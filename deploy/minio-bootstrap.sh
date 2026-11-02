#!/bin/sh
set -eu
mc alias set local http://minio:9000 "$MINIO_ROOT_USER" "$MINIO_ROOT_PASSWORD" >/dev/null
mc mb --ignore-existing local/racletty-private
mc admin policy create local racletty-app /opt/racletty/minio-app-policy.json 2>/dev/null || {
  mc admin policy info local racletty-app >/dev/null
}
mc admin user add local "$MINIO_APP_USER" "$MINIO_APP_PASSWORD" 2>/dev/null || {
  mc admin user info local "$MINIO_APP_USER" >/dev/null
}
mc admin policy attach local racletty-app --user "$MINIO_APP_USER"
