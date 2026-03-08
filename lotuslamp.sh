#!/bin/bash
# Builds the lotuslamp CLI (if needed) and runs it with all arguments passed through.

set -e

REPO_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT="$REPO_DIR/LotusLamp/LotusLamp.xcodeproj"

# Build (incremental — only recompiles changed files)
xcodebuild -project "$PROJECT" \
  -scheme lotuslamp-cli \
  -configuration Debug \
  build \
  -quiet 2>/dev/null

# Find and run the binary
BINARY=$(xcodebuild -project "$PROJECT" \
  -scheme lotuslamp-cli \
  -configuration Debug \
  -showBuildSettings 2>/dev/null \
  | awk '/BUILT_PRODUCTS_DIR/ { print $3; exit }')

exec "$BINARY/lotuslamp" "$@"
