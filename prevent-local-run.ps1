# Prevent Local Run Script
# This script blocks local npm commands and enforces Docker-only execution

param(
    [string]$Command
)

Write-Host "" -ForegroundColor Red
Write-Host "❌ BLOCKED: Local execution is not allowed!" -ForegroundColor Red
Write-Host "" -ForegroundColor Red
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Yellow
Write-Host " This application is configured to run ONLY from Docker" -ForegroundColor Yellow
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Yellow
Write-Host "" -ForegroundColor Yellow
Write-Host "You tried to run: npm $Command" -ForegroundColor White
Write-Host "" -ForegroundColor White
Write-Host "Instead, use Docker commands:" -ForegroundColor Cyan
Write-Host "" -ForegroundColor Cyan
Write-Host "  Start the application:" -ForegroundColor Green
Write-Host "    docker-compose --profile dev up -d" -ForegroundColor White
Write-Host "" -ForegroundColor White
Write-Host "  Stop the application:" -ForegroundColor Green
Write-Host "    docker-compose --profile dev down" -ForegroundColor White
Write-Host "" -ForegroundColor White
Write-Host "  View logs:" -ForegroundColor Green
Write-Host "    docker-compose --profile dev logs -f" -ForegroundColor White
Write-Host "" -ForegroundColor White
Write-Host "  Rebuild containers:" -ForegroundColor Green
Write-Host "    docker-compose --profile dev up -d --build" -ForegroundColor White
Write-Host "" -ForegroundColor White
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Yellow
Write-Host "Reason: Database hostname is set to 'postgres' (Docker service)" -ForegroundColor Yellow
Write-Host "Running locally will fail to connect to the database." -ForegroundColor Yellow
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Yellow
Write-Host "" -ForegroundColor Red

exit 1
