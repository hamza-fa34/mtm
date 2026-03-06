# BL-017 - Campagne Finale de Validation

## Objectif
Finaliser la validation metier + technique BL-017 avant toute nouvelle evolution.

## Statut
- Campagne executee et validee le 2026-03-06.
- Reference de cloture: `docs/BL017_EXECUTION_CHECKLIST.md` (L1 -> L7 en `DONE/GO`).
- Evidence metier: `docs/BL017_L1_10_SCENARIOS_EVIDENCE.md` et `docs/TEST_PLAN.md`.

## Pre-conditions (historique d'execution)
- CI GitHub au vert sur `main`.
- Environnement stable:
  - Front: `npm run dev` ou Docker
  - API + DB: Docker ou local, migrations Prisma appliquees
- Jeu de test:
  - 1 compte `MANAGER`
  - 1 compte `STAFF`
  - Produits/ingredients suffisants pour ventes + mouvements stock
  - 1 produit a stock limite pour test concurrence
  - Export JSON realiste pour validation L5

## Ordre d'execution retenu
1. L4 - Auth/Roles (smoke)
2. L3 - Session open
3. L1 - POS -> commande -> KDS -> statuts
4. L2 - Inventory (achat/perte)
5. L3 - Session close / EndOfDay
6. L5 - Cutover local -> DB (dry-run + apply)
7. L6 - Tests auto + non-regression manuelle
8. L7 - Drill incident + backup/restore + observabilite
9. Gate final GO/NO-GO

## Resultat final (cloture)
- [x] Tous les lots passent de `IN_PROGRESS` a `DONE`.
- [x] Tous les criteres GO par lot sont valides.
- [x] Gate final valide:
  - [x] L1 a L7 en `DONE`
  - [x] Aucun `NO-GO` ouvert
  - [x] Checklist test metier signee
  - [x] Decision de passage validee

## Livrables de cloture
- [x] PV de campagne (execution + resultats)
- [x] Checklist BL-017 mise a jour
- [x] Eventuels ecarts reportes au backlog si necessaire
