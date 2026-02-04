# FRED-Next POC Setup Guide

## ✅ Implementation Progress

### Completed Tasks:
1. ✅ **Next.js 15 Project** - TypeScript, App Router, Tailwind CSS (Port 3100)
2. ✅ **Shadcn/UI** - Button, Dialog, Form, Input, Label, Select, Table, Sonner
3. ✅ **Docker Environment** - Dockerfile + docker-compose.yml (app + PostgreSQL)
4. ✅ **Prisma Schema** - 5 core tables: District, Section, Nigp, User, Rental
5. ✅ **Seed Data** - Test users, districts, sections, equipment codes

### Next Tasks:
- 🚧 NextAuth.js authentication
- ⏳ Rental submission form with Server Actions
- ⏳ Docker deployment testing

## 🗄️ Database Schema

### Tables:
- **DIST** (District) - 5 TxDOT districts
- **SECTION** - 3 sections linked to districts
- **NIGP** - 10 equipment codes with descriptions
- **USERS** - 3 test users (ES and RC roles)
- **RENTAL** - Main table (52 columns, 10 chartfields)

### Test Credentials:
| Username | Password | Role | Description |
|----------|----------|------|-------------|
| testuser1 | password123 | ES | Equipment Section user |
| testuser2 | password123 | ES | Equipment Section user |
| rcuser1 | password123 | RC | Rental Coordinator |

## 🚀 Local Development Setup

### 1. Install Dependencies
```powershell
cd c:\Users\SGARLA-C\FRED\fred-next
npm install
```

### 2. Generate Prisma Client
```powershell
npm run prisma:generate
```

### 3. Environment Variables
File `.env.local` is already created with:
```env
DATABASE_URL="postgresql://fred_user:fred_password_dev@localhost:5432/fred_poc"
NEXTAUTH_URL="http://localhost:3100"
NEXTAUTH_SECRET="dev-secret-key"
```

### 4. Start PostgreSQL (Docker)
```powershell
docker compose up postgres -d
```

### 5. Run Database Migration
```powershell
npm run prisma:migrate
```
When prompted for migration name, enter: `init`

### 6. Seed Database
```powershell
npm run prisma:seed
```

### 7. Start Next.js Dev Server
```powershell
npm run dev
```

### 8. Access Application
Open browser: **http://localhost:3100**

## 🐳 Full Docker Setup

```powershell
# Build and start all services
cd c:\Users\SGARLA-C\FRED\fred-next
docker compose up --build

# App: http://localhost:3100
# PostgreSQL: localhost:5432
```

## 🛠️ Useful Commands

### Prisma:
```powershell
npx prisma studio          # Visual database editor
npx prisma migrate dev     # Create new migration
npx prisma db push         # Push schema without migration
npx prisma generate        # Regenerate Prisma Client
```

### Docker:
```powershell
docker compose up -d               # Start detached
docker compose down                # Stop all services
docker compose logs -f app         # View app logs
docker compose exec postgres psql -U fred_user -d fred_poc  # Access DB
```

### Development:
```powershell
npm run dev        # Start on port 3100
npm run build      # Production build
npm run lint       # Run linter
```

## 📁 Key Files Created

```
fred-next/
├── prisma/
│   ├── schema.prisma              # 5 models (District, Section, Nigp, User, Rental)
│   └── seed.ts                    # Test data seeder
├── lib/
│   └── prisma.ts                  # Prisma client singleton
├── components/ui/                 # 8 Shadcn components
├── Dockerfile                     # Multi-stage production build
├── docker-compose.yml             # Dev environment (app + postgres)
├── .env.local                     # Environment variables
└── package.json                   # Scripts and dependencies
```

## 📊 Database Schema Details

### Rental Table (52 Columns):
- **IDs**: rentalId (PK), sectId (FK), distNbr (FK), nigpCd (FK)
- **Dates**: submitDt, dlvryRqstDt, dlvryDt, callOffDt, rentalDueDt
- **Equipment**: eqpmtModel, eqpmtMake, eqpmtCmnt, eqpmtQty
- **Location**: dlvryLocn (delivery location)
- **Contacts**: pocNm, pocPhnNbr (point of contact)
- **10 Chartfields**: cfDeptNbr, cfAcctNbr, cfAppropYr, cfAppropClass, cfFund, cfBusUnit, cfProj, cfActv, cfSrcType, cfTask
- **Status**: rentStatus, troubleRentFlg, serviceCallFlg
- **Comments**: spclInst, rentCmnt, serviceCallCmnt

## 🎯 Next Steps Implementation Plan

### Step 5: NextAuth.js (Today)
1. Install: `npm install next-auth@beta`
2. Create `/app/api/auth/[...nextauth]/route.ts`
3. Configure Credentials provider with Prisma
4. Create `middleware.ts` for route protection
5. Build `/app/login/page.tsx`

### Step 6: Rental Form (Tomorrow)
1. Create `/app/rental/new/page.tsx` (Server Component)
2. Build `RentalForm.tsx` (Client Component)
3. Implement Server Actions in `/app/actions/rental.ts`
4. Add Zod validation schema
5. Cascading dropdowns: District → Section → NIGP
6. Auto-populate chartfields from section

### Step 7: Testing (End of Week)
1. Test full Docker deployment
2. Manual testing of rental submission
3. Verify database inserts
4. Document findings
5. Create demo video

## 🔍 Verification Checklist

- [x] Next.js runs on port 3100
- [x] Shadcn/UI components installed
- [x] Prisma schema created
- [x] Docker compose configured
- [x] Seed data prepared
- [ ] Can start PostgreSQL in Docker
- [ ] Can run migrations
- [ ] Can seed database
- [ ] Can access app at localhost:3100
- [ ] Authentication works
- [ ] Rental form submits successfully

## 💡 Quick Tips

**View Database:**
```powershell
npx prisma studio
```
Opens visual editor at http://localhost:5555

**Reset Database:**
```powershell
npx prisma migrate reset
npm run prisma:seed
```

**Check Docker Status:**
```powershell
docker compose ps
```

**Stop Everything:**
```powershell
docker compose down
```

## ⚠️ Troubleshooting

**Port 3100 in use:**
```powershell
# Check what's using the port
netstat -ano | findstr :3100

# Kill the process (replace PID)
taskkill /PID <PID> /F
```

**PostgreSQL connection error:**
- Ensure Docker is running: `docker compose up postgres -d`
- Check connection: `docker compose exec postgres pg_isready`

**Prisma Client not found:**
```powershell
npm run prisma:generate
```

## 📝 Project Status

**Overall Progress:** ~30% Complete
- ✅ Infrastructure (Done)
- ✅ Database Schema (Done)
- ✅ Docker Config (Done)
- 🚧 Authentication (Next)
- ⏳ Rental Form (Pending)
- ⏳ Testing (Pending)

**Estimated Completion:** 1-1.5 weeks for full POC

---

**Created:** February 3, 2026  
**Last Updated:** February 3, 2026  
**Project:** FRED Modernization POC
