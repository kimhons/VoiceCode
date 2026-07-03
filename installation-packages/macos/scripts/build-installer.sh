#!/bin/bash
# VoiceFlow Pro macOS Installer Build Script
# This script builds the macOS installer for VoiceFlow Pro

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
BUILD_DIR="$PROJECT_ROOT/../build"
DIST_DIR="$PROJECT_ROOT/../dist-macos"

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Functions
print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check prerequisites
check_prerequisites() {
    print_info "Checking prerequisites..."
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        print_error "Node.js not found. Please install Node.js v18 or higher."
        exit 1
    fi
    NODE_VERSION=$(node --version)
    print_success "Node.js $NODE_VERSION found"
    
    # Check Rust
    if ! command -v rustc &> /dev/null; then
        print_error "Rust not found. Please install Rust."
        exit 1
    fi
    RUST_VERSION=$(rustc --version)
    print_success "$RUST_VERSION found"
    
    # Check Tauri CLI
    if ! npx @tauri-apps/cli --version &> /dev/null; then
        print_info "Installing Tauri CLI..."
        npm install -g @tauri-apps/cli
    fi
    TAURI_VERSION=$(npx @tauri-apps/cli --version)
    print_success "Tauri CLI $TAURI_VERSION found"
    
    # Check macOS build tools
    if [[ "$OSTYPE" == "darwin"* ]]; then
        if ! command -v xcodebuild &> /dev/null; then
            print_error "Xcode command line tools not found. Please install Xcode."
            exit 1
        fi
        print_success "Xcode command line tools found"
    fi
}

# Clean previous builds
clean_builds() {
    print_info "Cleaning previous builds..."
    
    if [ -d "dist" ]; then
        rm -rf dist
    fi
    
    if [ -d "src-tauri/target/release" ]; then
        rm -rf src-tauri/target/release
    fi
    
    if [ -d "$DIST_DIR" ]; then
        rm -rf "$DIST_DIR"
    fi
    
    if [ -d "$BUILD_DIR" ]; then
        rm -rf "$BUILD_DIR"
    fi
    
    print_success "Build directories cleaned"
}

# Install dependencies
install_dependencies() {
    print_info "Installing dependencies..."
    npm install
    print_success "Dependencies installed"
}

# Build the application
build_application() {
    print_info "Building VoiceFlow Pro for macOS..."
    
    # Build for Intel Macs
    print_info "Building for Intel Macs..."
    npx tauri build --target x86_64-apple-darwin
    
    # Build for Apple Silicon Macs
    print_info "Building for Apple Silicon Macs..."
    npx tauri build --target aarch64-apple-darwin
    
    print_success "Application built successfully"
}

# Create DMG installer
create_dmg() {
    print_info "Creating DMG installer..."
    
    mkdir -p "$BUILD_DIR"
    cd "$BUILD_DIR"
    
    # Create temporary folder for DMG contents
    DMG_TEMP="dmg_contents"
    mkdir -p "$DMG_TEMP"
    
    # Copy app bundles
    cp -R ../src-tauri/target/release/bundle/macos/VoiceFlow\ Pro.app "$DMG_TEMP/"
    
    # Create Applications alias
    ln -s /Applications "$DMG_TEMP/Applications"
    
    # Create DMG background
    mkdir -p "$DMG_TEMP/.background"
    # This would contain a background image for the DMG
    
    # Copy installer resources
    cp -R ../resources/* "$DMG_TEMP/"
    
    # Create DMG
    hdiutil create -volname "VoiceFlow Pro" -srcfolder "$DMG_TEMP" -ov -format UDZO "VoiceFlow Pro.dmg"
    
    # Clean up
    rm -rf "$DMG_TEMP"
    
    cd ..
    print_success "DMG installer created: $BUILD_DIR/VoiceFlow Pro.dmg"
}

# Create ZIP archive
create_zip() {
    print_info "Creating ZIP archive..."
    
    mkdir -p "$BUILD_DIR"
    cd "$BUILD_DIR"
    
    # Create ZIP of the app bundle
    zip -r "VoiceFlow Pro.zip" "../src-tauri/target/release/bundle/macos/VoiceFlow Pro.app"
    
    cd ..
    print_success "ZIP archive created: $BUILD_DIR/VoiceFlow Pro.zip"
}

# Sign the application (requires developer certificate)
sign_application() {
    if [ -n "$APPLE_ID" ] && [ -n "$APPLE_ID_PASSWORD" ]; then
        print_info "Signing application with Apple Developer Certificate..."
        
        # Sign the app bundle
        codesign --force --options runtime --entitlements "../resources/entitlements.plist" \
                 --sign "$APPLE_ID" "src-tauri/target/release/bundle/macos/VoiceFlow Pro.app"
        
        # Notarize the app
        xcrun notarytool submit "src-tauri/target/release/bundle/macos/VoiceFlow Pro.app" \
                 --apple-id "$APPLE_ID" \
                 --password "$APPLE_ID_PASSWORD" \
                 --team-id "$TEAM_ID" \
                 --wait
        
        # Staple the app
        xcrun stapler staple "src-tauri/target/release/bundle/macos/VoiceFlow Pro.app"
        
        print_success "Application signed and notarized successfully"
    else
        print_warning "Skipping code signing (APPLE_ID and APPLE_ID_PASSWORD not set)"
    fi
}

# Create distribution package
create_distribution() {
    print_info "Creating distribution package..."
    
    mkdir -p "$DIST_DIR"
    
    # Copy installers
    if [ -f "$BUILD_DIR/VoiceFlow Pro.dmg" ]; then
        cp "$BUILD_DIR/VoiceFlow Pro.dmg" "$DIST_DIR/"
    fi
    
    if [ -f "$BUILD_DIR/VoiceFlow Pro.zip" ]; then
        cp "$BUILD_DIR/VoiceFlow Pro.zip" "$DIST_DIR/"
    fi
    
    # Copy app bundles for direct distribution
    mkdir -p "$DIST_DIR/app-bundles"
    cp -R "src-tauri/target/release/bundle/macos/VoiceFlow Pro.app" "$DIST_DIR/app-bundles/"
    
    # Copy documentation
    cp "README.md" "$DIST_DIR/"
    cp "LICENSE" "$DIST_DIR/"
    if [ -f "CHANGELOG.md" ]; then
        cp "CHANGELOG.md" "$DIST_DIR/"
    fi
    
    # Create checksum file
    if [ -f "$DIST_DIR/VoiceFlow Pro.dmg" ]; then
        shasum -a 256 "$DIST_DIR/VoiceFlow Pro.dmg" > "$DIST_DIR/checksum.txt"
    fi
    
    print_success "Distribution package created: $DIST_DIR"
}

# Create installer script
create_installer_script() {
    print_info "Creating installer script..."
    
    cat > "$DIST_DIR/install.sh" << 'EOF'
#!/bin/bash
# VoiceFlow Pro macOS Installer Script

set -e

APP_NAME="VoiceFlow Pro"
APP_BUNDLE="VoiceFlow Pro.app"
INSTALL_DIR="/Applications"
DMG_FILE="VoiceFlow Pro.dmg"
ZIP_FILE="VoiceFlow Pro.zip"

echo "=== VoiceFlow Pro macOS Installer ==="
echo ""

# Check if running as admin (not required but recommended)
if [ "$EUID" -ne 0 ]; then
    echo "Note: Installation may require administrator privileges for some actions."
fi

# Find the installer file
INSTALLER_FILE=""
if [ -f "$DMG_FILE" ]; then
    INSTALLER_FILE="$DMG_FILE"
elif [ -f "$ZIP_FILE" ]; then
    INSTALLER_FILE="$ZIP_FILE"
else
    echo "Error: Could not find installer file ($DMG_FILE or $ZIP_FILE)"
    exit 1
fi

echo "Found installer: $INSTALLER_FILE"

# Mount DMG if needed
if [[ "$INSTALLER_FILE" == *.dmg ]]; then
    echo "Mounting DMG..."
    hdiutil attach "$INSTALLER_FILE" -quiet
    
    # Wait for volume to mount
    sleep 2
    
    # Find the mounted volume
    VOLUME_PATH=$(hdiutil info | grep "/Volumes/" | tail -1 | awk '{print $1}')
    
    if [ -z "$VOLUME_PATH" ]; then
        echo "Error: Could not find mounted volume"
        exit 1
    fi
    
    echo "Volume mounted at: $VOLUME_PATH"
    
    # Copy app to Applications
    echo "Installing $APP_NAME to $INSTALL_DIR..."
    cp -R "$VOLUME_PATH/$APP_BUNDLE" "$INSTALL_DIR/"
    
    # Unmount DMG
    hdiutil detach "$VOLUME_PATH" -quiet
    
    echo "✓ Installation completed successfully!"
    echo ""
    echo "You can now find $APP_NAME in your Applications folder."
    
elif [[ "$INSTALLER_FILE" == *.zip ]]; then
    echo "Extracting archive..."
    unzip -q "$INSTALLER_FILE" -d /tmp/
    
    # Copy app to Applications
    echo "Installing $APP_NAME to $INSTALL_DIR..."
    cp -R "/tmp/$APP_BUNDLE" "$INSTALL_DIR/"
    
    # Clean up
    rm -rf "/tmp/$APP_BUNDLE"
    
    echo "✓ Installation completed successfully!"
    echo ""
    echo "You can now find $APP_NAME in your Applications folder."
fi

# Set permissions
chmod -R 755 "$INSTALL_DIR/$APP_BUNDLE"

echo ""
echo "=== Installation Complete ==="
echo ""
echo "To launch $APP_NAME:"
echo "1. Open Finder"
echo "2. Go to Applications"
echo "3. Double-click on $APP_NAME"
echo ""
echo "Note: On first launch, you may need to allow the application in System Preferences > Security & Privacy"
EOF
    
    chmod +x "$DIST_DIR/install.sh"
    print_success "Installer script created: $DIST_DIR/install.sh"
}

# Main execution
main() {
    echo "=== VoiceFlow Pro macOS Installer Build ==="
    echo ""
    
    cd "$PROJECT_ROOT"
    
    check_prerequisites
    clean_builds
    install_dependencies
    build_application
    
    # Sign if credentials are available
    if [ -n "$APPLE_ID" ] && [ -n "$APPLE_ID_PASSWORD" ]; then
        sign_application
    fi
    
    create_dmg
    create_zip
    create_distribution
    create_installer_script
    
    echo ""
    echo "=== Build Complete ==="
    echo ""
    echo "Distribution Package: $DIST_DIR"
    echo "DMG Installer: $BUILD_DIR/VoiceFlow Pro.dmg"
    echo "ZIP Archive: $BUILD_DIR/VoiceFlow Pro.zip"
    echo ""
    echo "To distribute:"
    echo "1. Copy the distribution package to your server"
    echo "2. Host the files for download"
    echo "3. Users can run the install.sh script or manually mount the DMG"
    echo ""
}

# Run main function
main "$@"
