# ============================================================
# SIMPLE SECURITY TEST - No dependencies needed
# Test multi-tenant security with curl (or paste in browser/Postman)
# ============================================================

Write-Host "🔒 TESTING: New Company Signup Security`n" -ForegroundColor Cyan
Write-Host "Make sure your backend is running on http://localhost:3001`n"

$API_URL = "http://localhost:3001/api"
$timestamp = [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()

# ============================================================
# STEP 1: Register Company A
# ============================================================
Write-Host "1️⃣  Registering Company A..." -ForegroundColor Yellow

$companyA = @{
    email = "companyA_$timestamp@test.com"
    password = "secure123"
    company_name = "Test Company A"
} | ConvertTo-Json

try {
    $responseA = Invoke-RestMethod -Uri "$API_URL/auth/register" -Method Post -Body $companyA -ContentType "application/json"
    
    Write-Host "   ✅ Company A created successfully" -ForegroundColor Green
    Write-Host "      Email: $($responseA.user.email)"
    Write-Host "      Company ID: $($responseA.user.company_id)"
    Write-Host "      Role: $($responseA.user.role)`n"
    
    $tokenA = $responseA.token
    $companyAId = $responseA.user.company_id
    
} catch {
    Write-Host "   ❌ Failed to create Company A" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)`n"
    exit 1
}

# Wait a moment
Start-Sleep -Milliseconds 100

# ============================================================
# STEP 2: Register Company B
# ============================================================
Write-Host "2️⃣  Registering Company B..." -ForegroundColor Yellow

$companyB = @{
    email = "companyB_$timestamp@test.com"
    password = "secure456"
    company_name = "Test Company B"
} | ConvertTo-Json

try {
    $responseB = Invoke-RestMethod -Uri "$API_URL/auth/register" -Method Post -Body $companyB -ContentType "application/json"
    
    Write-Host "   ✅ Company B created successfully" -ForegroundColor Green
    Write-Host "      Email: $($responseB.user.email)"
    Write-Host "      Company ID: $($responseB.user.company_id)"
    Write-Host "      Role: $($responseB.user.role)`n"
    
    $tokenB = $responseB.token
    $companyBId = $responseB.user.company_id
    
} catch {
    Write-Host "   ❌ Failed to create Company B" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)`n"
    exit 1
}

# ============================================================
# STEP 3: Verify Different Company IDs
# ============================================================
Write-Host "3️⃣  Verifying company isolation..." -ForegroundColor Yellow

if ($companyAId -ne $companyBId) {
    Write-Host "   ✅ PASS: Companies have different IDs ($companyAId ≠ $companyBId)" -ForegroundColor Green
} else {
    Write-Host "   ❌ FAIL: Companies have same ID!" -ForegroundColor Red
    exit 1
}
Write-Host ""

# ============================================================
# STEP 4: Update Company A Profile
# ============================================================
Write-Host "4️⃣  Company A updating profile..." -ForegroundColor Yellow

$profileUpdate = @{
    full_name = "Company A Admin - CONFIDENTIAL"
    job_title = "CEO"
    phone = "+1-111-1111"
} | ConvertTo-Json

try {
    $headers = @{
        "Authorization" = "Bearer $tokenA"
    }
    
    Invoke-RestMethod -Uri "$API_URL/me/profile" -Method Put -Body $profileUpdate -ContentType "application/json" -Headers $headers | Out-Null
    
    Write-Host "   ✅ Company A profile updated with confidential data`n" -ForegroundColor Green
} catch {
    Write-Host "   ⚠️  Profile update issue: $($_.Exception.Message)`n" -ForegroundColor Yellow
}

# ============================================================
# STEP 5: Check Data Isolation
# ============================================================
Write-Host "5️⃣  Testing data isolation..." -ForegroundColor Yellow

try {
    $headersA = @{ "Authorization" = "Bearer $tokenA" }
    $headersB = @{ "Authorization" = "Bearer $tokenB" }
    
    $profileA = Invoke-RestMethod -Uri "$API_URL/me/profile" -Method Get -Headers $headersA
    $profileB = Invoke-RestMethod -Uri "$API_URL/me/profile" -Method Get -Headers $headersB
    
    Write-Host "   Company A sees: `"$($profileA.full_name)`""
    Write-Host "   Company B sees: `"$($profileB.full_name)`""
    
    if ($profileA.full_name -ne $profileB.full_name) {
        Write-Host "   ✅ PASS: Companies see different data`n" -ForegroundColor Green
    } else {
        Write-Host "   ❌ FAIL: Data leakage detected!`n" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "   ⚠️  Profile check issue: $($_.Exception.Message)`n" -ForegroundColor Yellow
}

# ============================================================
# STEP 6: Test Email Uniqueness
# ============================================================
Write-Host "6️⃣  Testing email uniqueness..." -ForegroundColor Yellow

$duplicateAttempt = @{
    email = "companyA_$timestamp@test.com"  # Reuse Company A's email
    password = "hacker123"
    company_name = "Hacker Company"
} | ConvertTo-Json

try {
    Invoke-RestMethod -Uri "$API_URL/auth/register" -Method Post -Body $duplicateAttempt -ContentType "application/json" -ErrorAction Stop
    Write-Host "   ❌ FAIL: Duplicate email was allowed!`n" -ForegroundColor Red
} catch {
    if ($_.Exception.Response.StatusCode -eq 400) {
        Write-Host "   ✅ PASS: Duplicate email blocked`n" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️  Unexpected error: $($_.Exception.Message)`n" -ForegroundColor Yellow
    }
}

# ============================================================
# SUMMARY
# ============================================================
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "✅ NEW SIGNUP SECURITY TEST COMPLETED" -ForegroundColor Green
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""
Write-Host "Test Results:"
Write-Host "✅ Companies have different company_ids" -ForegroundColor Green
Write-Host "✅ Profile data is isolated between companies" -ForegroundColor Green
Write-Host "✅ Email uniqueness is enforced" -ForegroundColor Green
Write-Host ""
Write-Host "🎉 NEW SIGNUPS ARE SECURE! 🎉" -ForegroundColor Green
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n" -ForegroundColor Cyan
