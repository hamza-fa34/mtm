# MTM API (NestJS)

Backend service for Molly's Truck Manager.

## Stack
- NestJS (TypeScript)
- PostgreSQL (via Docker)
- Prisma (planned next step)

## Local Run (without Docker)
1. `npm install`
2. `npm run start:dev`
3. Open `http://localhost:4000/api`

## Docker Run
From project root:
- `docker compose --profile dev --profile backend up --build`

API health path:
- `http://localhost:4000/api`

## Notes
- Global API prefix is `/api`
- Default port is `4000`
