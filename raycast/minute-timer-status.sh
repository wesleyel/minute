#!/bin/bash

# Required parameters:
# @raycast.schemaVersion 1
# @raycast.title Minute Timer Status
# @raycast.mode compact
# @raycast.packageName Minute
#
# Optional parameters:
# @raycast.icon 📊
# @raycast.description Show timer state, current session, and today's total duration.

set -euo pipefail

# 查询当前 Minute timer 状态；输出今日累计时长，运行中时附带当前会话与 note。
MINUTE_URL="${MINUTE_URL:-http://localhost:4000}"

response=$(curl -sS -w "\n%{http_code}" "$MINUTE_URL/api/raycast/timer")
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
const format = (seconds) => {
  const h = String(Math.floor(seconds / 3600)).padStart(2, "0");
  const m = String(Math.floor((seconds % 3600) / 60)).padStart(2, "0");
  const s = String(seconds % 60).padStart(2, "0");
  return `${h}:${m}:${s}`;
};
const today = format(status.todayTotalDuration ?? 0);
if (!status.isRunning) {
  console.log(`今日 ${today}`);
} else {
  const note = status.runningTimeEntry.description;
  console.log(`今日 ${today} · ${format(status.currentDuration)} ${note}`);
}
' "$response_body"
