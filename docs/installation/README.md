# VoiceFlow Pro Installation Guide

Complete installation instructions for all supported platforms and deployment scenarios.

## 🚀 System Requirements

### Minimum Requirements

| Component | Requirement |
|-----------|-------------|
| **Operating System** | Windows 10+, macOS 11+, Ubuntu 18.04+ |
| **RAM** | 4 GB minimum, 8 GB recommended |
| **Storage** | 500 MB free space, 2 GB for offline models |
| **Microphone** | Built-in or external USB microphone |
| **Internet** | Required for initial setup and cloud features |
| **Browser** (Web) | Chrome 90+, Firefox 88+, Safari 14.1+, Edge 90+ |

### Recommended Requirements

| Component | Recommendation |
|-----------|----------------|
| **Operating System** | Latest versions of Windows/macOS/Linux |
| **RAM** | 16 GB or more for optimal performance |
| **Storage** | SSD with 5+ GB free space |
| **Microphone** | Quality USB microphone or headset |
| **Internet** | Broadband connection for cloud features |
| **Graphics** | Dedicated GPU for AI acceleration (optional) |

### Performance Specifications

| Engine | Model Size | RAM Usage | CPU Impact | Storage |
|--------|------------|-----------|------------|---------|
| Web Speech API | N/A | 10-20 MB | 5-15% | Minimal |
| Whisper Tiny | 75 MB | 75-100 MB | 20-40% | 75 MB |
| Whisper Base | 142 MB | 120-180 MB | 25-50% | 142 MB |
| Whisper Small | 488 MB | 400-600 MB | 40-70% | 488 MB |

## 💻 Desktop Applications

### Windows Installation

#### Method 1: Installer (Recommended)

1. **Download Installer**
   - Visit [voiceflowpro.com/download](https://voiceflowpro.com/download)
   - Download `VoiceFlow-Pro-Setup.msi` (64-bit)
   - Verify download integrity (SHA256 provided)

2. **Run Installer**
   - Right-click installer → "Run as Administrator"
   - Follow installation wizard
   - Accept license agreement
   - Choose installation directory (default: `%ProgramFiles%\VoiceFlow Pro`)
   - Select additional tasks:
     - ✅ Create desktop shortcut
     - ✅ Add to Start Menu
     - ✅ Run at system startup
     - ✅ Enable system integration

3. **First Launch**
   - Launch from Start Menu or Desktop shortcut
   - **Windows Security** may prompt - click "More info" → "Run anyway"
   - Allow microphone access when prompted
   - Complete initial setup wizard

#### Method 2: Microsoft Store

1. Open Microsoft Store
2. Search "VoiceFlow Pro"
3. Click "Get" or "Install"
4. Wait for installation to complete
5. Launch from Start Menu

#### Method 3: Portable Version

1. Download `VoiceFlow-Pro-Portable.zip`
2. Extract to desired location
3. Run `VoiceFlowPro.exe`
4. **Note**: No installation required, but limited system integration

#### Windows-Specific Features

- **Windows Hello**: Biometric authentication support
- **Cortana Integration**: Voice commands through Cortana
- **Microsoft Office**: Enhanced integration with Word, Outlook, PowerPoint
- **System Tray**: Minimize to system tray with global hotkeys

### macOS Installation

#### Method 1: DMG Installer (Recommended)

1. **Download Application**
   - Download `VoiceFlow-Pro.dmg` from website
   - Verify with provided SHA256 checksum

2. **Install Application**
   - Double-click `.dmg` file to mount
   - Drag "VoiceFlow Pro" to Applications folder
   - Wait for copy to complete
   - Eject DMG file

3. **First Launch & Security**
   - Launch from Applications folder
   - **Gatekeeper** may block - go to System Preferences
   - Security & Privacy → General → "Open Anyway"
   - Or right-click app → "Open" → "Open" in dialog
   - Grant microphone access in System Preferences

4. **Optional: Menu Bar Integration**
   - Enable "Show in menu bar" in Preferences
   - Set up global hotkeys
   - Configure system integration

#### Method 2: Homebrew (Developers)

```bash
# Install via Homebrew
brew install --cask voiceflow-pro

# Or tap our repository
brew tap voiceflow-pro/tap
brew install voiceflow-pro
```

#### Method 3: Mac App Store

1. Open Mac App Store
2. Search "VoiceFlow Pro"
3. Click "Get" or price (if paid version)
4. Wait for download and installation
5. Launch from Launchpad or Applications

#### macOS-Specific Features

- **Touch Bar**: Support for Touch Bar controls (MacBook Pro)
- **Siri Integration**: Native Siri shortcuts support
- **Quick Look**: Preview transcribed text in Finder
- **Share Extensions**: Share text directly to VoiceFlow Pro

### Linux Installation

#### Ubuntu/Debian (.deb package)

```bash
# Download and install
wget https://releases.voiceflowpro.com/deb/voiceflow-pro_1.0.0_amd64.deb
sudo dpkg -i voiceflow-pro_1.0.0_amd64.deb

# Fix dependencies if needed
sudo apt --fix-broken install

# Install dependencies
sudo apt update
sudo apt install libgtk-3-0 libnotify4 libnss3 libxss1 libasound2

# Launch application
voiceflow-pro
```

#### Red Hat/CentOS/Fedora (.rpm package)

```bash
# Download and install
wget https://releases.voiceflowpro.com/rpm/voiceflow-pro-1.0.0.x86_64.rpm
sudo rpm -ivh voiceflow-pro-1.0.0.x86_64.rpm

# Or using dnf
sudo dnf install voiceflow-pro-1.0.0.x86_64.rpm

# Launch application
voiceflow-pro
```

#### AppImage (Universal)

```bash
# Download AppImage
wget https://releases.voiceflowpro.com/appimage/VoiceFlow-Pro-1.0.0.AppImage

# Make executable
chmod +x VoiceFlow-Pro-1.0.0.AppImage

# Run application
./VoiceFlow-Pro-1.0.0.AppImage

# Optional: Create desktop shortcut
mkdir -p ~/.local/share/applications
cat > ~/.local/share/applications/voiceflow-pro.desktop << EOF
[Desktop Entry]
Name=VoiceFlow Pro
Exec=/path/to/VoiceFlow-Pro-1.0.0.AppImage
Type=Application
Icon=voiceflow-pro
Categories=Office;Utility;
EOF
```

#### Snap Package

```bash
# Install from Snap Store
sudo snap install voiceflow-pro

# Or from local file
sudo snap install --dangerous voiceflow-pro_1.0.0_amd64.snap

# Launch
voiceflow-pro
```

#### AUR (Arch Linux)

```bash
# Using yay
yay -S voiceflow-pro

# Or manually
git clone https://aur.archlinux.org/voiceflow-pro.git
cd voiceflow-pro
makepkg -si
```

#### Linux-Specific Dependencies

**Required System Libraries:**
```bash
# Ubuntu/Debian
sudo apt install libgtk-3-0 libnotify4 libnss3 libxss1 libasound2 \
                 libsecret-1-0 libglib2.0-0 libxrandr2 libxinerama1 \
                 libxcursor1 libxi6 libxcomposite1 libxdamage1

# Fedora
sudo dnf install gtk3 libnotify nss alsa-lib libsecret glib2 \
                 libXrandr libXinerama libXcursor libXi \
                 libXcomposite libXdamage

# Arch Linux
sudo pacman -S gtk3 libnotify nss alsa-lib libsecret glib2 \
             libxrandr libxinerama libxcursor libxi \
             libxcomposite libxdamage
```

#### Distribution-Specific Notes

**Ubuntu:**
- Supports Ubuntu 18.04 LTS and later
- Unity and GNOME desktop environments
- Snap package available for latest version

**Fedora:**
- Supports Fedora 30 and later
- GNOME, KDE, XFCE desktop environments
- RPM Fusion repositories for additional codecs

**Arch Linux:**
- Rolling release - always latest version
- AUR packages for easy installation
- Supports all desktop environments

**openSUSE:**
- Use RPM package from website
- Additional codecs via Packman repository
- YaST integration available

## 📱 Mobile Applications

### iOS Installation

#### App Store (Recommended)

1. **Download from App Store**
   - Search "VoiceFlow Pro" in App Store
   - Tap "Get" or price (if paid version)
   - Wait for download and installation

2. **Initial Setup**
   - Launch app from home screen
   - Grant microphone access when prompted
   - Sign in with your account (optional)
   - Complete voice training (30 seconds)

3. **Apple Watch Integration**
   - Install companion watch app
   - Enable "VoiceFlow" complication
   - Use watch for quick voice commands

#### TestFlight (Beta)

1. Join TestFlight beta program
2. Install TestFlight app
3. Accept invitation link
4. Download and test beta version

#### Enterprise Deployment

For organizations requiring enterprise deployment:

1. **Apple Business Manager**
   - Purchase volume licenses
   - Distribute via MDM solution
   - Configure with company policies

2. **Configuration Profile**
   - Download enterprise config file
   - Install via Settings app
   - Policy enforcement enabled

#### iOS-Specific Features

- **Siri Shortcuts**: Integration with Siri
- **Apple Watch**: Quick voice commands from watch
- **AirPods**: Enhanced voice recognition with AirPods
- **Handoff**: Continue dictation from Mac/iPad

### Android Installation

#### Google Play Store (Recommended)

1. **Download from Play Store**
   - Search "VoiceFlow Pro" in Google Play
   - Tap "Install"
   - Wait for download and installation

2. **Initial Setup**
   - Launch app from app drawer
   - Grant microphone and storage permissions
   - Sign in with your Google account (optional)
   - Complete voice training

3. **Android Auto Integration**
   - Enable in car's Android Auto
   - Use voice commands while driving
   - Hands-free operation

#### APK Installation

1. **Download APK**
   - Visit [voiceflowpro.com/android](https://voiceflowpro.com/android)
   - Download `VoiceFlowPro-v1.0.0.apk`
   - Enable "Unknown Sources" in Settings

2. **Install APK**
   - Open downloaded APK file
   - Tap "Install"
   - Wait for installation to complete

3. **Security Considerations**
   - Verify APK signature
   - Enable Google Play Protect
   - Monitor for security updates

#### Enterprise Distribution

For business deployment:

1. **Google Play Console**
   - Private channel distribution
   - Managed Google Play
   - Company app store integration

2. **Sideloading**
   - Distribute APK via company portal
   - Enable enterprise app signing
   - Configure MDM policies

#### Android-Specific Features

- **Google Assistant**: Integration with Google Assistant
- **Android Auto**: Voice commands in car
- **Wear OS**: Smartwatch companion app
- **Samsung Bixby**: Bixby voice integration

## 🌐 Web Application

### Browser Installation (PWA)

#### Progressive Web App

1. **Visit Web Application**
   - Go to [app.voiceflowpro.com](https://app.voiceflowpro.com)
   - Sign in with your account or create new one

2. **Install as PWA**
   - **Chrome**: Click install icon in address bar
   - **Firefox**: Click "Install" in menu
   - **Safari**: Add to Home Screen
   - **Edge**: Click "Apps" → "Install this site"

3. **Offline Capabilities**
   - PWA works offline (limited features)
   - Syncs data when online
   - Push notifications supported

#### Browser Extensions

##### Chrome Extension

1. **Install from Chrome Web Store**
   - Search "VoiceFlow Pro"
   - Click "Add to Chrome"
   - Confirm installation

2. **First Use**
   - Click extension icon
   - Grant microphone permission
   - Configure global shortcuts

3. **Integration Features**
   - Works on all websites
   - Context menu integration
   - Screenshot and text capture

##### Firefox Add-on

1. **Install from Firefox Add-ons**
   - Search "VoiceFlow Pro"
   - Click "Add to Firefox"
   - Allow permissions

2. **Configuration**
   - Right-click context menus
   - Toolbar shortcuts
   - Privacy settings

##### Safari Extension (macOS only)

1. **Install from Mac App Store**
   - Search "VoiceFlow Pro Safari Extension"
   - Install extension
   - Enable in Safari preferences

2. **Setup**
   - Grant microphone access
   - Configure toolbar buttons
   - Set up keyboard shortcuts

#### Web App Features

- **Cross-browser Compatibility**: Works on all modern browsers
- **Offline Mode**: Limited functionality without internet
- **Real-time Sync**: Data sync across all devices
- **Push Notifications**: Browser notification support
- **WebRTC**: Direct microphone access without plugins

## 🔧 Advanced Installation Options

### Container Installation

#### Docker

```bash
# Pull latest image
docker pull voiceflowpro/voiceflow-pro:latest

# Run with GUI support
docker run -d \
  --name voiceflow-pro \
  --device /dev/snd \
  --user $(id -u):$(id -g) \
  -v $HOME/.config/VoiceFlowPro:/home/user/.config/VoiceFlowPro \
  -v /tmp/.X11-unix:/tmp/.X11-unix \
  -e DISPLAY=$DISPLAY \
  voiceflowpro/voiceflow-pro:latest

# For development
docker run -it --rm \
  --device /dev/snd \
  -p 3000:3000 \
  voiceflowpro/voiceflow-pro:dev
```

#### Docker Compose

```yaml
# docker-compose.yml
version: '3.8'

services:
  voiceflow-pro:
    image: voiceflowpro/voiceflow-pro:latest
    container_name: voiceflow-pro
    devices:
      - /dev/snd
    volumes:
      - voiceflow-config:/home/user/.config/VoiceFlowPro
      - voiceflow-data:/home/user/.local/share/VoiceFlowPro
    environment:
      - PULSE_SERVER=unix:/tmp/pulse/native
    restart: unless-stopped

volumes:
  voiceflow-config:
  voiceflow-data:
```

### Development Installation

#### From Source

```bash
# Clone repository
git clone https://github.com/voiceflow-pro/voiceflow-pro.git
cd voiceflow-pro

# Install dependencies
npm install

# Setup Rust environment
cd src-tauri
cargo check
cd ..

# Build for development
npm run dev

# Build for production
npm run build
```

#### Development with Hot Reload

```bash
# Frontend development
npm run dev:frontend

# Backend development (separate terminal)
npm run dev:backend

# Full stack development
npm run dev:all
```

## 🚨 Troubleshooting Installation

### Common Issues

#### Windows Issues

**Problem**: "This app can't run on your PC"
- **Solution**: Ensure 64-bit Windows and latest .NET Framework
- **Fix**: Download x64 version of installer

**Problem**: "Windows protected your PC"
- **Solution**: Click "More info" → "Run anyway"
- **Fix**: Add exception in Windows Security

**Problem**: Microphone not detected
- **Solution**: Check Windows Sound Settings
- **Fix**: Enable microphone in Privacy Settings

#### macOS Issues

**Problem**: "Cannot be opened because it is from an unidentified developer"
- **Solution**: Right-click app → "Open" → "Open"
- **Fix**: System Preferences → Security & Privacy → "Open Anyway"

**Problem**: "VoiceFlow Pro would like to access the microphone"
- **Solution**: Allow in System Preferences
- **Fix**: Privacy & Security → Microphone → Enable VoiceFlow Pro

**Problem**: App crashes on startup
- **Solution**: Clear app data and reinstall
- **Fix**: Delete `~/Library/Application Support/VoiceFlowPro`

#### Linux Issues

**Problem**: Missing shared libraries
- **Solution**: Install required dependencies
- **Fix**: Run dependency installer script

**Problem**: No audio devices found
- **Solution**: Check PulseAudio/PipeWire setup
- **Fix**: Restart audio service

**Problem**: Permission denied
- **Solution**: Run with `sudo` or fix permissions
- **Fix**: Set correct ownership of app files

#### Mobile Issues

**iOS:**
- **Problem**: Microphone permission not granted
- **Fix**: Settings → Privacy & Security → Microphone → Enable VoiceFlow Pro

**Android:**
- **Problem**: App crashes on startup
- **Fix**: Clear app data and cache in Android Settings

#### Web Issues

**Problem**: Microphone not working
- **Solution**: Check browser permissions
- **Fix**: Click microphone icon in address bar

**Problem**: PWA won't install
- **Solution**: Ensure HTTPS connection
- **Fix**: Clear browser cache and cookies

### Diagnostic Tools

#### System Information Script

Run this script to gather system information for troubleshooting:

**Windows (PowerShell):**
```powershell
# Save as system-info.ps1
Get-ComputerInfo | Select-Object WindowsProductName, WindowsVersion, TotalPhysicalMemory
Get-WmiObject -Class Win32_ComputerSystem | Select-Object TotalPhysicalMemory
Get-WmiObject -Class Win32_SoundDevice | Select-Object Name, Status
Test-NetConnection -ComputerName api.voiceflowpro.com -Port 443
```

**macOS (Terminal):**
```bash
#!/bin/bash
# Save as system-info.sh
echo "System: $(sw_vers -productName) $(sw_vers -productVersion)"
echo "Memory: $(sysctl -n hw.memsize | awk '{print $1/1024/1024/1024 " GB"}')"
echo "Audio: $(system_profiler SPAudioDataType | grep "Model Name")"
curl -I https://api.voiceflowpro.com
```

**Linux (Bash):**
```bash
#!/bin/bash
# Save as system-info.sh
echo "OS: $(lsb_release -d | cut -f2)"
echo "Memory: $(free -h | awk '/^Mem:/ {print $2}')"
echo "Audio: $(aplay -l | head -n1 || echo "No audio devices")"
curl -I https://api.voiceflowpro.com
```

### Log Files

#### Log File Locations

**Windows:**
```
%APPDATA%\VoiceFlowPro\logs\
```

**macOS:**
```
~/Library/Logs/VoiceFlowPro/
```

**Linux:**
```
~/.config/VoiceFlowPro/logs/
```

**Web:**
- Open Developer Tools (F12)
- Console tab for JavaScript errors
- Network tab for API failures

#### Log Analysis

**Common Log Entries:**

```
[INFO] Voice engine initialized successfully
[WARN] Web Speech API not supported, falling back to Whisper
[ERROR] Microphone permission denied
[INFO] Language auto-detected: en-US
[ERROR] Network error, switching to offline mode
```

### Support Resources

- **Installation Support**: [support.voiceflowpro.com/installation](https://support.voiceflowpro.com/installation)
- **Community Forum**: [community.voiceflowpro.com](https://community.voiceflowpro.com)
- **Email Support**: install@voiceflowpro.com
- **Live Chat**: Available 9 AM - 5 PM EST, Mon-Fri

---

## ✅ Installation Checklist

Before considering installation complete:

- [ ] Application launches successfully
- [ ] Microphone permission granted
- [ ] Voice recognition working
- [ ] AI processing functional
- [ ] Cross-device sync (if enabled)
- [ ] Keyboard shortcuts configured
- [ ] Auto-start enabled (optional)
- [ ] Updates configured
- [ ] Backup/restore tested
- [ ] Privacy settings reviewed

**Next Steps**: After installation, complete the [Quick Start Guide](../user-guide/quick-start.md) to get the most out of VoiceFlow Pro!
