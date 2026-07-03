# VoiceCode Extension - Install and Test Script
# This script helps you install the extension locally for screenshot capture

Write-Host "🚀 VoiceCode Extension - Install and Test" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Check if VSCode is installed
$vscodePath = Get-Command code -ErrorAction SilentlyContinue
if (-not $vscodePath) {
    Write-Host "❌ VSCode CLI 'code' not found in PATH" -ForegroundColor Red
    Write-Host "Please install VSCode or add it to your PATH" -ForegroundColor Yellow
    Write-Host "Windows: Add 'C:\Program Files\Microsoft VS Code\bin' to PATH" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ VSCode CLI found: $($vscodePath.Source)" -ForegroundColor Green
Write-Host ""

# Check if VSIX file exists
$vsixPath = "voicecode-vscode-1.0.0.vsix"
if (-not (Test-Path $vsixPath)) {
    Write-Host "❌ VSIX file not found: $vsixPath" -ForegroundColor Red
    Write-Host "Building extension..." -ForegroundColor Yellow
    npm run package
    
    if (-not (Test-Path $vsixPath)) {
        Write-Host "❌ Failed to build VSIX package" -ForegroundColor Red
        exit 1
    }
}

Write-Host "✅ VSIX file found: $vsixPath" -ForegroundColor Green
Write-Host ""

# Install extension
Write-Host "📦 Installing VoiceCode extension..." -ForegroundColor Cyan
code --install-extension $vsixPath --force

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Extension installed successfully!" -ForegroundColor Green
} else {
    Write-Host "❌ Failed to install extension" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "🎉 Installation Complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📸 Next Steps for Screenshot Capture:" -ForegroundColor Cyan
Write-Host "1. Open VSCode: code ." -ForegroundColor White
Write-Host "2. Create a demo project with sample code" -ForegroundColor White
Write-Host "3. Follow the SCREENSHOT_GUIDE.md for each screenshot" -ForegroundColor White
Write-Host "4. Save screenshots to: screenshots/" -ForegroundColor White
Write-Host ""
Write-Host "🔧 Quick Commands:" -ForegroundColor Cyan
Write-Host "- Start Listening: Ctrl+Shift+V" -ForegroundColor White
Write-Host "- Show Chatbox: Ctrl+Shift+C" -ForegroundColor White
Write-Host "- Command Palette: Ctrl+Shift+P → 'VoiceCode'" -ForegroundColor White
Write-Host "- Open Settings: Ctrl+, → Search 'voicecode'" -ForegroundColor White
Write-Host ""
Write-Host "📖 Full guide: SCREENSHOT_GUIDE.md" -ForegroundColor Yellow
Write-Host ""

# Ask if user wants to open VSCode
$openVSCode = Read-Host "Open VSCode now? (y/n)"
if ($openVSCode -eq 'y' -or $openVSCode -eq 'Y') {
    Write-Host "Opening VSCode..." -ForegroundColor Cyan
    code .
}

