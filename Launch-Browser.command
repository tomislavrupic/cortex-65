#!/bin/zsh
set -eu
cd "${0:A:h}/dist"
PORT=8765
if /usr/bin/curl -fsS "http://127.0.0.1:$PORT/" 2>/dev/null | /usr/bin/grep -q 'CORTEX'; then
  /usr/bin/open "http://127.0.0.1:$PORT/"
  exit 0
fi
PYTHON="/usr/bin/python3"
if [[ ! -x "$PYTHON" ]]; then PYTHON="$(command -v python3)"; fi
"$PYTHON" -m http.server "$PORT" --bind 127.0.0.1 &
CORTEX_SERVER_PID=$!
trap 'kill "$CORTEX_SERVER_PID" 2>/dev/null || true' EXIT INT TERM
sleep 1
/usr/bin/open "http://127.0.0.1:$PORT/"
print 'CORTEX / 65 is running locally. Keep this window open; Ctrl+C stops the server.'
wait "$CORTEX_SERVER_PID"
