# Alpha deployment

Status: Repository deployment path prepared for Docker Swarm and Portainer Stack UI; external infrastructure remains operator setup

Last updated: 2026-11-02

This runbook covers the single VPS allocation using Docker Swarm, the existing Traefik instance, and Portainer's Stack UI. It does not require SSH or host shell access. GitHub Actions builds and publishes immutable images to GHCR; Portainer pulls those images when you deploy. The app stack contains its own PostgreSQL 17.11 and MinIO services. Only the frontend is routed through Traefik; the API, database, MinIO, and backup tools have no public ports. Local production-mode builds remain available through Docker Compose.

The stack assumes the external Swarm overlay network is named `traefik_public`, the Traefik entrypoints are `web` and `websecure`, and its Let's Encrypt resolver is named `le`, matching the supplied template. The friend who manages Traefik must confirm these exact names and make sure the network is attached to Traefik. The stack creates its own private `app_network`, `proxy`, and `data` overlay networks.

The MinIO community repository is archived and no longer publishes its current community release as an official container. This project builds the upstream `RELEASE.2025-10-15T17-29-55Z` source into its own digest-pinned image; that source release includes the October 2025 service-account policy fix. Upstream describes source-built deployments as operator responsibility, so keep this choice under review before broader production use. See the [upstream security release](https://github.com/minio/minio/releases/tag/RELEASE.2025-10-15T17-29-55Z) and [source-build guidance](https://github.com/minio/minio#install-from-source).

## Local production-mode build

Run from the repository root with Docker Engine and Compose installed:

1. Copy `.env.production.example` to `.env.production.local`; fill its blank PostgreSQL and MinIO values with local-only credentials. Keep the copied file private and untracked.
2. Build and start the isolated local production stack:

   ```sh
   docker compose -p racletty-local-production --env-file .env.production.local -f docker-compose.production.yml -f docker-compose.production.local.yml up --build -d
   ```

3. Open `https://app.localhost`. Caddy uses a local CA; trust it in the browser or use `TLS_INSECURE=1` for the command-line smoke test. The file endpoint is `https://files.localhost`.
4. Run `set -a; . .env.production.local; set +a; TLS_INSECURE=1 sh deploy/smoke-test.sh` from the repository root.
5. Inspect using the same Compose arguments followed by `ps` or `logs -f api caddy minio-bootstrap`. Stop with `stop`. Use `down -v` only when you intend to delete this local production test data.

The local stack remains separate from the Swarm stack file and from development `docker-compose.yml`.

## Requirements before deployment

- A Portainer endpoint connected to the Docker Swarm manager, with permission to deploy stacks and create an overlay network.
- Confirmation from the Swarm administrator that `traefik_public` exists and that Traefik uses entrypoints `web`/`websecure` and resolver `le`. If the names differ, update the corresponding labels in `docker-stack.production.yml` before deploying.
- An unused private subnet for the stack's frontend/API proxy overlay. Ask the Swarm administrator to confirm the example `172.31.0.0/24` in `.env.portainer.example` does not overlap any existing network; replace it if needed.
- DNS A records for the app and file hostnames pointing at the VPS, and inbound TCP 80/443 allowed by the VPS firewall. The existing Traefik owns those host ports and terminates HTTPS.
- A GitHub Actions release on `main`, and GHCR packages pullable by the VPS. If packages are private, configure a Portainer registry entry with a read-only `read:packages` token and select it when deploying. The release workflow itself uses GitHub's Actions token to publish; it does not configure Portainer credentials.
- An off-host backup destination and age encryption identity before storing real tester data.

If Maps are enabled, set the optional `VITE_GOOGLE_MAPS_API_KEY` GitHub repository variable before release, and restrict the key to the application host and required APIs.

## First Portainer deployment

1. In GitHub Actions, open the successful **Publish Portainer release** run for the desired `main` commit. Download and extract its `racletty-portainer-<commit>` artifact. `release.env` contains the full GHCR image addresses pinned to that build's digests. The `FRONTEND_IMAGE` value is the address Portainer will pull; the image has already been built and published by GitHub Actions.
2. In Portainer, open **Stacks → Add stack**, choose **Upload**, upload `docker-stack.production.yml`, and name the stack `racletty-production`. Do not use `docker-compose.production.yml` for the VPS; that file is solely for local standalone production-mode diagnosis.
3. Load the variables from `release.env` and `.env.portainer.example` into the stack environment. Portainer's Swarm deployment does not support Compose `env_file`, so these values must be added in Portainer or pasted individually. Replace example hostnames, passwords, and image placeholders. Set:

   - `APP_DOMAIN`, `FILES_DOMAIN`, `APP_ORIGIN=https://<APP_DOMAIN>`, and `FILES_PUBLIC_ENDPOINT=https://<FILES_DOMAIN>`.
   - `PROXY_NETWORK` to the subnet confirmed free by the Swarm administrator.
   - `POSTGRES_PASSWORD`, `MINIO_ROOT_USER`, `MINIO_ROOT_PASSWORD`, `MINIO_APP_USER`, and `MINIO_APP_PASSWORD` to independent random values. Use alphanumeric values to avoid Compose interpolation and connection-string parsing issues.
   - `RACLETTY_STACK_NAME=racletty-production`, `AGE_RECIPIENT` to the public age recipient, and optionally `BACKUP_REMOTE` plus `RCLONE_CONFIG_CONTENT` for encrypted off-host copies.

   Portainer stack environment values can be inspected by Docker administrators. They are not a separate encrypted vault. Do not commit or publish the completed values.

4. Deploy with the configured GHCR registry selected if needed. The app stack routes both hostnames through the frontend service to Traefik. Traefik handles public TLS. The API, database, MinIO API/console, and backup tools are not published to the Internet. Confirm all services converge and check their logs in Portainer. Verify both HTTPS hostnames, `/api/ready`, login, and an upload/download.
5. Sign in privately with the existing seeded `Admin` credentials (`admin` / `admin`). Before inviting testers, change its password or create and verify a replacement administrator, then delete the seeded account. Confirm the seeded login no longer works.
6. Before testers log in, clear the initial persisted session-key ring. Upload `docker-compose.portainer-key-reset.yml` as a temporary helper stack named, for example, `racletty-key-reset`. Set `BACKUP_TOOLS_IMAGE` from the selected release, `RACLETTY_TARGET_STACK=racletty-production`, and `KEY_RESET_CONFIRMATION=RESET_KEYS_racletty-production`. Open its container console and run `racletty-reset-keys --confirm-no-testers`. Remove the helper stack, restart the target API service, verify the replacement administrator can log in and the earlier cookie is rejected, then admit testers.

## Updating a release

Download the artifact for a successful release and use its matching `docker-stack.production.yml` and `release.env`. Edit the existing `racletty-production` stack, replace the stack file, update image digest values and `COMMIT`, preserve all host configuration, and redeploy with image pulls enabled. Do not rename the stack, remove volumes, or prune services. This is a brief-restart rollout, not zero downtime. Check service health, HTTPS, login, and file upload/download.

## Encrypted manual backup

Create and protect an age private identity outside the VPS; put only its public recipient in `AGE_RECIPIENT`. A backup contains a PostgreSQL dump, MinIO data, ASP.NET data-protection keys, the Swarm stack file, image digests, and commit. It excludes passwords, the age identity, and Portainer settings.

For a consistent backup, arrange a short maintenance window. In Portainer scale the `frontend`, `api`, and `minio` services to zero replicas; leave `db` and `backup-tools` running. Do not redeploy the target stack during the backup. In the `backup-tools` console, run:

```sh
racletty-backup --confirm-services-stopped
```

The encrypted archive is stored in the stack's `backup-data` volume. When `BACKUP_REMOTE` and valid `RCLONE_CONFIG_CONTENT` are set, the helper uploads and verifies the encrypted archive. Without a remote, the archive remains on the VPS and is not an off-site backup. Portainer's volume browser may be used only if the installed edition/agent exposes it.

After recording the filename and confirming the required copy exists, scale `minio`, `api`, and `frontend` back to one replica. Confirm they converge and test login and file access. Configure retention on remote storage; the helper does not delete old backups. To fetch a remote backup, set `BACKUP_REMOTE` and `RCLONE_CONFIG_CONTENT` on a temporary helper stack and run `racletty-fetch-backup <archive-name>` in its console.

## Restore

Restore replaces the target database, MinIO data, and data-protection keys. Database changes after the selected backup are lost. Scale `frontend`, `api`, and `minio` to zero and verify the exact backup filename and target stack name. Ensure the encrypted archive is in the target stack's `backup-data` volume.

Upload `docker-compose.portainer-restore.yml` as a separate temporary Swarm stack. Set `RACLETTY_TARGET_STACK=racletty-production`, `BACKUP_TOOLS_IMAGE` to the required digest, `POSTGRES_PASSWORD`, `RESTORE_FILE=/backups/<archive-name>`, `RESTORE_CONFIRMATION=RESTORE_racletty-production`, and `AGE_IDENTITY` to the matching private age identity. Run `racletty-restore` in the helper's console. Confirm the printed release metadata, remove the helper stack and temporary private-key values, then scale `minio`, `api`, and `frontend` back to one replica. Verify admin login, a representative object, and the application workflow.

Practice recovery against a disposable stack before inviting testers. A local backup drill does not verify GHCR access, remote credentials, remote retention, or the VPS restore path.

## Alpha release checks

Before inviting testers, exercise company access boundaries, user disable/delete behavior, CSRF-protected mutations, uploads/downloads/previews, representative large drawings, and Maps if enabled. Review browser console and CSP report-only output before enforcing a stricter policy. Verify reboot recovery, certificate renewal, service health, disk/memory capacity, and retrieval and restoration of an encrypted backup. Ask testers to report through one feedback channel and not include passwords, cookies, or signed file URLs.

## References

- [Add a Portainer stack](https://docs.portainer.io/user/docker/stacks/add) (including Swarm's `env_file` limitation)
- [Docker Swarm stack deployment](https://docs.docker.com/engine/swarm/stack-deploy/)
- [Traefik Swarm routing labels](https://doc.traefik.io/traefik/v3.3/routing/providers/swarm/)
- [Open a Portainer container console](https://docs.portainer.io/user/docker/containers/console)
- [Browse a Portainer volume](https://docs.portainer.io/user/docker/volumes/browse)
