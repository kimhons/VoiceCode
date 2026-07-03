# PowerShell script to deploy Supabase Edge Functions
# Usage: .\deploy-functions.ps1 [-ProjectRef YOUR_PROJECT_REF] [-Environment dev|staging|prod]

param(
    [Parameter(Mandatory=$false)]
    [string]$ProjectRef,
    
    [Parameter(Mandatory=$false)]
    [ValidateSet('dev', 'staging', 'prod')]
    [string]$Environment = 'dev'
)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Supabase Edge Functions Deployment" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if Supabase CLI is installed
Write-Host "[1/6] Checking Supabase CLI..." -ForegroundColor Yellow
$supabaseVersion = supabase --version 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "[FAIL] Supabase CLI not found!" -ForegroundColor Red
    Write-Host "Install it with: npm install -g supabase" -ForegroundColor Yellow
    exit 1
}
Write-Host "[OK] Supabase CLI installed: $supabaseVersion" -ForegroundColor Green
Write-Host ""

# Check if logged in
Write-Host "[2/6] Checking authentication..." -ForegroundColor Yellow
$loginStatus = supabase projects list 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "[FAIL] Not logged in to Supabase!" -ForegroundColor Red
    Write-Host "Run: supabase login" -ForegroundColor Yellow
    exit 1
}
Write-Host "[OK] Authenticated" -ForegroundColor Green
Write-Host ""

# Link to project if ProjectRef provided
if ($ProjectRef) {
    Write-Host "[3/6] Linking to project: $ProjectRef..." -ForegroundColor Yellow
    supabase link --project-ref $ProjectRef
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[FAIL] Failed to link to project!" -ForegroundColor Red
        exit 1
    }
    Write-Host "[OK] Linked to project" -ForegroundColor Green
} else {
    Write-Host "[3/6] Skipping project link (already linked)" -ForegroundColor Yellow
}
Write-Host ""

# List functions to deploy
Write-Host "[4/6] Functions to deploy:" -ForegroundColor Yellow
$functions = @(
    "create-checkout-session",
    "create-payment-intent",
    "create-portal-session",
    "stripe-webhook",
    "send-push-notification"
)

foreach ($func in $functions) {
    Write-Host "  - $func" -ForegroundColor Cyan
}
Write-Host ""

# Confirm deployment
Write-Host "Environment: $Environment" -ForegroundColor Magenta
$confirmation = Read-Host "Deploy these functions? (y/n)"
if ($confirmation -ne 'y') {
    Write-Host "Deployment cancelled." -ForegroundColor Yellow
    exit 0
}
Write-Host ""

# Deploy functions
Write-Host "[5/6] Deploying functions..." -ForegroundColor Yellow
$deployedCount = 0
$failedCount = 0

foreach ($func in $functions) {
    Write-Host "Deploying $func..." -ForegroundColor Cyan
    supabase functions deploy $func --no-verify-jwt
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "[OK] $func deployed successfully" -ForegroundColor Green
        $deployedCount++
    } else {
        Write-Host "[FAIL] Failed to deploy $func" -ForegroundColor Red
        $failedCount++
    }
    Write-Host ""
}

# Summary
Write-Host "[6/6] Deployment Summary:" -ForegroundColor Yellow
Write-Host "  Deployed: $deployedCount" -ForegroundColor Green
Write-Host "  Failed: $failedCount" -ForegroundColor $(if ($failedCount -gt 0) { "Red" } else { "Green" })
Write-Host ""

if ($failedCount -eq 0) {
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "  Deployment Successful!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Yellow
    Write-Host "1. Set environment secrets (see DEPLOYMENT.md)" -ForegroundColor White
    Write-Host "2. Configure Stripe webhooks" -ForegroundColor White
    Write-Host "3. Test the functions" -ForegroundColor White
    Write-Host ""
    Write-Host "View logs with:" -ForegroundColor Yellow
    Write-Host "  supabase functions logs FUNCTION_NAME --tail" -ForegroundColor Cyan
} else {
    Write-Host "========================================" -ForegroundColor Red
    Write-Host "  Deployment Failed!" -ForegroundColor Red
    Write-Host "========================================" -ForegroundColor Red
    Write-Host ""
    Write-Host "Check the errors above and try again." -ForegroundColor Yellow
    Write-Host "View logs with:" -ForegroundColor Yellow
    Write-Host "  supabase functions logs FUNCTION_NAME" -ForegroundColor Cyan
    exit 1
}

