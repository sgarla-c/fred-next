# FRED Application - Docker Setup Complete

## Overview
The FRED Next.js application is now fully configured to run in Docker containers. This provides a consistent development environment and eliminates "works on my machine" issues.

## What's Included

### Docker Compose Services
1. **PostgreSQL Database** (`postgres`)
   - PostgreSQL 16 Alpine
   - Port: 5432 (exposed to host)
   - Persistent data storage
   - Healthcheck enabled
   - Pre-configured with FRED database

2. **Next.js Application** (`app-dev`)
   - Development mode with hot reload
   - Port: 3100 (exposed to host)
   - Automatic Prisma migrations
   - Database seeding on startup
   - Source code mounted for live updates

### Helper Scripts

1. **start-docker.ps1** - One-command startup
   - Checks Docker status
   - Stops any existing containers
   - Builds and starts all services
   - Shows container status
   - Opens browser automatically

2. **stop-docker.ps1** - Clean shutdown
   - Stops all containers
   - Preserves database data

## How to Use

### First Time Setup

1. **Install Docker Desktop**
   - Download from: https://www.docker.com/products/docker-desktop/
   - Install and restart your computer if prompted
   - Launch Docker Desktop
   - Wait for it to show "Docker Desktop is running" (green icon)

2. **Start the Application**
   ```powershell
   cd c:\Users\SGARLA-C\FRED\fred-next
   .\start-docker.ps1
   ```

   The script will:
   - ✓ Verify Docker is running
   - ✓ Build container images
   - ✓ Start PostgreSQL database
   - ✓ Run database migrations
   - ✓ Seed test data
   - ✓ Start Next.js application
   - ✓ Open http://localhost:3100 in browser

3. **Login with Test Account**
   - Username: `SGARLA-C`
   - Password: `password123`

### Daily Usage

**Start Application:**
```powershell
.\start-docker.ps1
```

**Stop Application:**
```powershell
.\stop-docker.ps1
```

**View Logs:**
```powershell
docker-compose --profile dev logs -f
```

**Restart After Code Changes:**
Changes to `.tsx`, `.ts`, `.css` files are hot-reloaded automatically.
For schema changes or new dependencies:
```powershell
docker-compose --profile dev restart app-dev
```

## Architecture

```
┌─────────────────────────────────────────┐
│         Host Machine (Windows)          │
│                                         │
│  ┌───────────────────────────────────┐ │
│  │   Docker Desktop                  │ │
│  │                                   │ │
│  │  ┌─────────────────────────────┐ │ │
│  │  │  fred-postgres              │ │ │
│  │  │  PostgreSQL 16              │ │ │
│  │  │  Port: 5432                 │ │ │
│  │  └─────────────────────────────┘ │ │
│  │              ▲                    │ │
│  │              │ TCP                │ │
│  │              ▼                    │ │
│  │  ┌─────────────────────────────┐ │ │
│  │  │  fred-next-app-dev          │ │ │
│  │  │  Next.js + Prisma           │ │ │
│  │  │  Port: 3100                 │ │ │
│  │  │  Hot Reload: ✓              │ │ │
│  │  └─────────────────────────────┘ │ │
│  │                                   │ │
│  └───────────────────────────────────┘ │
│                                         │
│  Browser: http://localhost:3100        │
└─────────────────────────────────────────┘
```

## Features Now Available

✅ **File Attachments** - Upload/download files for rental requests
✅ **Database Persistence** - Data survives container restarts
✅ **Hot Reload** - Code changes apply instantly
✅ **Isolated Environment** - No conflicts with other projects
✅ **Easy Sharing** - Other developers can use same setup
✅ **Consistent Behavior** - Same environment on all machines

## Troubleshooting

### "Docker is not running"
- Open Docker Desktop from Start menu
- Wait for green icon in system tray
- Try starting again

### "Port 3100 already in use"
```powershell
# Stop any local dev servers
Get-Process -Name node | Stop-Process -Force

# Or check what's using the port
Get-NetTCPConnection -LocalPort 3100
```

### "Can't reach database"
```powershell
# Check if postgres container is healthy
docker ps

# View database logs
docker logs fred-postgres

# Restart database
docker-compose --profile dev restart postgres
```

### Rebuild Everything
```powershell
# Clean rebuild (removes volumes - deletes data!)
docker-compose --profile dev down -v
docker-compose --profile dev up -d --build
```

### View Application Logs
```powershell
# All logs
docker-compose --profile dev logs -f

# Just app logs
docker logs -f fred-next-app-dev

# Just database logs
docker logs -f fred-postgres
```

## File Structure

```
fred-next/
├── docker-compose.yml       # Container orchestration
├── Dockerfile              # Production container
├── Dockerfile.dev          # Development container
├── start-docker.ps1        # Startup script
├── stop-docker.ps1         # Shutdown script
├── .env.local              # Environment variables (local)
└── README.md               # Updated with Docker instructions
```

## Next Steps

1. **Start Docker Desktop** (if not already running)
2. **Run `.\start-docker.ps1`** to start the application
3. **Navigate to http://localhost:3100**
4. **Login and test attachment feature** at `/es/rentals/new`

## Benefits of Docker Setup

| Aspect | Before | After |
|--------|--------|-------|
| Database Setup | Manual PostgreSQL install | Automatic via Docker |
| Dependencies | Node.js, npm, PostgreSQL | Only Docker Desktop |
| Consistency | Different on each machine | Identical everywhere |
| Startup Time | Multiple commands | Single script |
| Cleanup | Manual uninstall | `docker-compose down` |
| Port Conflicts | Hard to resolve | Configured in one place |
| Team Onboarding | Hours of setup | Minutes |

---

**Ready to start?** Open Docker Desktop, then run `.\start-docker.ps1`! 🚀
