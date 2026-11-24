# UI / UX Wireframes — TechForge ERP + MES

Design language: **Linear/Stripe** — minimal, dense-but-calm, strong typography, subtle borders, generous whitespace, fast. shadcn/ui + Tailwind + Recharts. Light/dark via design tokens.

## Design tokens (excerpt)
- **Radius:** 8px cards, 6px controls. **Border:** 1px `hsl(var(--border))`.
- **Type:** Inter; 13px body, 12px labels, tabular-nums for figures.
- **Chart palette (tokens):** `--chart-1..6` — swap per brand; validated for light/dark contrast.
- **Motion:** 120–160ms ease-out; skeletons on load; optimistic on safe mutations.

## App shell
```
┌──────────────────────────────────────────────────────────────────────┐
│ [≡] TechForge            ⌘K Search…            🔔3   ☾/☀   ⬤ Shashank │  ← Topbar
├───────────┬──────────────────────────────────────────────────────────┤
│ Sidebar   │  Page                                                     │
│           │  ┌────────────────────────────────────────────────────┐  │
│ ⌂ Dashboard│  │ PageHeader: Title · breadcrumbs · [primary action] │  │
│ ▤ Orders  │  ├────────────────────────────────────────────────────┤  │
│ ◷ Production│ │  content: cards / table / board / charts           │  │
│ ⚙ Machines │  │                                                    │  │
│ ✓ Quality │  └────────────────────────────────────────────────────┘  │
│ ▣ Inventory│                                                          │
│ 🛒 Purchase│                                                          │
│ 💳 Finance │   Sidebar items filtered by permissions (RBAC).         │
│ 👥 HR     │                                                          │
│ 📊 Reports │   Floating ✨ AI Assistant button (bottom-right) →       │
│ ⚙ Settings │   opens right-side panel.                               │
└───────────┴──────────────────────────────────────────────────────────┘
```
- **Command palette (⌘K):** global search + navigation + quick actions ("New Sales Order").
- **Sidebar** collapses to icons; mobile → drawer. Nav items hidden if user lacks permission.

## Dashboard (role-aware)
```
┌ Today's Production ─┐┌ Completed Orders ─┐┌ Pending Orders ─┐┌ Revenue (MTD) ─┐
│  1,240 pcs   ▲12%  ││   38              ││   17            ││ ₹42.6L   ▲8%   │   ← StatCards (sparkline)
└────────────────────┘└───────────────────┘└─────────────────┘└────────────────┘
┌ OEE (gauge) ─────┐┌ Machine Utilization (bar) ───────┐┌ Rejected % (donut) ─┐
│     78.4%        ││ ███ ███ ██ █████ ██               ││   ◔ 3.2%            │
└──────────────────┘└──────────────────────────────────┘└─────────────────────┘
┌ Production Efficiency trend (line, 30d) ───────────┐┌ Inventory Status ──────┐
│  ╱╲    ╱╲___╱                                       ││ ● 6 low-stock  →       │
└────────────────────────────────────────────────────┘│ ● 2 out-of-stock       │
┌ Operator Performance (table) ──────────────────────┐└────────────────────────┘
│ Operator     Good   Reject   Efficiency            │
└────────────────────────────────────────────────────┘
```

## DataTable (Orders/Customers/etc.) — reused component
```
┌ Sales Orders ───────────────────────── [Filters ▾][Export ▾][+ New Order] ┐
│ 🔎 search…   Status: All ▾   Customer: All ▾   Date: This month ▾          │
├────┬────────────┬───────────┬──────────┬──────────┬──────────┬────────────┤
│ ☐  │ SO-2026-01 │ Acme Corp │ ₹1.2L    │ ●In Prod │ 24 Jul   │  ⋯         │
├────┴────────────┴───────────┴──────────┴──────────┴──────────┴────────────┤
│ Rows 1–20 of 143            ‹ 1 2 3 … 8 ›            20 / page ▾           │
└───────────────────────────────────────────────────────────────────────────┘
```
Features: column sort, sticky header, row select + bulk actions, status badges, row menu, URL-synced filters, skeleton rows, empty state, error state.

## Production board (Kanban) + schedule (Calendar/Gantt)
```
 Planned        Released       In Progress      Paused          Completed
┌─────────┐    ┌─────────┐    ┌─────────┐      ┌─────────┐     ┌─────────┐
│WO-118   │    │WO-114   │    │WO-109 ▓▓│      │WO-107   │     │WO-101 ✓ │
│Gear A×50│    │Shaft×20 │    │CNC-02   │      │no matl  │     │  QC →   │
│CNC-01   │    │LATHE-01 │    │68% ████ │      └─────────┘     └─────────┘
└─────────┘    └─────────┘    └─────────┘
```
Drag between columns = state transition (permission-checked). Calendar tab shows planned WOs per machine lane.

## Operator console (touch-friendly, big targets)
```
┌ WO-109 · Gear A · Qty 50 · Machine CNC-02 ──────────────────┐
│  Status: IN PROGRESS   ⏱ 01:24:07                            │
│  Good produced: [  42  ]     Rejected: [  3  ]               │
│  ┌ ▶ Start ┐ ┌ ⏸ Pause ┐ ┌ ＋ Log Output ┐ ┌ ■ Complete ┐   │
│  Pause reason: ( Breakdown | Setup | No Material | Quality ) │
└──────────────────────────────────────────────────────────────┘
```

## Quality inspection
Split view: inspection meta + parameter checklist (pass/fail toggles) + sample/reject counts → Complete → optional NCR drawer.

## Machine status board
Grid of machine tiles color-coded by status (Running/Idle/Down/Maintenance/Setup) with live OEE mini-gauge and current WO; click → detail with downtime timeline.

## AI Assistant panel (right drawer)
```
┌ ✨ Assistant ───────────────────────── ✕ ┐
│  You: show low inventory items            │
│  ⚙ ran: lowStockItems                     │
│  Assistant: 6 items below reorder point:  │
│  ┌ table: Item · On-hand · Reorder · ▲ ┐  │
│  │ Steel Rod 12mm   40   120   -80     │  │
│  └─────────────────────────────────────┘  │
│  💡 Suggest PO for top 3 shortfalls →     │
│  [ Ask anything…                    ➤ ]   │
└───────────────────────────────────────────┘
```
Renderers: text, table, bar/line/donut chart, insight card, action button (draft PO). Streamed tokens; tool-run chips.

## Invoice / PDF view
Document-style layout (company header, bill-to, line items, tax, totals, status stamp) with **Download PDF** and **Record Payment**.

## Cross-cutting states
- **Loading:** skeletons matching final layout (never spinners for full pages).
- **Empty:** illustration + one-line guidance + primary CTA.
- **Error:** inline retry; toast for mutations.
- **Responsive:** ≥1280 full, 768–1279 collapsed sidebar, <768 drawer + stacked cards; tables → card list on mobile.
- **A11y:** focus rings, ARIA on interactive components, AA contrast both themes, full keyboard nav, ⌘K.

> High-fidelity Figma-style mockups are out of scope for code; these ASCII wireframes + the shadcn component inventory define layout intent. Final screenshots go in `docs/screenshots/`.
