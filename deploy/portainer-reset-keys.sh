#!/bin/sh
set -eu

: "${RACLETTY_STACK_NAME:?Set RACLETTY_STACK_NAME to the target Portainer stack name}"
: "${KEY_RESET_CONFIRMATION:?Set KEY_RESET_CONFIRMATION to RESET_KEYS_<stack-name>}"
[ "$KEY_RESET_CONFIRMATION" = "RESET_KEYS_$RACLETTY_STACK_NAME" ] || {
  echo "Confirmation must be exactly RESET_KEYS_$RACLETTY_STACK_NAME" >&2
  exit 2
}
[ "${1:-}" = --confirm-no-testers ] || {
  echo 'This invalidates every session. Confirm there are no testers, then pass --confirm-no-testers.' >&2
  exit 2
}
[ -d /reset/data-protection ] || { echo 'Data-protection volume is not mounted' >&2; exit 2; }
find /reset/data-protection -maxdepth 1 -type f -name 'key-*.xml' -delete
echo 'Persisted authentication keys removed. Restart the API and verify the replacement admin login.'
