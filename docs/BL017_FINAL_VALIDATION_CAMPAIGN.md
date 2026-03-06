# BL-017 - Campagne Finale de Validation

## Objectif
Finaliser la validation metier + technique BL-017 avant toute nouvelle evolution.

## Pre-conditions
- CI GitHub au vert sur `main` (confirme).
- Environnement stable:
  - Front: `npm run dev`
  - API + DB: Docker ou local, migrations Prisma appliquees.
- Jeu de test disponible:
  - 1 compte `MANAGER`
  - 1 compte `STAFF`
  - Produits/ingredients suffisants pour ventes + mouvements stock.
  - Au moins 1 produit a stock limite pour test concurrence.
  - Export JSON realiste (donnees proches prod) pour validation L5.

## Recommandation d'execution
- Campagne recommandee en **3 sessions**:
  1. Session A: L4 + L3(open) + L1 + L2
  2. Session B: L3(close) + L5 + tests de degradation reseau/API
  3. Session C: L6 + L7 + gate final
- Si contrainte temps: minimum **2 sessions** (A+B fusionnes, puis C).
- Pour L5, utiliser un backup JSON realiste (pas uniquement le sample minimal).

## Ordre d'execution recommande (finalisation)
1. **L4 - Auth/Roles (smoke manuel rapide)**
2. **L3 - Session open**
3. **L1 - Flux POS -> commande -> KDS -> statuts**
4. **L2 - Inventory (achat/perte + coherence stock/cout)**
5. **L3 - Session close / EndOfDay**
6. **L5 - Cutover migration local -> DB (dry-run + apply sur backup de test)**
7. **L6 - Validation tests auto (front + back) + controle non-regression manuel**
8. **L7 - Drill operatoire (incident + backup/restore + observabilite)**
9. **Gate final GO/NO-GO BL-017**

---

## Checklist GO/NO-GO par lot

## L1 - Orders write transactionnel
### Validation manuelle
- [ ] Ouvrir session (si necessaire) puis creer 5 commandes POS reelles.
- [ ] Verifier apparition en KDS de chaque commande.
- [ ] Faire evoluer les statuts KDS (`PENDING -> PREPARING -> READY`).
- [ ] Verifier recap ventes/sessions coherent.
- [ ] Verifier un cas d'echec stock insuffisant (commande refusee proprement).
- [ ] Test de concurrence: 2 commandes quasi simultanees sur produit a stock limite.
  Attendu:
  - [ ] une seule commande consomme le stock restant
  - [ ] l'autre est rejetee proprement (`409` ou equivalent)
  - [ ] aucun stock negatif / incoherent
### GO
- [ ] Aucun ticket incoherent (total/items/status) sur l'echantillon.
- [ ] Aucun effet de bord sur KDS/POS.
- [ ] Concurrence commandes validee sans incoherence stock.

## L2 - Inventory write transactionnel
### Validation manuelle
- [ ] Creer 2 achats (`purchase`) sur ingredient existant.
- [ ] Creer 2 pertes (`waste`) sur ingredient existant.
- [ ] Verifier recalcul stock/cout moyen apres achat.
- [ ] Verifier rejet perte excedentaire (stock negatif bloque).
- [ ] Verifier ecran inventory coherent (quantites/couts/date).
### GO
- [ ] Stock et cout moyen coherents apres scenarios d'achat/perte.

## L3 - Sessions / End-of-Day transactionnel
### Validation manuelle
- [ ] Verifier impossibilite d'ouvrir une 2e session simultanee.
- [ ] Verifier cloture avec cash final + reconciliation.
- [ ] Verifier archive session et retour dashboard.
- [ ] Verifier backup de secours present apres cloture.
### GO
- [ ] Cloture fiable, sans perte de donnees ni incoherence de recap.

## L4 - Auth / Roles backend stricts
### Validation manuelle
- [ ] `STAFF` ne peut pas executer actions manager (`sessions/open|close`, writes inventory).
- [ ] `MANAGER` peut executer actions sensibles.
- [ ] Endpoints critiques sans token -> `401`.
- [ ] Endpoints token role inadapté -> `403`.
### GO
- [ ] Aucune action critique possible sans role autorise.

## L5 - Migration reelle local -> DB
### Validation manuelle/technique
- [ ] Export backup JSON **realiste** depuis app (donnees representatives).
- [ ] `dry-run` import -> rapport sans anomalie bloquante.
- [ ] `apply` import sur environnement de test.
- [ ] Verifier coherence post-import:
  - [ ] products
  - [ ] customers
  - [ ] inventory
  - [ ] orders
  - [ ] sessions
- [ ] Tester rollback rapide (`VITE_DATA_SOURCE=local` + import backup local si besoin).
### GO
- [ ] Donnees historiques + nouvelles donnees coherentes apres cutover test.

## L6 - Tests integration + E2E
### Validation technique
- [ ] `npm run quality:ci` (front) OK.
- [ ] `npm run e2e` (Playwright front) OK.
- [ ] `api npm run build` OK.
- [ ] `api npm run test:e2e` OK.
- [ ] Controle manuel complementaire T03/T06/T07/T08/T09/T10.
- [ ] Test degradation reseau/API indisponible:
  Etapes:
  - [ ] lancer un flux (ex: consultation produits/clients ou inventory)
  - [ ] couper API (`docker stop mtm_api_dev` ou equivalent)
  - [ ] verifier reaction front par domaine (fallback/message, pas de crash)
  - [ ] relancer API et verifier reprise propre
### GO
- [ ] Tests auto + validations manuelles critiques au vert.
- [ ] Degradation reseau/API geree sans casse du flux critique.

## L7 - CI/CD + Observabilite + Runbooks
### Validation technique/ops
- [ ] Pipeline GitHub verte (front, back, e2e, docker-build).
- [ ] Build Docker front + api OK.
- [ ] Logs structures visibles en execution API.
- [ ] Runbook incident relu + applicable.
- [ ] Runbook backup/restore execute au moins 1 fois avec succes.
### GO
- [ ] Environnement exploitable avec diagnostic + rollback operationnels.

---

## Points de verification finaux pour cloturer L1 -> L7
- [ ] Tous les items de validation manuelle restants sont coches.
- [ ] Tous les criteres GO par lot sont coches.
- [ ] Tous les lots passent de `IN_PROGRESS` a `DONE` dans `docs/BL017_EXECUTION_CHECKLIST.md`.
- [ ] Gate final coche:
  - [ ] L1 a L7 en `DONE`
  - [ ] Aucun `NO-GO` ouvert
  - [ ] Checklist test metier signee
  - [ ] Decision de passage validee

## Livrables de cloture attendus
- PV de campagne (date, testeur, environnement, resultats).
- Checklist BL-017 mise a jour (`DONE` + GO par lot).
- Eventuels ecarts ouverts en backlog (si non bloquant phase suivante).
