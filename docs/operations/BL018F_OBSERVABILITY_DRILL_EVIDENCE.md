# BL-018F Observability Drill - Evidence

Date: 2026-03-06
Environment: Docker profile `fullstack` (`frontend + api + db`)

## Scope
- Validate minimum observability behavior in incident conditions.
- Confirm liveness/readiness behavior and request correlation.

## Execution Timeline

1. Baseline checks
- `GET /api/health` -> `200`
- `GET /api/health/readiness` -> `200`

2. Request correlation sample
- `GET /api/health` with `x-request-id: drill-health-ok-001` -> `200`
- `GET /api/not-found-drill` with `x-request-id: drill-notfound-001` -> `404`
- Log evidence captured with matching `requestId` values.

3. API outage simulation
- Action: `docker stop mtm_api_dev`
- Result: `GET /api/health` failed with connection error (expected)
- Recovery action: `docker start mtm_api_dev`
- Readiness recovered in about `69s`

4. Dependency failure simulation (DB down)
- Action: `docker stop mtm_db`
- Result: `GET /api/health/readiness` with `x-request-id: drill-readiness-503-001` -> `503`
- Log evidence:
  - `http_error` with `requestId=drill-readiness-503-001` and `statusCode=503`
  - corresponding `http_request` for same `requestId`
- Recovery action: `docker start mtm_db`
- Result after restart: `GET /api/health/readiness` -> `200`

## Key Evidence Extracts
- `{"event":"http_request","requestId":"drill-health-ok-001","path":"/api/health","statusCode":200}`
- `{"event":"http_request","requestId":"drill-notfound-001","path":"/api/not-found-drill","statusCode":404}`
- `{"event":"http_error","requestId":"drill-readiness-503-001","path":"/api/health/readiness","statusCode":503}`
- `{"event":"http_request","requestId":"drill-readiness-503-001","path":"/api/health/readiness","statusCode":503}`

## Result
- Status: `GO`
- Observability minimum is operational for pre-prod:
  - health/readiness signals are usable
  - outage/dependency degradation is detectable
  - request correlation via `requestId` works in logs

## Notes
- During dev compose restart, API warm-up may take around 60-70 seconds because `npm ci` and Prisma generation run on start.
