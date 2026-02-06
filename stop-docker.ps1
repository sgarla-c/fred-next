# Stop FRED Application Docker Containers
# This script stops all FRED application containers

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "FRED Application - Docker Shutdown" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Push-Location $PSScriptRoot

Write-Host "Stopping containers..." -ForegroundColor Yellow
docker-compose --profile dev down

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "[OK] All containers stopped successfully" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "[ERROR] Error stopping containers" -ForegroundColor Red
}

Pop-Location
Write-Host ""
