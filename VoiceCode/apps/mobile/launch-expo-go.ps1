# Launch Expo Go on Android Emulator
# This script checks if Expo Go is installed and launches your app

$adb = "C:\Users\khono\AppData\Local\Android\Sdk\platform-tools\adb.exe"
$emulator = "emulator-5554"
$appUrl = "exp://192.168.232.34:8083"

Write-Host "🔍 Checking if Expo Go is installed..." -ForegroundColor Cyan

# Check if Expo Go is installed
$expoPackage = & $adb -s $emulator shell pm list packages | Select-String "host.exp.exponent"

if ($expoPackage) {
    Write-Host "✅ Expo Go is installed!" -ForegroundColor Green
    Write-Host "🚀 Launching your app..." -ForegroundColor Cyan
    
    # Launch Expo Go with your app URL
    & $adb -s $emulator shell am start -a android.intent.action.VIEW -d $appUrl
    
    Write-Host "✅ App launched! Check your emulator." -ForegroundColor Green
    Write-Host "📱 If the app doesn't open, manually open Expo Go and enter: $appUrl" -ForegroundColor Yellow
} else {
    Write-Host "❌ Expo Go is NOT installed yet." -ForegroundColor Red
    Write-Host "" 
    Write-Host "📋 Please install Expo Go using one of these methods:" -ForegroundColor Yellow
    Write-Host "   1. Play Store (already opened for you)" -ForegroundColor White
    Write-Host "   2. APKMirror (already opened in browser)" -ForegroundColor White
    Write-Host "   3. Download APK manually and run:" -ForegroundColor White
    Write-Host "      & '$adb' -s $emulator install expo-go.apk" -ForegroundColor Gray
    Write-Host ""
    Write-Host "💡 After installation, run this script again!" -ForegroundColor Cyan
}

