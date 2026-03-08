#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BUILD_DIR="$SCRIPT_DIR/build/debug"

echo "==> Regenerating Xcode project"
cd "$SCRIPT_DIR"
xcodegen generate

echo "==> Building CLI (Debug)"
xcodebuild \
  -project LotusLamp.xcodeproj \
  -scheme lotuslamp-cli \
  -configuration Debug \
  -derivedDataPath "$BUILD_DIR/DerivedData" \
  SYMROOT="$BUILD_DIR/Products" \
  build

echo "==> Building App (Debug)"
xcodebuild \
  -project LotusLamp.xcodeproj \
  -scheme LotusLamp \
  -configuration Debug \
  -derivedDataPath "$BUILD_DIR/DerivedData" \
  SYMROOT="$BUILD_DIR/Products" \
  build

OUTPUT_DIR="$BUILD_DIR/Products/Debug"

if [[ ! -d "$OUTPUT_DIR/LotusLamp.app" ]]; then
  echo "ERROR: App not found at $OUTPUT_DIR/LotusLamp.app"
  exit 1
fi

echo "Done: $OUTPUT_DIR"
open "$OUTPUT_DIR"
