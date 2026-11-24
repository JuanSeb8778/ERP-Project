# Task Checklist — TechForge ERP + MES

Living checklist. Check items as completed. Grouped by phase (see `06-ROADMAP.md`).

## Phase 0 — Foundation
- [ ] pnpm workspace + `apps/web`, `apps/api`, `packages/shared`, `packages/config`
- [ ] Shared TS config, ESLint, Prettier, Husky + lint-staged
- [ ] GitHub Actions CI (lint · typecheck · test · build)
- [ ] `docker-compose.yml` (postgres, redis) + `.env.example`
- [ ] API: Express, pino logger, error handler, response envelope, Zod env validation
- [ ] API: Prisma init + DB connection + `/health`
- [ ] Web: Vite + Tailwind + shadcn + tokens (light/dark) + Router + React Query + Axios
- [ ] Web: AppShell (sidebar, topbar, theme toggle) reads `/health`
- [ ] README skeleton

## Phase 1 — Auth · RBAC · Tenancy
- [ ] Models: Company, User, Role, Permission, RolePermission, RefreshToken + migration
- [ ] Password hashing (argon2), JWT access + rotating refresh (httpOnly, revocable)
- [ ] Endpoints: login, refresh, logout, me, forgot/reset password
- [ ] Rate limiting, helmet, CORS, secure cookies
- [ ] AsyncLocalStorage tenant context + Prisma companyId auto-scope extension
- [ ] `requirePermission()` middleware + permission key registry
- [ ] Seed: company + 9 roles + permission matrix + user per role
- [ ] Web: login page, AuthProvider, protected routes, `usePermissions`, gated sidebar
- [ ] Test: tenant isolation + permission denial

## Phase 2 — Master data · Inventory
- [ ] CRUD (controller/service/repo/Zod) — Customers, Suppliers, Products, RawMaterials, Warehouses
- [ ] BOM + BomItem CRUD (versioned)
- [ ] Stock + StockMovement ledger; low-stock endpoint; adjustment/transfer
- [ ] Web DataTable (sort/filter/paginate/URL-sync/skeleton/empty/bulk)
- [ ] Form dialogs (react-hook-form + shared Zod), StatCard, StatusBadge, PageHeader
- [ ] Feature pages: Customers, Suppliers, Products, Raw Materials, Inventory, BOM editor
- [ ] Seed master data + opening stock

## Phase 3 — Sales flow
- [ ] Inquiry + items CRUD
- [ ] Quotation (pricing/tax, states) + accept→SO conversion
- [ ] PDF service + quotation PDF; StorageProvider (local)
- [ ] Sales Order state machine + status endpoint
- [ ] Web: pipeline pages, quotation builder, SO detail/actions
- [ ] Audit log on all state changes

## Phase 4 — Production · MES
- [ ] Production plan from SO + BOM explosion
- [ ] Material availability check (demand vs stock, shortfalls)
- [ ] Plan release → Work Orders + stock reservation
- [ ] WorkOrder state machine + WorkOrderEvent logging (start/output/pause/stop/complete)
- [ ] Machines CRUD + live status + downtime capture/close
- [ ] OEE computation service (Availability × Performance × Quality)
- [ ] Socket.IO namespaces (production, machines)
- [ ] Web: production Kanban (drag=transition), schedule calendar, Operator console, machine board, OEE gauges

## Phase 5 — Quality · Purchasing · Dispatch · Finance
- [ ] Inspections (incoming/in-process/final) + results + complete + reject→KPI/OEE
- [ ] Non-conformance report + disposition
- [ ] Purchase Orders (+ from shortage) + send + PDF
- [ ] Goods Receipt (GRN) → stock movement
- [ ] Dispatch/packing note → decrement FG stock
- [ ] Invoice (from SO) + issue + PDF
- [ ] Payments + AR aging
- [ ] Web pages for each; golden-path e2e test

## Phase 6 — Dashboard · Reports · Analytics · HR
- [ ] Role-aware dashboard KPI bundle (all specified metrics)
- [ ] Analytics endpoints (OEE, revenue, operator perf, utilization, rejects)
- [ ] Recharts dashboards
- [ ] Reports with filters + Excel export (exceljs) + PDF export
- [ ] HR: employees, attendance, leave request/approve
- [ ] Seed 60 days history for realistic charts

## Phase 7 — AI Assistant
- [ ] LangChain agent + typed tool registry (permission/tenant scoped)
- [ ] Tools: pendingOrders, machineDowntimeRanking, lowStockItems, revenueTrend, productionSummary, materialForecast
- [ ] `/ai/chat` streamed + AssistantPanel (text/table/chart/insight/action renderers)
- [ ] Material forecast service (statistical) + narrated by LLM
- [ ] "Draft PO" action (human approval)
- [ ] VectorStore interface (RAG stub) + document ingestion placeholder
- [ ] AiConversation/AiMessage persistence
- [ ] Verify six example prompts

## Phase 8 — Bonus · Hardening · Docs
- [ ] Notifications center + email (nodemailer) + live toasts
- [ ] Activity/Audit log viewer
- [ ] Document upload (StorageProvider) attach-to-entity
- [ ] Barcode/QR generation + scan
- [ ] Permission-matrix UI (Settings)
- [ ] Multi-company switcher
- [ ] Tests: service ≥70%, golden-path e2e, a11y pass, perf pass
- [ ] Loading/empty/error states audited everywhere
- [ ] README (setup, demo accounts, screenshots), architecture diagram
- [ ] API docs (OpenAPI/Swagger + Postman collection)
- [ ] Dockerized one-command run + demo seed
- [ ] Tag v1.0

---

### Demo accounts (to seed)
| Role | Email | Password |
|---|---|---|
| Admin | admin@techforge.dev | (seed) |
| Production Manager | pm@techforge.dev | (seed) |
| Operator | operator@techforge.dev | (seed) |
| Quality Inspector | qc@techforge.dev | (seed) |
| … | one per role | |

### Definition of Done (every task)
Typed · Zod-validated · permission-guarded · tenant-scoped · audited (if mutating) · has loading/empty/error UI · covered by at least a service test for non-trivial logic · committed with a Conventional Commit message.
