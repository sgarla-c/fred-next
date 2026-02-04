# FRED Docker Startup Script
# Run this to start the entire application

Write-Host "🚀 Starting FRED Application..." -ForegroundColor Cyan
Write-Host ""

# Check if Docker is running
$dockerRunning = docker info 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Docker is not running!" -ForegroundColor Red
    Write-Host "Please start Docker Desktop and try again." -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Docker is running" -ForegroundColor Green

# Ask user which mode to run
Write-Host ""
Write-Host "Select mode:" -ForegroundColor Cyan
Write-Host "1. Development (with hot reload)" -ForegroundColor White
Write-Host "2. Production (optimized)" -ForegroundColor White
Write-Host "3. Stop all services" -ForegroundColor White
Write-Host "4. Reset everything (clean start)" -ForegroundColor White
Write-Host ""

$choice = Read-Host "Enter choice (1-4)"

switch ($choice) {
    "1" {
        Write-Host ""
        Write-Host "🔧 Starting in DEVELOPMENT mode..." -ForegroundColor Cyan
        Write-Host "   - Hot reload enabled" -ForegroundColor Gray
        Write-Host "   - Code changes will reflect immediately" -ForegroundColor Gray
        Write-Host ""
        docker compose --profile dev up --build
    }
    "2" {
        Write-Host ""
        Write-Host "🏭 Starting in PRODUCTION mode..." -ForegroundColor Cyan
        Write-Host "   - Optimized build" -ForegroundColor Gray
        Write-Host "   - Best performance" -ForegroundColor Gray
        Write-Host ""
        docker compose --profile prod up --build
    }
    "3" {
        Write-Host ""
        Write-Host "🛑 Stopping all services..." -ForegroundColor Yellow
        docker compose down
        Write-Host ""
        Write-Host "✅ All services stopped" -ForegroundColor Green
    }
    "4" {
        Write-Host ""
        Write-Host "⚠️  WARNING: This will delete all data!" -ForegroundColor Red
        $confirm = Read-Host "Are you sure? (yes/no)"
        
        if ($confirm -eq "yes") {
            Write-Host ""
            Write-Host "🗑️  Removing all containers and volumes..." -ForegroundColor Yellow
            docker compose down -v
            
            Write-Host "🗑️  Removing images..." -ForegroundColor Yellow
            docker rmi fred-next-app-dev 2>$null
            docker rmi fred-next-app 2>$null
            
            Write-Host ""
            Write-Host "✅ Everything cleaned!" -ForegroundColor Green
            Write-Host ""
            Write-Host "Run this script again to start fresh." -ForegroundColor Cyan
        } else {
            Write-Host "Cancelled." -ForegroundColor Gray
        }
    }
    default {
        Write-Host ""
        Write-Host "❌ Invalid choice" -ForegroundColor Red
        exit 1
    }
}

Write-Host ""
Write-Host "──────────────────────────────────────" -ForegroundColor Gray
Write-Host "📍 Application URL: http://localhost:3100" -ForegroundColor Cyan
Write-Host "🔐 Test Login:" -ForegroundColor Cyan
Write-Host "   Username: testuser1" -ForegroundColor White
Write-Host "   Password: password123" -ForegroundColor White
Write-Host "──────────────────────────────────────" -ForegroundColor Gray
Write-Host ""
