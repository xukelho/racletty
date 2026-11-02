#!/bin/sh
set -eu

: "${APP_DOMAIN:?Set APP_DOMAIN}"
APP_ORIGIN=${APP_ORIGIN:-https://${APP_DOMAIN}}
FILES_URL=${FILES_PUBLIC_ENDPOINT:-https://${FILES_DOMAIN:-files.localhost}}
HTTP_PORT=${HTTP_PORT:-80}
HTTPS_PORT=${HTTPS_PORT:-443}
TLS_INSECURE=${TLS_INSECURE:-0}
APP_ORIGIN=${APP_ORIGIN%/}
FILES_URL=${FILES_URL%/}
HTTP_URL="http://${APP_DOMAIN}:${HTTP_PORT}"
EXPECTED_REDIRECT="https://${APP_DOMAIN}:${HTTPS_PORT}/api/health"

case "$TLS_INSECURE" in
  0|1) ;;
  *) echo 'TLS_INSECURE must be 0 or 1' >&2; exit 2 ;;
esac

request_status() {
  if [ "$TLS_INSECURE" -eq 1 ]; then
    curl --insecure --silent --show-error --output /dev/null --write-out '%{http_code}' \
      --connect-timeout 5 --max-time 20 "$@"
  else
    curl --silent --show-error --output /dev/null --write-out '%{http_code}' \
      --connect-timeout 5 --max-time 20 "$@"
  fi
}

expect_status() {
  name=$1
  expected=$2
  shift 2
  actual=$(request_status "$@") || {
    echo "Smoke check failed: $name could not reach its endpoint" >&2
    exit 1
  }
  [ "$actual" = "$expected" ] || {
    echo "Smoke check failed: $name returned HTTP $actual (expected $expected)" >&2
    exit 1
  }
  echo "ok: $name (HTTP $actual)"
}

expect_status 'application HTML' 200 "$APP_ORIGIN/"
expect_status 'SPA deep route' 200 "$APP_ORIGIN/notifications"
expect_status 'missing built asset' 404 "$APP_ORIGIN/assets/__racletty_missing_asset__.js"
expect_status 'API liveness' 200 "$APP_ORIGIN/api/health"
expect_status 'API readiness' 200 "$APP_ORIGIN/api/ready"
expect_status 'anonymous admin denial' 401 "$APP_ORIGIN/api/admin/roles"
expect_status 'file CORS preflight' 204 \
  --request OPTIONS \
  --header "Origin: $APP_ORIGIN" \
  --header 'Access-Control-Request-Method: GET' \
  --header 'Access-Control-Request-Headers: content-type' \
  "$FILES_URL/racletty-private/__racletty_smoke__.txt"
expect_status 'HTTP to HTTPS redirect' 301 "$HTTP_URL/api/health"

if [ "$TLS_INSECURE" -eq 1 ]; then
  location=$(curl --insecure --silent --show-error --dump-header - --output /dev/null \
    --connect-timeout 5 --max-time 20 "$HTTP_URL/api/health" |
    awk 'tolower($1) == "location:" { sub("\r$", "", $2); print $2; exit }')
else
  location=$(curl --silent --show-error --dump-header - --output /dev/null \
    --connect-timeout 5 --max-time 20 "$HTTP_URL/api/health" |
    awk 'tolower($1) == "location:" { sub("\r$", "", $2); print $2; exit }')
fi
[ "$location" = "$EXPECTED_REDIRECT" ] || {
  echo 'Smoke check failed: HTTP redirect target is incorrect' >&2
  exit 1
}
echo 'ok: HTTP redirect target'
