# PowerShell script to set up Supabase Edge Function secrets
# Usage: .\setup-secrets.ps1 [-Environment dev|staging|prod]

param(
    [Parameter(Mandatory=$false)]
    [ValidateSet('dev', 'staging', 'prod')]
    [string]$Environment = 'dev'
)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Supabase Secrets Setup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Environment: $Environment" -ForegroundColor Magenta
Write-Host ""

# Function to set a secret
function Set-SupabaseSecret {
    param(
        [string]$Name,
        [string]$Description,
        [bool]$Required = $true
    )
    
    Write-Host "Setting: $Name" -ForegroundColor Yellow
    Write-Host "  Description: $Description" -ForegroundColor Gray
    
    if ($Required) {
        Write-Host "  [REQUIRED]" -ForegroundColor Red
    } else {
        Write-Host "  [OPTIONAL]" -ForegroundColor Green
    }
    
    $value = Read-Host "  Enter value (or press Enter to skip)"
    
    if ([string]::IsNullOrWhiteSpace($value)) {
        if ($Required) {
            Write-Host "  [SKIP] Warning: This is a required secret!" -ForegroundColor Yellow
        } else {
            Write-Host "  [SKIP] Skipped" -ForegroundColor Gray
        }
        return $false
    }
    
    # Set the secret
    $output = supabase secrets set "$Name=$value" 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  [OK] Secret set successfully" -ForegroundColor Green
        return $true
    } else {
        Write-Host "  [FAIL] Failed to set secret: $output" -ForegroundColor Red
        return $false
    }
}

# Check if logged in
Write-Host "Checking authentication..." -ForegroundColor Yellow
$loginStatus = supabase projects list 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "[FAIL] Not logged in to Supabase!" -ForegroundColor Red
    Write-Host "Run: supabase login" -ForegroundColor Yellow
    exit 1
}
Write-Host "[OK] Authenticated" -ForegroundColor Green
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Required Secrets" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Stripe Secret Key
Set-SupabaseSecret `
    -Name "STRIPE_SECRET_KEY" `
    -Description "Stripe secret key (sk_test_... for test, sk_live_... for prod)" `
    -Required $true

Write-Host ""

# Stripe Webhook Secret
Set-SupabaseSecret `
    -Name "STRIPE_WEBHOOK_SECRET" `
    -Description "Stripe webhook signing secret (whsec_...)" `
    -Required $true

Write-Host ""

# Supabase Service Role Key
Set-SupabaseSecret `
    -Name "SUPABASE_SERVICE_ROLE_KEY" `
    -Description "Supabase service role key (from Settings > API)" `
    -Required $true

Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Stripe Price IDs" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Pro Monthly Price ID
Set-SupabaseSecret `
    -Name "STRIPE_PRO_MONTHLY_PRICE_ID" `
    -Description "Stripe price ID for Pro Monthly plan" `
    -Required $true

Write-Host ""

# Pro Yearly Price ID
Set-SupabaseSecret `
    -Name "STRIPE_PRO_YEARLY_PRICE_ID" `
    -Description "Stripe price ID for Pro Yearly plan" `
    -Required $true

Write-Host ""

# Enterprise Monthly Price ID
Set-SupabaseSecret `
    -Name "STRIPE_ENTERPRISE_MONTHLY_PRICE_ID" `
    -Description "Stripe price ID for Enterprise Monthly plan" `
    -Required $true

Write-Host ""

# Enterprise Yearly Price ID
Set-SupabaseSecret `
    -Name "STRIPE_ENTERPRISE_YEARLY_PRICE_ID" `
    -Description "Stripe price ID for Enterprise Yearly plan" `
    -Required $true

Write-Host ""

Write-Host "========================================" -ForegroundColor Green
Write-Host "  Secrets Setup Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

Write-Host "View all secrets with:" -ForegroundColor Yellow
Write-Host "  supabase secrets list" -ForegroundColor Cyan
Write-Host ""

Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Deploy Edge Functions (run deploy-functions.ps1)" -ForegroundColor White
Write-Host "2. Configure Stripe webhooks (see DEPLOYMENT.md)" -ForegroundColor White
Write-Host "3. Test the payment flow" -ForegroundColor White
Write-Host ""

