# Quick Start Commands for FRED Application

## 🚀 Easy Start (Recommended)

### Using the startup script:
```powershell
cd c:\Users\SGARLA-C\FRED\fred-next
.\start.ps1
```

Then select:
- **Option 1**: Development mode (for coding)
- **Option 2**: Production mode (for testing final build)
- **Option 3**: Stop everything
- **Option 4**: Complete reset

---

## 📋 Manual Commands

### Development Mode (Hot Reload)
```powershell
cd c:\Users\SGARLA-C\FRED\fred-next
docker compose --profile dev up --build
```

### Production Mode (Optimized)
```powershell
cd c:\Users\SGARLA-C\FRED\fred-next
docker compose --profile prod up --build
```

### Stop Services
```powershell
docker compose down
```

### Complete Reset
```powershell
docker compose down -v
docker rmi fred-next-app-dev fred-next-app
```

---

## 🌐 Access Application

**URL**: http://localhost:3100

**Test Credentials**:
- Username: `testuser1`
- Password: `password123`

---

## 🔍 Troubleshooting

### View Logs
```powershell
# All services
docker compose logs -f

# Just the app
docker compose logs -f app-dev

# Just the database
docker compose logs -f postgres
```

### Check Running Containers
```powershell
docker ps
```

### Check Database
```powershell
docker exec -it fred-postgres psql -U fred_user -d fred_poc -c "\dt"
```

### Restart Just One Service
```powershell
# Restart app only
docker compose restart app-dev

# Restart database only
docker compose restart postgres
```

---

## 📦 What's Running

When you start the application:

1. **PostgreSQL Database** (fred-postgres)
   - Port: 5432
   - Database: fred_poc
   - User: fred_user

2. **Next.js Application** (fred-next-app-dev or fred-next-app)
   - Port: 3100
   - Frontend + Backend in one container
   - Connected to PostgreSQL automatically

---

## 🎯 First Time Setup

Only needed once:

```powershell
# 1. Navigate to project
cd c:\Users\SGARLA-C\FRED\fred-next

# 2. Copy environment example (if .env doesn't exist)
Copy-Item .env.example .env

# 3. Start everything
.\start.ps1
```

That's it! The Docker setup handles:
- ✅ Installing dependencies
- ✅ Database migrations
- ✅ Seeding test data
- ✅ Starting the application

---

## 💡 Development Tips

### Code Changes (Dev Mode)
1. Start in dev mode: `docker compose --profile dev up`
2. Edit files in VS Code
3. Changes auto-reload in browser
4. No restart needed!

### Database Changes
```powershell
# Create migration
docker compose exec app-dev npx prisma migrate dev --name your_migration_name

# Apply migrations
docker compose exec app-dev npx prisma migrate deploy

# View database
docker compose exec app-dev npx prisma studio
```

### Update Dependencies
```powershell
# Stop containers
docker compose down

# Rebuild with new dependencies
docker compose --profile dev up --build
```

---

## 🆘 Common Issues

### "Port 3100 already in use"
```powershell
# Find what's using port 3100
netstat -ano | findstr :3100

# Kill the process (replace <PID> with actual process ID)
taskkill /PID <PID> /F
```

### "Port 5432 already in use"
Stop your local PostgreSQL service:
```powershell
Stop-Service postgresql*
```

### "Database connection failed"
```powershell
# Check if postgres is running
docker ps | Select-String postgres

# Check postgres logs
docker logs fred-postgres

# Restart postgres
docker compose restart postgres
```

### "Out of memory"
Increase Docker Desktop memory:
1. Open Docker Desktop
2. Settings → Resources
3. Set Memory to 4GB+
4. Apply & Restart

---

## 📖 More Documentation

- [DOCKER_GUIDE.md](./DOCKER_GUIDE.md) - Complete Docker explanation
- [SETUP.md](./SETUP.md) - Detailed setup guide
- [README.md](./README.md) - Project overview

---

## ✅ Verification Checklist

After starting, verify:

- [ ] Containers running: `docker ps` shows postgres + app
- [ ] App accessible: http://localhost:3100 loads
- [ ] Login works: testuser1/password123
- [ ] Database populated: Can see districts in UI
- [ ] No errors in logs: `docker compose logs`

---

**Need help?** Check logs first:
```powershell
docker compose logs -f
```
