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
| BL-006 | P1 | Materialiser 10 scenarios critiques (execution + suivi) | S | docs/TEST_PLAN.md | DONE |
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

## Prochaine Action Recommandee
- Ouvrir la prochaine phase: ecriture API transactionnelle (orders/inventory/sessions) avec tests d'integration dedies.
