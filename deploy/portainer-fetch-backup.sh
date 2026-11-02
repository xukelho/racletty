#!/bin/sh
set -eu
umask 077
: "${BACKUP_REMOTE:?Set BACKUP_REMOTE to the configured rclone remote path}"
: "${RCLONE_CONFIG_CONTENT:?Set RCLONE_CONFIG_CONTENT with the rclone remote configuration}"
NAME=${1:-}
case "$NAME" in
  racletty-????????T??????Z.tar.gz.age) ;;
  *) echo 'Pass a backup filename in the form racletty-YYYYMMDDTHHMMSSZ.tar.gz.age' >&2; exit 2 ;;
esac
WORK=$(mktemp -d /tmp/racletty-fetch.XXXXXX)
trap 'rm -rf "$WORK"' EXIT HUP INT TERM
printf '%s\n' "$RCLONE_CONFIG_CONTENT" > "$WORK/rclone.conf"
chmod 600 "$WORK/rclone.conf"
mkdir -p /backups
rclone copyto "${BACKUP_REMOTE%/}/$NAME" "/backups/$NAME" --config "$WORK/rclone.conf"
test -s "/backups/$NAME"
echo "Downloaded encrypted backup to /backups/$NAME"
