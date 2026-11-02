#!/bin/sh
set -eu
umask 077

DEST=${BACKUP_DIR:-/backups}
WORK=$(mktemp -d /tmp/racletty-backup.XXXXXX)
cleanup() { rm -rf "$WORK"; }
trap cleanup EXIT HUP INT TERM

: "${AGE_RECIPIENT:?Set AGE_RECIPIENT before taking a backup}"
: "${RACLETTY_STACK_NAME:?Set RACLETTY_STACK_NAME to the exact Portainer stack name}"
: "${RACLETTY_RELEASE_COMMIT:?Release commit is missing}"
: "${RACLETTY_API_IMAGE:?API image digest is missing}"
: "${RACLETTY_FRONTEND_IMAGE:?Frontend image digest is missing}"
: "${RACLETTY_MINIO_BOOTSTRAP_IMAGE:?MinIO bootstrap image digest is missing}"
: "${RACLETTY_BACKUP_TOOLS_IMAGE:?Backup tools image digest is missing}"
: "${RACLETTY_POSTGRES_IMAGE:?PostgreSQL image reference is missing}"
: "${RACLETTY_MINIO_IMAGE:?MinIO image reference is missing}"
: "${RACLETTY_MINIO_MC_IMAGE:?MinIO client image reference is missing}"

case "$RACLETTY_RELEASE_COMMIT" in
  [0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f]*) ;;
  *) echo 'Release commit is not a full lowercase Git SHA' >&2; exit 2 ;;
esac
[ "${#RACLETTY_RELEASE_COMMIT}" -eq 40 ] || { echo 'Release commit must contain 40 characters' >&2; exit 2; }

case "${1:-}" in
  --confirm-services-stopped) ;;
  *) echo 'Scale frontend, api, and minio to zero replicas in Portainer first, then pass --confirm-services-stopped.' >&2; exit 2 ;;
esac

pg_isready -h "${PGHOST:-db}" -p "${PGPORT:-7584}" -U "${PGUSER:-racletty}" -d "${PGDATABASE:-racletty}" >/dev/null || {
  echo 'PostgreSQL is not ready; no backup was created.' >&2
  exit 1
}

mkdir -p "$DEST"
chmod 700 "$DEST"
PAYLOAD="$WORK/payload"
mkdir -m 700 "$PAYLOAD"
pg_dump --format=custom --no-owner --no-privileges \
  --host="${PGHOST:-db}" --port="${PGPORT:-7584}" \
  --username="${PGUSER:-racletty}" --dbname="${PGDATABASE:-racletty}" \
  --file="$PAYLOAD/database.dump"
tar -C /source/minio -czf "$PAYLOAD/minio-data.tar.gz" .
tar -C /source/data-protection -czf "$PAYLOAD/data-protection.tar.gz" .
cp /opt/racletty/docker-stack.production.yml "$PAYLOAD/docker-stack.production.yml"
cat > "$PAYLOAD/release.env" <<EOF
COMMIT=$RACLETTY_RELEASE_COMMIT
API_IMAGE=$RACLETTY_API_IMAGE
FRONTEND_IMAGE=$RACLETTY_FRONTEND_IMAGE
MINIO_BOOTSTRAP_IMAGE=$RACLETTY_MINIO_BOOTSTRAP_IMAGE
BACKUP_TOOLS_IMAGE=$RACLETTY_BACKUP_TOOLS_IMAGE
POSTGRES_IMAGE=$RACLETTY_POSTGRES_IMAGE
MINIO_IMAGE=$RACLETTY_MINIO_IMAGE
MINIO_MC_IMAGE=$RACLETTY_MINIO_MC_IMAGE
EOF
printf '%s\n' "$RACLETTY_STACK_NAME" > "$PAYLOAD/portainer-stack-name.txt"
test -s "$PAYLOAD/database.dump"
test -s "$PAYLOAD/minio-data.tar.gz"
test -s "$PAYLOAD/data-protection.tar.gz"

STAMP=$(date -u +%Y%m%dT%H%M%SZ)
ARCHIVE_NAME="racletty-$STAMP.tar.gz.age"
if [ -e "$DEST/$ARCHIVE_NAME" ]; then
  echo "A backup already exists for this timestamp: $ARCHIVE_NAME" >&2
  exit 1
fi
tar -C "$PAYLOAD" -czf "$WORK/racletty-$STAMP.tar.gz" .
age -r "$AGE_RECIPIENT" -o "$DEST/.$ARCHIVE_NAME.tmp" "$WORK/racletty-$STAMP.tar.gz"
test -s "$DEST/.$ARCHIVE_NAME.tmp"
chmod 600 "$DEST/.$ARCHIVE_NAME.tmp"
mv "$DEST/.$ARCHIVE_NAME.tmp" "$DEST/$ARCHIVE_NAME"

if [ -n "${BACKUP_REMOTE:-}" ]; then
  : "${RCLONE_CONFIG_CONTENT:?Set RCLONE_CONFIG_CONTENT when BACKUP_REMOTE is configured}"
  RCLONE_CONFIG_FILE="$WORK/rclone.conf"
  printf '%s\n' "$RCLONE_CONFIG_CONTENT" > "$RCLONE_CONFIG_FILE"
  chmod 600 "$RCLONE_CONFIG_FILE"
  rclone copyto "$DEST/$ARCHIVE_NAME" "${BACKUP_REMOTE%/}/$ARCHIVE_NAME" --config "$RCLONE_CONFIG_FILE"
  rclone check --download "$DEST" "$BACKUP_REMOTE" --include "$ARCHIVE_NAME" --config "$RCLONE_CONFIG_FILE"
  echo "Encrypted backup created and verified at $BACKUP_REMOTE/$ARCHIVE_NAME"
else
  echo "Encrypted backup created in Portainer volume backup-data: $ARCHIVE_NAME"
fi
