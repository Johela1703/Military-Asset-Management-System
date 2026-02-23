# Military Asset Management System (MAMS)

A secure, role-based web application for tracking military assets across multiple bases.

## Tech Stack Justification

### Backend: Node.js + Express + TypeScript
- **Node.js/Express**: Lightweight, high-performance, ideal for RESTful API development. Large ecosystem, fast development cycle.
- **TypeScript**: Compile-time type safety reduces runtime errors — critical for a security-sensitive system.
- **Prisma ORM**: Type-safe database queries, automatic migrations, intuitive schema design.
- **JWT + bcrypt**: Industry-standard token-based authentication with hashed passwords.

### Database: SQLite (dev) / PostgreSQL (production)
**Why relational (SQL)?**
- **Referential integrity**: Foreign keys enforce consistent relationships between bases, users, equipment, and transactions.
- **ACID compliance**: Ensures purchases, transfers, and assignments are never partially recorded — critical for audit accuracy.
- **Complex reporting**: SQL JOINs enable efficient aggregate queries for dashboards (opening/closing balances, net movements).
- **Audit trail**: Relational structure allows linking every action to a user, base, and equipment type with full traceability.

### Frontend: React + TypeScript + Vite
- **React**: Component-based UI with efficient state management via TanStack Query.
- **Vite**: Ultra-fast builds and HMR for development productivity.
- **Tailwind CSS**: Utility-first styling for a consistent, responsive military-themed UI.
- **Recharts**: Lightweight charting for asset flow visualization on the dashboard.
- **TanStack Query**: Caching, background refetching, and loading states for all API calls.

## Features

### Dashboard
- Opening Balance, Closing Balance, Net Movement metrics
- Purchases, Transfers In/Out, Assigned, Expended counters
- Bar chart showing asset flow summary
- **Bonus**: Clicking "Net Movement" opens a detailed pop-up with breakdown by purchases, transfers in, and transfers out
- Filter by Date Range, Base, and Equipment Type

### Purchases Page
- Record new asset purchases with supplier, cost, and date
- Paginated historical view with all filters

### Transfers Page
- Create asset transfers between bases
- Full transfer history with source → destination routing
- Status indicators (Completed / Pending / Cancelled)

### Assignments & Expenditures Page
- Assign assets to named personnel with status tracking
- Mark assignments as returned
- Record asset expenditures with reason and date

### Administration (Admin only)
- Manage military bases
- Manage equipment types and categories
- Manage user accounts with role assignment

### Audit Logs (Admin only)
- Complete timestamped transaction history
- Filter by entity type
- Linked to user who performed each action

## Role-Based Access Control (RBAC)

| Feature | Admin | Base Commander | Logistics Officer |
|---------|-------|----------------|-------------------|
| Dashboard (all bases) | ✅ | ❌ (own base only) | ✅ |
| View Purchases | ✅ | ✅ (own base) | ✅ |
| Create Purchase | ✅ | ✅ (own base) | ✅ |
| View Transfers | ✅ | ✅ (own base) | ✅ |
| Create Transfer | ✅ | ✅ (from own base) | ✅ |
| View Assignments | ✅ | ✅ (own base) | ❌ |
| Create Assignment | ✅ | ✅ (own base) | ❌ |
| Record Expenditure | ✅ | ✅ (own base) | ❌ |
| Audit Logs | ✅ | ❌ | ❌ |
| Administration | ✅ | ❌ | ❌ |

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn

### Backend Setup

```bash
cd backend
npm install
npm run db:migrate        # Run Prisma migrations
npm run db:seed           # Seed initial data
npm run dev               # Start dev server (port 5000)
```

### Frontend Setup

```bash
cd frontend
npm install
npm run dev               # Start Vite dev server (port 5173)
```

### Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@military.gov | admin123 |
| Base Commander (Alpha) | commander.alpha@military.gov | commander123 |
| Base Commander (Bravo) | commander.bravo@military.gov | commander123 |
| Logistics Officer | logistics1@military.gov | officer123 |

## API Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | /api/auth/login | Authenticate user | Public |
| GET | /api/auth/me | Get current user | All |
| GET | /api/dashboard/metrics | Dashboard KPIs | All |
| GET | /api/dashboard/net-movement-details | Net movement breakdown | All |
| GET | /api/purchases | List purchases | All |
| POST | /api/purchases | Record purchase | All |
| GET | /api/transfers | List transfers | All |
| POST | /api/transfers | Create transfer | All |
| GET | /api/assignments | List assignments | Admin, Commander |
| POST | /api/assignments | Create assignment | Admin, Commander |
| PATCH | /api/assignments/:id/return | Return assignment | Admin, Commander |
| GET | /api/expenditures | List expenditures | Admin, Commander |
| POST | /api/expenditures | Record expenditure | Admin, Commander |
| GET | /api/bases | List bases | All |
| POST | /api/bases | Create base | Admin |
| GET | /api/equipment-types | List equipment types | All |
| POST | /api/equipment-types | Create type | Admin |
| GET | /api/users | List users | Admin |
| POST | /api/users | Create user | Admin |
| GET | /api/audit-logs | View audit log | Admin |

## Database Schema Design

```
User ──────── Base (many-to-one, commanders belong to a base)
Purchase ──── Base, EquipmentType (what was bought, where)
Transfer ──── SourceBase, DestBase, EquipmentType (movement between bases)
Assignment ── Base, EquipmentType, User (assigned to personnel)
Expenditure ─ Base, EquipmentType (consumed/used assets)
AuditLog ──── User, linked to any transaction entity
```

**Balance Calculation:**
```
Opening Balance = All stock acquired before start date − expenditures before start date
Net Movement    = Purchases + Transfers In − Transfers Out (within period)
Closing Balance = Opening Balance + Net Movement − Expenditures (within period)
```

## Security Features
- JWT authentication with configurable expiry
- bcrypt password hashing (10 rounds)
- Helmet.js for HTTP security headers
- CORS restricted to known origins
- Rate limiting (500 req / 15 min)
- Role-based middleware on every protected route
- All transactions logged with user identity for audit
