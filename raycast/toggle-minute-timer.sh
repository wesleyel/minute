#!/bin/bash

# Required parameters:
# @raycast.schemaVersion 1
# @raycast.title Toggle Minute Timer
# @raycast.mode compact
# @raycast.packageName Minute
#
# Optional parameters:
# @raycast.icon 🔄
# @raycast.description Stop the running timer, or resume the cached timer when idle.

set -euo pipefail

# 无参数切换：运行中则停止，空闲时读取 start 脚本保存的缓存并继续上一个计时。
SCRIPT_DIR=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)
CACHE_PATH="$SCRIPT_DIR/.minute-timer-cache.json"
LAST_NOTE_PATH="$SCRIPT_DIR/.start-minute-timer-last-note"
MINUTE_URL="${MINUTE_URL:-http://localhost:4000}"

status_response=$(curl -sS -w "\n%{http_code}" "$MINUTE_URL/api/raycast/timer")
status_http_status=$(printf "%s" "$status_response" | tail -n 1)
status_response_body=$(printf "%s" "$status_response" | sed '$d')

if [[ "$status_http_status" != 2* ]]; then
  node -e '
const body = JSON.parse(process.argv[1]);
console.error(body.error ?? "Minute timer request failed");
' "$status_response_body"
  exit 1
fi

is_running=$(node -e '
const status = JSON.parse(process.argv[1]);
process.stdout.write(status.isRunning ? "true" : "false");
' "$status_response_body")

if [[ "$is_running" == "true" ]]; then
  body='{"action":"stop"}'
else
  body=$(node -e '
const fs = require("fs");
const [, cachePath, legacyNotePath] = process.argv;
const body = { action: "start" };

if (fs.existsSync(cachePath)) {
  const cache = JSON.parse(fs.readFileSync(cachePath, "utf8"));
  if (typeof cache.description === "string" && cache.description.length > 0) {
    body.description = cache.description;
  }
  if (typeof cache.folderId === "string" && cache.folderId.length > 0) {
    body.folderId = cache.folderId;
  } else if (typeof cache.folder === "string" && cache.folder.length > 0) {
    body.folder = cache.folder;
  }
} else if (fs.existsSync(legacyNotePath)) {
  const description = fs.readFileSync(legacyNotePath, "utf8");
  if (description.length > 0) {
    body.description = description;
  }
} else {
  console.error("No cached Minute timer. Run Start Minute Timer once first.");
  process.exit(64);
}

process.stdout.write(JSON.stringify(body));
' "$CACHE_PATH" "$LAST_NOTE_PATH")
fi

response=$(curl -sS -w "\n%{http_code}" "$MINUTE_URL/api/raycast/timer" \
  -H "Content-Type: application/json" \
  -d "$body")
http_status=$(printf "%s" "$response" | tail -n 1)
response_body=$(printf "%s" "$response" | sed '$d')

if [[ "$http_status" != 2* ]]; then
  node -e '
const body = JSON.parse(process.argv[1]);
console.error(body.error ?? "Minute timer request failed");
' "$response_body"
  exit 1
fi

# shellcheck disable=SC2016
node -e '
const status = JSON.parse(process.argv[1]);
if (status.isRunning) {
  console.log(`Started: ${status.runningTimeEntry.description}`);
} else {
  console.log("Stopped");
}
' "$response_body"
