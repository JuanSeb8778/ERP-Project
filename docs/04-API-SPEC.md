# API Specification — TechForge ERP + MES

REST, JSON, versioned under `/api/v1`. Auth via `Authorization: Bearer <accessToken>`.

## Conventions
- **Response envelope:** `{ "success": true, "data": ..., "meta": {...} }` or `{ "success": false, "error": { "code", "message", "details" } }`.
- **Pagination:** `?page=1&pageSize=20&sort=createdAt:desc&q=<search>&<filters>`; `meta: { page, pageSize, total, totalPages }`.
- **Validation:** Zod on every body/query/params; 422 with field errors.
- **Errors:** 400 bad request · 401 unauthenticated · 403 forbidden (permission) · 404 · 409 conflict/state · 422 validation · 429 rate-limit · 500.
- **Every mutating endpoint** writes an ActivityLog entry and is company-scoped automatically.
- **Permission** column = required permission key (RBAC middleware).

## Auth
| Method | Path | Permission | Purpose |
|---|---|---|---|
| POST | `/auth/login` | public | email+password → access+refresh |
| POST | `/auth/refresh` | public (cookie) | rotate refresh, new access |
| POST | `/auth/logout` | auth | revoke refresh token |
| GET  | `/auth/me` | auth | current user + permissions |
| POST | `/auth/forgot-password` | public | send reset email |
| POST | `/auth/reset-password` | public | reset with token |

## Settings / Admin
| Method | Path | Permission |
|---|---|---|
| GET/PATCH | `/company` | `company:read` / `company:update` |
| GET/POST | `/users` · GET/PATCH/DELETE `/users/:id` | `user:*` |
| GET | `/roles` · POST `/roles` · PATCH `/roles/:id` | `role:*` |
| GET | `/permissions` | `role:read` |
| PUT | `/roles/:id/permissions` | `role:update` (permission matrix) |

## Master data (same CRUD shape each)
`GET list` · `POST create` · `GET /:id` · `PATCH /:id` · `DELETE /:id` (soft)
| Resource | Base path | Permission root |
|---|---|---|
| Customers | `/customers` | `customer` |
| Suppliers | `/suppliers` | `supplier` |
| Products | `/products` | `product` |
| Raw materials | `/raw-materials` | `rawmaterial` |
| BOMs | `/products/:id/bom` | `product` |
| Warehouses | `/warehouses` | `inventory` |

## Inventory
| Method | Path | Permission | Purpose |
|---|---|---|---|
| GET | `/inventory/stock` | `inventory:read` | stock levels (filter warehouse/item/low-stock) |
| GET | `/inventory/low-stock` | `inventory:read` | available < reorder point |
| POST | `/inventory/movements` | `inventory:update` | manual adjustment/transfer (ledger) |
| GET | `/inventory/movements` | `inventory:read` | movement history |

## Sales flow
| Method | Path | Permission | Purpose |
|---|---|---|---|
| CRUD | `/inquiries` | `inquiry:*` | customer inquiries |
| CRUD | `/quotations` | `quotation:*` | quotations |
| POST | `/quotations/:id/send` | `quotation:update` | Draft→Sent |
| POST | `/quotations/:id/accept` | `quotation:update` | Accept → creates SO |
| GET | `/quotations/:id/pdf` | `quotation:read` | PDF export |
| CRUD | `/sales-orders` | `order:*` | sales orders |
| POST | `/sales-orders/:id/status` | `order:update` | state transition |

## Production / MES
| Method | Path | Permission | Purpose |
|---|---|---|---|
| POST | `/production/plans` | `production:create` | plan from SO line(s); BOM explosion |
| POST | `/production/plans/:id/material-check` | `production:update` | compute demand vs stock; shortfalls |
| POST | `/production/plans/:id/release` | `production:release` | generate work orders |
| GET | `/work-orders` | `production:read` | list (filter status/machine) — Kanban source |
| POST | `/work-orders/:id/release` | `production:release` | reserve material, PLANNED→RELEASED |
| POST | `/work-orders/:id/events` | `production:execute` | operator log (start/output/pause/stop/complete) |
| GET | `/work-orders/schedule` | `production:read` | calendar/Gantt feed |

## Machines & Maintenance
| Method | Path | Permission |
|---|---|---|
| CRUD | `/machines` | `machine:*` |
| POST | `/machines/:id/status` | `machine:update` (live status) |
| POST | `/machines/:id/downtime` · POST `/downtime/:id/close` | `machine:update` |
| GET | `/machines/:id/oee?range=` | `machine:read` |
| CRUD | `/maintenance` | `maintenance:*` |

## Quality
| Method | Path | Permission |
|---|---|---|
| GET/POST | `/inspections` | `quality:read` / `quality:create` |
| POST | `/inspections/:id/results` | `quality:update` |
| POST | `/inspections/:id/complete` | `quality:approve` (pass/fail, reject qty) |
| POST | `/inspections/:id/ncr` | `quality:approve` |

## Purchasing
| Method | Path | Permission |
|---|---|---|
| CRUD | `/purchase-orders` | `purchase:*` |
| POST | `/purchase-orders/:id/send` | `purchase:update` |
| POST | `/purchase-orders/:id/receipts` | `purchase:receive` (GRN → stock) |
| GET | `/purchase-orders/:id/pdf` | `purchase:read` |

## Dispatch, Invoicing, Payments
| Method | Path | Permission |
|---|---|---|
| POST/GET | `/dispatches` | `dispatch:*` (decrement FG stock) |
| CRUD | `/invoices` | `invoice:*` |
| POST | `/invoices/:id/issue` | `invoice:update` |
| GET | `/invoices/:id/pdf` | `invoice:read` |
| POST | `/invoices/:id/payments` | `payment:create` |

## HR
| Method | Path | Permission |
|---|---|---|
| CRUD | `/employees` | `employee:*` |
| GET/POST | `/attendance` | `attendance:*` |
| CRUD | `/leaves` · POST `/leaves/:id/approve` | `leave:*` |

## Dashboard / Reports / Analytics
| Method | Path | Permission | Purpose |
|---|---|---|---|
| GET | `/dashboard` | `dashboard:read` | role-aware KPI bundle |
| GET | `/analytics/oee?range=` | `analytics:read` | OEE trend |
| GET | `/analytics/revenue?range=` | `analytics:read` | revenue trend |
| GET | `/analytics/operator-performance` | `analytics:read` | |
| GET | `/reports/:type?filters` | `report:read` | tabular report data |
| GET | `/reports/:type/export?format=xlsx\|pdf` | `report:export` | Excel/PDF |

## AI Assistant
| Method | Path | Permission | Purpose |
|---|---|---|---|
| GET/POST | `/ai/conversations` | `ai:use` | list/create conversation |
| POST | `/ai/chat` | `ai:use` | `{ conversationId?, message }` → streamed answer + tool results (chart/table/insight). Tools run permission- & tenant-scoped. |
| POST | `/ai/forecast/material` | `ai:use` | material requirement forecast |
| POST | `/ai/actions/draft-po` | `purchase:create` | AI drafts PO (human approves) |

## Platform
| Method | Path | Permission |
|---|---|---|
| GET | `/notifications` · POST `/notifications/:id/read` | `auth` |
| GET | `/activity` | `audit:read` |
| POST | `/documents` (multipart) · GET `/documents/:id` | `document:*` |
| WS | `/socket.io` namespaces `/notifications`, `/production`, `/machines` | auth |

## Example — AI chat request/response
```http
POST /api/v1/ai/chat
{ "message": "Which machine has the maximum downtime this month?" }
```
```json
{ "success": true, "data": {
  "answer": "Machine CNC-02 had the most downtime this month: 14h 20m, mostly BREAKDOWN (61%).",
  "render": { "type": "bar", "title": "Downtime by machine (min)",
    "series": [{ "name": "CNC-02", "value": 860 }, { "name": "LATHE-01", "value": 410 }] },
  "insight": "CNC-02 breakdown minutes rose 32% vs last month — consider preventive maintenance.",
  "toolCalls": [{ "name": "machineDowntimeRanking", "args": { "range": "month" } }]
}}
```
