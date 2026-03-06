# MTM API (NestJS)

Backend service for Molly's Truck Manager.

## Stack
- NestJS (TypeScript)
- PostgreSQL
- Prisma

## Local Run (without Docker)
1. `npm install`
2. Copy `.env.example` to `.env` and adjust values if needed.
3. `npm run config:sanity`
4. `npm run prisma:generate`
5. `npm run prisma:migrate:deploy`
6. `npm run start:dev`
7. Open `http://localhost:4000/api`

## Required Environment Variables
- `DATABASE_URL`
- `JWT_ACCESS_SECRET`
- `JWT_REFRESH_SECRET`
- `JWT_ACCESS_TTL`
- `JWT_REFRESH_TTL`
- `ALLOW_PLAIN_PIN_LOGIN`
- `CORS_ALLOWED_ORIGINS`
- `RATE_LIMIT_WINDOW_MS`
- `RATE_LIMIT_MAX_REQUESTS`

## Docker Run
From project root:
- `docker compose -f infra/docker-compose.yml --profile fullstack up --build -d`

API health paths:
- `http://localhost:4000/api/health`
- `http://localhost:4000/api/health/readiness`

## Notes
- Global API prefix is `/api`
- Default port is `4000`
