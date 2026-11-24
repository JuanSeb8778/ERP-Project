# TechForge ERP + MES — Planning Package

Read in order. These documents are the contract for implementation; code follows only after sign-off.

| # | Document | What it answers |
|---|---|---|
| 00 | [Architecture Decisions](00-ARCHITECTURE-DECISIONS.md) | *Why* the system is built this way (ADRs) |
| 01 | [Software Requirements Spec](01-SRS.md) | *What* it must do — roles, modules, functional & non-functional requirements, acceptance criteria |
| 02 | [Database Schema](02-DATABASE-SCHEMA.md) | Full normalized Prisma schema + ER diagram + seed plan |
| 03 | [Folder Structure](03-FOLDER-STRUCTURE.md) | Monorepo layout, feature-based folders, conventions |
| 04 | [API Specification](04-API-SPEC.md) | REST endpoints, permissions, envelopes, examples |
| 05 | [UI / UX Wireframes](05-UI-WIREFRAMES.md) | Design language, app shell, key screens, states |
| 06 | [Development Roadmap](06-ROADMAP.md) | 9 phases, exit criteria, milestones |
| 07 | [Task Checklist](07-TASK-CHECKLIST.md) | Granular, checkable task list per phase |

## One-paragraph summary
An AI-powered **ERP + MES** for a fictional discrete manufacturer (TechForge). It runs the full workflow **Inquiry → Quotation → Sales Order → Production Planning → Material Check → Purchase → Production → Quality → Dispatch → Invoice → Payment**, with real-time shop-floor tracking (work orders, machine OEE, downtime), a permission-matrix RBAC across 9 roles, multi-company tenancy, and a **grounded** AI assistant that answers from live data via typed tools. Stack: React/TS/Vite/Tailwind/shadcn/React Query/Recharts · Node/Express/TS · PostgreSQL/Prisma · JWT · OpenAI/LangChain — in a pnpm monorepo with shared Zod-derived types.

## Status
📋 **Awaiting approval.** No application code written yet — by design.
