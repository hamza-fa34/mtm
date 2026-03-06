# BL-019 - Next Phase (Monitoring Activation + Production Preparation)

## Positioning
BL-019 starts after BL-018 closure and keeps the same rule:
- progressive changes
- no business logic break
- 1 theme = 1 ticket = 1 PR

This phase is intentionally deferred until a staging URL is available.

## Objectives
1. Activate GitHub operational monitoring on real staging endpoint.
2. Prepare production entry criteria without immediate production deployment.
3. Keep rollback and data safety as first-class constraints.

## Proposed Lots

### BL-019A - Monitoring Activation (GitHub)
- Set repository variable `OPS_BASE_URL` to staging API URL (`.../api`).
- Run `.github/workflows/ops-monitor.yml` manually and validate success path.
- Simulate controlled outage and validate failed run path + incident handling.
- Deliverable: monitoring activation evidence.

### BL-019B - Security & Access Readiness
- Review secrets lifecycle and ownership.
- Enforce least-privilege permissions for deployment/ops accounts.
- Freeze baseline policy for CORS/rate-limit values per environment.
- Deliverable: security readiness checklist.

### BL-019C - Data Safety Rehearsal
- Execute backup + restore rehearsal on staging-like dataset.
- Validate restore timing and post-restore smoke checks.
- Deliverable: signed restore rehearsal report.

### BL-019D - GO/NO-GO Gate
- Consolidate evidence from monitoring/security/restore drills.
- Run final checklist with explicit GO or NO-GO.
- Deliverable: production preparation decision record.

## Execution Order
1. BL-019A
2. BL-019B
3. BL-019C
4. BL-019D

## Risks To Control
- Monitoring false confidence before staging endpoint is stable.
- Secrets drift between local/dev/staging.
- Backup scripts validated on toy data only.
- Production pressure before full GO criteria is met.

## Entry Criteria
- BL-018 docs closed and aligned.
- Staging API URL reachable from GitHub Actions.
- Named owners for ops incident response.

## Exit Criteria
- Monitoring active and validated
- Security and access checklist passed
- Restore rehearsal passed on realistic dataset
- Explicit GO/NO-GO record produced
