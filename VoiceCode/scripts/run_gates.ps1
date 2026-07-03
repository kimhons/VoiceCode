# VoiceCode Quality Gate Runner (Windows)
# Blueprint Forge OS™ | Generated: 2026-02-26

$Pass = 0
$Fail = 0
$Warn = 0

function Gate($Name, $Command) {
    Write-Host "--- GATE: $Name ---"
    try {
        Invoke-Expression $Command
        if ($LASTEXITCODE -eq 0 -or $null -eq $LASTEXITCODE) {
            Write-Host "PASS: $Name" -ForegroundColor Green
            $script:Pass++
        } else {
            Write-Host "FAIL: $Name" -ForegroundColor Red
            $script:Fail++
        }
    } catch {
        Write-Host "FAIL: $Name - $_" -ForegroundColor Red
        $script:Fail++
    }
    Write-Host ""
}

function WarnGate($Name, $Command) {
    Write-Host "--- GATE (warn): $Name ---"
    try {
        Invoke-Expression $Command
        if ($LASTEXITCODE -eq 0 -or $null -eq $LASTEXITCODE) {
            Write-Host "PASS: $Name" -ForegroundColor Green
            $script:Pass++
        } else {
            Write-Host "WARN: $Name" -ForegroundColor Yellow
            $script:Warn++
        }
    } catch {
        Write-Host "WARN: $Name - $_" -ForegroundColor Yellow
        $script:Warn++
    }
    Write-Host ""
}

Write-Host "=== VoiceCode Quality Gates ===" -ForegroundColor Cyan

# Web App Gates
Gate "Web: Type Check" "Push-Location apps/web; npx tsc --noEmit; Pop-Location"
Gate "Web: Lint" "Push-Location apps/web; npm run lint; Pop-Location"
Gate "Web: Build" "Push-Location apps/web; npm run build; Pop-Location"
Gate "Web: Unit Tests" "Push-Location apps/web; npm test -- --run; Pop-Location"
Gate "Web: Security Audit" "Push-Location apps/web; npx audit-ci --high; Pop-Location"

# Desktop Rust Gates
Gate "Rust: Cargo Check" "Push-Location apps/desktop/src-tauri; cargo check --lib; Pop-Location"
Gate "Rust: Clippy" "Push-Location apps/desktop/src-tauri; cargo clippy --lib -- -D clippy::correctness -D clippy::suspicious -A dead_code -A unused; Pop-Location"
Gate "Rust: Unit Tests" "Push-Location apps/desktop/src-tauri; cargo test --release --lib; Pop-Location"

# Desktop Frontend
WarnGate "Desktop FE: Type Check" "Push-Location apps/desktop; npx tsc --noEmit; Pop-Location"

# Mobile Gates
Gate "Mobile: Type Check" "Push-Location apps/mobile; npx tsc --noEmit; Pop-Location"
Gate "Mobile: Lint" "Push-Location apps/mobile; npx eslint . --ext .ts,.tsx --max-warnings 0; Pop-Location"
Gate "Mobile: Tests" "Push-Location apps/mobile; npm test -- --ci --coverage --maxWorkers=2; Pop-Location"

Write-Host "=== RESULTS ===" -ForegroundColor Cyan
Write-Host "PASS: $Pass" -ForegroundColor Green
Write-Host "FAIL: $Fail" -ForegroundColor Red
Write-Host "WARN: $Warn" -ForegroundColor Yellow

if ($Fail -gt 0) {
    Write-Host "QUALITY GATES FAILED" -ForegroundColor Red
    exit 1
} else {
    Write-Host "ALL QUALITY GATES PASSED" -ForegroundColor Green
    exit 0
}
