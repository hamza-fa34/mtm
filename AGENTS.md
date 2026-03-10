# AGENTS.md - Molly's Truck Manager

## 1) Project context
Molly's Truck Manager is an operations app for food-trucks and small mobile restaurants.
Goal: centralize daily operations in a fast, readable, reliable tool.

Current state (2026-03-10):
- Monorepo in place: `apps/web` + `apps/api` + `infra` + `docs`
- Frontend: React + TypeScript + Vite
- Backend: NestJS + Prisma + PostgreSQL
- Docker fullstack and CI pipelines operational
- Offline sync foundations implemented for critical domains
- Current phase objective: close offline-sync stabilization and prepare BL-019

## 2) Purpose of this file
This file defines:
- collaboration rules (human + AI),
- delivery guardrails,
- phase priorities,
- anti-regression constraints.

## 3) Functional scope (current)

### Included
- POS: cart, checkout, payment flow
- KDS: kitchen queue and order status flow
- Product/menu management
- Inventory (ingredients, purchases, waste)
- Customers (CRM/loyalty basics)
- Sessions (open/close end-of-day)
- Expenses
- Role-based access (MANAGER / STAFF)

### Not in scope now
- Multi-device real-time sync
- Full offline-first conflict engine
- External payment provider integration
- Multi-tenant SaaS architecture

## 4) Architecture target (current phase)
- PostgreSQL (through API) is the business source of truth for critical flows.
- Nominal runtime: `UI -> API -> PostgreSQL`.
- Offline support: local queue buffer with replay on reconnect.
- Local business mode remains only as controlled legacy/rollback path.

## 5) Guardrails
1. Never break critical field flows: POS, KDS, orders, inventory, sessions.
2. Keep changes incremental, reversible, and testable.
3. No global refactor without explicit request.
4. No schema/model changes during cleanup-only phases.
5. Keep docs and backlog aligned with actual code state.

## 6) Working method
For each change proposal include:
- Objective
- Impacted files
- Change summary
- Risks
- Manual tests
- Simple rollback

Execution rules:
- 1 theme = 1 lot = 1 commit/PR sequence
- Validate after each lot (`quality`, targeted tests, smoke checks)
- Keep CI green before merge

## 7) Definition of Done for current phase
Phase is considered closed when:
- Offline sync lots are implemented and technically validated
- Remaining manual gate items are explicitly tracked and signed (GO/NO-GO)
- Repo/docs/backlog are coherent with real implementation state
- No blocking regression on critical flows

## 8) Critical validation baseline
Minimum checks:
1. Open session
2. Create POS order and verify KDS visibility
3. Verify stock consistency
4. Close session and verify coherence
5. Offline degradation behavior and replay behavior
6. Concurrency safety on limited stock

## 9) Decision log (high level)
- 2026-03-04: V1 started as standalone local-first MVP.
- 2026-03-06 to 2026-03-10: migration foundations to API + PostgreSQL completed.
- 2026-03-10: final stabilization/cleanup before BL-019 pre-prod phase.
