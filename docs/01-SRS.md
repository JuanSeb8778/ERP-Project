# Software Requirements Specification (SRS)
## TechForge Manufacturing Pvt. Ltd. — AI-Powered ERP + MES

**Version:** 1.0 (Draft for approval) · **Date:** 2026-07-24 · **Status:** Awaiting sign-off

---

## 1. Introduction

### 1.1 Purpose
Define the functional and non-functional requirements for an AI-powered **ERP (Enterprise Resource Planning)** + **MES (Manufacturing Execution System)** for a discrete-manufacturing company. The system manages the full lifecycle **Inquiry → Quotation → Sales Order → Production → Quality → Dispatch → Invoice → Payment**, with real-time shop-floor tracking and a natural-language AI assistant.

### 1.2 Scope
A multi-tenant web platform (responsive, light/dark) with role-based access for 9 roles across 25+ modules. Not a generic CRUD ERP: it emphasizes **manufacturing execution** (work orders, machine OEE, downtime, quality gates) and **grounded AI** (assistant answers from live data, forecasts material demand).

### 1.3 Definitions
| Term | Meaning |
|---|---|
| **BOM** | Bill of Materials — components/raw materials required to build one product |
| **Work Order (WO)** | An executable unit of production for a quantity of a product |
| **OEE** | Overall Equipment Effectiveness = Availability × Performance × Quality |
| **MES** | Manufacturing Execution System — shop-floor tracking layer |
| **RBAC** | Role-Based Access Control |
| **RAG** | Retrieval-Augmented Generation |
| **Downtime** | Period a machine is not producing (breakdown, setup, no-material, planned) |

### 1.4 Actors (Roles)
Admin, Production Manager, Quality Inspector, Purchase Manager, Store Manager, Sales Executive, Operator, HR, Finance.

---

## 2. Overall Description

### 2.1 Product perspective
Greenfield, self-contained. Web frontend (React) ↔ REST API (Express) ↔ PostgreSQL (Prisma). Optional Redis (jobs/cache), OpenAI (assistant). Storage abstracted (local → S3).

### 2.2 User classes & responsibilities
| Role | Primary responsibilities |
|---|---|
| **Admin** | Company setup, users, roles/permissions, master data, everything |
| **Sales Executive** | Customers, inquiries, quotations, sales orders |
| **Production Manager** | Production plans, work orders, machine assignment, scheduling, OEE |
| **Operator** | Execute/log work orders at a machine, report output & downtime |
| **Quality Inspector** | Inspections, pass/reject, non-conformance, hold/release |
| **Purchase Manager** | Suppliers, purchase orders, GRN, reorder |
| **Store Manager** | Warehouses, stock, raw material issue/receipt, stock moves |
| **Finance** | Invoices, payments, credit, financial reports |
| **HR** | Employees, attendance, leave |

### 2.3 Operating environment
Modern browsers (last 2 versions). Node 20 LTS, PostgreSQL 15+, Redis 7 (optional). Deployable to any container host.

### 2.4 Design & implementation constraints
Stack fixed by client: React + TS + Vite + Tailwind + shadcn/ui + React Router + React Query + Recharts; Node + Express + TS; PostgreSQL + Prisma; JWT + RBAC; OpenAI + LangChain.

### 2.5 Assumptions
- Discrete (not process/continuous) manufacturing.
- Single currency per company (configurable), single base UoM per item with conversions.
- Demo seed data provided for all modules.
- Email/SMS providers may be sandboxed in demo.

---

## 3. Functional Requirements (by module)

> Each requirement is testable. `FR-<MOD>-<n>`. Priority: **M**ust / **S**hould / **C**ould.

### 3.1 Auth & Access (AUTH)
- **FR-AUTH-1 (M):** Users log in with email + password; receive access + refresh tokens.
- **FR-AUTH-2 (M):** Refresh tokens rotate and can be revoked (logout, admin kill-session).
- **FR-AUTH-3 (M):** Every request is authorized against the user's **permissions** (not role name).
- **FR-AUTH-4 (M):** All data is scoped to the user's `companyId`; cross-tenant access is impossible.
- **FR-AUTH-5 (S):** Password reset via email token. Account lockout after N failed attempts.

### 3.2 Company & Settings (SET)
- **FR-SET-1 (M):** Admin manages company profile, logo, address, currency, timezone.
- **FR-SET-2 (M):** Admin manages users (invite, deactivate, assign role).
- **FR-SET-3 (M):** **Permission Matrix** UI to toggle role↔permission.
- **FR-SET-4 (S):** Numbering schemes (SO-2026-0001, WO-…, INV-…) configurable.

### 3.3 Customers (CUST) & Suppliers (SUP)
- **FR-CUST-1 (M):** CRUD customers with contacts, billing/shipping addresses, credit limit, GST/Tax ID.
- **FR-SUP-1 (M):** CRUD suppliers with contacts, payment terms, lead times, rating.

### 3.4 Products, Raw Materials, BOM (PROD/RM/BOM)
- **FR-PROD-1 (M):** CRUD finished products (SKU, UoM, category, price, specs, barcode/QR).
- **FR-RM-1 (M):** CRUD raw materials (SKU, UoM, reorder point, safety stock, default supplier).
- **FR-BOM-1 (M):** Define BOM per product (component RM/sub-assembly + quantity + scrap %).
- **FR-BOM-2 (S):** BOM versioning; active version used for planning.

### 3.5 Inventory & Warehouses (INV)
- **FR-INV-1 (M):** Multi-warehouse stock levels per item (on-hand, reserved, available).
- **FR-INV-2 (M):** Every quantity change is an immutable **StockMovement** (receipt, issue, transfer, adjustment, production-in, scrap).
- **FR-INV-3 (M):** Reserve stock when a work order is released; consume on completion.
- **FR-INV-4 (M):** Low-stock detection (available < reorder point) → notification + AI flag.
- **FR-INV-5 (C):** Batch/lot & expiry tracking.

### 3.6 Sales flow (INQ/QUO/SO)
- **FR-INQ-1 (M):** Capture customer inquiry (items, target qty, needed-by).
- **FR-QUO-1 (M):** Generate quotation from inquiry (pricing, tax, validity); PDF export.
- **FR-QUO-2 (M):** Quotation states: Draft → Sent → Accepted/Rejected/Expired.
- **FR-SO-1 (M):** Convert accepted quotation → Sales Order; SO states: Confirmed → In Production → Ready → Dispatched → Closed.
- **FR-SO-2 (M):** SO drives production demand.

### 3.7 Production Planning & Tracking (PP/WO)
- **FR-PP-1 (M):** Create a Production Plan from one/many SO lines; explode BOM to compute material demand.
- **FR-PP-2 (M):** **Material availability check** — compare demand vs available stock; flag shortages and suggest purchase.
- **FR-PP-3 (M):** Generate **Work Orders** per product/quantity; assign machine + operator + planned start/end.
- **FR-WO-1 (M):** WO states: Planned → Released → In Progress → Paused → Completed → Closed. Release reserves material.
- **FR-WO-2 (M):** Operator logs production events: start, qty produced good/reject, pause reason, stop.
- **FR-WO-3 (M):** Kanban board of work orders by state; calendar/Gantt of schedule.
- **FR-WO-4 (S):** Auto-consume components (backflush) on completion.

### 3.8 Machines & Maintenance (MC/MNT)
- **FR-MC-1 (M):** CRUD machines (code, type, capacity, location, status).
- **FR-MC-2 (M):** Live machine status: Running / Idle / Down / Maintenance / Setup.
- **FR-MC-3 (M):** Record **downtime** events with reason codes and duration.
- **FR-MC-4 (M):** Compute **OEE** per machine/shift/day (Availability × Performance × Quality).
- **FR-MNT-1 (S):** Preventive maintenance schedules; breakdown work requests; maintenance history.

### 3.9 Quality (QC)
- **FR-QC-1 (M):** Inspection tied to a WO/GRN (incoming, in-process, final). Sample size, parameters, pass/fail.
- **FR-QC-2 (M):** Reject qty feeds OEE quality factor and rejected-products KPI.
- **FR-QC-3 (M):** Non-conformance report; hold/release; disposition (rework/scrap/accept).

### 3.10 Purchasing (PO/GRN)
- **FR-PO-1 (M):** Create Purchase Order (manual or from shortage suggestion) → Sent → Partially/Fully Received.
- **FR-PO-2 (M):** Goods Receipt (GRN) increments stock via StockMovement; may trigger incoming QC.
- **FR-PO-3 (S):** AI-generated draft PO from low-stock/forecast.

### 3.11 Dispatch & Invoicing (DISP/INV$/PAY)
- **FR-DISP-1 (M):** Packing list + dispatch note for a ready SO; decrement finished-goods stock.
- **FR-INV$-1 (M):** Generate Invoice from SO/dispatch; tax lines; PDF export; states Draft → Issued → Paid/Overdue.
- **FR-PAY-1 (M):** Record payments (full/partial) against invoices; update AR aging.

### 3.12 HR (EMP/ATT/LV)
- **FR-EMP-1 (M):** CRUD employees (link to User optionally), department, designation, shift.
- **FR-ATT-1 (M):** Attendance check-in/out (manual/import); daily status.
- **FR-LV-1 (M):** Leave request → approve/reject; leave balances.

### 3.13 Dashboard, Reports & Analytics (DASH/RPT)
- **FR-DASH-1 (M):** Role-aware dashboard: Today's Production, Completed/Pending Orders, Machine Utilization & Downtime, Operator Performance, Inventory Status, Revenue, Rejected Products, Production Efficiency, OEE.
- **FR-RPT-1 (M):** Filterable reports (date range, product, machine, customer) with Excel/PDF export.
- **FR-RPT-2 (S):** Saved/scheduled reports.

### 3.14 AI Assistant (AI)
- **FR-AI-1 (M):** Natural-language query answered from **live data** via typed tools (e.g., "How many pending orders?", "Which machine has max downtime?", "Show low inventory items").
- **FR-AI-2 (M):** Every AI answer is permission-scoped and company-scoped (never exceeds the user's access).
- **FR-AI-3 (S):** AI renders results as chart/table + a short insight/recommendation.
- **FR-AI-4 (S):** Material-requirement forecast (statistical service; LLM narrates).
- **FR-AI-5 (S):** "Generate purchase order" / "Summarize production" produce a reviewable draft (human approves).
- **FR-AI-6 (C):** Document RAG over uploaded specs/SOPs (vector store) — architecture stubbed now.

### 3.15 Platform (NOTIF/AUDIT/DOC)
- **FR-NOTIF-1 (M):** Live in-app notifications (Socket.IO) + notification center; email for key events.
- **FR-AUDIT-1 (M):** Immutable **Activity/Audit log** of create/update/delete/state-change with actor, before/after.
- **FR-DOC-1 (S):** Attach documents to any entity via storage provider (local → S3).
- **FR-BC-1 (C):** Barcode/QR generation & scan for products/WO/inventory.

---

## 4. Non-Functional Requirements

| # | Category | Requirement |
|---|---|---|
| NFR-1 | **Performance** | P95 API < 300 ms on seeded dataset; dashboard first paint < 2 s. |
| NFR-2 | **Scalability** | Stateless API (horizontal scale); pagination on all list endpoints. |
| NFR-3 | **Security** | OWASP Top 10 mitigations; hashed passwords (argon2/bcrypt); httpOnly refresh cookie; input validation on every endpoint; rate limiting; helmet/CORS. |
| NFR-4 | **Reliability** | Transactional writes for multi-table ops (SO→WO, GRN→stock); idempotent state transitions. |
| NFR-5 | **Auditability** | Every mutating action logged; stock/financial ledgers append-only. |
| NFR-6 | **Usability** | Responsive ≥320px; keyboard-navigable; WCAG AA contrast; loading skeletons, empty states, optimistic UI where safe. |
| NFR-7 | **Maintainability** | Layered architecture, shared types, ≥70% service-layer test coverage, ESLint/Prettier/CI. |
| NFR-8 | **Observability** | Structured JSON logging (pino), request IDs, error tracking hook. |
| NFR-9 | **i18n-ready** | Text externalized; currency/date localization per company. |
| NFR-10 | **Portability** | Dockerized; `.env`-driven config; storage & AI providers swappable. |

---

## 5. Domain State Machines (summary)

- **Quotation:** Draft → Sent → (Accepted → converts to SO | Rejected | Expired)
- **Sales Order:** Confirmed → In Production → Ready → Dispatched → Invoiced → Closed (Cancelled from any pre-dispatch state)
- **Work Order:** Planned → Released → In Progress ⇄ Paused → Completed → Closed
- **Purchase Order:** Draft → Sent → Partially Received → Received → Closed (Cancelled)
- **Invoice:** Draft → Issued → (Partially Paid) → Paid | Overdue | Cancelled
- **Inspection:** Pending → In Progress → Passed | Failed → (NCR → Reworked/Scrapped/Accepted)

---

## 6. Acceptance criteria (definition of done for the MVP demo)
1. A user can walk the **full golden path**: create customer → inquiry → quotation → SO → plan → material check → (PO if short) → work order → operator logs output & a reject → QC inspection → dispatch → invoice → payment. Every step reflects in dashboard KPIs.
2. Machine downtime logged in a shift is visible in OEE and in the AI answer to "which machine has max downtime?".
3. Low-stock item appears in inventory status, triggers a notification, and is returned by the AI "show low inventory items".
4. RBAC verified: an Operator cannot access Finance; a Sales Executive cannot release work orders.
5. Light/dark themes, responsive down to mobile, Excel/PDF export on at least Orders and one report.
