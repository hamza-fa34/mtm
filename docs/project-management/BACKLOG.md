# Backlog Priorise

## Legende
- Priorite: `P0` (critique), `P1` (haute), `P2` (moyenne), `P3` (basse)
- Effort: `S`, `M`, `L`
- Statut: `TODO`, `IN_PROGRESS`, `DONE`

| ID | Priorite | Tache | Effort | Dependances | Statut |
|---|---|---|---|---|---|
| BL-001 | P0 | Export global JSON (toutes entites) | M | Phase 0 validee | DONE |
| BL-002 | P0 | Import global JSON avec validations | L | BL-001 | DONE |
| BL-003 | P0 | Backup automatique a la cloture session | M | BL-001 | DONE |
| BL-004 | P0 | Ecran Data Management (Export/Import/Reset) | M | BL-001, BL-002, BL-003 | DONE |
| BL-005 | P0 | Reset protege (manager + double confirmation) | S | BL-004 | DONE |
| BL-006 | P1 | Materialiser 10 scenarios critiques (execution + suivi) | S | docs/validation/TEST_PLAN.md | DONE |
| BL-007 | P1 | Hardening erreurs flux POS/KDS/stock | M | BL-006 | DONE |
| BL-008 | P2 | Conventions contribution et checklist PR | S | - | DONE |
| BL-009 | P2 | Tests unitaires utils critiques (TVA, couts, stock) | M | BL-008 | DONE |
| BL-010 | P2 | Stabilisation scripts qualite (lint/build) | S | - | DONE |
| BL-011 | P3 | Dockerfile frontend (dev + prod) | M | P0/P1 OK | DONE |
| BL-012 | P3 | docker-compose minimal + doc usage | M | BL-011 | DONE |
| BL-013 | P4 | Modele de donnees cible PostgreSQL | L | P0/P1 stabilises | DONE |
| BL-014 | P4 | Contrats API prioritaires (auth/orders/products/inventory/customers) | L | BL-013 | DONE |
| BL-015 | P4 | Couche abstraction data (local/api) | L | BL-014 | DONE |
| BL-016 | P4 | Plan migration localStorage -> DB + rollback | M | BL-013, BL-015 | DONE |
| BL-017 | P4 | Ecritures transactionnelles + migration reelle + quality gates pro | L | BL-016 | DONE |
| BL-018A | P5 | Pre-prod hardening config + secrets | M | BL-017 | DONE |
| BL-018B | P5 | Pre-prod hardening security HTTP baseline | M | BL-018A | DONE |
| BL-018C | P5 | Pre-prod observability ready + request correlation | M | BL-018B | DONE |
| BL-018D | P5 | Pre-prod backup/restore automatisables | M | BL-018C | DONE |
| BL-018E | P5 | Pre-prod CI gate renforce | M | BL-018D | DONE |
| BL-018F | P5 | Observabilite minimale exploitable (alert policy + drill) | S | BL-018C | DONE |
| BL-017R | P5 | Revalidation finale metier mode API + offline replay | M | BL-017, BL-018F, Lot5 tech | DONE |
| BL-018G | P5 | Final cleanup and consistency pass (docs/repo/e2e determinism) | S | BL-018F | DONE |

## Prochaine Action Recommandee
- Demarrer BL-019 (monitoring GitHub active + prepa pre-prod).
