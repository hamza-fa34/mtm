# Observability Alert Matrix (Minimum)

## Objective
Define a minimal, actionable alert policy for pre-prod operations.

## Alert Channels
- Primary: GitHub Actions notifications (failed `Ops Monitor` workflow)
- Secondary: incident handling via `docs/RUNBOOK_INCIDENT_RESPONSE.md`

## Owners
- Primary owner: Project maintainer
- Backup owner: Tech lead / release owner of current phase

## Alert Rules

### A1 - API Liveness Down
- Signal: `GET /api/health`
- Trigger: 2 consecutive failures in one monitor run
- Severity: High
- Action:
  1. Check API container/process status
  2. Check recent API logs
  3. Follow incident runbook triage

### A2 - API Readiness Not Ready
- Signal: `GET /api/health/readiness`
- Trigger: 2 consecutive failures in one monitor run
- Severity: High
- Action:
  1. Validate DB availability
  2. Validate runtime config status
  3. Recover dependencies and re-check readiness

### A3 - 5xx Spike (Operational Manual Rule)
- Signal: structured logs (`event=http_error`, `statusCode >= 500`)
- Trigger: >= 5 errors over 5 minutes
- Severity: Medium/High (depending on user impact)
- Action:
  1. Correlate by `requestId`
  2. Isolate failing route/domain
  3. Apply containment from incident runbook

## Execution Mode
- Scheduled monitor: every 10 minutes (`.github/workflows/ops-monitor.yml`)
- Manual monitor: `workflow_dispatch` with optional custom base URL and thresholds

## Required Repo Variable
- `OPS_BASE_URL` (example: `https://staging.example.com/api`)

If `OPS_BASE_URL` is not set:
- scheduled workflow runs but is skipped by script (`exit 0`)
- no active alerting is produced

## Verification Checklist
- [ ] `OPS_BASE_URL` configured in repo variables
- [ ] `Ops Monitor` workflow run succeeds for healthy environment
- [ ] Simulated outage produces failed workflow run
- [ ] Incident handled using runbook steps
