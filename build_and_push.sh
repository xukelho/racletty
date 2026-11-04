#!/usr/bin/env bash

# Build and push the Racletty images used by the Portainer stacks.
#
# Usage:
#   ./build_and_push.sh <docker-username> [tag] [--no-push]
#
# Example:
#   ./build_and_push.sh hammebsb v1.0.0
#   DOCKER_BIN="sudo -n docker" ./build_and_push.sh hammebsb v1.0.0 --no-push
#
# Optional environment:
#   DOCKER_BIN                Docker command to use (default: docker)
#   VITE_GOOGLE_MAPS_API_KEY  Baked into the frontend bundle when set.

set -euo pipefail

if [[ $# -lt 1 ]]; then
  echo "Usage: $0 <docker-username> [tag] [--no-push]" >&2
  echo "Example: $0 hammebsb v1.0.0" >&2
  exit 1
fi

DOCKER_USER="$1"
TAG="${2:-latest}"
PUSH=1
[[ "${3:-}" == "--no-push" ]] && PUSH=0
MAPS_KEY="${VITE_GOOGLE_MAPS_API_KEY:-}"
DOCKER_BIN="${DOCKER_BIN:-docker}"

read -r -a DOCKER_CMD <<< "$DOCKER_BIN"

if ! "${DOCKER_CMD[@]}" info >/dev/null 2>&1; then
  echo "Docker daemon is not accessible with: ${DOCKER_BIN}" >&2
  echo "Add the user to the docker group and start a new shell, or use sudo." >&2
  exit 1
fi

IMAGES=(
  "${DOCKER_USER}/racletty-backend:${TAG}"
  "${DOCKER_USER}/racletty-frontend:${TAG}"
  "${DOCKER_USER}/racletty-minio:${TAG}"
  "${DOCKER_USER}/racletty-mc:${TAG}"
  "${DOCKER_USER}/racletty-minio-bootstrap:${TAG}"
  "${DOCKER_USER}/racletty-backup-tools:${TAG}"
)

echo ">>> Building ${IMAGES[0]}"
"${DOCKER_CMD[@]}" build -t "${IMAGES[0]}" -f Backend/Dockerfile Backend

echo ">>> Building ${IMAGES[1]}"
"${DOCKER_CMD[@]}" build -t "${IMAGES[1]}" \
  -f Frontend/Dockerfile.production \
  --build-arg CADDY_CONFIG=deploy/Caddyfile.swarm \
  --build-arg "VITE_GOOGLE_MAPS_API_KEY=${MAPS_KEY}" \
  .

echo ">>> Building ${IMAGES[2]}"
"${DOCKER_CMD[@]}" build -t "${IMAGES[2]}" -f deploy/minio.Dockerfile .

echo ">>> Building ${IMAGES[3]}"
"${DOCKER_CMD[@]}" build -t "${IMAGES[3]}" -f deploy/minio-client.Dockerfile .

echo ">>> Building ${IMAGES[4]}"
"${DOCKER_CMD[@]}" build -t "${IMAGES[4]}" -f deploy/minio-bootstrap.Dockerfile .

echo ">>> Building ${IMAGES[5]}"
"${DOCKER_CMD[@]}" build -t "${IMAGES[5]}" -f deploy/backup-tools.Dockerfile .

if [[ "$PUSH" -eq 1 ]]; then
  for image in "${IMAGES[@]}"; do
    echo ">>> Pushing ${image}"
    "${DOCKER_CMD[@]}" push "${image}"
  done
  echo "All images built and pushed with tag '${TAG}'."
else
  echo "All images built with tag '${TAG}' (push skipped)."
fi
