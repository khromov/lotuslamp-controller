#!/bin/bash
# Builds the maclotus CLI (if needed) and runs it with all arguments passed through.

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT="$SCRIPT_DIR/MacLotus.xcodeproj"

echo "[script] project: $PROJECT" >&2

# Build (incremental — only recompiles changed files)
xcodebuild -project "$PROJECT" \
  -scheme maclotus-cli \
  -configuration Debug \
  build \
  -quiet

# Find and run the binary
BINARY=$(xcodebuild -project "$PROJECT" \
  -scheme maclotus-cli \
  -configuration Debug \
  -showBuildSettings 2>/dev/null \
  | awk '/BUILT_PRODUCTS_DIR/ { print $3; exit }')

echo "[script] running: $BINARY/maclotus $*" >&2
exec "$BINARY/maclotus" "$@"
