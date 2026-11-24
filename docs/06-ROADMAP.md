# Development Roadmap — TechForge ERP + MES

Phased, vertical-slice delivery. Each phase ends **deployable, demoable, and committed**. Estimates assume one focused developer; they scope work, not deadlines.

---

## Phase 0 — Foundation & scaffolding  *(~2–3 days)*
**Goal:** the monorepo runs end-to-end with one trivial authenticated route.
- pnpm workspaces, TS project refs, ESLint/Prettier, Husky + lint-staged, CI (lint/typecheck/test/build).
- `apps/api`: Express + pino + error handler + response envelope + Zod env config + Prisma connected to Postgres (Docker).
- `apps/web`: Vite + Tailwind + shadcn init + design tokens (light/dark) + React Router + React Query + Axios client + AppShell (sidebar/topbar/theme toggle).
- `packages/shared`: first Zod schema wired into both ends.
- `docker-compose` (postgres, redis), `.env.example`, README skeleton.
- **Exit:** `GET /api/v1/health` + a themed "Hello" page reading it via React Query. CI green.

## Phase 1 — Auth, RBAC, multi-tenancy, seed  *(~3–4 days)*
**Goal:** secure spine everything else builds on.
- Prisma schema: Company, User, Role, Permission, RolePermission, RefreshToken.
- Auth: login/refresh/logout/me, argon2 hashing, rotating refresh (httpOnly), rate limiting, helmet/CORS.
- Tenant context (AsyncLocalStorage) + Prisma extension auto-scoping `companyId`.
- `requirePermission()` middleware + permission registry.
- Seed: company, 9 roles + full permission matrix, one user per role.
- Web: login page, AuthProvider, protected routes, permission-gated sidebar, ThemeProvider.
- **Exit:** log in as each role; sidebar/routes reflect permissions; tenant isolation test passes.

## Phase 2 — Master data + Inventory ledger  *(~4–5 days)*
**Goal:** the nouns of the business + reusable UI kit.
- Backend CRUD (controller/service/repo + Zod): Customers, Suppliers, Products, RawMaterials, BOM, Warehouses.
- Inventory: Stock + StockMovement ledger, low-stock endpoint, adjustment/transfer.
- Web reusable kit: **DataTable** (sort/filter/paginate/URL-sync/skeleton/empty), form dialogs (react-hook-form + Zod), StatCard, StatusBadge, PageHeader.
- Feature pages: Customers, Suppliers, Products, Raw Materials, Inventory, BOM editor.
- Seed master data + opening stock.
- **Exit:** full CRUD with search/filter/pagination on all master data; inventory reflects movements.

## Phase 3 — Sales flow (Inquiry → Quotation → Sales Order)  *(~4 days)*
**Goal:** first real workflow + PDF.
- Inquiry, Quotation (pricing/tax, states, PDF), accept → Sales Order (states).
- PDF service (quotation), storage provider (local).
- Web: sales pipeline pages, quotation builder, SO detail with state actions.
- **Exit:** create inquiry → quote → PDF → accept → SO, all state-guarded and audited.

## Phase 4 — Production & MES (the differentiator)  *(~6–7 days)*
**Goal:** planning, work orders, machines, OEE, downtime.
- Production plan from SO + **BOM explosion** + **material availability check** (shortfalls).
- Release → Work Orders (reserve stock); WO state machine; WorkOrderEvent logging.
- Machines: CRUD, live status, downtime capture/close, **OEE** computation service.
- Web: production Kanban (drag = transition), schedule calendar, **Operator console**, machine status board, OEE gauges.
- Real-time: Socket.IO for board + machine status.
- **Exit:** release a plan, operator logs good/reject output & downtime, OEE updates live.

## Phase 5 — Quality, Purchasing, Dispatch, Finance  *(~5–6 days)*
**Goal:** close the golden path to payment.
- Quality: inspections (incoming/in-process/final), results, reject → OEE quality + KPI, NCR.
- Purchasing: PO (incl. from shortage), send, GRN → stock, PDF.
- Dispatch: packing/dispatch note, decrement FG stock.
- Finance: Invoice (from SO), issue, PDF, Payments, AR aging.
- **Exit:** the **full golden path** runs Inquiry→…→Payment; KPIs reflect it.

## Phase 6 — Dashboard, Reports, Analytics, HR  *(~4–5 days)*
- Role-aware dashboard KPI bundle (all specified metrics).
- Analytics endpoints + Recharts (OEE, revenue, operator perf, utilization, rejects).
- Reports with filters + **Excel/PDF export**.
- HR: employees, attendance, leave approvals.
- **Exit:** every dashboard tile is live; ≥3 reports export to Excel/PDF.

## Phase 7 — AI Assistant (grounded)  *(~4–5 days)*
- LangChain agent + **typed tool registry** (pending orders, max downtime, low stock, revenue, production summary…), permission- & tenant-scoped.
- Chat endpoint (streamed) + AssistantPanel with chart/table/insight/action renderers.
- Material-requirement **forecast** service (statistical) + "draft PO" action (human-approved).
- VectorStore interface stubbed (RAG-ready) for document Q&A.
- **Exit:** the six example prompts return grounded answers with visualizations.

## Phase 8 — Bonus, hardening, polish, docs  *(~4–5 days)*
- Notifications center + email; Activity/Audit log viewer; document upload; barcode/QR; permission-matrix UI; multi-company switcher.
- Tests (service-layer ≥70%, key e2e golden path), a11y pass, perf pass, loading/empty/error everywhere.
- README (setup, screenshots, architecture diagram), API docs (OpenAPI/Postman), Dockerized deploy, demo seed & demo accounts.
- **Exit:** portfolio-ready: one-command run, screenshots, docs, green CI.

---

## Dependency graph
```
P0 → P1 → P2 → P3 → P4 → P5 → P6 → P7 → P8
              └────────────┴→ (P6 analytics needs P4/P5 data)
                                    (P7 tools reuse P2–P6 services)
```

## Milestone demos
- **M1 (end P1):** secure multi-role login.
- **M2 (end P4):** shop-floor MES live (Kanban + operator + OEE).
- **M3 (end P5):** full golden path to payment.
- **M4 (end P7):** AI assistant answering from live data.
- **M5 (end P8):** portfolio release v1.0.

## Suggested commit cadence
Conventional Commits (`feat:`, `fix:`, `chore:`, `docs:`), one logical slice per commit, PR-per-phase with checklist. Tag `v0.x` per phase, `v1.0` at M5.
