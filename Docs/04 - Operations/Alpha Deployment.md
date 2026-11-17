# Local production-mode runbook

Status: Local diagnosis only; server deployment configuration is deferred

Last updated: 2026-11-17

This guide covers running the production-mode application locally for diagnosis. It does not define a server deployment. A deployment target and its networking, storage, secrets, and release process will be documented separately once selected.

The MinIO community repository is archived and no longer publishes its current community release as an official container. This project builds the upstream `RELEASE.2025-10-15T17-29-55Z` source into its own image; that source release includes the October 2025 service-account policy fix. Upstream describes source-built deployments as operator responsibility, so keep this choice under review before broader production use. See the [upstream security release](https://github.com/minio/minio/releases/tag/RELEASE.2025-10-15T17-29-55Z) and [source-build guidance](https://github.com/minio/minio#install-from-source). Buckets created by MinIO are private by default; the bootstrap creates no anonymous access policy.

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

The local stack remains separate from development `docker-compose.yml`. Do not use it as a server deployment definition; the next server's deployment configuration will be supplied separately.

## Alpha release checks

Before inviting testers, exercise company access boundaries, user disable/delete behavior, CSRF-protected mutations, uploads/downloads/previews, representative large drawings, and Maps if enabled. Review browser console and CSP report-only output before enforcing a stricter policy.
