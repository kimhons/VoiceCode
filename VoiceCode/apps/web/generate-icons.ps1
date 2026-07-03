# Generate PWA Icons from SVG
# This script converts logo.svg to all required PNG icon sizes

$logoPath = "public/logo.svg"
$iconsDir = "public/icons"

# Check if logo exists
if (-not (Test-Path $logoPath)) {
    Write-Error "Logo file not found: $logoPath"
    exit 1
}

# Create icons directory if it doesn't exist
if (-not (Test-Path $iconsDir)) {
    New-Item -ItemType Directory -Path $iconsDir -Force | Out-Null
}

Write-Host "Generating PWA icons..." -ForegroundColor Green

# Icon sizes required by manifest.json
$sizes = @(72, 96, 128, 144, 152, 192, 384, 512)

# Check if we have ImageMagick or similar tool
$hasImageMagick = Get-Command "magick" -ErrorAction SilentlyContinue
$hasInkscape = Get-Command "inkscape" -ErrorAction SilentlyContinue

if ($hasImageMagick) {
    Write-Host "Using ImageMagick to generate icons..." -ForegroundColor Cyan
    
    foreach ($size in $sizes) {
        $outputFile = "$iconsDir/icon-${size}x${size}.png"
        Write-Host "  Generating ${size}x${size}..." -NoNewline
        
        & magick convert -background none -resize "${size}x${size}" $logoPath $outputFile 2>$null
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host " [OK]" -ForegroundColor Green
        } else {
            Write-Host " [FAIL]" -ForegroundColor Red
        }
    }
    
    # Generate favicon.ico (16x16, 32x32, 48x48)
    Write-Host "  Generating favicon.ico..." -NoNewline
    & magick convert $logoPath -define icon:auto-resize=16,32,48 "public/favicon.ico" 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host " [OK]" -ForegroundColor Green
    } else {
        Write-Host " [FAIL]" -ForegroundColor Red
    }
    
    # Generate shortcut icons
    Copy-Item "$iconsDir/icon-96x96.png" "$iconsDir/record-96x96.png" -Force
    Copy-Item "$iconsDir/icon-96x96.png" "$iconsDir/transcribe-96x96.png" -Force
    Write-Host "  Shortcut icons created" -ForegroundColor Cyan
    
} elseif ($hasInkscape) {
    Write-Host "Using Inkscape to generate icons..." -ForegroundColor Cyan
    
    foreach ($size in $sizes) {
        $outputFile = "$iconsDir/icon-${size}x${size}.png"
        Write-Host "  Generating ${size}x${size}..." -NoNewline
        
        & inkscape $logoPath --export-type=png --export-filename=$outputFile --export-width=$size --export-height=$size 2>$null
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host " [OK]" -ForegroundColor Green
        } else {
            Write-Host " [FAIL]" -ForegroundColor Red
        }
    }
    
    # Generate favicon
    Write-Host "  Generating favicon (48x48)..." -NoNewline
    & inkscape $logoPath --export-type=png --export-filename="public/favicon-48.png" --export-width=48 --export-height=48 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host " [OK]" -ForegroundColor Green
    }
    
    # Generate shortcut icons
    Copy-Item "$iconsDir/icon-96x96.png" "$iconsDir/record-96x96.png" -Force
    Copy-Item "$iconsDir/icon-96x96.png" "$iconsDir/transcribe-96x96.png" -Force
    Write-Host "  Shortcut icons created" -ForegroundColor Cyan
    
} else {
    Write-Host "WARNING: Neither ImageMagick nor Inkscape found!" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Please install one of the following:" -ForegroundColor Yellow
    Write-Host "  - ImageMagick: https://imagemagick.org/script/download.php" -ForegroundColor Cyan
    Write-Host "  - Inkscape: https://inkscape.org/release/" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Alternative: Use online tool pwa-asset-generator:" -ForegroundColor Yellow
    Write-Host "  npm install -g pwa-asset-generator" -ForegroundColor Cyan
    Write-Host "  pwa-asset-generator public/logo.svg public/icons --icon-only --favicon --type png --padding '10%'" -ForegroundColor Cyan
    Write-Host ""
    exit 1
}

Write-Host ""
Write-Host "Icon generation complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Generated files:" -ForegroundColor Cyan
Get-ChildItem $iconsDir | ForEach-Object { 
    Write-Host "  - $($_.Name)" -ForegroundColor White 
}

