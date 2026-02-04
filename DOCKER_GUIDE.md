# 🐳 FRED Docker Configuration Explained

## 📋 Table of Contents
1. [Why Your App Keeps Going Down](#why-app-goes-down)
2. [Current Configuration Explained](#configuration-explained)
3. [How to Run Completely Dockerized](#fully-dockerized-setup)
4. [Frontend Architecture](#frontend-architecture)
5. [Troubleshooting](#troubleshooting)

---

## 🚨 Why Your App Keeps Going Down

### Common Issues:

1. **Database Connection Failure**
   - Your app needs PostgreSQL running at all times
   - If using your local PostgreSQL, the connection string must match exactly
   - Container restarts lose in-memory data

2. **Environment Variables Missing**
   - `DATABASE_URL` must point to your PostgreSQL server
   - `NEXTAUTH_SECRET` required for authentication
   - Missing `.env` file causes startup failures

3. **Port Conflicts**
   - Port 3100 (app) or 5432 (PostgreSQL) already in use
   - Windows Defender or antivirus blocking ports

4. **Prisma Migration Issues**
   - Database schema not initialized
   - Migrations not run after database restart

5. **Memory/Resource Issues**
   - Docker Desktop not allocated enough memory
   - Too many containers running

---

## 🔍 Configuration Explained

### Your Current Setup:

```
┌─────────────────────────────────────────────┐
│          Your Machine (Windows)              │
│                                              │
│  ┌────────────────┐    ┌─────────────────┐ │
│  │   Next.js App  │───▶│   PostgreSQL    │ │
│  │  (Port 3100)   │    │   (Port 5432)   │ │
│  │                │    │                 │ │
│  │ - Frontend     │    │ - fred_poc DB   │ │
│  │ - Backend API  │    │ - Tables/Data   │ │
│  │ - Auth         │    │                 │ │
│  └────────────────┘    └─────────────────┘ │
│         │                       │           │
│         └───── DATABASE_URL ────┘           │
└─────────────────────────────────────────────┘
```

### Docker Compose Services:

#### 1. **postgres** Service
```yaml
postgres:
  image: postgres:16-alpine        # Lightweight PostgreSQL 16
  container_name: fred-postgres
  restart: unless-stopped          # Auto-restart on failure
  ports:
    - "5432:5432"                  # Expose to host machine
  volumes:
    - postgres_data:/var/lib/postgresql/data  # Persist data
```

**Purpose**: Database server that stores all rental data, users, districts, etc.

#### 2. **app-dev** Service (Development)
```yaml
app-dev:
  build: Dockerfile.dev
  ports:
    - "3100:3100"
  environment:
    - DATABASE_URL=postgresql://fred_user:fred_password_dev@postgres:5432/fred_poc
  volumes:
    - .:/app                       # Hot reload: sync code changes
  command: npm run dev
```

**Purpose**: Development server with hot reload (changes reflect immediately).

#### 3. **app** Service (Production)
```yaml
app:
  build: Dockerfile
  environment:
    - NODE_ENV=production
  profiles:
    - prod                         # Only runs with --profile prod
```

**Purpose**: Optimized production build (faster, smaller).

---

## 🎯 How the Frontend Works

### Next.js Architecture:

```
┌───────────────────────────────────────────────┐
│              Next.js 16 (App Router)          │
│                                               │
│  ┌─────────────────────────────────────────┐ │
│  │  Frontend (React Components)            │ │
│  │  - Pages: /login, /rental/new           │ │
│  │  - UI: Shadcn components                │ │
│  │  - State: React hooks                   │ │
│  └──────────────┬──────────────────────────┘ │
│                 │                             │
│                 ▼                             │
│  ┌─────────────────────────────────────────┐ │
│  │  Backend (Server Actions/API Routes)    │ │
│  │  - Auth: NextAuth.js                    │ │
│  │  - Database: Prisma ORM                 │ │
│  │  - Business Logic                       │ │
│  └──────────────┬──────────────────────────┘ │
│                 │                             │
│                 ▼                             │
│         PostgreSQL Database                   │
└───────────────────────────────────────────────┘
```

### How Requests Flow:

1. **User visits** `http://localhost:3100/rental/new`
2. **Next.js Server** renders the page (Server-Side Rendering)
3. **React hydrates** the page in browser (makes it interactive)
4. **User submits form** → calls Server Action
5. **Server Action** validates data using Prisma
6. **Prisma** queries PostgreSQL database
7. **Response** sent back to user

**Key Point**: It's a **full-stack** application:
- Frontend AND backend run on port 3100
- NOT separate servers
- One Next.js process handles everything

---

## 🚀 Fully Dockerized Setup (Independent of Your Machine)

### Quick Start Commands:

#### Option 1: Development Mode (with hot reload)
```powershell
# Start everything in development mode
docker compose --profile dev up --build

# Access at: http://localhost:3100
```

#### Option 2: Production Mode (optimized)
```powershell
# Start everything in production mode
docker compose --profile prod up --build

# Access at: http://localhost:3100
```

#### Stop Everything:
```powershell
docker compose down
```

#### Complete Cleanup (reset everything):
```powershell
# Stop and remove all containers and volumes
docker compose down -v

# Remove images
docker rmi fred-next-app-dev fred-next-app fred-postgres
```

---

## 🔧 What Changed to Make It Independent

### 1. **Automatic Database Initialization**
The app now automatically:
- Runs Prisma migrations on startup
- Seeds the database with test data
- Handles database connection retries

### 2. **Self-Contained Networking**
```yaml
networks:
  fred-network:
    driver: bridge
```
All containers communicate via Docker's internal network (no external dependencies).

### 3. **Persistent Data Storage**
```yaml
volumes:
  postgres_data:
    driver: local
```
Database data survives container restarts.

### 4. **Health Checks**
```yaml
healthcheck:
  test: ["CMD-SHELL", "pg_isready -U fred_user"]
  interval: 10s
```
App waits for database to be ready before starting.

---

## 📦 File Structure After Dockerization

```
fred-next/
├── Dockerfile              # Production build (optimized, 3-stage)
├── Dockerfile.dev          # Development build (hot reload)
├── docker-compose.yml      # Orchestrates all services
├── .env                    # Environment variables (auto-generated)
├── prisma/
│   ├── schema.prisma       # Database schema
│   ├── migrations/         # Version-controlled DB changes
│   └── seed.ts             # Test data generator
└── app/                    # Next.js application code
```

---

## 🩺 Troubleshooting

### Problem: "Port 5432 already in use"
**Solution**: Stop your local PostgreSQL server
```powershell
# Stop PostgreSQL Windows service
Stop-Service postgresql*

# OR change the port in docker-compose.yml
ports:
  - "5433:5432"  # Use 5433 on host instead
```

### Problem: "Database connection failed"
**Check:**
1. Is PostgreSQL container running?
   ```powershell
   docker ps | Select-String postgres
   ```

2. Check container logs:
   ```powershell
   docker logs fred-postgres
   ```

3. Verify connection:
   ```powershell
   docker exec -it fred-postgres psql -U fred_user -d fred_poc
   ```

### Problem: "App keeps restarting"
**Debug:**
```powershell
# Watch app logs in real-time
docker logs -f fred-next-app-dev

# Check container status
docker ps -a
```

### Problem: "Changes not reflecting"
**For Development Mode**:
- Make sure you're using `--profile dev`
- Volumes should be mounted (check docker-compose.yml)
- Try rebuilding: `docker compose --profile dev up --build`

### Problem: "Out of memory"
**Solution**: Increase Docker Desktop memory
1. Open Docker Desktop → Settings
2. Resources → Advanced
3. Set Memory to at least 4GB
4. Apply & Restart

---

## 🎓 Understanding the Architecture

### What Runs Where:

| Component | Running In | Purpose |
|-----------|------------|---------|
| PostgreSQL | Docker Container | Database server |
| Next.js Frontend | Docker Container | React UI (runs on port 3100) |
| Next.js Backend | Same Container | API routes + Server Actions |
| Prisma Client | Same Container | Database ORM |
| NextAuth | Same Container | Authentication |

### Database Connection Flow:

```
Your Machine (Windows)
    │
    ├─ Docker Network (fred-network)
    │   │
    │   ├─ postgres:5432 (internal hostname)
    │   │   └─ PostgreSQL database
    │   │
    │   └─ app:3100 (internal hostname)
    │       └─ Next.js app
    │           ├─ Connects to postgres:5432
    │           └─ Exposes port 3100 to host
    │
    └─ Browser → localhost:3100 → Docker port mapping → app:3100
```

**Key Points**:
- Inside Docker: use `postgres:5432` (container name as hostname)
- Outside Docker: use `localhost:5432` (mapped to host)
- The app uses internal networking (faster, more secure)

---

## ✅ Verification Steps

After running `docker compose --profile dev up --build`:

1. **Check containers are running**:
   ```powershell
   docker ps
   ```
   Should see: `fred-postgres` and `fred-next-app-dev`

2. **Check database**:
   ```powershell
   docker exec -it fred-postgres psql -U fred_user -d fred_poc -c "\dt"
   ```
   Should show tables: DIST, SECTION, NIGP, USERS, RENTAL

3. **Check app logs**:
   ```powershell
   docker logs fred-next-app-dev
   ```
   Should see: `✓ Ready on http://0.0.0.0:3100`

4. **Access app**:
   Open browser: `http://localhost:3100`

5. **Test login**:
   - Username: `testuser1`
   - Password: `password123`

---

## 🎯 Recommended Workflow

### Daily Development:
```powershell
# Start (first time or after changes)
docker compose --profile dev up --build

# Just start (no rebuild needed)
docker compose --profile dev up

# Stop (keeps data)
docker compose down

# View logs
docker compose logs -f app-dev
```

### Deploy to Another Machine:
1. Copy entire `fred-next/` folder
2. Install Docker Desktop
3. Run: `docker compose --profile prod up -d`
4. Done! App is running at `http://localhost:3100`

### Production Deployment:
```powershell
# Build production image
docker compose --profile prod build

# Start in detached mode
docker compose --profile prod up -d

# Check status
docker compose ps

# View logs
docker compose logs -f app
```

---

## 🔐 Security Notes

### Change These Before Production:

1. **Database Password**:
   ```yaml
   POSTGRES_PASSWORD: fred_password_dev  # ← CHANGE THIS
   ```

2. **NextAuth Secret**:
   ```yaml
   NEXTAUTH_SECRET: your-secret-key-change-in-production  # ← GENERATE NEW
   ```

   Generate secure secret:
   ```powershell
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

3. **Database URL**:
   Update both in docker-compose.yml and .env files

---

## 📞 Quick Reference

### Start Fresh:
```powershell
docker compose down -v
docker compose --profile dev up --build
```

### Reset Database Only:
```powershell
docker compose down postgres
docker volume rm fred-next_postgres_data
docker compose up postgres -d
docker compose exec app-dev npx prisma migrate deploy
docker compose exec app-dev npx prisma db seed
```

### Check Everything:
```powershell
docker ps                          # Running containers
docker compose ps                  # Service status
docker logs fred-postgres          # DB logs
docker logs fred-next-app-dev      # App logs
```

---

## 🎉 Benefits of This Setup

✅ **Portable**: Copy folder → run on any machine with Docker  
✅ **Isolated**: Won't interfere with other PostgreSQL installations  
✅ **Reproducible**: Same environment for all developers  
✅ **Easy Reset**: `docker compose down -v` clears everything  
✅ **Version Controlled**: All config in git  
✅ **Production Ready**: Same setup works for deployment  

---

**Need Help?** Check the logs first:
```powershell
docker compose logs -f
```
