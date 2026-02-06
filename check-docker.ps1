# Docker Check Script
# Ensures Docker is running before allowing any operations

Write-Host "🐳 Checking Docker status..." -ForegroundColor Cyan

# Check if Docker Desktop is running
try {
    $dockerProcess = Get-Process "Docker Desktop" -ErrorAction SilentlyContinue
    if (-not $dockerProcess) {
        Write-Host "❌ ERROR: Docker Desktop is not running!" -ForegroundColor Red
        Write-Host "" -ForegroundColor Red
        Write-Host "This application MUST run from Docker containers." -ForegroundColor Yellow
        Write-Host "Please start Docker Desktop first:" -ForegroundColor Yellow
        Write-Host "  1. Open Docker Desktop application" -ForegroundColor White
        Write-Host "  2. Wait for it to start (15-30 seconds)" -ForegroundColor White
        Write-Host "  3. Run this script again" -ForegroundColor White
        Write-Host "" -ForegroundColor Yellow
        exit 1
    }
} catch {
    Write-Host "⚠️  Warning: Could not check Docker Desktop process" -ForegroundColor Yellow
}

# Check if Docker daemon is responsive
try {
    $dockerInfo = docker info 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ ERROR: Docker daemon is not responding!" -ForegroundColor Red
        Write-Host "" -ForegroundColor Red
        Write-Host "Docker Desktop may be starting up. Please wait and try again." -ForegroundColor Yellow
        Write-Host "" -ForegroundColor Yellow
        exit 1
    }
} catch {
    Write-Host "❌ ERROR: Cannot connect to Docker daemon!" -ForegroundColor Red
    Write-Host "" -ForegroundColor Red
    Write-Host "This application MUST run from Docker containers." -ForegroundColor Yellow
    Write-Host "Please ensure Docker Desktop is installed and running." -ForegroundColor Yellow
    Write-Host "" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Docker is running and responsive" -ForegroundColor Green
Write-Host "" -ForegroundColor Green

# Check if docker-compose is available
try {
    $composeVersion = docker-compose --version 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ ERROR: docker-compose is not available!" -ForegroundColor Red
        exit 1
    }
    Write-Host "✅ docker-compose is available: $composeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ ERROR: docker-compose is not installed!" -ForegroundColor Red
    exit 1
}

Write-Host "" -ForegroundColor Green
Write-Host "🎉 All Docker checks passed!" -ForegroundColor Green
Write-Host "" -ForegroundColor Green
exit 0
