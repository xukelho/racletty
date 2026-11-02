# Jeimerson server integration ledger

Status: Active integration ledger

Owner: Ricardo Coelho

Last updated: 2026-11-02

## Purpose and maintenance rule

This document tracks the repository changes made to prepare Racletty for deployment on Jeimerson's VPS through Portainer and Docker Swarm. Use it to identify which decisions are tied to that server and which parts should remain when moving the application to Ricardo's own server.

Whenever a deployment-related file, workflow, runtime setting, backup/recovery tool, or deployment document changes, update this ledger in the same change. Add new work under **Change history**, update the current file inventory and server-specific section, and note whether the change is portable or needs reconsideration on another server. Keep earlier entries as history instead of replacing them.

This is a record of repository changes and intended operation. It does not imply that a release has been published or deployed to Jeimerson's VPS.

## Current integration target

- Portainer Stack UI connected to a Docker Swarm manager. The operator does not have SSH or host shell access.
- Traefik is already running and controlled by Jeimerson. The stack currently expects the external overlay network `traefik_public`, entrypoints `web` and `websecure`, and certificate resolver `le`, based on the supplied template. These exact live values still need confirmation from Jeimerson.
- Traefik owns public ports 80 and 443 and terminates public TLS. Racletty's Caddy frontend serves HTTP within the Swarm and is reached through Traefik.
- The Racletty stack supplies its own PostgreSQL 17.11 and MinIO services. It does not use the sample `postgresql16` service or an existing Postgres database.
- The stack creates its own private overlay networks and persistent volumes. Services are constrained to a manager node, matching the one-VPS allocation and local volume storage.
- GitHub Actions builds the images, publishes them to GHCR, and packages a Portainer release artifact. Portainer pulls the images; it does not build them.
- The app retains the seeded `Admin` account. The operator replaces/deletes it before allowing testers in, then resets persisted data-protection keys to invalidate bootstrap sessions.

## Change inventory

### Swarm and Traefik deployment

| File | Change and purpose | Portability when moving servers |
| --- | --- | --- |
| [`docker-stack.production.yml`](../../docker-stack.production.yml) | Added the image-only Swarm stack. Defines frontend, API, PostgreSQL, MinIO, MinIO bootstrap, and backup tools; named persistent volumes; resource limits; manager placement; restart policies; health checks; and private overlays. The frontend joins external `traefik_public` and carries Traefik Swarm labels for both hostnames, HTTPS, the `le` resolver, HTTP-to-HTTPS redirection, and internal port 80. | Swarm structure and Traefik labels are Jeimerson-target-specific. On another Swarm/Traefik host, confirm network, entrypoint, resolver, and placement. On standalone Docker, use a Compose stack and proxy configuration suitable for that host instead. |
| [`deploy/Caddyfile.swarm`](../../deploy/Caddyfile.swarm) | Added the frontend configuration used behind Traefik: serves static assets, forwards API and file-storage requests, handles file CORS, and trusts the proxy layer for client address forwarding. It does not issue public certificates; Traefik does that. | Keep if the new server uses Traefik with the same HTTP-to-frontend arrangement. Replace or adjust if the new server uses Caddy for public TLS, nginx, or another proxy. |
| [`.env.portainer.example`](../../.env.portainer.example) | Added Portainer stack variable template for domains, image references, database/MinIO credentials, backup settings, and the `PROXY_NETWORK` CIDR used by the API to trust forwarded headers. The example CIDR must be checked for conflicts by the Swarm administrator. | Host-specific values, network CIDR, credentials, domains, and image references must be set again. Never copy the filled-in values into source control. |
| [`docker-compose.portainer-restore.yml`](../../docker-compose.portainer-restore.yml) | Added a temporary Swarm recovery stack that mounts the target stack's named volumes and internal data network for restore operations. | Depends on Swarm-generated stack volume/network names and the target stack name. Rework for a different orchestrator, volume driver, or stack naming convention. |
| [`docker-compose.portainer-key-reset.yml`](../../docker-compose.portainer-key-reset.yml) | Added a temporary helper stack to clear persisted authentication keys before testers join. It mounts the target stack's data-protection volume. | Its external volume name assumes the Swarm target stack name. Rework if the target deployment uses different volume naming or key storage. |

The supplied `stack_ricardo.yaml` (not committed; supplied by the user) was treated as guidance, not copied into the repository. Its generic `/app/data_ricardo` and `/tmp_ricardo` mounts are not paths used by this application. Racletty persists its database, MinIO objects, data-protection keys, and backup archives in its own named volumes. The sample rule ``Host(`http://ricardo.centsfy.com/`)`` was corrected in the project design to use hostnames without a scheme or path.

### Local production mode and container images

| File | Change and purpose | Portability when moving servers |
| --- | --- | --- |
| [`docker-compose.production.yml`](../../docker-compose.production.yml) | Added image-based standalone Compose configuration for local production-mode diagnosis, with a Caddy service that binds local host ports, app services, network boundaries, health checks, and persistent volumes. | Intended for local Compose diagnosis, not the current VPS stack. It uses the standalone TLS Caddy configuration; do not pair it with the current Swarm-only GHCR frontend image without building/publishing a matching standalone frontend image. |
| [`docker-compose.production.local.yml`](../../docker-compose.production.local.yml) | Added a local build overlay so production-mode images can be built from the working tree without GHCR. | Portable local-development tool. Its Caddy build argument selects the standalone `deploy/Caddyfile`. |
| [`.env.production.example`](../../.env.production.example) | Added non-production values for local production-mode Compose, including local domains, ports, image tags, and blank required PostgreSQL/MinIO credentials. CI generates ephemeral credentials at runtime; local users fill the blanks in their private copy. | Local only. Generate fresh independent credentials for any server deployment. |
| [`Frontend/Dockerfile.production`](../../Frontend/Dockerfile.production) | Added a production frontend image build: compiles the React app and packages it with pinned Caddy. `CADDY_CONFIG` selects the local or Swarm Caddyfile. | The image build is reusable; choose the correct Caddyfile for the server's TLS/proxy topology. |
| [`deploy/Caddyfile`](../../deploy/Caddyfile) | Added standalone/local Caddy routing for the app and file domains, HTTPS redirects, local/public TLS handling, security headers, SPA routing, API proxying, and MinIO proxy/CORS. | Use when Caddy is the public edge. It is the local production build's config, not the current Swarm GHCR frontend config. |
| [`Backend/Dockerfile`](../../Backend/Dockerfile) | Pinned .NET base image digests, installed `curl` for health checks, created a dedicated UID 10001 user and data-protection directory, and runs the API as non-root. | Portable production hardening. Preserve unless the runtime or filesystem model changes. |
| [`deploy/minio.Dockerfile`](../../deploy/minio.Dockerfile) | Added a source build of the pinned MinIO `RELEASE.2025-10-15T17-29-55Z` commit because the project uses the last identified community release with the required policy fix and upstream no longer supplies its image. | The image build is portable, but the MinIO source/release choice should be reviewed when selecting the long-term storage service. |
| [`deploy/minio-bootstrap.Dockerfile`](../../deploy/minio-bootstrap.Dockerfile), [`deploy/minio-bootstrap.sh`](../../deploy/minio-bootstrap.sh), [`deploy/minio-app-policy.json`](../../deploy/minio-app-policy.json) | Added a one-shot service that creates the private bucket and restricted application identity/policy in MinIO. | Portable while the app uses this MinIO bucket and policy model. |
| [`deploy/backup-tools.Dockerfile`](../../deploy/backup-tools.Dockerfile) | Added a helper image with PostgreSQL client, age, tar/gzip, and rclone; it packages the Swarm stack file and recovery commands. | Runtime tools are portable. The embedded Swarm stack file and volume assumptions are not. |
| [`.dockerignore`](../../.dockerignore), [`Backend/.dockerignore`](../../Backend/.dockerignore) | Exclude environment files, keys, secrets, backups, and build outputs from container build contexts. | Portable; retain when changing deployment topology. |
| [`.gitignore`](../../.gitignore) | Allows the committed example env files while continuing to ignore real `.env` files and local secrets. | Portable; retain. |

### API production behavior and deployment readiness

| File | Change and purpose | Portability when moving servers |
| --- | --- | --- |
| [`Backend/Configuration/ApplicationEnvironment.cs`](../../Backend/Configuration/ApplicationEnvironment.cs) | Changed unknown environment-name fallback from Development to Production, avoiding accidental development behavior for a misspelled deployment environment. | Portable. Set the environment explicitly in every deployment. |
| [`Backend/Program.cs`](../../Backend/Program.cs) | Added production forwarded-header handling constrained by `PROXY_NETWORK`; persistent ASP.NET data-protection keys at a configured path; secure production cookies; generic production exception responses; production rate limiting; and disabled OpenAPI in production. | Mostly portable production behavior. Configure the trusted proxy CIDR and persistent key volume/path for the new server's proxy and storage layout. |
| [`Backend/Endpoints/HealthEndpoints.cs`](../../Backend/Endpoints/HealthEndpoints.cs) | Added `/api/ready`, which checks database connectivity and object-storage availability for health monitoring and deployment readiness. | Portable; health check endpoints may need updating if storage/database providers change. |
| [`Backend/Endpoints/AuthenticationEndpoints.cs`](../../Backend/Endpoints/AuthenticationEndpoints.cs) | Added a production rate-limit policy to login. | Portable production protection. |
| [`Backend/Endpoints/AdministrationEndpoints.cs`](../../Backend/Endpoints/AdministrationEndpoints.cs) | Required the platform-admin role for administration endpoints. | Portable application authorization, independent of server topology. |

The following test fixture and integration-test files were adjusted for authenticated admin routes, seeded-admin sessions, and optional external S3 test settings: `Backend.Tests/AdministrationIntegrationTests.cs`, `ClientInvitationIntegrationTests.cs`, `CompanyIntegrationTests.cs`, `MinioObjectStoreIntegrationTests.cs`, `PostgreSqlApiFixture.cs`, `ProfileIntegrationTests.cs`, and `ProjectIntegrationTests.cs`. They support the application changes above; they do not change the VPS runtime configuration.

### GitHub build and release delivery

| File | Change and purpose | Portability when moving servers |
| --- | --- | --- |
| [`.github/workflows/ci.yml`](../../.github/workflows/ci.yml) | Added CI build/test steps for frontend and backend, a private MinIO integration service, runtime-generated ephemeral credentials, production image builds, standalone Compose configuration checks, and a disposable local production smoke run. | GitHub-specific workflow, generally portable to another host. The current smoke stack validates standalone Compose, not the live Swarm/Traefik stack. |
| [`.github/workflows/release.yml`](../../.github/workflows/release.yml) | Added release workflow that runs after successful CI on `main`, builds and pushes five immutable GHCR images (API, frontend, MinIO, bootstrap, backup tools), writes digest-pinned `release.env`, packages stack/recovery/runbook files, and uploads the Portainer release artifact. The frontend image is built with `deploy/Caddyfile.swarm`. | GHCR image namespace is derived from the GitHub repository, so it is not tied to Jeimerson's VPS. Retain or adapt if using another registry or build system. The frontend image's proxy profile is topology-specific. |
| [`deploy/smoke-test.sh`](../../deploy/smoke-test.sh) | Added local production-mode HTTP/TLS/API/storage smoke checks. | Useful locally; update if routes or local TLS configuration change. |

### Backup and recovery commands

| File | Change and purpose | Portability when moving servers |
| --- | --- | --- |
| [`deploy/portainer-backup.sh`](../../deploy/portainer-backup.sh) | Added consistent backup flow: requires app/frontend and MinIO to be stopped, dumps PostgreSQL, archives MinIO and data-protection data, records stack/image identity, age-encrypts the archive, and optionally uploads/verifies via rclone. | Backup content/crypto are portable. Stopping service replicas and stack names/volume mounts are Swarm/Portainer-specific. |
| [`deploy/portainer-fetch-backup.sh`](../../deploy/portainer-fetch-backup.sh) | Added rclone download helper for encrypted backup archives. | Portable if the new environment can use rclone and mount the backup volume. |
| [`deploy/portainer-restore.sh`](../../deploy/portainer-restore.sh) | Added guarded restore for PostgreSQL, MinIO objects, and data-protection keys, with archive path validation and explicit stack/confirmation checks. | Restore content is portable; Docker volume paths, network access, and manager placement follow the current Swarm layout. |
| [`deploy/portainer-reset-keys.sh`](../../deploy/portainer-reset-keys.sh) | Added explicit confirmation guard and removal of persisted authentication key files before testers join. | Portable if key path and volume mount are preserved. |

### Documentation created or updated

- [`Docs/03 - Architecture/Alpha Deployment.PLAN.md`](../03%20-%20Architecture/Alpha%20Deployment.PLAN.md) — deployment scope, decisions, implementation record, verification history, and external prerequisites. Updated after the Swarm change to distinguish earlier standalone verification from the unvalidated Swarm deployment.
- [`Docs/04 - Operations/Alpha Deployment.md`](Alpha%20Deployment.md) — local production build, Swarm/Portainer deployment, image pulls, admin bootstrap, release update, backup, restore, and alpha operational checks.
- [`README.md`](../../README.md) — alpha status and links to deployment documents.
- [`Docs/03 - Architecture/Technology Stack.md`](../03%20-%20Architecture/Technology%20Stack.md) — updated MinIO status/rationale for controlled alpha.
- This ledger, `jeimerson integration.md`, records the deployment changes and migration considerations for future server changes.

The PR also adjusts `Frontend/src/pages/ClientNotificationsPage.test.tsx` to wait for the asynchronous mark-read callback instead of asserting a class change on a DOM node captured before React rerenders. CI failed that existing assertion twice; this test-only stabilization is included so the PR check can complete. Other notification routing/UI edits in `Frontend/src/api/notificationDestination.ts`, its test, `Frontend/src/components/NotificationList.tsx`, its test, and `Frontend/src/styles.css` remain separate product work and are not in the PR. Do not revert them when removing or changing this server integration.

## What to revisit for Ricardo's own server

### Server-specific items to replace or confirm

1. **Ingress/proxy:** decide whether the new host uses Traefik, Caddy, nginx, or another edge proxy. For Traefik, change `traefik_public`, entrypoints, resolver, TLS labels, and any redirect policy in `docker-stack.production.yml` to match that host. For standalone Caddy, use a matching image built with `deploy/Caddyfile` and the standalone `docker-compose.production.yml`; the existing release GHCR frontend image is the Swarm/Traefik variant and is not interchangeable with the standalone Caddy image.
2. **Orchestrator:** if the new server is Docker standalone, use Compose rather than `docker stack deploy`; remove Swarm-only `deploy` behavior and overlay-network assumptions. The current local production Compose files show the starting standalone topology, but are configured for local diagnostics. If the new server is another Swarm, retain the stack format and check the external proxy network and placement constraints.
3. **Proxy network:** select a non-overlapping CIDR and set `PROXY_NETWORK` to the actual network from which the API receives forwarded requests. Update Caddy's trusted-proxy configuration if the upstream proxy network is not covered appropriately.
4. **Persistent storage:** decide whether to keep the app-managed PostgreSQL and MinIO services. Preserve database, object data, data-protection keys, and backup volumes across app releases. If using external database/object storage, update endpoints, credentials, network access, backup/restore helpers, and the runbook.
5. **Registry:** GHCR image paths are generated from the GitHub repository and digests appear in each release artifact. Configure the new server's registry access or choose a different registry. Never replace digest-pinned release references with an unverified mutable tag for a production deployment.
6. **Placement and capacity:** current services are constrained to a manager because the allocation is one VPS with local named volumes. Revisit those constraints and volume drivers for a multi-node cluster or different storage system.
7. **Secrets and host settings:** set new domains, independent passwords, proxy CIDR, backup encryption recipient, and remote-backup credentials. Portainer stack variables are visible to Docker administrators; select a different secret-delivery method if the new server's trust model requires one.
8. **Portainer recovery:** target stack name and generated volume/network names are embedded in the recovery workflow. Keep the existing stack name or update the helper variables and recovery documentation together.
9. **Seeded account:** the repository's seeded `Admin` behavior remains. Replace/delete that account and invalidate bootstrap sessions before inviting testers, regardless of hosting provider.

### Portable changes to keep by default

Production API security behavior, admin authorization, health/readiness behavior, non-root API image, pinned build inputs, private object-storage policy, immutable release image identities, encrypted backups, restore validation, and local production-mode builds are application/deployment foundations rather than Jeimerson-specific networking. Keep them unless the application's runtime, security model, or storage architecture changes.

## Change history

### 2026-11-02 — Swarm and Traefik adaptation

- Added `docker-stack.production.yml` for Portainer Stack UI deployment to Docker Swarm.
- Added `deploy/Caddyfile.swarm`, and changed the production frontend Dockerfile to select a Caddyfile through a build argument. Local production builds continue to select the standalone Caddyfile.
- Changed the GHCR release frontend build to use the Swarm/Traefik Caddyfile; release bundles now include the Swarm stack file.
- Updated backup tooling and restore metadata to archive the Swarm stack definition, adjusted temporary recovery stacks for Swarm volume/network names, and updated the operations guide and plan.
- The supplied sample's `traefik_public`, `websecure`, and `le` values were used as assumptions. The user reported Traefik is running but cannot inspect its configuration. The Swarm stack has not been deployed against the live server; Jeimerson must confirm those values and the free `PROXY_NETWORK` subnet.

### 2026-10 — Initial production preparation

- Added standalone production Compose files and a local build overlay, with pinned PostgreSQL, Caddy, MinIO, and helper images; separate application/database/storage networks; persistent volumes; and production-only runtime environment values.
- Added GitHub Actions CI and GHCR release packaging, digest-pinned image manifest, Portainer environment example, MinIO source build/bootstrap policy, smoke checks, and encrypted backup/fetch/restore/key-reset tools.
- Added production API configuration and hardening: durable data-protection keys, secure cookies, forwarded-header trust, login throttling, API readiness checks, generic exception responses, restricted OpenAPI, and platform-admin authorization. Made container builds non-root and pinned key base images.
- Added deployment plan and operations guide, and linked deployment docs from the README.
- The prior local production stack was stopped at the user's request to free runtime resources. Its persistent test volumes were retained; no stack was started as part of creating this ledger.

## Current verification boundary

The initial local production path and supporting backup/recovery work were verified before the Swarm adaptation, as recorded in the deployment plan. The latest Swarm-specific stack, Traefik labels, and release frontend profile have not been deployed or validated against Jeimerson's live environment. GitHub publication, GHCR pull access, DNS, proxy networking, TLS issuance, backups, and restore on the VPS remain external steps.
