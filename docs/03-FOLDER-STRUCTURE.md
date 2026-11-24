# Folder Structure — TechForge ERP + MES

Monorepo (pnpm workspaces). Feature-based folders on both ends. Shared contracts in `packages/shared`.

```
techforge-erp/
├─ package.json                # workspace root, scripts (dev, build, lint, test)
├─ pnpm-workspace.yaml
├─ turbo.json                  # task pipeline (optional, caches builds)
├─ docker-compose.yml          # postgres + redis + api + web
├─ .env.example
├─ README.md
├─ docs/                       # ← these planning docs live here
│  ├─ 00-ARCHITECTURE-DECISIONS.md
│  ├─ 01-SRS.md … 07-TASK-CHECKLIST.md
│  ├─ architecture-diagram.png
│  └─ screenshots/
│
├─ packages/
│  ├─ shared/                  # framework-agnostic contracts
│  │  └─ src/
│  │     ├─ schemas/           # Zod schemas per domain (order, workOrder, invoice…)
│  │     ├─ types/             # inferred TS types (z.infer) + enums
│  │     ├─ constants/         # permission keys, statuses, reason codes
│  │     └─ index.ts
│  └─ config/                  # shared eslint, tsconfig, tailwind preset
│
├─ apps/
│  ├─ api/                     # Express + TS backend
│  │  ├─ prisma/
│  │  │  ├─ schema.prisma
│  │  │  ├─ migrations/
│  │  │  └─ seed.ts
│  │  └─ src/
│  │     ├─ main.ts            # bootstrap, http server, socket.io
│  │     ├─ app.ts             # express app, middleware wiring
│  │     ├─ config/            # env (zod-validated), constants
│  │     ├─ core/
│  │     │  ├─ prisma.ts       # PrismaClient + tenant extension
│  │     │  ├─ context.ts      # AsyncLocalStorage (userId, companyId, reqId)
│  │     │  ├─ errors/         # AppError, error codes, error handler
│  │     │  ├─ logger.ts       # pino
│  │     │  └─ result.ts       # standard API response envelope
│  │     ├─ middleware/        # auth, requirePermission, validate, rateLimit, audit
│  │     ├─ modules/           # ← FEATURE-BASED
│  │     │  ├─ auth/
│  │     │  │  ├─ auth.controller.ts
│  │     │  │  ├─ auth.service.ts
│  │     │  │  ├─ auth.routes.ts
│  │     │  │  └─ auth.test.ts
│  │     │  ├─ orders/ customers/ suppliers/ products/ inventory/
│  │     │  ├─ production/ machines/ quality/ maintenance/
│  │     │  ├─ purchasing/ dispatch/ invoices/ payments/
│  │     │  ├─ hr/ reports/ analytics/ notifications/ activity/ documents/
│  │     │  └─ ai/
│  │     │     ├─ ai.controller.ts
│  │     │     ├─ ai.service.ts          # LangChain agent + tool router
│  │     │     ├─ tools/                 # typed tools over services (pendingOrders, maxDowntime…)
│  │     │     ├─ forecast.service.ts    # statistical material forecast
│  │     │     └─ vector/                # VectorStore interface (RAG stub)
│  │     ├─ repositories/      # thin Prisma wrappers (or per-module *.repo.ts)
│  │     ├─ services/          # cross-module domain services (workflow, storage, pdf, excel, email)
│  │     │  ├─ storage/        # StorageProvider, Local + S3 impls
│  │     │  ├─ pdf/ excel/ email/ realtime/
│  │     └─ jobs/              # BullMQ workers (optional)
│  │
│  └─ web/                     # React + Vite frontend
│     └─ src/
│        ├─ main.tsx routes.tsx app.tsx
│        ├─ lib/               # axios client, react-query client, utils, formatters
│        ├─ components/
│        │  ├─ ui/             # shadcn primitives (button, card, table, dialog…)
│        │  ├─ charts/         # Recharts wrappers (LineChart, BarChart, Gauge/OEE)
│        │  ├─ layout/         # AppShell, Sidebar, Topbar, CommandPalette, ThemeToggle
│        │  └─ common/         # DataTable, PageHeader, EmptyState, Skeletons, StatCard, StatusBadge, Kanban, Calendar
│        ├─ features/          # ← FEATURE-BASED, mirrors API modules
│        │  ├─ auth/           # pages, hooks (useLogin), api (auth.api.ts)
│        │  ├─ dashboard/ orders/ customers/ suppliers/ products/
│        │  ├─ inventory/ production/ machines/ quality/ maintenance/
│        │  ├─ purchasing/ dispatch/ invoices/ hr/ reports/ analytics/
│        │  ├─ settings/       # profile, users, roles, permission-matrix
│        │  ├─ notifications/ activity/
│        │  └─ ai/             # AssistantPanel, useAssistant, message renderers
│        ├─ hooks/             # useAuth, usePermissions, useSocket, useTheme
│        ├─ providers/         # AuthProvider, QueryProvider, ThemeProvider, SocketProvider
│        └─ styles/            # tailwind.css, tokens.css (light/dark design tokens)
│
└─ .github/workflows/ci.yml    # lint + typecheck + test + build
```

### Conventions
- **One feature = one folder** on both ends; API module and web feature share the name.
- Each API module exposes exactly: `*.routes.ts` → `*.controller.ts` → `*.service.ts` → repository.
- Each web feature exposes: `pages/`, `components/`, `hooks/`, and a single `*.api.ts` (React Query).
- No business logic in controllers or React components. No Prisma outside repositories. No `fetch` outside `*.api.ts`.
