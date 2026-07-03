# VoiceFlow Pro Windows Installer Build Script
# This script builds the Windows installer for VoiceFlow Pro

param(
    [switch]$Sign,
    [string]$CertificateThumbprint = "",
    [string]$TimestampUrl = "http://timestamp.digicert.com",
    [switch]$CreateMSI,
    [switch]$CreateNSIS
)

$ErrorActionPreference = "Stop"

Write-Host "=== VoiceFlow Pro Windows Installer Build ===" -ForegroundColor Cyan
Write-Host ""

# Check prerequisites
Write-Host "Checking prerequisites..." -ForegroundColor Yellow

# Check if Node.js is installed
try {
    $nodeVersion = node --version
    Write-Host "✓ Node.js $nodeVersion found" -ForegroundColor Green
} catch {
    Write-Host "✗ Node.js not found. Please install Node.js v18 or higher." -ForegroundColor Red
    exit 1
}

# Check if Rust is installed
try {
    $rustVersion = rustc --version
    Write-Host "✓ $rustVersion found" -ForegroundColor Green
} catch {
    Write-Host "✗ Rust not found. Please install Rust." -ForegroundColor Red
    exit 1
}

# Check if Tauri CLI is installed
try {
    $tauriVersion = npx @tauri-apps/cli --version
    Write-Host "✓ Tauri CLI $tauriVersion found" -ForegroundColor Green
} catch {
    Write-Host "Installing Tauri CLI..." -ForegroundColor Yellow
    npm install -g @tauri-apps/cli
}

# Clean previous builds
Write-Host ""
Write-Host "Cleaning previous builds..." -ForegroundColor Yellow
if (Test-Path "dist") {
    Remove-Item -Recurse -Force dist -ErrorAction SilentlyContinue
}
if (Test-Path "src-tauri/target/release") {
    Remove-Item -Recurse -Force src-tauri/target/release -ErrorAction SilentlyContinue
}

# Install dependencies
Write-Host ""
Write-Host "Installing dependencies..." -ForegroundColor Yellow
npm install

# Build the application
Write-Host ""
Write-Host "Building VoiceFlow Pro for Windows..." -ForegroundColor Yellow
npx tauri build --target x86_64-pc-windows-msvc

if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Build failed!" -ForegroundColor Red
    exit 1
}

Write-Host "✓ Build completed successfully!" -ForegroundColor Green

# Create installer
$appPath = "src-tauri/target/release/bundle"
Write-Host ""
Write-Host "Creating installer..." -ForegroundColor Yellow

if ($CreateMSI -or (-not $CreateNSIS)) {
    # Create MSI using WiX
    Write-Host "Creating MSI installer..." -ForegroundColor Yellow
    
    # Check if WiX is installed
    try {
        $candle = Get-Command candle -ErrorAction Stop
        $light = Get-Command light -ErrorAction Stop
        Write-Host "✓ WiX Toolset found" -ForegroundColor Green
    } catch {
        Write-Host "Installing WiX Toolset..." -ForegroundColor Yellow
        # Download and install WiX
        $wixUrl = "https://github.com/wixtoolset/wix3/releases/download/wix3112rtm/wix311.exe"
        $wixPath = "$env:TEMP\wix311.exe"
        Invoke-WebRequest -Uri $wixUrl -OutFile $wixPath
        Start-Process -FilePath $wixPath -ArgumentList "/S" -Wait
    }
    
    # Copy required files to installer directory
    $installerDir = "installer"
    New-Item -ItemType Directory -Force -Path $installerDir
    
    # Copy application files
    Copy-Item -Recurse -Force "$appPath\msi\*" $installerDir\
    
    # Copy installer resources
    Copy-Item -Recurse -Force "resources\*" $installerDir\
    
    # Build MSI
    Push-Location $installerDir
    try {
        & candle -ext WixUIExtension -ext WixUtilExtension VoiceFlowPro.wxs
        & light -ext WixUIExtension -ext WixUtilExtension VoiceFlowPro.wixobj -out VoiceFlowPro.msi
    } finally {
        Pop-Location
    }
    
    Write-Host "✓ MSI installer created: $installerDir\VoiceFlowPro.msi" -ForegroundColor Green
}

if ($CreateNSIS) {
    # Create NSIS installer
    Write-Host "Creating NSIS installer..." -ForegroundColor Yellow
    
    # Check if NSIS is installed
    try {
        $makensis = Get-Command makensis -ErrorAction Stop
        Write-Host "✓ NSIS found" -ForegroundColor Green
    } catch {
        Write-Host "Installing NSIS..." -ForegroundColor Yellow
        $nsisUrl = "https://nsis.sourceforge.io/Download"
        Start-Process -FilePath "https://nsis.sourceforge.io/Download"
        Write-Host "Please install NSIS manually from the opened page, then run this script again." -ForegroundColor Yellow
        exit 1
    }
    
    # Copy required files
    Copy-Item -Recurse -Force "$appPath\msi\*" "installer\"
    Copy-Item -Recurse -Force "resources\*" "installer\"
    
    # Build NSIS installer
    Push-Location "installer"
    try {
        & makensis VoiceFlowPro.nsi
    } finally {
        Pop-Location
    }
    
    Write-Host "✓ NSIS installer created: installer\VoiceFlowProSetup.exe" -ForegroundColor Green
}

# Sign the installer if requested
if ($Sign -and $CertificateThumbprint) {
    Write-Host ""
    Write-Host "Signing installer..." -ForegroundColor Yellow
    
    if ($CreateMSI) {
        & signtool sign /f "$env:TEMP\certificate.p12" /p "$env:CERT_PASSWORD" /t $TimestampUrl /fd SHA256 installer\VoiceFlowPro.msi
    }
    
    if ($CreateNSIS) {
        & signtool sign /f "$env:TEMP\certificate.p12" /p "$env:CERT_PASSWORD" /t $TimestampUrl /fd SHA256 installer\VoiceFlowProSetup.exe
    }
    
    Write-Host "✓ Installer signed successfully!" -ForegroundColor Green
}

# Create distribution package
Write-Host ""
Write-Host "Creating distribution package..." -ForegroundColor Yellow

$distDir = "dist-windows"
New-Item -ItemType Directory -Force -Path $distDir

# Copy installer files
if ($CreateMSI -or (-not $CreateNSIS)) {
    Copy-Item "installer\VoiceFlowPro.msi" $distDir\
}
if ($CreateNSIS) {
    Copy-Item "installer\VoiceFlowProSetup.exe" $distDir\
}

# Copy additional files
Copy-Item "README.md" $distDir\
Copy-Item "LICENSE" $distDir\
Copy-Item "CHANGELOG.md" $distDir\ -ErrorAction SilentlyContinue

# Create checksum file
$installerFile = if ($CreateMSI -or (-not $CreateNSIS)) { "VoiceFlowPro.msi" } else { "VoiceFlowProSetup.exe" }
$hash = Get-FileHash "$distDir\$installerFile" -Algorithm SHA256
$checksum | Out-File "$distDir\checksum.txt"
$checksumContent = "$installerFile - SHA256: $($hash.Hash)"
$checksumContent | Out-File "$distDir\checksum.txt" -Encoding UTF8

Write-Host "✓ Distribution package created: $distDir" -ForegroundColor Green

# Summary
Write-Host ""
Write-Host "=== Build Complete ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "Installer Location: $distDir\$installerFile" -ForegroundColor Green
Write-Host "Checksum File: $distDir\checksum.txt" -ForegroundColor Green
Write-Host ""
Write-Host "To install on target systems:" -ForegroundColor Yellow
Write-Host "1. Copy the installer to the target system" -ForegroundColor White
Write-Host "2. Run the installer as Administrator" -ForegroundColor White
Write-Host "3. Follow the installation wizard" -ForegroundColor White
Write-Host ""
