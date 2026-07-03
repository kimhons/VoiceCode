# VoiceFlow Pro Installation Packages

This directory contains installation packages and deployment scripts for VoiceFlow Pro across all supported platforms: Windows, macOS, and Linux.

## Overview

VoiceFlow Pro is a cross-platform desktop voice assistant application built with Tauri, React, and TypeScript. This package provides comprehensive installation and uninstallation scripts for distributing the application.

### Features

- **Cross-Platform Support**: Windows, macOS, and Linux
- **Multiple Package Formats**: MSI, DMG, AppImage, DEB, RPM
- **System Integration**: Desktop shortcuts, start menu entries, system tray
- **Automatic Updates**: Built-in update mechanism (future feature)
- **Uninstallers**: Complete removal with optional user data cleanup
- **Code Signing Ready**: Support for platform-specific code signing

## Platform-Specific Packages

### Windows

**Package Types:**
- MSI Installer (Windows Installer)
- NSIS Installer (Nullsoft Scriptable Install System)
- Portable Executable

**Features:**
- Windows Service integration
- Registry entries for system integration
- Desktop and Start Menu shortcuts
- Firewall exception support
- Automatic uninstaller

**Installation Methods:**
1. **PowerShell Script** (`windows/scripts/build-installer.ps1`)
   ```powershell
   # Build installer
   ./windows/scripts/build-installer.ps1 -CreateMSI
   
   # Build and sign installer
   ./windows/scripts/build-installer.ps1 -CreateMSI -Sign -CertificateThumbprint "..."
   ```

2. **Manual Installation**
   - Run `VoiceFlowProSetup.exe` as Administrator
   - Follow installation wizard
   - Application will be installed to `Program Files\VoiceFlow Pro`

**Uninstallation:**
```powershell
# Standard uninstall
./windows/scripts/uninstall.ps1

# Silent uninstall with data removal
./windows/scripts/uninstall.ps1 -Silent -RemoveUserData -RemoveLogs -RemoveCache
```

### macOS

**Package Types:**
- DMG (Disk Image)
- ZIP Archive
- App Bundle (.app)

**Features:**
- Code signing ready
- Notarization support
- System integration (Dock, Spotlight, etc.)
- Gatekeeper compatibility

**Installation Methods:**
1. **Shell Script** (`macos/scripts/build-installer.sh`)
   ```bash
   # Build all installers
   ./macos/scripts/build-installer.sh
   
   # Build with code signing
   APPLE_ID="your-apple-id" APPLE_ID_PASSWORD="app-specific-password" ./macos/scripts/build-installer.sh
   ```

2. **DMG Installation**
   - Mount the DMG file
   - Drag `VoiceFlow Pro.app` to `/Applications`
   - First launch may require allowing in System Preferences

**Uninstallation:**
```bash
# Standard uninstall
./macos/scripts/uninstall.sh

# Complete uninstall with data removal
./macos/scripts/uninstall.sh --remove-all
```

### Linux

**Package Types:**
- AppImage (Universal Linux package)
- DEB (Debian/Ubuntu)
- RPM (Red Hat/Fedora/SUSE)

**Features:**
- Desktop entry integration
- Systemd service support
- Autostart configuration
- Icon integration

**Installation Methods:**
1. **Shell Script** (`linux/scripts/build-installer.sh`)
   ```bash
   # Build all installers
   ./linux/scripts/build-installer.sh
   ```

2. **Manual Installation**

   **AppImage:**
   ```bash
   chmod +x "VoiceFlow Pro-1.0.0.AppImage"
   ./VoiceFlow\ Pro-1.0.0.AppImage
   ```

   **DEB Package:**
   ```bash
   sudo dpkg -i voiceflow-pro_1.0.0_amd64.deb
   sudo apt-get install -f  # Fix dependencies if needed
   ```

   **RPM Package:**
   ```bash
   sudo rpm -Uvh voiceflow-pro-1.0.0.x86_64.rpm
   ```

**Uninstallation:**
```bash
# Standard uninstall
./linux/scripts/uninstall.sh

# Complete uninstall with data removal
./linux/scripts/uninstall.sh --remove-all
```

## Building from Source

### Prerequisites

1. **Node.js** (v18 or higher)
2. **Rust** (latest stable version)
3. **Platform-Specific Tools:**
   - **Windows**: Visual Studio Build Tools, WiX Toolset
   - **macOS**: Xcode Command Line Tools, (optional) Apple Developer Certificate
   - **Linux**: Build essentials, WebKitGTK

### Build Process

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd voiceflow-pro
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Build for specific platform:**

   **Windows:**
   ```powershell
   cd installation-packages\windows\scripts
   .\build-installer.ps1 -CreateMSI
   ```

   **macOS:**
   ```bash
   cd installation-packages/macos/scripts
   chmod +x build-installer.sh
   ./build-installer.sh
   ```

   **Linux:**
   ```bash
   cd installation-packages/linux/scripts
   chmod +x build-installer.sh
   ./build-installer.sh
   ```

## Distribution

### Release Structure

```
dist/
├── windows/
│   ├── VoiceFlowProSetup.exe
│   ├── checksum.txt
│   └── README.txt
├── macos/
│   ├── VoiceFlow Pro.dmg
│   ├── VoiceFlow Pro.zip
│   ├── install.sh
│   └── checksum.txt
└── linux/
    ├── VoiceFlow Pro-1.0.0.AppImage
    ├── voiceflow-pro_1.0.0_amd64.deb
    ├── voiceflow-pro-1.0.0.x86_64.rpm
    ├── install.sh
    └── checksums.txt
```

### Distribution Checklist

- [ ] Build all platform packages
- [ ] Generate checksums (SHA256)
- [ ] Code sign installers (production only)
- [ ] Test installation on clean systems
- [ ] Verify uninstallation process
- [ ] Create release notes
- [ ] Upload to distribution server

## System Requirements

### Windows
- **OS**: Windows 10 (64-bit) or later
- **Architecture**: x64
- **Memory**: 4 GB RAM minimum
- **Storage**: 200 MB available space
- **Dependencies**: .NET Framework 4.7.2 or later

### macOS
- **OS**: macOS 10.15 (Catalina) or later
- **Architecture**: Intel (x64) or Apple Silicon (ARM64)
- **Memory**: 4 GB RAM minimum
- **Storage**: 200 MB available space
- **Dependencies**: None (self-contained)

### Linux
- **OS**: Most modern Linux distributions
- **Architecture**: x64
- **Memory**: 4 GB RAM minimum
- **Storage**: 200 MB available space
- **Dependencies**: 
  - libasound2
  - libgtk-3-0
  - libwebkit2gtk-4.0-37

## Troubleshooting

### Common Issues

**Windows:**
- Installer fails with "SmartScreen" warning: Code sign the installer
- Installation fails with missing DLL errors: Install Visual C++ Redistributable
- Service fails to start: Check Windows Event Log

**macOS:**
- "Cannot be opened because it is from an unidentified developer": 
  1. Right-click the app and select "Open"
  2. Or allow in System Preferences > Security & Privacy
- Application won't start: Check Console.app for crash reports

**Linux:**
- "Permission denied" when running AppImage: `chmod +x VoiceFlow Pro.AppImage`
- Missing dependencies: Install using package manager (apt/dnf/pacman)
- AppImage won't start: Check if FUSE is installed

### Debug Mode

Enable debug logging by setting environment variables:

**Windows:**
```powershell
$env:RUST_LOG="debug"
$env:TAURI_DEBUG="1"
```

**macOS/Linux:**
```bash
RUST_LOG=debug Tauri_DEBUG=1 voiceflow-pro
```

## Code Signing

### Windows
1. Obtain a code signing certificate
2. Set certificate thumbprint in installer script
3. Use signtool to sign the installer

### macOS
1. Join Apple Developer Program
2. Create Developer ID Application certificate
3. Set APPLE_ID and APPLE_ID_PASSWORD environment variables

### Linux
1. Code signing is optional for Linux
2. Use GPG signing for packages if desired

## License

All installation packages and scripts are provided under the same license as the main application (MIT License).

## Support

For issues with installation packages:
- Create an issue on GitHub
- Check the troubleshooting section
- Provide system information and error logs

## Contributing

To contribute to the installation packages:
1. Fork the repository
2. Create a feature branch
3. Test your changes on all platforms
4. Submit a pull request

---

**Version**: 1.0.0  
**Last Updated**: 2025-10-24  
**Maintained by**: VoiceFlow Pro Team
