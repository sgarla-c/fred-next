# FRED-Next Application - Docker-Only Execution

## ⚠️ CRITICAL: This Application MUST Run from Docker

This application is **strictly configured** to run only from Docker containers. Local execution is **blocked** by design.

## Why Docker-Only?

1. **Database Configuration**: The application is configured to connect to `postgres` hostname (Docker service name), not `localhost`
2. **Environment Consistency**: Ensures everyone runs the exact same environment
3. **Prevents Configuration Drift**: Eliminates issues from switching between local and Docker execution
4. **Safety**: Prevents accidental configuration changes when Docker is down

## ❌ Blocked Commands

The following commands are **blocked** and will show an error:

```powershell
npm run dev      # ❌ BLOCKED
npm run build    # ❌ BLOCKED
npm run start    # ❌ BLOCKED
npm start        # ❌ BLOCKED
```

## ✅ Correct Commands

Always use Docker commands:

### Start Application
```powershell
# Option 1: Use npm script (recommended)
npm run docker:start

# Option 2: Direct docker-compose
docker-compose --profile dev up -d

# Option 3: Use startup script
.\start-docker.ps1
```

### Stop Application
```powershell
# Option 1: Use npm script
npm run docker:stop

# Option 2: Direct docker-compose
docker-compose --profile dev down
```

### View Logs
```powershell
# Option 1: Use npm script
npm run docker:logs

# Option 2: Direct docker-compose
docker-compose --profile dev logs -f
```

### Rebuild Containers
```powershell
# Option 1: Use npm script
npm run docker:rebuild

# Option 2: Direct docker-compose
docker-compose --profile dev up -d --build
```

### Check Docker Status
```powershell
npm run docker:check
```

## 🚨 What Happens if Docker Goes Down?

If Docker Desktop stops or crashes:

1. **Scripts will fail immediately** with a clear error message
2. **No configuration changes will be made**
3. **You must restart Docker Desktop** before continuing
4. **The application will not attempt to run locally**

### Recovery Steps

If Docker goes down:

1. **Start Docker Desktop**
   ```powershell
   Start-Process "C:\Program Files\Docker\Docker\Docker Desktop.exe"
   ```

2. **Wait 15-30 seconds** for Docker to fully start

3. **Verify Docker is running**
   ```powershell
   docker ps
   # Should show running containers or empty list (not an error)
   ```

4. **Restart the application**
   ```powershell
   npm run docker:start
   ```

## 🔒 Protection Mechanisms

### 1. Script-Level Protection
- `prevent-local-run.ps1` blocks npm dev/build/start commands
- Shows helpful error message with correct Docker commands

### 2. Docker Check Script
- `check-docker.ps1` verifies Docker is running before any operations
- Checks Docker Desktop process
- Validates Docker daemon is responsive
- Confirms docker-compose is available

### 3. Configuration Lock
- `.env` and `.env.local` are set to use `postgres` hostname
- Will fail immediately if run locally (cannot connect to database)
- Configuration comments clearly indicate Docker vs local setup

### 4. Package.json Guards
```json
{
  "scripts": {
    "dev": "powershell -ExecutionPolicy Bypass -File ./prevent-local-run.ps1 dev",
    "build": "powershell -ExecutionPolicy Bypass -File ./prevent-local-run.ps1 build",
    "start": "powershell -ExecutionPolicy Bypass -File ./prevent-local-run.ps1 start"
  }
}
```

## 📋 Configuration Files

### Current Configuration (Docker-Only)

#### .env
```bash
DATABASE_URL="postgresql://fred_user:fred_password_dev@postgres:5432/fred_poc"
```

#### .env.local
```bash
DATABASE_URL="postgresql://fred_user:fred_password_dev@postgres:5432/fred_poc"
```

#### docker-compose.yml
```yaml
services:
  app-dev:
    environment:
      - DATABASE_URL=postgresql://fred_user:fred_password_dev@postgres:5432/fred_poc
```

### ⚠️ Never Change These

Do **NOT** change the database hostname from `postgres` to `localhost` unless you explicitly want to enable local development (not recommended).

## 🧪 Testing

All testing must be done inside Docker containers:

```powershell
# Start containers
npm run docker:start

# Run tests (they execute inside the container)
docker exec -it fred-next-app-dev npm run test:rental

# Or use docker-compose exec
docker-compose --profile dev exec app-dev npm run test:rental
```

## 🆘 Troubleshooting

### Error: "Docker is not running"
**Solution**: Start Docker Desktop and wait for it to be ready

### Error: "Cannot connect to Docker daemon"
**Solution**: Docker Desktop is still starting. Wait 15-30 seconds and try again

### Error: "docker-compose not found"
**Solution**: Ensure Docker Desktop is up to date

### Error: "no configuration file provided"
**Solution**: You're not in the correct directory
```powershell
cd c:\Users\SGARLA-C\FRED\fred-next
```

### Container starts but app doesn't work
**Solution**: Check logs for actual error
```powershell
npm run docker:logs
# or
docker-compose --profile dev logs app-dev
```

## 📖 Additional Resources

- [DOCKER_CONFIGURATION.md](DOCKER_CONFIGURATION.md) - Complete Docker setup guide
- [DOCKER_GUIDE.md](DOCKER_GUIDE.md) - Docker usage guide
- [QUICK_START.md](QUICK_START.md) - Quick start guide

## Summary

✅ **DO**: Always use Docker commands  
✅ **DO**: Check Docker is running first  
✅ **DO**: Use `npm run docker:start` to start the app  
✅ **DO**: View logs with `npm run docker:logs`  

❌ **DON'T**: Try to run `npm run dev` locally  
❌ **DON'T**: Change database hostname to localhost  
❌ **DON'T**: Modify .env files without understanding the impact  
❌ **DON'T**: Attempt to bypass the Docker checks  

**Remember**: If Docker is down, fix Docker first. Don't try to work around it.
