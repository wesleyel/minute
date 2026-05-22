#!/bin/bash

# Required parameters:
# @raycast.schemaVersion 1
# @raycast.title Toggle Minute Timer
# @raycast.mode compact
# @raycast.packageName Minute
#
# Optional parameters:
# @raycast.icon 🔄
# @raycast.description Start the timer when idle, or stop the running timer.
# @raycast.argument1 { "type": "dropdown", "placeholder": "分类", "data": [{ "title": "数学", "value": "数学" }, { "title": "408", "value": "408" }, { "title": "英语", "value": "英语" }] }
# @raycast.argument2 { "type": "text", "placeholder": "note", "optional": true }

set -euo pipefail

# 参数顺序：$1 是分类，$2 是 note；启动时 note 为空则复用脚本目录里的上一次 note。
SCRIPT_DIR=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)
LAST_NOTE_PATH="$SCRIPT_DIR/.toggle-minute-timer-last-note"
MINUTE_URL="${MINUTE_URL:-http://localhost:4000}"
FOLDER="${1:-}"
NOTE="${2:-}"

if [[ -z "$NOTE" && -r "$LAST_NOTE_PATH" ]]; then
  NOTE=$(<"$LAST_NOTE_PATH")
fi

NOTE="${NOTE:-Raycast timer}"

body=$(node -e '
const [, action, description, folder] = process.argv;
const body = { action, description };
if (folder) {
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(folder)) {
    body.folderId = folder;
  } else {
    body.folder = folder;
  }
}
process.stdout.write(JSON.stringify(body));
' toggle "$NOTE" "$FOLDER")

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

node -e '
const fs = require("fs");
const status = JSON.parse(process.argv[1]);
if (status.isRunning) {
  fs.writeFileSync(process.argv[3], process.argv[2]);
  console.log(`Started: ${status.runningTimeEntry.description}`);
} else {
  console.log("Stopped");
}
' "$response_body" "$NOTE" "$LAST_NOTE_PATH"
