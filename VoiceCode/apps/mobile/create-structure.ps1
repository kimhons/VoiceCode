# Create VoiceFlow Mobile Folder Structure

$folders = @(
    "src\components\common",
    "src\components\recording",
    "src\components\transcription",
    "src\components\ai",
    "src\screens\onboarding",
    "src\screens\home",
    "src\screens\recording",
    "src\screens\library",
    "src\screens\settings",
    "src\screens\profile",
    "src\navigation",
    "src\store\slices",
    "src\store\api",
    "src\services\audio",
    "src\services\transcription",
    "src\services\ai",
    "src\services\sync",
    "src\services\storage",
    "src\hooks",
    "src\utils",
    "src\types",
    "src\theme",
    "src\contexts"
)

foreach ($folder in $folders) {
    New-Item -ItemType Directory -Force -Path $folder | Out-Null
    Write-Host "Created: $folder" -ForegroundColor Green
}

Write-Host "`nFolder structure created successfully!" -ForegroundColor Cyan

