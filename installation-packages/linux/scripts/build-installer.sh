#!/bin/bash
# VoiceFlow Pro Linux Installer Build Script
# This script builds the Linux installer for VoiceFlow Pro

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
BUILD_DIR="$PROJECT_ROOT/../build"
DIST_DIR="$PROJECT_ROOT/../dist-linux"

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
    
    # Check for Linux build dependencies
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        print_info "Checking for Linux build dependencies..."
        
        # Check for required libraries
        MISSING_DEPS=()
        
        if ! ldconfig -p | grep -q libasound.so; then
            MISSING_DEPS+=("libasound2")
        fi
        
        if ! ldconfig -p | grep -q libgtk-3.so; then
            MISSING_DEPS+=("libgtk-3-0")
        fi
        
        if ! ldconfig -p | grep -q libwebkit2gtk-4.0.so; then
            MISSING_DEPS+=("libwebkit2gtk-4.0-37")
        fi
        
        if [ ${#MISSING_DEPS[@]} -ne 0 ]; then
            print_warning "Missing dependencies: ${MISSING_DEPS[*]}"
            print_info "Please install them using your package manager:"
            print_info "  Ubuntu/Debian: sudo apt install ${MISSING_DEPS[*]}"
            print_info "  Fedora: sudo dnf install ${MISSING_DEPS[*]}"
            print_info "  Arch: sudo pacman -S ${MISSING_DEPS[*]}"
        else
            print_success "All required dependencies found"
        fi
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
    print_info "Building VoiceFlow Pro for Linux..."
    npx tauri build --target x86_64-unknown-linux-gnu
    print_success "Application built successfully"
}

# Create AppImage
create_appimage() {
    print_info "Creating AppImage..."
    
    APP_DIR="$BUILD_DIR/AppDir"
    mkdir -p "$APP_DIR"
    
    # Copy the application
    APP_BUNDLE_DIR="src-tauri/target/release/bundle/deb/voiceflow-pro_1.0.0_amd64"
    if [ -d "$APP_BUNDLE_DIR" ]; then
        cp -r "$APP_BUNDLE_DIR/usr/bin"/* "$APP_DIR/"
        cp -r "$APP_BUNDLE_DIR/usr/share"/* "$APP_DIR/usr/share/" 2>/dev/null || true
        
        # Copy desktop file
        mkdir -p "$APP_DIR/usr/share/applications"
        cp "$APP_BUNDLE_DIR/voiceflow-pro.desktop" "$APP_DIR/usr/share/applications/"
        
        # Copy icons
        mkdir -p "$APP_DIR/usr/share/pixmaps"
        cp "$APP_BUNDLE_DIR/voiceflow-pro.png" "$APP_DIR/usr/share/pixmaps/voiceflow-pro.png" 2>/dev/null || true
    fi
    
    # Create AppDir structure
    mkdir -p "$APP_DIR/usr/bin"
    mkdir -p "$APP_DIR/usr/share/applications"
    mkdir -p "$APP_DIR/usr/share/pixmaps"
    
    # Copy the binary
    cp "src-tauri/target/release/voiceflow-pro" "$APP_DIR/usr/bin/"
    
    # Copy desktop file
    cp "resources/voiceflow-pro.desktop" "$APP_DIR/usr/share/applications/"
    
    # Copy icon
    cp "src-tauri/icons/icon.png" "$APP_DIR/usr/share/pixmaps/voiceflow-pro.png"
    
    # Create AppRun script
    cat > "$APP_DIR/AppRun" << 'EOF'
#!/bin/bash
HERE="$(dirname "$(readlink -f "${0}")")"
export LD_LIBRARY_PATH="$HERE/usr/lib:$LD_LIBRARY_PATH"
exec "$HERE/usr/bin/voiceflow-pro" "$@"
EOF
    chmod +x "$APP_DIR/AppRun"
    
    # Download AppImageTool if not present
    if [ ! -f "$BUILD_DIR/appimagetool-x86_64.AppImage" ]; then
        print_info "Downloading AppImageTool..."
        wget -O "$BUILD_DIR/appimagetool-x86_64.AppImage" "https://github.com/AppImage/AppImageKit/releases/download/continuous/appimagetool-x86_64.AppImage"
        chmod +x "$BUILD_DIR/appimagetool-x86_64.AppImage"
    fi
    
    # Create AppImage
    cd "$BUILD_DIR"
    ./appimagetool-x86_64.AppImage AppDir "VoiceFlow Pro-1.0.0.AppImage"
    cd "$PROJECT_ROOT"
    
    print_success "AppImage created: $BUILD_DIR/VoiceFlow Pro-1.0.0.AppImage"
}

# Create DEB package
create_deb() {
    print_info "Creating DEB package..."
    
    # Copy the DEB package from Tauri build
    if [ -d "src-tauri/target/release/bundle/deb" ]; then
        cp src-tauri/target/release/bundle/deb/*.deb "$BUILD_DIR/"
        print_success "DEB package created: $BUILD_DIR/voiceflow-pro_1.0.0_amd64.deb"
    else
        print_warning "DEB package not found. The Tauri build process should have created it."
    fi
}

# Create RPM package
create_rpm() {
    print_info "Creating RPM package..."
    
    # Copy the RPM package from Tauri build
    if [ -d "src-tauri/target/release/bundle/rpm" ]; then
        cp src-tauri/target/release/bundle/rpm/*.rpm "$BUILD_DIR/"
        print_success "RPM package created: $BUILD_DIR/voiceflow-pro-1.0.0.x86_64.rpm"
    else
        print_warning "RPM package not found. The Tauri build process should have created it."
    fi
}

# Create distribution package
create_distribution() {
    print_info "Creating distribution package..."
    
    mkdir -p "$DIST_DIR"
    
    # Copy packages
    if [ -f "$BUILD_DIR/VoiceFlow Pro-1.0.0.AppImage" ]; then
        cp "$BUILD_DIR/VoiceFlow Pro-1.0.0.AppImage" "$DIST_DIR/"
    fi
    
    for deb in "$BUILD_DIR"/*.deb; do
        if [ -f "$deb" ]; then
            cp "$deb" "$DIST_DIR/"
        fi
    done
    
    for rpm in "$BUILD_DIR"/*.rpm; do
        if [ -f "$rpm" ]; then
            cp "$rpm" "$DIST_DIR/"
        fi
    done
    
    # Copy documentation
    cp "README.md" "$DIST_DIR/"
    cp "LICENSE" "$DIST_DIR/"
    if [ -f "CHANGELOG.md" ]; then
        cp "CHANGELOG.md" "$DIST_DIR/"
    fi
    
    # Create checksum file
    if [ -d "$DIST_DIR" ]; then
        cd "$DIST_DIR"
        sha256sum * > checksums.txt 2>/dev/null || true
        cd "$PROJECT_ROOT"
    fi
    
    print_success "Distribution package created: $DIST_DIR"
}

# Create installer script
create_installer_script() {
    print_info "Creating installer script..."
    
    cat > "$DIST_DIR/install.sh" << 'EOF'
#!/bin/bash
# VoiceFlow Pro Linux Installer Script

set -e

APP_NAME="VoiceFlow Pro"
VERSION="1.0.0"
INSTALL_DIR="/opt/voiceflow-pro"
BIN_DIR="/usr/local/bin"
DESKTOP_DIR="$HOME/.local/share/applications"
ICON_DIR="$HOME/.local/share/pixmaps"

# Color codes
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

echo "=== VoiceFlow Pro Linux Installer ==="
echo ""

# Check if running as root
if [ "$EUID" -eq 0 ]; then
    print_warning "Running as root. This will install for all users."
else
    print_info "Running as user. This will install for the current user only."
fi

# Find the installer package
INSTALLER_FILE=""
PACKAGE_TYPE=""

if [ -f "VoiceFlow Pro-$VERSION.AppImage" ]; then
    INSTALLER_FILE="VoiceFlow Pro-$VERSION.AppImage"
    PACKAGE_TYPE="appimage"
elif [ -f "voiceflow-pro_${VERSION}_amd64.deb" ]; then
    INSTALLER_FILE="voiceflow-pro_${VERSION}_amd64.deb"
    PACKAGE_TYPE="deb"
elif [ -f "voiceflow-pro-$VERSION.x86_64.rpm" ]; then
    INSTALLER_FILE="voiceflow-pro-$VERSION.x86_64.rpm"
    PACKAGE_TYPE="rpm"
else
    print_error "Could not find installer package"
    exit 1
fi

echo "Found installer: $INSTALLER_FILE (type: $PACKAGE_TYPE)"

# Install based on package type
case "$PACKAGE_TYPE" in
    "appimage")
        echo ""
        echo "Installing AppImage..."
        
        # Create installation directory
        mkdir -p "$INSTALL_DIR"
        
        # Copy AppImage
        cp "$INSTALLER_FILE" "$INSTALL_DIR/VoiceFlow Pro.AppImage"
        chmod +x "$INSTALL_DIR/VoiceFlow Pro.AppImage"
        
        # Create desktop shortcut
        mkdir -p "$DESKTOP_DIR"
        cat > "$DESKTOP_DIR/voiceflow-pro.desktop" << DESKTOP_EOF
[Desktop Entry]
Version=1.0
Type=Application
Name=VoiceFlow Pro
Comment=Cross-platform Desktop Voice Assistant
Exec="$INSTALL_DIR/VoiceFlow Pro.AppImage" %f
Icon=voiceflow-pro
Terminal=false
Categories=Office;Utility;
StartupNotify=true
DESKTOP_EOF
        
        # Copy icon
        mkdir -p "$ICON_DIR"
        cp "src-tauri/icons/icon.png" "$ICON_DIR/voiceflow-pro.png"
        
        # Make desktop shortcut executable
        chmod +x "$DESKTOP_DIR/voiceflow-pro.desktop"
        
        # Create symlink in bin (optional)
        if command -v update-desktop-database &> /dev/null; then
            update-desktop-database "$DESKTOP_DIR" 2>/dev/null || true
        fi
        
        print_success "AppImage installed successfully!"
        echo "Location: $INSTALL_DIR/VoiceFlow Pro.AppImage"
        echo "Desktop shortcut: $DESKTOP_DIR/voiceflow-pro.desktop"
        ;;
        
    "deb")
        echo ""
        echo "Installing DEB package..."
        
        # Check if dpkg is available
        if ! command -v dpkg &> /dev/null; then
            print_error "dpkg not found. This system doesn't support DEB packages."
            exit 1
        fi
        
        # Install the package
        sudo dpkg -i "$INSTALLER_FILE" || {
            print_warning "Package installation failed. Trying to fix dependencies..."
            sudo apt-get install -f -y
        }
        
        print_success "DEB package installed successfully!"
        ;;
        
    "rpm")
        echo ""
        echo "Installing RPM package..."
        
        # Check if rpm is available
        if ! command -v rpm &> /dev/null; then
            print_error "rpm not found. This system doesn't support RPM packages."
            exit 1
        fi
        
        # Install the package
        sudo rpm -Uvh "$INSTALLER_FILE"
        
        print_success "RPM package installed successfully!"
        ;;
esac

echo ""
echo "=== Installation Complete ==="
echo ""
echo "To launch $APP_NAME:"
echo "1. Search for 'VoiceFlow Pro' in your applications menu"
echo "2. Or run: $INSTALL_DIR/VoiceFlow Pro.AppImage"
echo ""

# Optional: Add to PATH (for AppImage)
if [ "$PACKAGE_TYPE" = "appimage" ] && [ "$EUID" -ne 0 ]; then
    echo "To add to PATH, add the following line to your ~/.bashrc or ~/.zshrc:"
    echo "export PATH=\"\$PATH:$INSTALL_DIR\""
fi
EOF
    
    chmod +x "$DIST_DIR/install.sh"
    print_success "Installer script created: $DIST_DIR/install.sh"
}

# Main execution
main() {
    echo "=== VoiceFlow Pro Linux Installer Build ==="
    echo ""
    
    cd "$PROJECT_ROOT"
    
    check_prerequisites
    clean_builds
    install_dependencies
    build_application
    create_appimage
    create_deb
    create_rpm
    create_distribution
    create_installer_script
    
    echo ""
    echo "=== Build Complete ==="
    echo ""
    echo "Distribution Package: $DIST_DIR"
    echo "Build Directory: $BUILD_DIR"
    echo ""
    echo "Available packages:"
    [ -f "$BUILD_DIR/VoiceFlow Pro-1.0.0.AppImage" ] && echo "  - AppImage: $BUILD_DIR/VoiceFlow Pro-1.0.0.AppImage"
    [ -f "$BUILD_DIR/voiceflow-pro_1.0.0_amd64.deb" ] && echo "  - DEB: $BUILD_DIR/voiceflow-pro_1.0.0_amd64.deb"
    [ -f "$BUILD_DIR/voiceflow-pro-1.0.0.x86_64.rpm" ] && echo "  - RPM: $BUILD_DIR/voiceflow-pro-1.0.0.x86_64.rpm"
    echo ""
    echo "To distribute:"
    echo "1. Copy the distribution package to your server"
    echo "2. Host the files for download"
    echo "3. Users can run the install.sh script"
    echo ""
}

# Run main function
main "$@"
