# ML API Frontend Configuration Helper
# Usage: .\tools\configure-ml-env.ps1 https://lulan-ml-api.onrender.com

param(
    [Parameter(Mandatory=$true)]
    [string]$ApiUrl
)

$clientDir = Join-Path $PSScriptRoot "..\client"
$envFile = Join-Path $clientDir ".env.production"

Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  ML API Frontend Configuration" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# Validate URL
if ($ApiUrl -notmatch '^https?://') {
    Write-Host "❌ Invalid URL format. Must start with http:// or https://" -ForegroundColor Red
    exit 1
}

Write-Host "🔍 Verifying ML API..." -ForegroundColor Yellow
Write-Host "   URL: $ApiUrl" -ForegroundColor Gray

# Test API health
try {
    $healthUrl = "$ApiUrl/health"
    $response = Invoke-RestMethod -Uri $healthUrl -TimeoutSec 10
    
    if ($response.status -eq "healthy" -and $response.model_loaded -eq $true) {
        Write-Host "✅ ML API is healthy and model is loaded" -ForegroundColor Green
    } else {
        Write-Host "⚠️  ML API responded but model might not be loaded" -ForegroundColor Yellow
        Write-Host "   Response: $($response | ConvertTo-Json -Compress)" -ForegroundColor Gray
    }
} catch {
    Write-Host "❌ Failed to connect to ML API" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Gray
    Write-Host ""
    Write-Host "   Continuing anyway... (API might still be starting up)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "📝 Creating .env.production file..." -ForegroundColor Yellow

# Create .env.production content
$envContent = @"
# Production Environment Variables
# Generated: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")

# ML API Endpoint
VITE_ML_API_URL=$ApiUrl
"@

# Write to file
$envContent | Out-File -FilePath $envFile -Encoding utf8 -Force

Write-Host "✅ Created: $envFile" -ForegroundColor Green
Write-Host ""
Write-Host "📄 File contents:" -ForegroundColor Cyan
Write-Host "   VITE_ML_API_URL=$ApiUrl" -ForegroundColor Gray
Write-Host ""

Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  Next Steps" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Build frontend:" -ForegroundColor White
Write-Host "   cd client" -ForegroundColor Gray
Write-Host "   npm run build" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Deploy to Firebase:" -ForegroundColor White
Write-Host "   firebase deploy" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Test integration:" -ForegroundColor White
Write-Host "   Open: https://lulan-web-app-dashboard.web.app" -ForegroundColor Gray
Write-Host "   Try voice command: 'deliver morphine to ICU urgently'" -ForegroundColor Gray
Write-Host "   Check browser console for ML API calls" -ForegroundColor Gray
Write-Host ""
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
