# Stack Decision - Target Architecture

## Decision Date
- 2026-03-05

## Final Stack (Validated)
- Frontend: React + TypeScript + Vite
- Backend: NestJS (TypeScript)
- Database: PostgreSQL
- ORM: Prisma
- Auth: JWT + refresh token
- RBAC: MANAGER / STAFF

## Why This Stack
- Coherence TypeScript end-to-end (front + back)
- NestJS provides clear modular architecture for long-term maintainability
- PostgreSQL fits transactional needs (orders, stock, sessions, audit)
- Prisma gives migration/versioning foundation and strong developer velocity
- Docker-first setup keeps local/dev/prod parity and eases future scaling

## Non-Goals For This Step
- No immediate migration of frontend data to backend
- No full domain implementation yet
- No production deployment hardening yet

## Immediate Next Milestones
1. Bring up infrastructure services in Docker (`frontend`, `api`, `db`)
2. Keep frontend fully operational as-is
3. Add backend health endpoint and env configuration
4. Initialize Prisma schema and first migration skeleton
5. Start module-by-module migration with low-risk domain first

## Future Evolution Path
- Step 1: Read-only backend endpoints for products/settings
- Step 2: Write flows (orders, sessions, stock adjustments)
- Step 3: Auth + RBAC enforcement server-side
- Step 4: Data migration tools (`localStorage -> PostgreSQL`)
- Step 5: Observability, backups, and deployment hardening
