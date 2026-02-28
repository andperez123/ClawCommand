#!/usr/bin/env bash
set -euo pipefail

BUNDLE="$(dirname "$0")/../packages/scanner/dist/openclaw-scan-bundle.mjs"

if [ $# -lt 1 ]; then
  echo "Usage: ./scripts/scan-remote.sh user@host [/workspace/path]"
  echo ""
  echo "Examples:"
  echo "  ./scripts/scan-remote.sh pi@192.168.1.50"
  echo "  ./scripts/scan-remote.sh pi@raspberrypi.local /home/pi/my-project"
  exit 1
fi

HOST="$1"
REMOTE_PATH="${2:-}"

echo "→ Copying scanner to $HOST..."
scp -q "$BUNDLE" "$HOST:/tmp/openclaw-scan.mjs"

if [ -n "$REMOTE_PATH" ]; then
  SCAN_CMD="node /tmp/openclaw-scan.mjs --path $REMOTE_PATH --include-runs"
else
  SCAN_CMD="node /tmp/openclaw-scan.mjs --include-runs"
fi

echo "→ Running scan..."
OUTFILE="snapshot-$(echo "$HOST" | tr '@:.' '-')-$(date +%Y%m%d-%H%M%S).json"
ssh "$HOST" "$SCAN_CMD" > "$OUTFILE"

echo "→ Cleaning up..."
ssh "$HOST" "rm -f /tmp/openclaw-scan.mjs"

echo "✓ Done! Snapshot saved to $OUTFILE"
