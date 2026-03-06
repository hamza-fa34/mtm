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
| L2 | Inventory write transactionnel | DONE | GO |
| L3 | Sessions / End-of-Day transactionnel | DONE | GO |
| L4 | Auth/roles backend stricts | DONE | GO |
| L5 | Migration reelle local -> DB (cutover controle) | DONE | GO |
| L6 | Tests integration + E2E critiques | DONE | GO |
| L7 | CI/CD minimale pro + observabilite + runbooks | DONE | GO |

---

## L1 - Orders write transactionnel
### Checklist
- [x] Endpoint `POST /orders` transactionnel (Prisma `$transaction`)
- [x] Idempotency key pour creation commande
- [x] Verification session ouverte obligatoire
- [x] Verification stock suffisant au moment de la commande
- [x] Tests integration backend pour succes + echec atomique
- [x] Test concurrence: 2 commandes quasi simultanees sur stock limite
- [x] Validation manuelle POS -> KDS -> recap
- [x] Commit + push
### Critere GO
- [ ] Aucune commande incoherente observee sur 10 scenarios critiques
- [x] Aucune incoherence stock observee sous concurrence
- [ ] Evidence renseignee dans `docs/BL017_L1_10_SCENARIOS_EVIDENCE.md`

## L2 - Inventory write transactionnel
### Checklist
- [x] Endpoint write achats (`purchase`) transactionnel
- [x] Endpoint write pertes (`waste`) transactionnel
- [x] Recalcul stock/cout coherent en transaction
- [x] Blocage stock negatif
- [x] Tests integration sur mouvements stock
- [x] Validation manuelle ecrans inventory
- [x] Commit + push
### Critere GO
- [x] Stock et cout moyen restent coherents apres scenarios d'achat/perte

## L3 - Sessions / End-of-Day transactionnel
### Checklist
- [x] Endpoint `sessions/open` avec contrainte "1 session ouverte max"
- [x] Endpoint `sessions/close` transactionnel
- [x] Rapprochement total ventes / moyens de paiement / TVA
- [x] Backup de secours maintenu
- [x] Tests integration sur ouverture/fermeture et echec
- [x] Validation manuelle EndOfDay
- [x] Commit + push
### Critere GO
- [x] Cloture session fiable sans perte de donnees

## L4 - Auth / Roles backend stricts
### Checklist
- [x] Guards backend role-based sur endpoints critiques
- [x] Protection manager sur actions sensibles
- [x] PIN hash bcrypt uniquement (pas de fallback en clair en prod)
- [x] Reponses 401/403 homogenes
- [x] Tests integration auth/permission
- [x] Commit + push
### Critere GO
- [x] Aucune action critique possible sans role autorise

## L5 - Migration reelle local -> DB
### Checklist
- [x] Script/import migration depuis export JSON
- [x] Dry-run migration + rapport d'ecarts
- [x] Validation sur export JSON realiste (volume metier)
- [x] Cutover par domaine (orders/inventory/sessions)
- [x] Fallback local seulement en secours controle
- [x] Procedure rollback data testee
- [x] Commit + push
### Critere GO
- [x] Donnees historiques et donnees nouvelles coherentes apres cutover

## L6 - Tests integration + E2E
### Checklist
- [x] Suite integration backend (Jest + Supertest + DB test)
- [x] Scenarios E2E critiques front (Playwright)
- [x] Test degradation reseau/API indisponible
- [x] Scenarios manuels metier mis a jour
- [x] Non-regression POS/KDS/session validee
- [x] Commit + push
### Critere GO
- [x] Pipeline tests verte sur tous les flux critiques
- [x] Frontend degrade proprement quand API indisponible

## L7 - CI/CD + Observabilite + Runbooks
### Checklist
- [x] CI front (typecheck/test/build)
- [x] CI back (build/prisma validate/tests integration)
- [x] Build Docker front+api
- [x] Logs structures backend + gestion erreurs standardisee
- [x] Runbook incident + runbook rollback publies
- [x] Strategie backups DB (dump + restore teste)
- [x] Commit + push
### Critere GO
- [x] Environnement exploitable avec diagnostics et rollback operationnels

---

## Gate final "Ready for next phase"
- [ ] L1 a L7 en `DONE`
- [ ] Aucun `NO-GO` ouvert
- [ ] Checklist test metier signee (`docs/TEST_PLAN.md` + `docs/BL017_L1_10_SCENARIOS_EVIDENCE.md`)
- [ ] Decision de passage validee (GO prod-ready phase suivante)
