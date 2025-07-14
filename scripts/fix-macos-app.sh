#!/bin/bash

# Script to fix macOS app quarantine issues
# Run this after downloading the app

APP_NAME="FilmoMania Beta.app"
APP_PATH="/Applications/$APP_NAME"

echo "🔧 Fixing macOS app quarantine issues..."

# Check if app exists
if [ ! -d "$APP_PATH" ]; then
    echo "❌ App not found at $APP_PATH"
    echo "Please make sure the app is installed in /Applications/"
    exit 1
fi

# Remove quarantine attributes
echo "📦 Removing quarantine attributes..."
xattr -rd com.apple.quarantine "$APP_PATH"

# Remove extended attributes that might cause issues
echo "🧹 Cleaning extended attributes..."
xattr -cr "$APP_PATH"

echo "✅ App should now be ready to run!"
echo "💡 If you still get 'damaged' error, try:"
echo "   - Right-click the app → Open"
echo "   - Or go to System Preferences → Security & Privacy → Allow anyway"
