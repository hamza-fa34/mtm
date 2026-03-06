# BL-017 - Checklist d'Execution (Professionnalisation)

## Mode d'utilisation
- 1 theme = 1 ticket = 1 PR.
- Pas de lot suivant tant que le lot courant n'est pas `GO`.
- Commit + push a la fin de chaque lot valide.

## Statut global
- Date de lancement:
- Responsable:
- Branche:
- Environnement cible:

## Lots et avancement

| Lot | Objectif | Statut (`TODO`/`IN_PROGRESS`/`DONE`) | GO/NO-GO |
|---|---|---|---|
| L1 | Orders write transactionnel | IN_PROGRESS | NO-GO |
| L2 | Inventory write transactionnel | IN_PROGRESS | NO-GO |
| L3 | Sessions / End-of-Day transactionnel | IN_PROGRESS | NO-GO |
| L4 | Auth/roles backend stricts | IN_PROGRESS | NO-GO |
| L5 | Migration reelle local -> DB (cutover controle) | TODO | NO-GO |
| L6 | Tests integration + E2E critiques | TODO | NO-GO |
| L7 | CI/CD minimale pro + observabilite + runbooks | TODO | NO-GO |

---

## L1 - Orders write transactionnel
### Checklist
- [x] Endpoint `POST /orders` transactionnel (Prisma `$transaction`)
- [x] Idempotency key pour creation commande
- [x] Verification session ouverte obligatoire
- [x] Verification stock suffisant au moment de la commande
- [x] Tests integration backend pour succes + echec atomique
- [ ] Validation manuelle POS -> KDS -> recap
- [x] Commit + push
### Critere GO
- [ ] Aucune commande incoherente observee sur 10 scenarios critiques

## L2 - Inventory write transactionnel
### Checklist
- [x] Endpoint write achats (`purchase`) transactionnel
- [x] Endpoint write pertes (`waste`) transactionnel
- [x] Recalcul stock/cout coherent en transaction
- [x] Blocage stock negatif
- [x] Tests integration sur mouvements stock
- [ ] Validation manuelle ecrans inventory
- [x] Commit + push
### Critere GO
- [ ] Stock et cout moyen restent coherents apres scenarios d'achat/perte

## L3 - Sessions / End-of-Day transactionnel
### Checklist
- [x] Endpoint `sessions/open` avec contrainte "1 session ouverte max"
- [x] Endpoint `sessions/close` transactionnel
- [x] Rapprochement total ventes / moyens de paiement / TVA
- [x] Backup de secours maintenu
- [x] Tests integration sur ouverture/fermeture et echec
- [ ] Validation manuelle EndOfDay
- [x] Commit + push
### Critere GO
- [ ] Cloture session fiable sans perte de donnees

## L4 - Auth / Roles backend stricts
### Checklist
- [x] Guards backend role-based sur endpoints critiques
- [x] Protection manager sur actions sensibles
- [x] PIN hash bcrypt uniquement (pas de fallback en clair en prod)
- [x] Reponses 401/403 homogenes
- [x] Tests integration auth/permission
- [x] Commit + push
### Critere GO
- [ ] Aucune action critique possible sans role autorise

## L5 - Migration reelle local -> DB
### Checklist
- [ ] Script/import migration depuis export JSON
- [ ] Dry-run migration + rapport d'ecarts
- [ ] Cutover par domaine (orders/inventory/sessions)
- [ ] Fallback local seulement en secours controle
- [ ] Procedure rollback data testee
- [ ] Commit + push
### Critere GO
- [ ] Donnees historiques et donnees nouvelles coherentes apres cutover

## L6 - Tests integration + E2E
### Checklist
- [ ] Suite integration backend (Jest + Supertest + DB test)
- [ ] Scenarios E2E critiques front (Playwright)
- [ ] Scenarios manuels metier mis a jour
- [ ] Non-regression POS/KDS/session validee
- [ ] Commit + push
### Critere GO
- [ ] Pipeline tests verte sur tous les flux critiques

## L7 - CI/CD + Observabilite + Runbooks
### Checklist
- [ ] CI front (typecheck/test/build)
- [ ] CI back (build/prisma validate/tests integration)
- [ ] Build Docker front+api
- [ ] Logs structures backend + gestion erreurs standardisee
- [ ] Runbook incident + runbook rollback publies
- [ ] Strategie backups DB (dump + restore teste)
- [ ] Commit + push
### Critere GO
- [ ] Environnement exploitable avec diagnostics et rollback operationnels

---

## Gate final "Ready for next phase"
- [ ] L1 a L7 en `DONE`
- [ ] Aucun `NO-GO` ouvert
- [ ] Checklist test metier signee
- [ ] Decision de passage validee (GO prod-ready phase suivante)
