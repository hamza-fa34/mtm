# Molly's Truck Manager

Application metier pour food-truck: POS, KDS, stock, recettes/marges, CRM, sessions de caisse et depenses.

## Structure Monorepo

```text
mtm/
|- apps/
|  |- web/      # Frontend React + Vite
|  `- api/      # Backend NestJS + Prisma + PostgreSQL
|- docs/
|- infra/
|  `- docker-compose.yml
`- .github/workflows/
```

## Prerequis
- Node.js 20+
- npm 10+
- Docker + Docker Compose

## Commandes Racine
- `npm run web:dev`
- `npm run web:build`
- `npm run web:quality:ci`
- `npm run web:e2e`
- `npm run api:build`
- `npm run api:config:sanity`
- `npm run quality:ci` (web quality + api build)
- `npm run docker:up`
- `npm run docker:down`
- `npm run db:backup:dump`
- `npm run db:backup:restore -- ./backups/<file.dump>`
- `node scripts/ops-health-check.cjs http://localhost:4000/api`

## Frontend (apps/web)
Configuration:
1. Copier `apps/web/.env.example` vers `apps/web/.env.local`
2. Variables principales:
   - `VITE_DATA_SOURCE=api|local` (recommande: `api`, `local` = mode legacy/rollback)
   - `VITE_API_BASE_URL=http://localhost:4000/api`

Lancement local:
- `npm --prefix apps/web install`
- `npm --prefix apps/web run dev`
- E2E web (deterministe): `npm --prefix apps/web run e2e` (mode `local` par defaut)
- E2E web en mode API: `VITE_DATA_SOURCE=api npm --prefix apps/web run e2e`

## Backend (apps/api)
Lancement local:
- `npm --prefix apps/api install`
- `npm --prefix apps/api run prisma:generate`
- `npm --prefix apps/api run prisma:migrate:deploy`
- `npm --prefix apps/api run start:dev`

## Docker (infra)
Stack complete:
- `docker compose -f infra/docker-compose.yml --profile fullstack up --build -d`
- Par defaut, le frontend tourne en `VITE_DATA_SOURCE=api` (mode nominal PostgreSQL).
- Override possible (legacy/diagnostic): `VITE_DATA_SOURCE=local docker compose -f infra/docker-compose.yml --profile fullstack up --build -d`

Arret:
- `docker compose -f infra/docker-compose.yml down`

URLs:
- Frontend: `http://localhost:3000`
- API: `http://localhost:4000/api`
- Health: `http://localhost:4000/api/health`
- Readiness: `http://localhost:4000/api/health/readiness`

## Observability (Minimum)
- Structured logs are emitted by API for:
  - `event=http_request`
  - `event=http_error`
- `x-request-id` is returned and reused for request/error correlation.
- Minimum runbooks:
  - `docs/operations/RUNBOOK_INCIDENT_RESPONSE.md`
  - `docs/operations/OBSERVABILITY_MINIMUM.md`
  - `docs/operations/OBSERVABILITY_ALERT_MATRIX.md`

Automated monitor:
- Workflow: `.github/workflows/ops-monitor.yml`
- Configure repo variable: `OPS_BASE_URL` (target API base URL, including `/api`)
 
Roadmap (next phase):
- `docs/phases/PHASE_NEXT_BL019.md`

## CI
- Workflow: `.github/workflows/ci.yml`
- Jobs:
  - Frontend quality + e2e (`apps/web`)
  - Backend build + Prisma + e2e (`apps/api`)
  - Docker build front + api
