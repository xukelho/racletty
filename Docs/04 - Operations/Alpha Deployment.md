# Alpha deployment

Status: Initial Contabo VPS deployment automation
Owner: Project owner
Last updated: 2026-11-22

This runbook covers the first deployment of the production Compose stack to an Ubuntu VPS with Docker Engine and the Docker Compose plugin already installed. GitHub Actions builds and publishes immutable images; the deployment job connects to the VPS over SSH and starts that Compose stack. The VPS remains responsible for its environment file, firewall, Docker installation and persistent-volume backups.

## What the GitHub pipeline does

The `.github/workflows/ci.yml` workflow runs tests and production smoke checks on pull requests and pushes to `main`. A push to `main` also publishes the four application images to GitHub Container Registry (GHCR), tagged with the commit SHA.

The production deployment job runs only after those images publish successfully and only when the repository variable `PRODUCTION_DEPLOY_ENABLED` is set to the exact value `true`. It uploads `docker-compose.production.yml`, pulls the images for that commit, and starts the stack. The deployment job uses the GitHub Environment named `production`; configure its secrets before enabling the variable.

The deployment job does not create VPS users, install Docker, create the production environment file, or configure DNS. Complete the one-time setup below first.

## Production hostnames

For the initial deployment, the application uses `www.app.racletty.com`. Requests for `www.racletty.com` and `racletty.com` redirect to that application address. MinIO file delivery uses `files.app.racletty.com`.

Create these Cloudflare DNS records, all pointing to the VPS IPv4 address:

| Type | Name | Content |
| --- | --- | --- |
| A | `app` | VPS IPv4 address |
| CNAME | `www.app` | `app.racletty.com` |
| A | `files.app` | VPS IPv4 address |
| A | `@` | VPS IPv4 address |
| CNAME | `www` | `racletty.com` |

Initially set them to DNS-only (grey cloud) so Caddy can obtain certificates directly. After all four hostnames (`www.app.racletty.com`, `www.racletty.com`, `racletty.com`, and `files.app.racletty.com`) serve valid HTTPS, enable the Cloudflare proxy (orange cloud) and set SSL/TLS mode to Full (strict).

## One-time VPS setup

Use a dedicated Linux user for deployments rather than SSH root. The Docker group grants root-equivalent control of the host, so only add a trusted deployment account.

1. Create a deployment user, add it to the Docker group, and create the deployment directory. For example, as root:

   ```sh
   adduser --disabled-password --gecos "" deploy
   usermod -aG docker deploy
   install -d -o deploy -g deploy -m 750 /opt/racletty
   ```

2. Install a dedicated SSH public key in `/home/deploy/.ssh/authorized_keys`, with the directory owned by `deploy` and mode `700`, and the file owned by `deploy` and mode `600`. Keep the matching private key for the GitHub Environment secret. Do not put either key in the repository.

3. Create `/opt/racletty/.env.production`, owned by `deploy` and mode `600`. Start from `.env.production.example`, then set:

   - `APP_DOMAIN=www.app.racletty.com`
   - `APP_REDIRECT_DOMAIN=www.racletty.com` and `APP_APEX_DOMAIN=racletty.com`
   - `FILES_DOMAIN=files.app.racletty.com`
   - `APP_ORIGIN=https://www.app.racletty.com`
   - `FILES_PUBLIC_ENDPOINT=https://files.app.racletty.com`
   - `HTTP_PORT=80` and `HTTPS_PORT=443`
   - `PROXY_NETWORK` to an unused private IPv4 subnet for the Compose proxy network
   - Unique, randomly generated values for `POSTGRES_PASSWORD`, `MINIO_ROOT_USER`, `MINIO_ROOT_PASSWORD`, `MINIO_APP_USER`, and `MINIO_APP_PASSWORD`

   The example file's `localhost` hostnames and credentials are for local smoke testing only. Do not use development credentials on the VPS. For example, generate each password with `openssl rand -hex 32`. Keep the generated values only in the VPS environment file or a secrets manager.

   Check existing Docker subnets before selecting `PROXY_NETWORK`; it must not overlap another Docker network or the VPS routes. One way to inspect current networks is:

   ```sh
   docker network inspect $(docker network ls -q) --format '{{.Name}} {{range .IPAM.Config}}{{.Subnet}}{{end}}'
   ip route
   ```

4. Ensure the VPS provider firewall and the host firewall allow inbound TCP ports 80 and 443. SSH (port 22) must remain available to the deployment runner. Install a current Docker Compose v2 plugin that supports `docker compose up --wait`.

5. If GHCR packages are private, ensure the repository's Actions `GITHUB_TOKEN` has permission to read the packages. The current CI workflow publishes packages with the repository token.

## GitHub configuration

The deployment job uses the repository's existing `DEPLOY_*` settings. Keep the secrets at repository scope or in the `production` environment; keep the known-hosts line in a repository variable because it is a public host key.

### Secrets

| Secret | Value |
| --- | --- |
| `DEPLOY_HOST` | VPS address |
| `DEPLOY_PORT` | SSH port (usually `22`) |
| `DEPLOY_USER` | Dedicated deployment username |
| `DEPLOY_SSH_KEY` | Private key matching the public key installed for the deployment user |

### Repository variables

| Variable | Value |
| --- | --- |
| `DEPLOY_ENABLED` | Keep `false` until setup is complete; set to exact lowercase `true` to enable deployment |
| `DEPLOY_KNOWN_HOSTS` | Verified SSH host-key line for the VPS |
| `DEPLOY_PATH` | Optional; defaults to `/opt/racletty` |

Obtain the SSH host key from a trusted connection and verify its fingerprint using the Contabo console before adding it to `DEPLOY_KNOWN_HOSTS`. Do not rely on an unverified `ssh-keyscan` result. The deployment workflow enforces strict host-key checking.

If GHCR packages are private, ensure the repository's Actions `GITHUB_TOKEN` has permission to read the packages. The current CI workflow publishes packages with the repository token.

After the VPS is provisioned and the settings above are verified, set `DEPLOY_ENABLED=true`. Subsequent successful pushes to `main` publish and deploy that commit. To turn off automatic deployment, set the variable back to `false`.

## Start and verify

The first deployment needs a successful push to `main` after enabling the deployment variable. In the GitHub Actions run, confirm the CI, image publishing and production deployment jobs succeed.

On the VPS, check the services and logs:

```sh
cd /opt/racletty
docker compose --env-file .env.production -f docker-compose.production.yml ps
docker compose --env-file .env.production -f docker-compose.production.yml logs --tail=100 caddy api db minio
```

The API readiness endpoint is served through Caddy at `https://www.app.racletty.com/api/ready`. After certificates are issued and DNS is switched to proxied, set Cloudflare SSL/TLS mode to Full (strict).

To update the application, push the intended release to `main`. To stop the stack without deleting its persistent data, run:

```sh
docker compose --env-file .env.production -f docker-compose.production.yml down
```

Do not add `-v` to `down` unless you explicitly intend to delete the database, MinIO objects, data-protection keys and Caddy state. Back up the PostgreSQL and MinIO data volumes before relying on this alpha deployment.

## Local production-mode diagnosis

For local diagnosis, copy `.env.production.example` to a private local env file and use the local overlay as described below. This is separate from the server deployment stack.

```sh
docker compose -p racletty-local-production --env-file .env.production.local -f docker-compose.production.yml -f docker-compose.production.local.yml up --build -d
```

Open `https://app.localhost`. Caddy uses a local CA; trust it in the browser or set `TLS_INSECURE=1` for the command-line smoke test. Inspect with the same Compose arguments followed by `ps` or `logs -f api caddy minio-bootstrap`. Stop with `down`; use `down -v` only when you intend to delete this local diagnosis data.

The MinIO community repository is archived and no longer publishes its current community release as an official container. This project builds the upstream `RELEASE.2025-10-15T17-29-55Z` source into its own image; that source release includes the October 2025 service-account policy fix. Upstream describes source-built deployments as operator responsibility, so keep this choice under review before broader production use. See the [upstream security release](https://github.com/minio/minio/releases/tag/RELEASE.2025-10-15T17-29-55Z) and [source-build guidance](https://github.com/minio/minio#install-from-source).

## Alpha release checks

Before inviting testers, exercise company access boundaries, user disable/delete behavior, CSRF-protected mutations, uploads/downloads/previews, representative large drawings, and Maps if enabled. Review browser console and CSP report-only output before enforcing a stricter policy.
