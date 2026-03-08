#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
TEAM_ID="36S2252ZTN"
APP_NAME="MacLotus"
BUNDLE_ID="se.khromov.maclotus"
KEYCHAIN_PROFILE="MacLotus"
BUILD_DIR="$REPO_ROOT/build/release"
DMG_NAME="MacLotus.dmg"

SKIP_NOTARIZE=false
for arg in "$@"; do
  [[ "$arg" == "--skip-notarize" ]] && SKIP_NOTARIZE=true
done

echo "==> Regenerating Xcode project"
cd "$REPO_ROOT"
xcodegen generate

echo "==> Building Release"
xcodebuild \
  -project MacLotus.xcodeproj \
  -scheme MacLotus \
  -configuration Release \
  -derivedDataPath "$BUILD_DIR/DerivedData" \
  SYMROOT="$BUILD_DIR/Products" \
  build

APP_PATH="$BUILD_DIR/Products/Release/$APP_NAME.app"

if [[ ! -d "$APP_PATH" ]]; then
  echo "ERROR: App not found at $APP_PATH"
  exit 1
fi

# Re-sign the embedded CLI binary with hardened runtime
echo "==> Re-signing embedded CLI binary"
codesign --force --options runtime \
  --sign "Developer ID Application: $(security find-identity -v -p codesigning | grep "Developer ID Application" | grep "$TEAM_ID" | head -1 | sed 's/.*"\(.*\)"/\1/')" \
  "$APP_PATH/Contents/Resources/maclotus"

echo "==> Verifying app signature"
codesign --verify --deep --strict "$APP_PATH"
spctl --assess --type exec "$APP_PATH"

echo "==> Creating DMG"
DMG_STAGING="$BUILD_DIR/dmg-staging"
rm -rf "$DMG_STAGING"
mkdir -p "$DMG_STAGING"
cp -R "$APP_PATH" "$DMG_STAGING/"
ln -s /Applications "$DMG_STAGING/Applications"

DMG_PATH="$REPO_ROOT/$DMG_NAME"
rm -f "$DMG_PATH"
hdiutil create \
  -volname "$APP_NAME" \
  -srcfolder "$DMG_STAGING" \
  -ov \
  -format UDZO \
  "$DMG_PATH"

echo "==> Signing DMG"
codesign --force --sign "Developer ID Application: $(security find-identity -v -p codesigning | grep "Developer ID Application" | grep "$TEAM_ID" | head -1 | sed 's/.*"\(.*\)"/\1/')" \
  "$DMG_PATH"

if [[ "$SKIP_NOTARIZE" == true ]]; then
  echo "==> Skipping notarization (--skip-notarize)"
  echo "Done: $DMG_PATH"
  exit 0
fi

echo "==> Notarizing DMG"
echo "    (requires keychain profile '$KEYCHAIN_PROFILE' — set up with:)"
echo "    xcrun notarytool store-credentials \"$KEYCHAIN_PROFILE\" \\"
echo "      --apple-id \"your@email.com\" \\"
echo "      --team-id \"$TEAM_ID\" \\"
echo "      --password \"app-specific-password\""
echo ""

xcrun notarytool submit "$DMG_PATH" \
  --keychain-profile "$KEYCHAIN_PROFILE" \
  --wait

echo "==> Stapling notarization ticket"
xcrun stapler staple "$DMG_PATH"

echo "==> Verifying notarization"
spctl --assess --type open --context context:primary-signature "$DMG_PATH"

echo ""
echo "Done: $DMG_PATH"
