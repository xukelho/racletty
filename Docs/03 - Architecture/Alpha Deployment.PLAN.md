# Alpha deployment plan and implementation record

Status: Repository-side Portainer deployment prepared; external infrastructure configuration remains with the operator
Owner: Ricardo Coelho
Last updated: 2026-11-02

## Objective and scope

Prepare this repository to build and run an alpha release on a Docker Swarm VPS managed through the Portainer Stack UI. Local production-mode builds must remain possible for diagnosis. Keep the existing development Compose workflow and seeded `Admin` account. The operator will replace/delete the seeded account before inviting testers.

The delivery path is GitHub Actions CI → immutable GHCR images → downloadable release artifact → manual Portainer Stack UI update. No SSH-based deployment is part of the intended workflow. This repository change does not configure GitHub account/repository settings, buy a VPS/domain, alter the friend's VPS, configure DNS/firewalls/registry credentials, or set up a remote backup account.

## Settled deployment choices

- Docker Swarm with Portainer Stack UI. The production Swarm stack uses the existing external `traefik_public` network and creates private overlay networks. Local production diagnosis continues to use Docker Compose.
- Existing Traefik owns host ports 80 and 443 and terminates public TLS. The app's Caddy frontend is reached only through Traefik and serves both app and file hostnames.
- Dedicated project PostgreSQL 17.11 and MinIO containers use persistent named volumes. They do not use the friend's existing PostgreSQL template. API, database, MinIO, and backup-tools ports remain unpublished.
- Separate internal data network and proxy/storage network boundaries. PostgreSQL is only on the internal data network; MinIO is reachable by the API and Caddy only through the required networks.
- Application, patched MinIO, and helper images built for x86-64 and referenced by immutable digests in release bundles. PostgreSQL, MinIO client, and utility base images are pinned. The MinIO community source release is archived; the project builds its final security-fixed release from source and treats that as an alpha-only dependency under review.
- Production credentials are set in Portainer stack variables. Docker administrators can inspect container environment values; this is the initial secret delivery mechanism, not a Vault.
- Manual release redeployment in Portainer is simplest for Stack UI-only access. The app can briefly restart during an update.
- Manual encrypted backups through a dedicated helper container. PostgreSQL, MinIO data, data-protection keys, and release identity are captured. The helper can upload encrypted archives to an operator-configured rclone remote. Local-only copies in the Docker volume are not offsite backups.
- Existing seeded `admin` / `admin` behaviour is unchanged. Before testers join, the operator replaces or deletes that account and explicitly resets the persisted data-protection key ring, invalidating all existing sessions.

## Repository implementation

1. **Production runtime:** `docker-stack.production.yml` is the image-only Swarm stack for Portainer. `docker-compose.production.yml` plus `docker-compose.production.local.yml` preserve local standalone production-mode builds. The normal `docker-compose.yml` remains the development stack.
2. **Routing and API boundary:** production frontend image serves compiled static assets behind Caddy; Caddy proxies API and file-host requests. Only its 80/443 bindings are published. API production configuration includes trusted proxy handling, durable data-protection keys, explicit readiness, protected admin routes, and rate limiting. MinIO bootstrap creates a private bucket and restricted app credentials.
3. **CI and release artifact:** CI runs existing frontend and backend checks, validates the Compose definitions, builds the production images, and starts a disposable production-shaped stack for smoke checks. After successful CI on `main`, the release workflow publishes five digest-addressed GHCR images and packages the Swarm stack, pinned image references, configuration template, recovery helper files, and runbook.
4. **Portainer recovery tools:** an encrypted backup helper, remote fetch helper, restore helper stack, and data-protection key reset helper are included. They use target-stack named volumes and network. Restore requires explicit target name, selected archive, matching age identity, and exact confirmation. Key reset requires exact confirmation and an explicit no-testers acknowledgement.
5. **Secret hygiene:** tracked examples are placeholders only. Docker build contexts exclude environment files, keys, and backup material. Git ignores local environment files. Release artifacts contain image identities but no production secrets.
6. **Operations guide:** `Docs/04 - Operations/Alpha Deployment.md` describes local production build, manual Portainer deployment/update, seeded-admin replacement, key invalidation, manual encrypted backup/restore, and remaining external checks.

## Portainer operator sequence

1. Configure domains, public 80/443 access, Portainer GHCR read credentials if packages are private, and an external backup destination.
2. Download the artifact from a successful release workflow, upload `docker-stack.production.yml` in Portainer, and set the stack name to `racletty-production`.
3. Enter the digest values in `release.env` and host/secrets from `.env.portainer.example`; deploy and check service health, TLS, readiness, and file access.
4. Sign in once with the existing seeded account, change its password or establish a replacement administrator, delete the seed, then reset the data-protection keys before testers are admitted.
5. For updates, upload the next release Compose and image digests to the existing stack while retaining all volumes and host configuration.
6. For backups, scale frontend/API/MinIO to zero, run the backup tool from its Portainer console, ensure the encrypted archive reaches the remote, restore service replicas, and check health. Restore and key-reset helpers are temporary stacks removed after use.

## Verification record

Previously performed during the initial standalone/local production preparation, before the Swarm adaptation:

- Frontend unit suite: 166 passed; production frontend build succeeded.
- Backend integration suite: 84 passed against disposable PostgreSQL and MinIO services.
- Local production Compose startup and smoke checks covered frontend HTML/deep routes, missing asset 404, API health/readiness, anonymous admin denial, file CORS preflight, and HTTP-to-HTTPS redirect.
- Chromium login review covered desktop/tablet/mobile widths, seeded login, cookie flags, and persistence after reload; a horizontal overflow issue in the 761–840px range was fixed.
- Earlier host-script backup/restore drill restored database and object data into a separate local Compose project. That SSH-oriented path has since been replaced by Portainer helper containers.

Verified on 2026-11-02, before the Swarm adaptation:

- Shell syntax passed for all `deploy/*.sh` scripts. Workflow and Compose YAML parsed; production/local and both helper Compose configurations rendered successfully. `git diff --check` passed with CRLF recognized as a line ending. `actionlint` was not installed.
- All five production images built locally, including the source-commit-verified MinIO image. The isolated local production stack reached healthy state after updating PostgreSQL within major version 17 and passed smoke checks for frontend HTML/deep route, missing asset 404, API liveness/readiness, anonymous admin denial, file CORS preflight, and HTTP-to-HTTPS redirect.
- A simulated release archive contained the production Compose, restore/key-reset Compose files, Portainer example, operator runbook, and release image manifest; it contained no production env file or encryption identity.
- A disposable Portainer-shaped recovery drill created an age-encrypted backup, restored through the helper Stack and verified database snapshot semantics (a post-snapshot table was removed), restored a MinIO object, and passed the production smoke checks. The six test volumes and helper containers were removed. The user later stopped the remaining local production containers to free resources; persistent local test volumes were retained.
- The Swarm stack and Traefik frontend variant were added after the checks above. They have not been deployed or validated against the friend's Traefik configuration. Confirm the external network, entrypoint, resolver, and free proxy subnet with the Swarm administrator first.
- No live GitHub package publish, Portainer UI deployment, VPS/DNS/firewall check, or remote backup/restore was performed. Those depend on external settings and infrastructure outside repository scope.

## Acceptance criteria

- [x] Development Compose remains unchanged in behaviour and the local production build uses isolated project volumes.
- [x] The Swarm stack can be uploaded to Portainer without a repository checkout and requires immutable application image references.
- [x] Traefik handles public 80/443; only the frontend is routable, while database, MinIO, and API have no public ports.
- [x] CI validates/builds production images and tests a disposable stack; the release workflow packages digest references and deployment/recovery files after successful `main` CI. The workflow was parsed and its bundle assembly simulated locally; an actual GitHub run remains external.
- [x] Portainer instructions explain image pulls, stack naming, host variables, secrets, first login, update, backup, restore, and key invalidation.
- [x] Backup archives are age-encrypted and contain database, MinIO, data-protection keys, and release identity; no claim of offsite backup is made until remote upload is configured and verified.
- [x] Recovery helpers bind target data/network and require explicit confirmation before destructive restore/key reset; a disposable restore drill passed.
- [x] No GitHub account configuration, VPS provider, domain, server, or external account was changed by repository work.
- [x] The existing seeded Admin is retained; operator documentation requires replacing/deleting it and invalidating pre-tester sessions.

## Known external gates

The repository cannot confirm the domain, DNS propagation, provider firewall, installed Docker/Portainer version, Portainer registry access, GHCR package visibility, available disk capacity, rclone provider credentials, remote retention, or restore from a real VPS. The operator must complete and verify those before inviting testers. A local restore drill does not validate any of these external services.
