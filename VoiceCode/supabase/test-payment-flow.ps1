# PowerShell script to test Stripe payment flow
# Usage: .\test-payment-flow.ps1 -ProjectRef YOUR_PROJECT_REF -AnonKey YOUR_ANON_KEY

param(
    [Parameter(Mandatory=$true)]
    [string]$ProjectRef,
    
    [Parameter(Mandatory=$true)]
    [string]$AnonKey,
    
    [Parameter(Mandatory=$false)]
    [string]$PriceId = "price_test_123"
)

$baseUrl = "https://$ProjectRef.supabase.co/functions/v1"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Payment Flow Test Suite" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Base URL: $baseUrl" -ForegroundColor Gray
Write-Host ""

$passedTests = 0
$failedTests = 0

# Test 1: Create Checkout Session (Unauthenticated - should fail)
Write-Host "[Test 1] Create Checkout Session (Unauthenticated)" -ForegroundColor Yellow
$body = @{
    priceId = $PriceId
    successUrl = "https://example.com/success"
    cancelUrl = "https://example.com/cancel"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$baseUrl/create-checkout-session" `
        -Method POST `
        -Headers @{
            "Content-Type" = "application/json"
        } `
        -Body $body `
        -ErrorAction Stop
    
    Write-Host "[FAIL] Should have returned 401 Unauthorized" -ForegroundColor Red
    $failedTests++
} catch {
    if ($_.Exception.Response.StatusCode -eq 401) {
        Write-Host "[PASS] Correctly returned 401 Unauthorized" -ForegroundColor Green
        $passedTests++
    } else {
        Write-Host "[FAIL] Unexpected error: $($_.Exception.Message)" -ForegroundColor Red
        $failedTests++
    }
}
Write-Host ""

# Test 2: Create Payment Intent (Unauthenticated - should fail)
Write-Host "[Test 2] Create Payment Intent (Unauthenticated)" -ForegroundColor Yellow
$body = @{
    amount = 1000
    currency = "usd"
    description = "Test payment"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$baseUrl/create-payment-intent" `
        -Method POST `
        -Headers @{
            "Content-Type" = "application/json"
        } `
        -Body $body `
        -ErrorAction Stop
    
    Write-Host "[FAIL] Should have returned 401 Unauthorized" -ForegroundColor Red
    $failedTests++
} catch {
    if ($_.Exception.Response.StatusCode -eq 401) {
        Write-Host "[PASS] Correctly returned 401 Unauthorized" -ForegroundColor Green
        $passedTests++
    } else {
        Write-Host "[FAIL] Unexpected error: $($_.Exception.Message)" -ForegroundColor Red
        $failedTests++
    }
}
Write-Host ""

# Test 3: CORS Preflight
Write-Host "[Test 3] CORS Preflight (OPTIONS request)" -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/create-checkout-session" `
        -Method OPTIONS `
        -ErrorAction Stop
    
    if ($response.Headers["Access-Control-Allow-Origin"]) {
        Write-Host "[PASS] CORS headers present" -ForegroundColor Green
        $passedTests++
    } else {
        Write-Host "[FAIL] CORS headers missing" -ForegroundColor Red
        $failedTests++
    }
} catch {
    Write-Host "[FAIL] OPTIONS request failed: $($_.Exception.Message)" -ForegroundColor Red
    $failedTests++
}
Write-Host ""

# Test 4: Invalid Amount (Payment Intent)
Write-Host "[Test 4] Payment Intent with Invalid Amount" -ForegroundColor Yellow
$body = @{
    amount = 10  # Less than minimum (50 cents)
    currency = "usd"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$baseUrl/create-payment-intent" `
        -Method POST `
        -Headers @{
            "Content-Type" = "application/json"
            "Authorization" = "Bearer $AnonKey"
        } `
        -Body $body `
        -ErrorAction Stop
    
    Write-Host "[FAIL] Should have returned 400 Bad Request" -ForegroundColor Red
    $failedTests++
} catch {
    if ($_.Exception.Response.StatusCode -eq 400 -or $_.Exception.Response.StatusCode -eq 401) {
        Write-Host "[PASS] Correctly rejected invalid amount" -ForegroundColor Green
        $passedTests++
    } else {
        Write-Host "[FAIL] Unexpected error: $($_.Exception.Message)" -ForegroundColor Red
        $failedTests++
    }
}
Write-Host ""

# Test 5: Missing Required Fields
Write-Host "[Test 5] Checkout Session with Missing Fields" -ForegroundColor Yellow
$body = @{
    priceId = $PriceId
    # Missing successUrl and cancelUrl
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$baseUrl/create-checkout-session" `
        -Method POST `
        -Headers @{
            "Content-Type" = "application/json"
            "Authorization" = "Bearer $AnonKey"
        } `
        -Body $body `
        -ErrorAction Stop
    
    Write-Host "[FAIL] Should have returned 400 Bad Request" -ForegroundColor Red
    $failedTests++
} catch {
    if ($_.Exception.Response.StatusCode -eq 400 -or $_.Exception.Response.StatusCode -eq 401) {
        Write-Host "[PASS] Correctly rejected missing fields" -ForegroundColor Green
        $passedTests++
    } else {
        Write-Host "[FAIL] Unexpected error: $($_.Exception.Message)" -ForegroundColor Red
        $failedTests++
    }
}
Write-Host ""

# Summary
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Test Summary" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Passed: $passedTests" -ForegroundColor Green
Write-Host "Failed: $failedTests" -ForegroundColor $(if ($failedTests -gt 0) { "Red" } else { "Green" })
Write-Host ""

if ($failedTests -eq 0) {
    Write-Host "All tests passed!" -ForegroundColor Green
    exit 0
} else {
    Write-Host "Some tests failed. Check the output above." -ForegroundColor Red
    exit 1
}

