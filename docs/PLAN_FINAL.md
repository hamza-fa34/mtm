# Plan Final - Molly's Truck Manager

## Objectif Global
Transformer le MVP actuel en produit robuste, sans casser les flux terrain critiques (POS, KDS, EndOfDay), avec une migration progressive vers une architecture complete.

## Etat global au 2026-03-06
- Phases 0 -> 4: executees et validees.
- BL-017: cloture (`DONE/GO`).
- Prochaine etape: revue documentaire finale puis ouverture de la phase suivante.

## Phase 0 - Decisions Metier (Semaine 1)
Objectif: verrouiller les regles business avant tout developpement.

Livrables:
- Scope V1.1 valide (in / out)
- Regles metier formalisees: POS, KDS, stock, fidelite, cloture session
- Matrice roles/droits MANAGER vs STAFF
- KPI de succes produit + exploitation
- Liste des 10 scenarios critiques terrain

Definition of Done:
- Objectif 3 mois valide
- Scope V1.1 valide
- Regles metier critiques documentees
- Matrice roles/droits validee
- 10 scenarios critiques valides

## Phase 1 - Stabilisation Data Safety (Semaines 2-3)
Objectif: securiser les donnees en mode stand-alone.

Livrables:
- Export global JSON
- Import global JSON avec validation
- Backup automatique a la cloture de session
- Ecran Data Management (Export / Import / Reset protege)
- Reset protege (double confirmation + manager)

Definition of Done:
- Export JSON teste
- Import JSON teste (cas nominal + erreurs)
- Backup auto session verifie
- Reset protege valide
- Aucune regression POS/KDS/EndOfDay

## Phase 2 - Hygiene Repo + Docs + Qualite (Semaines 3-4)
Objectif: rendre le projet maintenable et pilotable.

Livrables:
- README operationnel
- Conventions repo/code (naming, structure, PR)
- Scripts qualite stabilises (`lint`, `build`)
- Test plan materialise (document + checklist)
- Premiers tests unitaires critiques (`utils.ts`)

Definition of Done:
- README a jour
- Regles contribution ecrites
- `npm run lint` passe
- `npm run build` passe
- Test plan exploitable

## Phase 3 - Dockerisation Front (Semaine 5)
Objectif: environnement standard et reproductible.

Livrables:
- Dockerfile frontend (dev + prod)
- docker-compose minimal
- Documentation execution Docker
- Verification run/build/preview en conteneur

Definition of Done:
- `docker compose up` fonctionne
- Build prod Docker OK
- Variables d'environnement documentees
- Runbook local valide

## Phase 4 - Data Layer + Preparation Backend/DB (Semaines 6-8)
Objectif: preparer la migration sans casser l'existant.

Livrables:
- Modele de donnees cible (PostgreSQL)
- Contrats API prioritaires (auth, orders, products, inventory, customers)
- Couche d'abstraction data (mode local puis mode API)
- Plan de migration localStorage -> DB (import + rollback)
- Extension du test plan (integration + regression)

Definition of Done:
- Schema DB valide
- Contrats API valides
- Strategie migration ecrite
- Plan rollback defini
- Tests integration prioritaires definis

## Regle de Pilotage
- 1 theme = 1 ticket = 1 PR
- Pas de refactor global sans besoin explicite
- Chaque ticket doit inclure: objectif, risque, test, rollback
