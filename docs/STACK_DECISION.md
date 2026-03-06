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
- No big-bang rewrite
- No complex offline sync architecture for now
- No direct production cutover without staging validation

## Immediate Next Milestones
1. Bring up infrastructure services in Docker (`frontend`, `api`, `db`) - DONE
2. Keep frontend fully operational as-is - DONE
3. Add backend health endpoint and env configuration - DONE
4. Initialize Prisma schema and first migration skeleton - DONE
5. Start module-by-module migration with low-risk domain first - DONE (BL-016/BL-017)

## Future Evolution Path
- Step 1: Activate GitHub ops monitor once staging URL is available (`OPS_BASE_URL`)
- Step 2: Staging release hardening (secrets lifecycle + access policy + incident response)
- Step 3: Production readiness gate (GO/NO-GO with runbooks and restore proof)
- Step 4: Controlled production rollout
