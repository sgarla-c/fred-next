# Start FRED Application in Docker
# This script starts the entire FRED application stack in Docker containers

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "FRED Application - Docker Startup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Run Docker check script
Write-Host "Running Docker checks..." -ForegroundColor Yellow
& "$PSScriptRoot\check-docker.ps1"
if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "Docker checks failed. Cannot proceed." -ForegroundColor Red
    Write-Host ""
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host ""

# Navigate to project directory
Push-Location $PSScriptRoot

Write-Host ""
Write-Host "Stopping any existing containers..." -ForegroundColor Yellow
docker-compose --profile dev down 2>&1 | Out-Null

Write-Host "Building and starting containers..." -ForegroundColor Yellow
Write-Host ""

# Start containers with dev profile
docker-compose --profile dev up -d --build

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "[OK] FRED Application started successfully!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Services:" -ForegroundColor Cyan
    Write-Host "  - PostgreSQL Database: localhost:5432" -ForegroundColor White
    Write-Host "  - Next.js Application: http://localhost:3100" -ForegroundColor White
    Write-Host ""
    Write-Host "View logs with:" -ForegroundColor Yellow
    Write-Host "  docker-compose --profile dev logs -f" -ForegroundColor White
    Write-Host ""
    Write-Host "Stop containers with:" -ForegroundColor Yellow
    Write-Host "  docker-compose --profile dev down" -ForegroundColor White
    Write-Host ""
    
    # Wait a moment for containers to initialize
    Write-Host "Waiting for services to initialize..." -ForegroundColor Yellow
    Start-Sleep -Seconds 5
    
    # Show container status
    Write-Host ""
    Write-Host "Container Status:" -ForegroundColor Cyan
    docker-compose --profile dev ps
    
    Write-Host ""
    Write-Host "Opening application in browser..." -ForegroundColor Yellow
    Start-Sleep -Seconds 3
    Start-Process "http://localhost:3100"
} else {
    Write-Host ""
    Write-Host "[ERROR] Failed to start containers" -ForegroundColor Red
    Write-Host "Check the logs with: docker-compose --profile dev logs" -ForegroundColor Yellow
}

Pop-Location
