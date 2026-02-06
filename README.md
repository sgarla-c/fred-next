# FRED Next.js Application

Modern Next.js rewrite of the FRED (Fleet Rental Equipment Database) application for TxDOT.

## ⚠️ IMPORTANT: Docker-Only Execution

**This application MUST run from Docker containers.** Local execution is blocked by design.

See [README_DOCKER.md](README_DOCKER.md) for quick reference or [DOCKER_ONLY_EXECUTION.md](DOCKER_ONLY_EXECUTION.md) for full details.

## Quick Start

### Prerequisites
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running

### Start Application

```powershell
# Option 1: Using npm script (recommended)
npm run docker:start

# Option 2: Using PowerShell script
.\start-docker.ps1

# Option 3: Using Docker Compose directly
docker-compose --profile dev up -d
```

The application will be available at: **http://localhost:3100**

### Other Commands

```powershell
# Stop application
npm run docker:stop

# View logs
npm run docker:logs

# Rebuild containers
npm run docker:rebuild

# Check Docker status
npm run docker:check
```

### Stop Application
```powershell
# Using npm script
npm run docker:stop

# Or using PowerShell script
.\stop-docker.ps1

# Or using Docker Compose
docker-compose --profile dev down
```

## ❌ Blocked Commands

The following commands are **intentionally blocked** to prevent local execution issues:

```powershell
npm run dev    # ❌ BLOCKED - Use npm run docker:start instead
npm run build  # ❌ BLOCKED - Build happens in Docker
npm run start  # ❌ BLOCKED - Use Docker commands
```

**Why?** The database is configured to connect to `postgres` (Docker service name), not `localhost`. Running locally will fail.

## 🚨 If Docker Goes Down

If Docker Desktop crashes or stops:

1. **Start Docker Desktop** and wait 30 seconds
2. **Verify Docker is running**: `docker ps`
3. **Restart the application**: `npm run docker:start`

**Do NOT attempt to modify configuration files or run locally.** The application is designed to fail fast and clearly when Docker is unavailable.

## 📚 Documentation

- [README_DOCKER.md](README_DOCKER.md) - Quick Docker reference
- [DOCKER_ONLY_EXECUTION.md](DOCKER_ONLY_EXECUTION.md) - Complete guide to Docker-only execution
- [DOCKER_CONFIGURATION.md](DOCKER_CONFIGURATION.md) - Detailed Docker configuration
- [DOCKER_GUIDE.md](DOCKER_GUIDE.md) - Docker usage guide
- [QUICK_START.md](QUICK_START.md) - Quick start guide

## Architecture
# Install dependencies
npm install

# Set up environment variables
cp .env.local.example .env.local
# Edit .env.local with your database credentials

# Run database migrations
npx prisma migrate dev

# Seed the database
npx prisma db seed

# Start development server
npm run dev
```

Open [http://localhost:3100](http://localhost:3100) with your browser.

## Features

- ✅ Rental Request Management (Submit, View, Edit, Approve/Deny)
- ✅ Purchase Order Management (Create, Link to Rentals)
- ✅ File Attachments (Upload/Download for rentals)
- ✅ Role-based Access (ES, RC, FIN, Manager)
- ✅ Status History Tracking
- ✅ Dashboard with Statistics

## Project Structure

```
fred-next/
├── app/                 # Next.js App Router pages
│   ├── es/             # Equipment Section module
│   ├── rc/             # Rental Coordinator module
│   ├── fin/            # Finance module
│   ├── manager/        # Manager module
│   └── api/            # API routes
├── components/          # React components
├── lib/                # Utilities and database
├── prisma/             # Database schema and migrations
├── public/             # Static files
│   └── uploads/        # File attachments
└── docker-compose.yml  # Docker configuration
```

## Database

PostgreSQL database with Prisma ORM. Key tables:
- `RENTAL` - Rental requests
- `RENTAL_ATTACHMENT` - File attachments
- `RENTAL_STATUS_HISTORY` - Status change tracking
- `PO` - Purchase orders
- `USERS` - User accounts
- `DIST`, `SECTION`, `NIGP` - Reference data

## Environment Variables

Required environment variables (in `.env.local`):
- `DATABASE_URL` - PostgreSQL connection string
- `NEXTAUTH_URL` - Application URL
- `NEXTAUTH_SECRET` - JWT secret for authentication

## Default Test Accounts

- ES User: `SGARLA-C` / `password123`
- RC User: `rc-user` / `password123`
- Manager: `manager-user` / `password123`

## Documentation

- [Quick Start Guide](QUICK_START.md)
- [Setup Guide](SETUP.md)
- [Feature Comparison](FEATURE_COMPARISON.md)
- [Rental Attachments](RENTAL_ATTACHMENTS.md)
- [Docker Guide](DOCKER_GUIDE.md)

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Database**: PostgreSQL 16
- **ORM**: Prisma
- **Authentication**: NextAuth.js
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **Containerization**: Docker & Docker Compose
