# Observability Minimum (Pre-Prod)

## Scope
This document defines the minimum observability baseline to operate MTM safely before production scaling.

Scope in this phase:
- API health and readiness checks
- Structured API logs with request correlation
- Minimal alert policy (availability + readiness + server errors)
- Incident drill process and expected evidence

Out of scope in this phase:
- Full metrics stack (Prometheus/Grafana/Loki)
- Advanced distributed tracing
- SLO error budget automation

## Signals To Monitor

### 1) Availability (liveness)
- Endpoint: `GET /api/health`
- Expected: `200` with `status: ok`
- Failure: `503` or timeout

### 2) Readiness (dependencies)
- Endpoint: `GET /api/health/readiness`
- Expected: `200` with `status: ready`
- Failure: `503` or `status: not_ready`

### 3) API errors
- Source: structured API logs (`event=http_error`)
- Focus: `statusCode >= 500`

## Log Contract (Minimum)
Every request log (`event=http_request`) should include:
- `timestamp`
- `level`
- `event`
- `requestId`
- `method`
- `path`
- `statusCode`
- `durationMs`

Every error log (`event=http_error`) should include:
- `timestamp`
- `level`
- `event`
- `requestId`
- `method`
- `path`
- `statusCode`
- `message`

## Minimal Alert Policy

### Alert A - API Down
- Trigger: `GET /api/health` fails 2 consecutive checks
- Check interval: 30s
- Severity: High
- Immediate action: follow incident runbook triage

### Alert B - Readiness Not Ready
- Trigger: `GET /api/health/readiness` returns non-200 for 2 consecutive checks
- Check interval: 30s
- Severity: High
- Immediate action: validate DB and config status

### Alert C - 5xx Spike
- Trigger: >= 5 server errors (`statusCode >= 500`) in 5 minutes
- Severity: Medium/High (based on user impact)
- Immediate action: correlate by `requestId`, isolate failing route/domain

## Execution Recommendation
Run observability validation in 2 sessions:

### Session 1 - Technical baseline (30-45 min)
1. Verify health/readiness endpoints.
2. Verify structured request/error logs.
3. Validate request correlation with `x-request-id`.

### Session 2 - Incident drill (30-45 min)
1. Stop API intentionally (`docker stop mtm_api_dev`).
2. Verify API down signal and expected behavior.
3. Restart API and verify recovery.
4. Capture evidence in incident notes.

## Evidence Checklist
- Health endpoint responses captured
- Readiness endpoint responses captured
- At least one correlated error trace (`requestId`)
- Incident drill timeline (down, detect, recover)
- Final status: `GO` or `NO-GO`

## Next Step (Later)
When pre-prod traffic increases, add an optional `observability` Docker profile with:
- Uptime checker
- Log storage/aggregation
- Dashboarding

Latest drill evidence:
- `docs/operations/BL018F_OBSERVABILITY_DRILL_EVIDENCE.md`
