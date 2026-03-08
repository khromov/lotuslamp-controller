#!/bin/bash
# Builds the lotuslamp CLI (if needed) and runs it with all arguments passed through.

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT="$SCRIPT_DIR/LotusLamp.xcodeproj"

echo "[script] project: $PROJECT" >&2

# Build (incremental — only recompiles changed files)
xcodebuild -project "$PROJECT" \
  -scheme lotuslamp-cli \
  -configuration Debug \
  build \
  -quiet

# Find and run the binary
BINARY=$(xcodebuild -project "$PROJECT" \
  -scheme lotuslamp-cli \
  -configuration Debug \
  -showBuildSettings 2>/dev/null \
  | awk '/BUILT_PRODUCTS_DIR/ { print $3; exit }')

echo "[script] running: $BINARY/lotuslamp $*" >&2
exec "$BINARY/lotuslamp" "$@"
