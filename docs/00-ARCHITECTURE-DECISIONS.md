# Architecture Decision Records (ADR) — TechForge ERP + MES

> A lightweight ADR log. Each record captures a decision, the context, and the consequences.
> Status legend: ✅ Accepted · 🔬 Proposed · ⛔ Rejected · ♻️ Superseded

---

## ADR-001 — Monorepo with shared types ✅
**Context:** Frontend and backend both need the same domain types (Order, WorkOrder, Invoice…). Keeping them in sync across two repos causes runtime drift.
**Decision:** Single monorepo (`pnpm` workspaces): `apps/web`, `apps/api`, `packages/shared`, `packages/config`.
**Consequences:** One `pnpm install`, shared ESLint/TS config, contract changes surface as compile errors. Slightly heavier CI. Worth it.

## ADR-002 — Zod as single source of truth ✅
**Context:** Validation (server) and types (client) tend to diverge.
**Decision:** Domain schemas defined once with **Zod** in `packages/shared`. Server validates requests with them; client infers types via `z.infer`.
**Consequences:** No duplicate DTOs. One place to change a field. Prisma model → Zod is kept aligned by review + a schema-parity test.

## ADR-003 — Layered backend (Controller → Service → Repository) ✅
**Context:** ERP business rules (material availability, OEE, workflow gates) must be testable independent of HTTP and Prisma.
**Decision:** Controllers handle HTTP only. Services own business logic. Repositories wrap Prisma. Cross-cutting concerns (auth, validation, logging, errors) are middleware.
**Consequences:** Services are unit-testable with mocked repos. Clear ownership. A little more boilerplate — mitigated by generators/snippets.

## ADR-004 — Multi-tenancy via `companyId` row scoping ✅
**Context:** "Multi Company Support" is a bonus goal; retrofitting tenancy is expensive.
**Decision:** Single database, shared schema, every business table has `companyId`. A Prisma client extension auto-injects `companyId` filters from request context (AsyncLocalStorage).
**Consequences:** Cheap to start, strong isolation in code. If a tenant needs physical isolation later, migrate that tenant to its own DB URL (provider abstraction already in place).

## ADR-005 — RBAC as a permission matrix ✅
**Context:** Nine roles, many modules. Hardcoding `if role === 'ADMIN'` does not scale.
**Decision:** `Role` ↔ `Permission` (many-to-many). Permissions are `resource:action` strings (`order:read`, `production:release`, `quality:approve`). `requirePermission()` middleware guards routes. A **Permission Matrix** UI (Settings) toggles them.
**Consequences:** New role = data change, not code change. The matrix doubles as living documentation.

## ADR-006 — AI = tool-calling over real data, RAG-ready ✅
**Context:** "AI Assistant" must answer real questions ("pending orders?", "max machine downtime?") — it must not hallucinate numbers.
**Decision:** LangChain **function/tool calling**. The LLM picks from a registry of typed, permission-checked tools (each backed by a real Prisma query/service). Results are rendered as chart/table/insight. A `VectorStore` interface is stubbed for future document RAG.
**Consequences:** Answers are grounded and auditable. Adding a capability = registering a tool. Predictions (material forecast) use a deterministic statistical service; the LLM only narrates.

## ADR-007 — Storage provider abstraction ✅
**Context:** "Local storage now, S3 later."
**Decision:** `StorageProvider` interface with `LocalStorageProvider` (default) and `S3StorageProvider` (later). Selected by `STORAGE_DRIVER` env var.
**Consequences:** File upload/download call sites never change. S3 is a config swap.

## ADR-008 — Auth: short-lived access JWT + rotating refresh token ✅
**Context:** JWT required; must be reasonably secure.
**Decision:** Access token (15 min, in memory / Authorization header) + refresh token (httpOnly, rotating, stored hashed in DB for revocation). RBAC claims minimal; permissions resolved server-side.
**Consequences:** Logout/kill-session works (refresh revocation). No sensitive data in the JWT.

## ADR-009 — Real-time via Socket.IO ✅
**Context:** "Live Notifications", machine status, production board.
**Decision:** Socket.IO namespaces per concern (`/notifications`, `/production`, `/machines`), rooms per `companyId`. REST remains the source of truth; sockets push deltas.
**Consequences:** Live UX without polling. Falls back to long-polling automatically.

## ADR-010 — Recharts + shadcn/ui, design tokens for theming ✅
**Context:** UI must feel like Linear/Stripe, not Bootstrap admin.
**Decision:** shadcn/ui (Radix + Tailwind) components, Recharts for charts, CSS variables as design tokens for light/dark. Chart palette defined once as tokens.
**Consequences:** Consistent, accessible, themeable. No template look.

## ADR-011 — Background jobs via BullMQ (Redis) 🔬
**Context:** Email, PDF/Excel generation, forecasts, low-stock alerts should not block requests.
**Decision:** BullMQ workers on Redis. Phase 5+ only; earlier phases run these inline behind the same service interface.
**Consequences:** Scales cleanly; optional for a demo deploy (interface allows inline execution).
