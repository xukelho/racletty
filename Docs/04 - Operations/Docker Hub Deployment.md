# Docker Hub and Portainer deployment

Status: Docker Hub image build and two-stack Portainer deployment path prepared; confirm image availability before deployment

Last updated: 2026-11-04

This runbook covers the Docker Hub path for Racletty: build the six application images locally, push them to Docker Hub, and deploy them through two Portainer stacks. It is an alternative to the GHCR/GitHub Actions path described in [Alpha Deployment](Alpha%20Deployment.md).

The deployment is split into two stacks so that the database lifecycle is independent from the application lifecycle:

| Stack | File | Services |
| --- | --- | --- |
| Database | `portainer/postgresql18.yaml` | `postgres18` |
| Application | `portainer/ricardo_app.yaml` | `frontend`, `api`, `minio`, `minio-bootstrap`, `backup-tools` |

Only the frontend is reachable from outside the cluster, through Traefik. The API, PostgreSQL, MinIO and the backup tools publish no host ports.

## Prerequisites

- Docker Engine with Buildx on the machine that builds the images.
- A Docker Hub account (the current stacks reference `hammebsb`).
- Roughly 5–6 GB of free disk space. The MinIO image is compiled from source and its Go build cache is the largest step.
- A Docker Swarm manager running Traefik, with the existing external overlay network `traefik_public` already attached to Traefik.
- The existing external overlay network `app_network`, shared by both stacks. The stacks do not create it; change the network name in both files if the cluster uses a different name.
- Traefik entrypoints named `web` and `websecure`, with a Let's Encrypt certificate resolver named `le`. Edit the labels in `portainer/ricardo_app.yaml` if the target cluster uses different names.

### Docker permissions

If the current user cannot access the Docker daemon, run the script through `sudo`:

```sh
DOCKER_BIN="sudo -n docker" ./build_and_push.sh hammebsb v1.0.0
```

Alternatively, add the user to the `docker` group and start a new shell. Using `sudo` changes the Docker configuration directory: authenticate with the same command prefix that will be used to push.

```sh
sudo docker login -u hammebsb
```

Use a Docker Hub access token rather than the account password.

## Image inventory

| Image | Build context | Dockerfile | Purpose |
| --- | --- | --- | --- |
| `racletty-backend` | `Backend` | `Backend/Dockerfile` | .NET 10 API |
| `racletty-frontend` | `.` | `Frontend/Dockerfile.production` | React build served by Caddy |
| `racletty-minio` | `.` | `deploy/minio.Dockerfile` | MinIO compiled from upstream source |
| `racletty-mc` | `.` | `deploy/minio-client.Dockerfile` | MinIO client helper |
| `racletty-minio-bootstrap` | `.` | `deploy/minio-bootstrap.Dockerfile` | Creates the private bucket and application credentials |
| `racletty-backup-tools` | `.` | `deploy/backup-tools.Dockerfile` | PostgreSQL and object-storage backup tooling |

The frontend must use `Frontend/Dockerfile.production`, not `Frontend/Dockerfile`. The latter is the Vite development server on port 5385. The production image uses Caddy on port 80 and is built with `CADDY_CONFIG=deploy/Caddyfile.swarm` so that it works behind Traefik in Swarm.

MinIO is built from source because the community repository was archived and no longer publishes the required release as an official container. The source release is `RELEASE.2025-10-15T17-29-55Z`, which includes the October 2025 service-account policy fix. Source-built MinIO images remain an operator responsibility and should be kept under review.

## Build and push

The script builds and pushes all six images with a single tag:

```sh
./build_and_push.sh <docker-username> [tag] [--no-push]
```

Examples:

```sh
./build_and_push.sh hammebsb v1.0.0
DOCKER_BIN="sudo -n docker" ./build_and_push.sh hammebsb v1.0.0 --no-push
VITE_GOOGLE_MAPS_API_KEY=... ./build_and_push.sh hammebsb v1.0.1
```

Optional environment variables:

| Variable | Default | Effect |
| --- | --- | --- |
| `DOCKER_BIN` | `docker` | Docker command, for example `sudo -n docker`. |
| `VITE_GOOGLE_MAPS_API_KEY` | empty | Baked into the frontend bundle at build time. Rebuild the frontend to change it. |

The produced references are:

```text
<user>/racletty-backend:<tag>
<user>/racletty-frontend:<tag>
<user>/racletty-minio:<tag>
<user>/racletty-mc:<tag>
<user>/racletty-minio-bootstrap:<tag>
<user>/racletty-backup-tools:<tag>
```

Record the digest printed by each `docker push`. Tags are convenient, but a digest is the only immutable reference.

### Manual equivalent

```sh
docker build -t hammebsb/racletty-backend:v1.0.0 -f Backend/Dockerfile Backend
docker build -t hammebsb/racletty-frontend:v1.0.0 \
  -f Frontend/Dockerfile.production \
  --build-arg CADDY_CONFIG=deploy/Caddyfile.swarm \
  --build-arg VITE_GOOGLE_MAPS_API_KEY="$VITE_GOOGLE_MAPS_API_KEY" .
docker build -t hammebsb/racletty-minio:v1.0.0 -f deploy/minio.Dockerfile .
docker build -t hammebsb/racletty-mc:v1.0.0 -f deploy/minio-client.Dockerfile .
docker build -t hammebsb/racletty-minio-bootstrap:v1.0.0 -f deploy/minio-bootstrap.Dockerfile .
docker build -t hammebsb/racletty-backup-tools:v1.0.0 -f deploy/backup-tools.Dockerfile .

for image in backend frontend minio mc minio-bootstrap backup-tools; do
  docker push "hammebsb/racletty-$image:v1.0.0"
done
```

To use a different Docker Hub account, update the image references in both stack files and in the environment block of the `backup-tools` service.

## Portainer stacks

Deploy order matters: the database stack first, then the application stack.

### 1. Database stack

File: `portainer/postgresql18.yaml`

- Service `postgres18`, hostname and network alias `postgres18` on `app_network` so the application stack can resolve PostgreSQL despite the stack prefix.
- Database `racletty`, user `racletty`, port `7584`.
- Image `postgres:18` by default, configurable through `POSTGRES_IMAGE`.
- Volume `postgres18_data` mounted at `/var/lib/postgresql`.
- Connected only to `app_network`.
- Health check uses `pg_isready -p 7584`.

For production, pin `POSTGRES_IMAGE` to an immutable digest instead of the mutable `postgres:18` tag.

### 2. Application stack

File: `portainer/ricardo_app.yaml`

- `frontend`: Caddy on port 80, connected to `traefik_public`, the internal `proxy` overlay and the private `storage` overlay. Traefik routes both the application and files hostnames to it. The `storage` network lets Caddy reach MinIO for direct browser uploads without joining the database network.
- `api`: listens on port 1818 inside the cluster, connects to `postgres18:7584` on `app_network`, to MinIO on `data`, and to Caddy on `proxy`.
- `minio`: internal object storage on port 9000, data in the `minio-data` volume. Network-scoped `minio` aliases let Caddy, the API and bootstrap resolve the service despite Swarm stack prefixes.
- `minio-bootstrap`: creates the bucket and the application credentials. It runs as a replicated job, so it completes instead of staying at `1/1`.
- `backup-tools`: long-running helper container with the database and object-storage backup scripts.

Networks used by this stack:

| Network | Driver | Scope | Purpose |
| --- | --- | --- | --- |
| `traefik_public` | overlay | external | Traefik ingress |
| `app_network` | overlay | external | API, PostgreSQL and backups |
| `proxy` | overlay, internal | stack-local | Caddy to API |
| `data` | overlay, internal | stack-local | API, MinIO, bootstrap and backups |
| `storage` | overlay, internal | stack-local | Caddy to MinIO for direct uploads |

Volumes created by this stack:

| Volume | Purpose |
| --- | --- |
| `minio-data` | Object storage |
| `data-protection` | ASP.NET Core Data Protection keys |
| `backup-data` | Local backup output before offsite upload |

### Environment variables

Hostnames and the proxy subnet have defaults. Credentials and the deployed source commit must be supplied through the Portainer stack environment; no credential values are stored in the stack files. Use separate random credentials for PostgreSQL, MinIO root and the MinIO application account. The database stack optionally accepts `POSTGRES_IMAGE`.

| Variable | Required | Example | Notes |
| --- | --- | --- | --- |
| `APP_DOMAIN` | no | `ricardo.centsfy.com` | Frontend hostname. |
| `FILES_DOMAIN` | no | `files.centsfy.com` | Files hostname. |
| `APP_ORIGIN` | no | `https://ricardo.centsfy.com` | Public application origin. |
| `FILES_PUBLIC_ENDPOINT` | no | `https://files.centsfy.com` | Public object-storage endpoint. |
| `PROXY_NETWORK` | no | `10.251.251.0/24` | Defaults to `10.251.251.0/24`. Override if it overlaps the host or any existing network. |
| `POSTGRES_PASSWORD` | yes | generated privately | Set the same value in the database and application stacks. |
| `MINIO_ROOT_USER` | yes | generated privately | MinIO administrator username. |
| `MINIO_ROOT_PASSWORD` | yes | generated privately | MinIO administrator password. |
| `MINIO_APP_USER` | yes | generated privately | Application S3 access key. |
| `MINIO_APP_PASSWORD` | yes | generated privately | Application S3 secret. |
| `RACLETTY_STACK_NAME` | no | `racletty` | Defaults to `racletty`. Set it to the exact Portainer stack name so restore targets the right stack. |
| `COMMIT` | yes | full 40-character SHA | Records the deployed source revision in backup metadata. |
| `POSTGRES_IMAGE` | no | `postgres:18` | Pin to a digest for production. |
| `AGE_RECIPIENT` | no | `age1...` | Enables encryption of offsite backups. |
| `BACKUP_REMOTE` | no | `remote:racletty` | rclone destination for offsite backups. |
| `RCLONE_CONFIG_CONTENT` | no | rclone config | Offsite credentials. |

Docker administrators can read stack environment values in Portainer. Do not commit real secrets to the repository. `.env.portainer.example` documents the variables used by the GHCR-based `docker-stack.production.yml`; the Docker Hub stacks use fixed image tags and do not need the `*_IMAGE` variables from that file.

### Deploy

1. Confirm the existing external networks `app_network` and `traefik_public` are visible to the Swarm manager.
2. Open **Stacks → Add stack** and paste `portainer/postgresql18.yaml`. Set `POSTGRES_PASSWORD`; optionally set `POSTGRES_IMAGE`. Deploy.
3. Wait until the `postgres18` service is healthy.
4. Add a second stack with `portainer/ricardo_app.yaml`. Set every required variable above, including the same `POSTGRES_PASSWORD`. Deploy.
5. Confirm the stack is running before exposing DNS or running smoke tests.

### Verification

On the Swarm manager:

```sh
docker stack ls
docker service ls
docker service ps <stack>_api --no-trunc
docker service logs <stack>_frontend --tail 100
docker service logs <stack>_api --tail 100
```

Check that the API readiness endpoint answers from inside the cluster:

```sh
docker run --rm --network app_network curlimages/curl:latest \
  -fsS -H "Host: app.example.com" http://<stack>_api:1818/api/ready
```

Then open `https://<APP_DOMAIN>` and `https://<FILES_DOMAIN>`. The API exposes `/api/ready`; `/api/health` is also available. The repository smoke test can be used when its environment matches the deployment:

```sh
set -a; . .env.portainer; set +a
sh deploy/smoke-test.sh
```

Verify the direct browser upload path with a small file. In the browser Network panel, the upload grant request should return `201`, the files-host `OPTIONS` preflight should return `204`, and the subsequent signed `PUT` should return `200` or `204`. Confirm the file appears in the project afterward. The `Content-Type` sent on the `PUT` must exactly match the value in the grant's `requiredHeaders`; if the `PUT` returns `502`, inspect frontend service logs and confirm Caddy can resolve `minio` on the stack's private `storage` network. A MinIO `SignatureDoesNotMatch` response instead points to a signed URL/header mismatch or an expired grant.

### Updating

1. Build and push a new tag with `build_and_push.sh`.
2. Update the six image references in `portainer/ricardo_app.yaml` (and the backup-tools environment block).
3. Redeploy the application stack in Portainer. Portainer pulls the new images when the stack is updated; enable **Re-pull image** if it is offered.

Redeploy the database stack only when changing PostgreSQL itself. Database changes must go through the migration path in the backend, not through ad-hoc SQL.

### Rollback

Point the image references back to the previous tag or digest and redeploy the application stack. Application images are stateless except for the volumes; the database and MinIO data are not rolled back by an image change, so schema and data compatibility must be checked before rolling back a release that ran migrations.

## Troubleshooting

| Symptom | Cause | Fix |
| --- | --- | --- |
| `Docker daemon is not accessible with: docker` | User cannot access the socket. | Use `DOCKER_BIN="sudo -n docker"` or join the `docker` group. |
| `no space left on device` during the MinIO build | Go build cache exhausted the disk. | Free space (`docker builder prune`, old images) and retry. The MinIO build is the largest step. |
| `unauthorized: authentication required` on push | Not logged in to Docker Hub. | `docker login -u <user>` with an access token, using the same `DOCKER_BIN` prefix. |
| `network app_network not found` | The existing network has another name or is not visible to the manager. | Align the name in both stack files with the existing network. |
| A required stack variable is missing | A credential or `COMMIT` was not supplied. | Set every required variable in Portainer; credential values have no defaults in the files. |
| API cannot reach PostgreSQL | Database stack not deployed, `app_network` differs, or `POSTGRES_PASSWORD` differs between stacks. | Deploy the database stack first, confirm both stacks use the same external network, and set the same password in both. |
| Caddy logs `lookup minio ... no such host` | Caddy and MinIO do not share a service-discovery network or the `minio` alias is missing. | Keep the frontend and MinIO attached to `storage`, with the `minio` alias configured on that network. |
| Signed upload `PUT` returns `SignatureDoesNotMatch` | The signed URL expired or a signed request header differs from the grant. | Request a fresh grant and send the exact `Content-Type` listed in `requiredHeaders`. |
| Traefik returns 404 | External network name, entrypoints or resolver differ from the labels. | Confirm `traefik_public`, `web`, `websecure` and `le`, or edit the labels. |
| Frontend serves the Vite dev server | The wrong Dockerfile was built. | Rebuild with `Frontend/Dockerfile.production`. |

## Relationship to the GHCR deployment

`Docs/04 - Operations/Alpha Deployment.md` and `.github/workflows/release.yml` describe a single-stack deployment that pulls immutable images from GHCR and contains its own PostgreSQL 17.11 and MinIO. The Docker Hub path described here is a separate, operator-driven alternative:

- two stacks instead of one;
- PostgreSQL 18 on port 7584 instead of 17.11;
- images pulled from Docker Hub instead of GHCR;
- builds run from the operator machine instead of GitHub Actions.

The two paths must not be deployed over the same volumes or stack names.
