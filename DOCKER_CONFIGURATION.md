# Docker Configuration Guide

## ⚠️ IMPORTANT: Always Run from Docker

This application is configured to **ALWAYS RUN FROM DOCKER**. Do not attempt to run it locally with `npm run dev` unless you have a specific reason and understand the configuration changes needed.

## Why Docker?

- **Consistent Environment**: Ensures everyone runs the same database, Node version, and dependencies
- **Easy Setup**: One command to start everything
- **Database Included**: PostgreSQL runs automatically in a container
- **No Local Installation**: No need to install PostgreSQL, Node.js, or other dependencies locally

## Quick Start

### Starting the Application

```powershell
# From the fred-next directory
docker-compose --profile dev up -d
```

### Stopping the Application

```powershell
docker-compose --profile dev down
```

### Viewing Logs

```powershell
# Follow logs in real-time
docker-compose --profile dev logs -f

# View last 50 lines
docker-compose --profile dev logs --tail 50

# View only app logs
docker-compose --profile dev logs app-dev -f
```

### Accessing the Application

- **Web Application**: http://localhost:3100
- **Database**: localhost:5432
  - User: `fred_user`
  - Password: `fred_password_dev`
  - Database: `fred_poc`

## Configuration Details

### Environment Variables

The application uses the following environment variable configurations:

#### Docker Environment (.env and .env.local)
```bash
# Database connection INSIDE Docker container
DATABASE_URL="postgresql://fred_user:fred_password_dev@postgres:5432/fred_poc"

# Application URL
NEXTAUTH_URL="http://localhost:3100"

# Secret for NextAuth
NEXTAUTH_SECRET="dev-secret-key-replace-in-production-with-secure-random-string"
```

**Key Point**: The database hostname is `postgres` (the Docker service name), NOT `localhost`.

#### Local Development (if running outside Docker)
If you absolutely must run outside Docker:
```bash
# Change database hostname to localhost
DATABASE_URL="postgresql://fred_user:fred_password_dev@localhost:5432/fred_poc"
```

### Docker Compose Services

#### Development Profile (`--profile dev`)
- **postgres**: PostgreSQL 16 database
  - Port: 5432
  - Data persisted in Docker volume
  - Health checks enabled
  
- **app-dev**: Next.js application in development mode
  - Port: 3100
  - Hot reload enabled
  - Source code mounted from host
  - Automatic Prisma migrations and seeding

#### Production Profile (`--profile prod`)
- **postgres**: Same database service
- **app**: Optimized production build
  - Port: 3100
  - Multi-stage Docker build
  - Standalone output

## Common Commands

### Rebuild Containers
```powershell
# If you change Dockerfile or dependencies
docker-compose --profile dev build
docker-compose --profile dev up -d
```

### Reset Database
```powershell
# Stop containers and remove volumes
docker-compose --profile dev down -v

# Start fresh
docker-compose --profile dev up -d
```

### Database Migrations
```powershell
# Migrations run automatically on container start
# To run manually:
docker-compose --profile dev exec app-dev npx prisma migrate deploy
```

### Access Database Shell
```powershell
docker exec -it fred-postgres psql -U fred_user -d fred_poc
```

### Shell into Container
```powershell
# Access the app container shell
docker exec -it fred-next-app-dev sh
```

## Troubleshooting

### Docker Desktop Not Running
**Error**: `open //./pipe/dockerDesktopLinuxEngine: The system cannot find the file specified`

**Solution**: Start Docker Desktop first
```powershell
Start-Process "C:\Program Files\Docker\Docker\Docker Desktop.exe"
# Wait 15-30 seconds for it to start
docker ps  # Verify it's running
```

### Port Already in Use
**Error**: `Bind for 0.0.0.0:3100 failed: port is already allocated`

**Solution**: Stop the conflicting process or change the port
```powershell
# Find what's using port 3100
Get-NetTCPConnection -LocalPort 3100

# Or change the port in docker-compose.yml
ports:
  - "3200:3100"  # Map to different host port
```

### Database Connection Issues
**Error**: `Can't reach database server`

**Solution**: 
1. Verify database hostname is `postgres` in `.env` files
2. Check postgres container is running: `docker ps`
3. Check postgres is healthy: `docker inspect fred-postgres`

### Container Keeps Restarting
```powershell
# Check logs for errors
docker-compose --profile dev logs app-dev

# Common issues:
# - Syntax errors in code
# - Missing environment variables
# - Database not ready (should wait for health check)
```

## File Structure

```
fred-next/
├── docker-compose.yml          # Container orchestration
├── Dockerfile                  # Production image
├── Dockerfile.dev              # Development image
├── .dockerignore               # Files excluded from image
├── .env                        # Environment variables (Docker config)
├── .env.local                  # Local overrides (Docker config)
├── .env.example                # Template with comments
└── start-docker.ps1            # Optional startup script
```

## Best Practices

1. **Always Use Docker**: Run `docker-compose --profile dev up -d` to start
2. **Never Commit .env**: Environment files are gitignored
3. **Use Volume Mounts**: Source code is mounted for hot reload
4. **Check Logs**: Use `docker-compose logs` to debug issues
5. **Clean Restart**: Use `docker-compose down -v` to reset everything
6. **Production Build**: Use `--profile prod` for production testing

## Production Deployment

For production deployment:

```powershell
# Build and run production containers
docker-compose --profile prod build
docker-compose --profile prod up -d

# Or build standalone image
docker build -t fred-next:latest .
docker run -p 3100:3100 --env-file .env.prod fred-next:latest
```

## Updates and Maintenance

### Update Dependencies
```powershell
# Stop containers
docker-compose --profile dev down

# Update package.json, then rebuild
docker-compose --profile dev build
docker-compose --profile dev up -d
```

### Prisma Schema Changes
```powershell
# Edit prisma/schema.prisma
# Create migration
docker-compose --profile dev exec app-dev npx prisma migrate dev --name your_migration_name

# Or let it auto-migrate on restart
docker-compose --profile dev restart app-dev
```

## Summary

✅ **DO**: Use `docker-compose --profile dev up -d` to run the application  
✅ **DO**: Use `postgres` as database hostname in .env files  
✅ **DO**: Check logs with `docker-compose logs` when troubleshooting  
✅ **DO**: Use Docker Desktop on Windows  

❌ **DON'T**: Run `npm run dev` locally (unless you know what you're doing)  
❌ **DON'T**: Use `localhost` as database hostname in .env  
❌ **DON'T**: Commit .env files to git  
❌ **DON'T**: Forget to start Docker Desktop first  
