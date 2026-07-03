#!/bin/bash
# VoiceFlow Pro Linux Uninstaller Script
# This script removes VoiceFlow Pro from Linux systems

set -e

APP_NAME="VoiceFlow Pro"
APP_ID="voiceflow-pro"
VERSION="1.0.0"
INSTALL_DIR="/opt/voiceflow-pro"
USER_INSTALL_DIR="$HOME/.local/share/voiceflow-pro"
BIN_DIR="/usr/local/bin"
USER_BIN_DIR="$HOME/.local/bin"
DESKTOP_DIR="$HOME/.local/share/applications"
USER_DESKTOP_DIR="$HOME/Desktop"
ICON_DIR="$HOME/.local/share/pixmaps"
APPIMAGE_FILE="$INSTALL_DIR/VoiceFlow Pro.AppImage"

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

# Parse command line arguments
FORCE=false
SILENT=false
REMOVE_USER_DATA=false
REMOVE_LOGS=false
REMOVE_CACHE=false
REMOVE_CONFIG=false

while [[ $# -gt 0 ]]; do
    case $1 in
        -f|--force)
            FORCE=true
            shift
            ;;
        -s|--silent)
            SILENT=true
            shift
            ;;
        --remove-user-data)
            REMOVE_USER_DATA=true
            shift
            ;;
        --remove-logs)
            REMOVE_LOGS=true
            shift
            ;;
        --remove-cache)
            REMOVE_CACHE=true
            shift
            ;;
        --remove-config)
            REMOVE_CONFIG=true
            shift
            ;;
        --remove-all)
            REMOVE_USER_DATA=true
            REMOVE_LOGS=true
            REMOVE_CACHE=true
            REMOVE_CONFIG=true
            shift
            ;;
        -h|--help)
            echo "VoiceFlow Pro Linux Uninstaller"
            echo ""
            echo "Usage: $0 [options]"
            echo ""
            echo "Options:"
            echo "  -f, --force           Force removal without confirmation"
            echo "  -s, --silent          Silent mode (no prompts)"
            echo "  --remove-user-data    Remove user data directory"
            echo "  --remove-logs         Remove log files"
            echo "  --remove-cache        Remove cache files"
            echo "  --remove-config       Remove configuration files"
            echo "  --remove-all          Remove all user data"
            echo "  -h, --help            Show this help message"
            echo ""
            exit 0
            ;;
        *)
            print_error "Unknown option: $1"
            exit 1
            ;;
    esac
done

echo "=== VoiceFlow Pro Linux Uninstaller ==="
echo ""

# Check if running as root
IS_ROOT=false
if [ "$EUID" -eq 0 ]; then
    IS_ROOT=true
    print_warning "Running as root. This will remove VoiceFlow Pro system-wide."
fi

# Check if application is running
check_running() {
    if pgrep -f "$APP_NAME" > /dev/null; then
        print_warning "$APP_NAME is currently running."
        if [ "$SILENT" = false ] && [ "$FORCE" = false ]; then
            read -p "Do you want to quit it? (y/N): " -n 1 -r
            echo
            if [[ $REPLY =~ ^[Yy]$ ]]; then
                pkill -f "$APP_NAME"
                sleep 2
            else
                print_warning "Continuing with uninstallation while application is running..."
            fi
        fi
    fi
}

# Remove AppImage installation
remove_appimage() {
    if [ -f "$APPIMAGE_FILE" ]; then
        print_info "Removing AppImage installation..."
        rm -f "$APPIMAGE_FILE"
        print_success "AppImage removed: $APPIMAGE_FILE"
    fi
    
    # Remove user AppImage
    if [ -f "$USER_INSTALL_DIR/VoiceFlow Pro.AppImage" ]; then
        print_info "Removing user AppImage installation..."
        rm -f "$USER_INSTALL_DIR/VoiceFlow Pro.AppImage"
        print_success "User AppImage removed"
    fi
}

# Remove DEB package
remove_deb() {
    if command -v dpkg &> /dev/null; then
        print_info "Removing DEB package..."
        dpkg -r "$APP_ID" 2>/dev/null || print_warning "Package not found in dpkg database"
        print_success "DEB package removed"
    fi
}

# Remove RPM package
remove_rpm() {
    if command -v rpm &> /dev/null; then
        print_info "Removing RPM package..."
        rpm -e "$APP_ID" 2>/dev/null || print_warning "Package not found in RPM database"
        print_success "RPM package removed"
    fi
}

# Remove desktop shortcuts
remove_desktop_shortcuts() {
    print_info "Removing desktop shortcuts..."
    
    # System-wide desktop shortcut
    if [ "$IS_ROOT" = true ]; then
        if [ -f "/usr/share/applications/$APP_ID.desktop" ]; then
            rm -f "/usr/share/applications/$APP_ID.desktop"
            print_success "Removed system desktop shortcut"
        fi
        
        # Update desktop database
        if command -v update-desktop-database &> /dev/null; then
            update-desktop-database /usr/share/applications 2>/dev/null || true
        fi
    fi
    
    # User desktop shortcut
    if [ -f "$DESKTOP_DIR/$APP_ID.desktop" ]; then
        rm -f "$DESKTOP_DIR/$APP_ID.desktop"
        print_success "Removed user desktop shortcut"
    fi
    
    # Desktop files
    for desktop_file in "$DESKTOP_DIR"/*.desktop; do
        if [ -f "$desktop_file" ] && grep -q "$APP_NAME" "$desktop_file"; then
            rm -f "$desktop_file"
            print_success "Removed desktop file: $desktop_file"
        fi
    done
    
    # User desktop shortcut
    if [ -f "$USER_DESKTOP_DIR/VoiceFlow Pro.desktop" ]; then
        rm -f "$USER_DESKTOP_DIR/VoiceFlow Pro.desktop"
        print_success "Removed desktop shortcut"
    fi
}

# Remove icons
remove_icons() {
    print_info "Removing icons..."
    
    # System-wide icons
    if [ "$IS_ROOT" = true ]; then
        if [ -f "/usr/share/pixmaps/$APP_ID.png" ]; then
            rm -f "/usr/share/pixmaps/$APP_ID.png"
            print_success "Removed system icon"
        fi
    fi
    
    # User icons
    if [ -f "$ICON_DIR/$APP_ID.png" ]; then
        rm -f "$ICON_DIR/$APP_ID.png"
        print_success "Removed user icon"
    fi
}

# Remove symlinks
remove_symlinks() {
    print_info "Removing symlinks..."
    
    # System-wide symlink
    if [ "$IS_ROOT" = true ] && [ -L "$BIN_DIR/$APP_ID" ]; then
        rm -f "$BIN_DIR/$APP_ID"
        print_success "Removed system symlink"
    fi
    
    # User symlink
    if [ -L "$USER_BIN_DIR/$APP_ID" ]; then
        rm -f "$USER_BIN_DIR/$APP_ID"
        print_success "Removed user symlink"
    fi
}

# Remove user data
remove_user_data() {
    if [ "$REMOVE_USER_DATA" = true ]; then
        print_info "Removing user data..."
        
        # Remove user data directories
        USER_DATA_DIRS=(
            "$HOME/.local/share/voiceflow-pro"
            "$HOME/.voiceflow-pro"
            "$HOME/VoiceFlow Pro"
        )
        
        for dir in "${USER_DATA_DIRS[@]}"; do
            if [ -d "$dir" ]; then
                rm -rf "$dir"
                print_success "Removed user data: $dir"
            fi
        done
    fi
}

# Remove logs
remove_logs() {
    if [ "$REMOVE_LOGS" = true ]; then
        print_info "Removing log files..."
        
        LOG_DIRS=(
            "$HOME/.local/share/voiceflow-pro/logs"
            "$HOME/.cache/voiceflow-pro"
            "$HOME/.voiceflow-pro/logs"
            "/var/log/voiceflow-pro"
        )
        
        for dir in "${LOG_DIRS[@]}"; do
            if [ -d "$dir" ]; then
                rm -rf "$dir"
                print_success "Removed logs: $dir"
            fi
        done
    fi
}

# Remove cache
remove_cache() {
    if [ "$REMOVE_CACHE" = true ]; then
        print_info "Removing cache files..."
        
        CACHE_DIRS=(
            "$HOME/.cache/voiceflow-pro"
            "$HOME/.voiceflow-pro/cache"
            "$HOME/.local/share/voiceflow-pro/cache"
        )
        
        for dir in "${CACHE_DIRS[@]}"; do
            if [ -d "$dir" ]; then
                rm -rf "$dir"
                print_success "Removed cache: $dir"
            fi
        done
    fi
}

# Remove configuration
remove_config() {
    if [ "$REMOVE_CONFIG" = true ]; then
        print_info "Removing configuration files..."
        
        CONFIG_DIRS=(
            "$HOME/.config/voiceflow-pro"
            "$HOME/.voiceflow-pro"
            "$HOME/.local/share/voiceflow-pro/config"
        )
        
        for dir in "${CONFIG_DIRS[@]}"; do
            if [ -d "$dir" ]; then
                rm -rf "$dir"
                print_success "Removed config: $dir"
            fi
        done
    fi
}

# Remove installation directories
remove_installation_dirs() {
    print_info "Removing installation directories..."
    
    # System-wide installation
    if [ "$IS_ROOT" = true ] && [ -d "$INSTALL_DIR" ]; then
        rm -rf "$INSTALL_DIR"
        print_success "Removed system installation: $INSTALL_DIR"
    fi
    
    # User installation
    if [ -d "$USER_INSTALL_DIR" ]; then
        rm -rf "$USER_INSTALL_DIR"
        print_success "Removed user installation: $USER_INSTALL_DIR"
    fi
}

# Remove systemd service
remove_systemd_service() {
    if [ "$IS_ROOT" = true ]; then
        print_info "Removing systemd service..."
        
        SERVICE_FILE="/etc/systemd/system/voiceflow-pro.service"
        if [ -f "$SERVICE_FILE" ]; then
            systemctl stop voiceflow-pro 2>/dev/null || true
            systemctl disable voiceflow-pro 2>/dev/null || true
            rm -f "$SERVICE_FILE"
            systemctl daemon-reload
            print_success "Removed systemd service"
        fi
        
        USER_SERVICE_FILE="$HOME/.config/systemd/user/voiceflow-pro.service"
        if [ -f "$USER_SERVICE_FILE" ]; then
            systemctl --user stop voiceflow-pro 2>/dev/null || true
            systemctl --user disable voiceflow-pro 2>/dev/null || true
            rm -f "$USER_SERVICE_FILE"
            systemctl --user daemon-reload
            print_success "Removed user systemd service"
        fi
    fi
}

# Remove autostart entries
remove_autostart() {
    print_info "Removing autostart entries..."
    
    # System-wide autostart
    if [ "$IS_ROOT" = true ]; then
        AUTOSTART_FILE="/etc/xdg/autostart/voiceflow-pro.desktop"
        if [ -f "$AUTOSTART_FILE" ]; then
            rm -f "$AUTOSTART_FILE"
            print_success "Removed system autostart entry"
        fi
    fi
    
    # User autostart
    USER_AUTOSTART="$HOME/.config/autostart/voiceflow-pro.desktop"
    if [ -f "$USER_AUTOSTART" ]; then
        rm -f "$USER_AUTOSTART"
        print_success "Removed user autostart entry"
    fi
}

# Clean up temporary files
cleanup_temp() {
    print_info "Cleaning up temporary files..."
    
    # Remove temporary files
    rm -f "/tmp/VoiceFlow"* 2>/dev/null || true
    rm -f "$HOME/Downloads/VoiceFlow"* 2>/dev/null || true
    
    print_success "Temporary files cleaned"
}

# Confirm uninstallation
confirm_uninstall() {
    if [ "$SILENT" = false ] && [ "$FORCE" = false ]; then
        echo ""
        echo "This will uninstall VoiceFlow Pro from your system."
        echo ""
        
        if [ "$REMOVE_USER_DATA" = true ] || [ "$REMOVE_LOGS" = true ] || [ "$REMOVE_CACHE" = true ] || [ "$REMOVE_CONFIG" = true ]; then
            echo "⚠️  WARNING: This will also remove:"
            [ "$REMOVE_USER_DATA" = true ] && echo "   - User data and settings"
            [ "$REMOVE_LOGS" = true ] && echo "   - Log files"
            [ "$REMOVE_CACHE" = true ] && echo "   - Cache files"
            [ "$REMOVE_CONFIG" = true ] && echo "   - Configuration files"
            echo ""
        fi
        
        read -p "Are you sure you want to continue? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            print_info "Uninstallation cancelled."
            exit 0
        fi
    fi
}

# Main execution
main() {
    # Check if application is running
    check_running
    
    # Confirm uninstallation
    confirm_uninstall
    
    echo ""
    print_info "Starting uninstallation process..."
    
    # Remove application based on installation type
    remove_appimage
    remove_deb
    remove_rpm
    
    # Remove shortcuts and icons
    remove_desktop_shortcuts
    remove_icons
    remove_symlinks
    
    # Remove services
    remove_systemd_service
    remove_autostart
    
    # Remove user data
    remove_user_data
    remove_logs
    remove_cache
    remove_config
    
    # Remove installation directories
    remove_installation_dirs
    
    # Clean up
    cleanup_temp
    
    echo ""
    echo "=== Uninstallation Complete ==="
    echo ""
    print_success "VoiceFlow Pro has been successfully uninstalled."
    
    if [ "$REMOVE_USER_DATA" = true ] || [ "$REMOVE_LOGS" = true ] || [ "$REMOVE_CACHE" = true ] || [ "$REMOVE_CONFIG" = true ]; then
        print_success "User data removed."
    fi
    
    echo ""
    echo "Thank you for using VoiceFlow Pro!"
    echo ""
    
    # Update desktop database
    if command -v update-desktop-database &> /dev/null; then
        print_info "Updating desktop database..."
        update-desktop-database "$DESKTOP_DIR" 2>/dev/null || update-desktop-database /usr/share/applications 2>/dev/null || true
    fi
}

# Run main function
main
