# 🏭 TechForge ERP + MES

**An AI-powered Manufacturing ERP + Manufacturing Execution System**
From customer inquiry to dispatch — sales, production, machines, quality, purchasing, inventory, finance & analytics in one role-aware workspace.

React · TypeScript · Node · Express · PostgreSQL · Prisma · TailwindCSS · JWT + RBAC

**Status: v1.0 — all planned phases (0–8) complete.**

---

## ✨ Features

**Core platform**

- Monorepo (npm workspaces): `apps/web`, `apps/api`, `packages/shared`
- JWT auth with rotating, revocable refresh tokens
- Role-Based Access Control — 9 seeded roles, permission-matrix enforced on every route
- Multi-tenancy — every query auto-scoped per company via a Prisma client extension
- Responsive UI with light/dark design system

**Business modules**

- **Master data & Inventory** — customers, suppliers, products, raw materials, warehouses, BOM, stock ledger
- **Sales** — inquiry → quotation → sales order pipeline, with PDF quotations
- **Production / MES** — production orders, machine tracking, work-order flow
- **Quality** — inspections (incoming/in-process/final)
- **Purchasing** — purchase orders tied to suppliers and shortages
- **Finance** — invoices, payments, AR tracking
- **HR** — employee records
- **Analytics & Dashboard** — role-aware KPIs, charts, reports
- **AI Assistant** — answers questions from live data (e.g. pending orders, low stock, machine downtime), key-free by default with optional Groq/Gemini/Ollama support

---

## 🚀 Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL (Docker, [Neon](https://neon.tech), Supabase, or local)

### Setup

```bash
# 1. Install
npm install

# 2. Configure environment
cp .env.example .env
# set DATABASE_URL (Docker defaults work out of the box)

# 3. Start the database (Docker option)
docker compose up -d

# 4. Create schema + seed demo data
npm run db:generate
npm run db:migrate
npm run db:seed

# 5. Run the app
npm run dev
```

Web: **<http://localhost:5173>** · API: **<http://localhost:4000>**

### Demo Accounts

Password: `Password123!`

| Role | Email |
|---|---|
| Admin | <admin@techforge.dev> |
| Production Manager | <pm@techforge.dev> |
| Quality Inspector | <qc@techforge.dev> |
| Purchase Manager | <purchase@techforge.dev> |
| Store Manager | <store@techforge.dev> |
| Sales Executive | <sales@techforge.dev> |
| Operator | <operator@techforge.dev> |
| HR | <hr@techforge.dev> |
| Finance | <finance@techforge.dev> |

---

## 📜 Common Scripts

| Command | Description |
|---|---|
| `npm run dev` | Run API + web together |
| `npm run build` | Build shared → api → web |
| `npm run typecheck` | Typecheck all workspaces |
| `npm run db:migrate` | Run Prisma migrations |
| `npm run db:seed` | Seed demo data |
| `npm run db:reset` | Drop, re-migrate, re-seed |

---

## 🗂️ Project Structure

techforge-erp/
├─ apps/
│ ├─ api/ # Express + Prisma backend (Controller → Service → Repository)
│ └─ web/ # React + Vite frontend (feature-based)
├─ packages/
│ └─ shared/ # Zod schemas, permission matrix, shared types
└─ docs/ # SRS, DB schema, API spec, wireframes, roadmap

---

## 🔐 Auth & RBAC

1. Login returns a short-lived access token plus a rotating, httpOnly refresh cookie.
2. Permissions are checked live on the server on every request — revocation is instant.
3. Routes are guarded with `requirePermission("resource:action")`; adding a role is a data change, not a code change.
4. A Prisma client extension enforces multi-tenant data isolation automatically.

---

## 🤖 AI Assistant

- **Default** — key-free, deterministic answers pulled directly from live database data (works fully offline).
- **Optional** — connect a free LLM (Groq, Google Gemini, or local Ollama) for natural-language responses.

---

## ☁️ Deployment

| Component | Suggested free host |
|---|---|
| Database | Neon / Supabase |
| API | Render / Fly.io |
| Web | Vercel / Netlify |

---

## 📚 Documentation

See [`/docs`](docs) for architecture decisions, requirements (SRS), database schema, API spec, UI wireframes, and the full phase-by-phase roadmap.

---

## 📄 License

MIT — portfolio / educational project. TechForge Manufacturing Pvt. Ltd. is fictional.
