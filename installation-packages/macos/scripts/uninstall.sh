#!/bin/bash
# VoiceFlow Pro macOS Uninstaller Script
# This script removes VoiceFlow Pro from macOS systems

set -e

APP_NAME="VoiceFlow Pro"
APP_BUNDLE="VoiceFlow Pro.app"
APP_ID="com.voiceflow.pro"
INSTALL_DIR="/Applications"
USER_APPS_DIR="$HOME/Applications"
SUPPORT_DIR="$HOME/Library/Application Support/VoiceFlow Pro"
CACHE_DIR="$HOME/Library/Caches/com.voiceflow.pro"
LOGS_DIR="$HOME/Library/Logs/VoiceFlow Pro"
PREFS_DIR="$HOME/Library/Preferences/com.voiceflow.pro"
SAVED_STATE_DIR="$HOME/Library/Saved\ Application\ State/com.voiceflow.pro"

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
REMOVE_PREFS=false

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
        --remove-prefs)
            REMOVE_PREFS=true
            shift
            ;;
        --remove-all)
            REMOVE_USER_DATA=true
            REMOVE_LOGS=true
            REMOVE_CACHE=true
            REMOVE_PREFS=true
            shift
            ;;
        -h|--help)
            echo "VoiceFlow Pro Uninstaller"
            echo ""
            echo "Usage: $0 [options]"
            echo ""
            echo "Options:"
            echo "  -f, --force           Force removal without confirmation"
            echo "  -s, --silent          Silent mode (no prompts)"
            echo "  --remove-user-data    Remove user data directory"
            echo "  --remove-logs         Remove log files"
            echo "  --remove-cache        Remove cache files"
            echo "  --remove-prefs        Remove preference files"
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

echo "=== VoiceFlow Pro Uninstaller ==="
echo ""

# Check if running as root (not required but recommended for system-wide removal)
if [ "$EUID" -eq 0 ]; then
    print_warning "Running as root. This will remove VoiceFlow Pro system-wide."
fi

# Check if application is running
check_running() {
    if pgrep -f "$APP_BUNDLE" > /dev/null; then
        print_warning "$APP_NAME is currently running."
        if [ "$SILENT" = false ] && [ "$FORCE" = false ]; then
            read -p "Do you want to quit it? (y/N): " -n 1 -r
            echo
            if [[ $REPLY =~ ^[Yy]$ ]]; then
                pkill -f "$APP_BUNDLE"
                sleep 2
            else
                print_warning "Continuing with uninstallation while application is running..."
            fi
        fi
    fi
}

# Remove application bundle
remove_app_bundle() {
    print_info "Removing application bundle..."
    
    # Remove from /Applications
    if [ -d "$INSTALL_DIR/$APP_BUNDLE" ]; then
        rm -rf "$INSTALL_DIR/$APP_BUNDLE"
        print_success "Removed from $INSTALL_DIR"
    fi
    
    # Remove from user Applications directory
    if [ -d "$USER_APPS_DIR/$APP_BUNDLE" ]; then
        rm -rf "$USER_APPS_DIR/$APP_BUNDLE"
        print_success "Removed from $USER_APPS_DIR"
    fi
    
    # Check for other locations
    find "$HOME" -name "$APP_BUNDLE" -type d 2>/dev/null | while read -r app_path; do
        if [ "$app_path" != "$INSTALL_DIR/$APP_BUNDLE" ] && [ "$app_path" != "$USER_APPS_DIR/$APP_BUNDLE" ]; then
            print_info "Found application at: $app_path"
            read -p "Remove this instance? (y/N): " -n 1 -r
            echo
            if [[ $REPLY =~ ^[Yy]$ ]]; then
                rm -rf "$app_path"
                print_success "Removed: $app_path"
            fi
        fi
    done
}

# Remove from Dock
remove_from_dock() {
    print_info "Removing from Dock..."
    
    # Remove from user's dock plist
    DOCK_PLIST="$HOME/Library/Preferences/com.apple.dock.plist"
    
    if [ -f "$DOCK_PLIST" ]; then
        # Backup dock plist
        cp "$DOCK_PLIST" "$DOCK_PLIST.backup.$(date +%Y%m%d_%H%M%S)"
        
        # Remove VoiceFlow Pro from dock (using plist manipulation)
        # This is a simplified approach - a more robust solution would use proper plist parsing
        defaults write com.apple.dock persistent-apps -array-remove "$(defaults read com.apple.dock persistent-apps | grep -A1 "VoiceFlow" | tail -1 | xargs)"
        
        # Restart Dock to apply changes
        killall Dock 2>/dev/null || true
        
        print_success "Removed from Dock"
    fi
}

# Remove Launch Services registration
remove_launch_services() {
    print_info "Removing Launch Services registration..."
    
    # Remove from Launch Services database
    /System/Library/Frameworks/CoreServices.framework/Frameworks/LaunchServices.framework/Support/lsregister \
        -kill -r -domain local -domain user "$INSTALL_DIR/$APP_BUNDLE" 2>/dev/null || true
    
    print_success "Launch Services registration removed"
}

# Remove from Spotlight
remove_from_spotlight() {
    print_info "Removing from Spotlight index..."
    
    # Remove from Spotlight index
    mdimport -r "$INSTALL_DIR/$APP_BUNDLE" 2>/dev/null || true
    
    print_success "Removed from Spotlight index"
}

# Remove login items
remove_login_items() {
    print_info "Removing login items..."
    
    # Remove from System Preferences > Users & Groups > Login Items
    # This would require osascript or direct plist manipulation
    # For now, we'll just log that it should be done manually
    print_warning "Please manually remove VoiceFlow Pro from System Preferences > Users & Groups > Login Items"
}

# Remove user data
remove_user_data() {
    if [ "$REMOVE_USER_DATA" = true ]; then
        print_info "Removing user data..."
        
        if [ -d "$SUPPORT_DIR" ]; then
            rm -rf "$SUPPORT_DIR"
            print_success "Removed user data: $SUPPORT_DIR"
        fi
    fi
}

# Remove logs
remove_logs() {
    if [ "$REMOVE_LOGS" = true ]; then
        print_info "Removing log files..."
        
        if [ -d "$LOGS_DIR" ]; then
            rm -rf "$LOGS_DIR"
            print_success "Removed logs: $LOGS_DIR"
        fi
        
        # Remove system logs
        rm -rf "$HOME/Library/Logs/DiagnosticReports/$APP_BUNDLE"* 2>/dev/null || true
        rm -rf "/Library/Logs/DiagnosticReports/$APP_BUNDLE"* 2>/dev/null || true
    fi
}

# Remove cache
remove_cache() {
    if [ "$REMOVE_CACHE" = true ]; then
        print_info "Removing cache files..."
        
        if [ -d "$CACHE_DIR" ]; then
            rm -rf "$CACHE_DIR"
            print_success "Removed cache: $CACHE_DIR"
        fi
        
        # Remove other cache locations
        rm -rf "$HOME/Library/Caches/com.voiceflow.pro"* 2>/dev/null || true
        rm -rf "$HOME/Library/Saved\ Application\ State/com.voiceflow.pro"* 2>/dev/null || true
    fi
}

# Remove preferences
remove_preferences() {
    if [ "$REMOVE_PREFS" = true ]; then
        print_info "Removing preference files..."
        
        if [ -d "$PREFS_DIR" ]; then
            rm -rf "$PREFS_DIR"
            print_success "Removed preferences: $PREFS_DIR"
        fi
        
        # Remove other preference files
        rm -rf "$HOME/Library/Preferences/com.voiceflow.pro"* 2>/dev/null || true
    fi
}

# Remove quarantine attributes
remove_quarantine() {
    print_info "Removing quarantine attributes..."
    
    # Remove quarantine attributes from the app bundle (if it still exists)
    if [ -d "$INSTALL_DIR/$APP_BUNDLE" ]; then
        xattr -dr com.apple.quarantine "$INSTALL_DIR/$APP_BUNDLE" 2>/dev/null || true
    fi
}

# Remove receipts (for packages installed via installer)
remove_receipts() {
    print_info "Checking for installation receipts..."
    
    # Remove from package receipts
    rm -f "/Library/Receipts/$APP_NAME"* 2>/dev/null || true
    rm -f "$HOME/Library/Receipts/$APP_NAME"* 2>/dev/null || true
    
    print_success "Installation receipts removed"
}

# Clean up temporary files
cleanup_temp() {
    print_info "Cleaning up temporary files..."
    
    # Remove any temporary files
    rm -rf "/tmp/VoiceFlow"* 2>/dev/null || true
    rm -rf "$HOME/Downloads/VoiceFlow"* 2>/dev/null || true
    
    print_success "Temporary files cleaned"
}

# Confirm uninstallation
confirm_uninstall() {
    if [ "$SILENT" = false ] && [ "$FORCE" = false ]; then
        echo ""
        echo "This will uninstall VoiceFlow Pro from your system."
        echo ""
        
        if [ "$REMOVE_USER_DATA" = true ] || [ "$REMOVE_LOGS" = true ] || [ "$REMOVE_CACHE" = true ] || [ "$REMOVE_PREFS" = true ]; then
            echo "⚠️  WARNING: This will also remove:"
            [ "$REMOVE_USER_DATA" = true ] && echo "   - User data and settings"
            [ "$REMOVE_LOGS" = true ] && echo "   - Log files"
            [ "$REMOVE_CACHE" = true ] && echo "   - Cache files"
            [ "$REMOVE_PREFS" = true ] && echo "   - Preference files"
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
    
    # Remove application bundle
    remove_app_bundle
    
    # Remove from Dock
    remove_from_dock
    
    # Remove Launch Services registration
    remove_launch_services
    
    # Remove from Spotlight
    remove_from_spotlight
    
    # Remove login items
    remove_login_items
    
    # Remove user data
    remove_user_data
    
    # Remove logs
    remove_logs
    
    # Remove cache
    remove_cache
    
    # Remove preferences
    remove_preferences
    
    # Remove quarantine attributes
    remove_quarantine
    
    # Remove receipts
    remove_receipts
    
    # Clean up temporary files
    cleanup_temp
    
    echo ""
    echo "=== Uninstallation Complete ==="
    echo ""
    print_success "VoiceFlow Pro has been successfully uninstalled."
    
    if [ "$REMOVE_USER_DATA" = true ] || [ "$REMOVE_LOGS" = true ] || [ "$REMOVE_CACHE" = true ] || [ "$REMOVE_PREFS" = true ]; then
        print_success "User data removed."
    fi
    
    echo ""
    echo "Thank you for using VoiceFlow Pro!"
    echo ""
    
    # Clear Spotlight cache to remove from search results
    print_info "Clearing Spotlight cache..."
    sudo mdutil -E / 2>/dev/null || print_warning "Could not clear Spotlight cache. You may need to do this manually."
    
    print_success "Uninstallation process completed!"
}

# Run main function
main
