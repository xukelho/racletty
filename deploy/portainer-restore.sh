#!/bin/sh
set -eu
umask 077

: "${RACLETTY_STACK_NAME:?Set RACLETTY_STACK_NAME to the exact target Portainer stack name}"
: "${RESTORE_FILE:?Set RESTORE_FILE to a backup file under /backups}"
: "${AGE_IDENTITY:?Set AGE_IDENTITY temporarily to the age private identity}"
: "${RESTORE_CONFIRMATION:?Set RESTORE_CONFIRMATION to RESTORE_<stack-name> after stopping frontend, api, and minio}"
[ "$RESTORE_CONFIRMATION" = "RESTORE_$RACLETTY_STACK_NAME" ] || {
  echo "Restore confirmation must be exactly RESTORE_$RACLETTY_STACK_NAME" >&2
  exit 2
}
case "$RESTORE_FILE" in
  /backups/racletty-*.tar.gz.age) ;;
  *) echo 'RESTORE_FILE must name a Racletty encrypted archive inside /backups' >&2; exit 2 ;;
esac
[ -s "$RESTORE_FILE" ] || { echo 'Backup file is missing or empty' >&2; exit 2; }
[ -d /restore/minio ] && [ -d /restore/data-protection ] || {
  echo 'Restore volumes are not mounted at the expected paths' >&2
  exit 2
}

WORK=$(mktemp -d /tmp/racletty-restore.XXXXXX)
IDENTITY_FILE="$WORK/age-identity"
cleanup() { rm -rf "$WORK"; }
trap cleanup EXIT HUP INT TERM
printf '%s\n' "$AGE_IDENTITY" > "$IDENTITY_FILE"
chmod 600 "$IDENTITY_FILE"
age -d -i "$IDENTITY_FILE" -o "$WORK/backup.tar.gz" "$RESTORE_FILE"
mkdir "$WORK/payload"
validate_archive_paths() {
  tar -tzf "$1" > "$WORK/archive-paths"
  awk 'BEGIN { bad = 0 } /^\// || /(^|\/)\.\.(\/|$)/ { bad = 1 } END { exit bad }' "$WORK/archive-paths" || {
    echo 'Backup archive contains an unsafe path' >&2
    exit 1
  }
}
validate_archive_paths "$WORK/backup.tar.gz"
tar -C "$WORK/payload" -xzf "$WORK/backup.tar.gz"
for file in database.dump minio-data.tar.gz data-protection.tar.gz docker-stack.production.yml release.env portainer-stack-name.txt; do
  test -s "$WORK/payload/$file" || { echo "Backup is missing $file" >&2; exit 1; }
done
[ "$(cat "$WORK/payload/portainer-stack-name.txt")" = "$RACLETTY_STACK_NAME" ] || {
  echo 'Backup was created from a different Portainer stack' >&2
  exit 2
}
validate_archive_paths "$WORK/payload/minio-data.tar.gz"
validate_archive_paths "$WORK/payload/data-protection.tar.gz"
pg_restore --list "$WORK/payload/database.dump" >/dev/null
[ "$PGDATABASE" != postgres ] && [ "$PGDATABASE" != template0 ] && [ "$PGDATABASE" != template1 ] || {
  echo 'Refusing to restore into a PostgreSQL maintenance/template database' >&2
  exit 2
}

echo "Restoring data into stack $RACLETTY_STACK_NAME. Verify the target stack and selected backup before proceeding."
dropdb --if-exists --force --maintenance-db=postgres \
  --host="${PGHOST:-db}" --port="${PGPORT:-7584}" \
  --username="${PGUSER:-racletty}" "${PGDATABASE:-racletty}"
createdb --maintenance-db=postgres --owner="${PGUSER:-racletty}" \
  --host="${PGHOST:-db}" --port="${PGPORT:-7584}" \
  --username="${PGUSER:-racletty}" "${PGDATABASE:-racletty}"
pg_restore --single-transaction --exit-on-error --no-owner --no-privileges \
  --host="${PGHOST:-db}" --port="${PGPORT:-7584}" \
  --username="${PGUSER:-racletty}" --dbname="${PGDATABASE:-racletty}" \
  "$WORK/payload/database.dump"
find /restore/minio -mindepth 1 -delete
tar -C /restore/minio -xzf "$WORK/payload/minio-data.tar.gz"
find /restore/data-protection -mindepth 1 -delete
tar -C /restore/data-protection -xzf "$WORK/payload/data-protection.tar.gz"
chown -R 10001:10001 /restore/data-protection
chmod 700 /restore/data-protection
echo "Restore completed. Backup release metadata:"
sed -n '1,8p' "$WORK/payload/release.env"
echo 'Remove AGE_IDENTITY and restore confirmation from Portainer, then start minio, api, and frontend.'
