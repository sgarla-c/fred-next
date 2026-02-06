# Run Legacy Data Migration from Host Machine
#
# This script runs the migration from the Windows host machine
# which has proper Windows Authentication to SQL Server
#
# The script will:
# 1. Temporarily update DATABASE_URL to use localhost
# 2. Run the migration
# 3. Restore the original DATABASE_URL

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Legacy Data Migration Runner" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if PostgreSQL port is exposed
Write-Host "Checking PostgreSQL availability..." -ForegroundColor Yellow
$postgresContainer = docker ps --filter "name=fred-postgres" --format "{{.Names}}"
if (-not $postgresContainer) {
    Write-Host "Error: PostgreSQL container is not running" -ForegroundColor Red
    Write-Host "Please ensure Docker containers are running with: docker-compose up -d" -ForegroundColor Yellow
    exit 1
}
Write-Host "PostgreSQL is available" -ForegroundColor Green
Write-Host ""

# Backup current .env.local
Write-Host "Backing up .env.local..." -ForegroundColor Yellow
Copy-Item .env.local .env.local.backup -Force
Write-Host "Backup created" -ForegroundColor Green
Write-Host ""

# Update DATABASE_URL to use localhost
Write-Host "Updating DATABASE_URL for host access..." -ForegroundColor Yellow
$envContent = Get-Content .env.local -Raw
$envContent = $envContent -replace 'DATABASE_URL="postgresql://([^@]+)@postgres:', 'DATABASE_URL="postgresql://$1@localhost:'
Set-Content .env.local $envContent
Write-Host "DATABASE_URL updated" -ForegroundColor Green
Write-Host ""

try {
    # Run the migration
    Write-Host "Starting migration..." -ForegroundColor Yellow
    Write-Host "(This may take several minutes depending on data volume)" -ForegroundColor Gray
    Write-Host ""
    
    npx tsx scripts/migrate-legacy-data.ts
    
    $exitCode = $LASTEXITCODE
    
    if ($exitCode -eq 0) {
        Write-Host ""
        Write-Host "Migration completed successfully!" -ForegroundColor Green
    } else {
        Write-Host ""
        Write-Host "Migration failed with exit code $exitCode" -ForegroundColor Red
    }
}
finally {
    # Restore original .env.local
    Write-Host ""
    Write-Host "Restoring original .env.local..." -ForegroundColor Yellow
    Copy-Item .env.local.backup .env.local -Force
    Remove-Item .env.local.backup -Force
    Write-Host "Restored" -ForegroundColor Green
    Write-Host ""
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Migration process complete" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
