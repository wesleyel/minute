#!/bin/bash

# Required parameters:
# @raycast.schemaVersion 1
# @raycast.title Stop Minute Timer
# @raycast.mode compact
# @raycast.packageName Minute
#
# Optional parameters:
# @raycast.icon ⏸

set -euo pipefail

MINUTE_URL="${MINUTE_URL:-http://localhost:4000}"

response=$(curl -sS -w "\n%{http_code}" "$MINUTE_URL/api/raycast/timer" \
  -H "Content-Type: application/json" \
  -d '{"action":"stop"}')
http_status=$(printf "%s" "$response" | tail -n 1)
response_body=$(printf "%s" "$response" | sed '$d')

if [[ "$http_status" != 2* ]]; then
  node -e '
const body = JSON.parse(process.argv[1]);
console.error(body.error ?? "Minute timer request failed");
' "$response_body"
  exit 1
fi

node -e '
const status = JSON.parse(process.argv[1]);
console.log(status.isRunning ? "Still running" : "Stopped");
' "$response_body"
