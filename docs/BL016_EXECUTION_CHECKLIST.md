# BL-016 - Checklist d'Execution (Tous les Lots)

## Regle d'execution
- Ordre impose: `categories -> settings -> products -> customers -> inventory -> orders -> sessions/end-of-day`
- 1 lot = 1 PR logique = 1 commit + 1 push
- Aucune bascule du lot suivant sans validation Go/No-Go du lot courant

## Definition de Done par lot
- Build frontend OK: `npm run build`
- Quality gate OK: `npm run quality:ci`
- API domaine repond (si mode API active)
- Fallback local verifie
- Rollback config verifie (`VITE_DATA_SOURCE=local`)
- Commit + push effectues

## Lot 1 - Categories
Objectif: basculer lecture categories vers adapter `api -> fallback local`

Checklist:
- [x] Creer `categoriesDataAdapter` (lecture API + fallback constantes/local)
- [x] Brancher les composants consommateurs de categories
- [x] Verifier comportement POS/Menu identique
- [x] Tester API disponible
- [x] Tester API indisponible (fallback local)
- [x] Valider `npm run quality:ci`
- [ ] Commit: `feat(front): migrate categories to adapter with fallback`
- [ ] Push `origin/main`

## Lot 2 - Settings
Objectif: consolider la bascule settings (deja active) et preparer write API en etape suivante

Checklist:
- [x] Verifier mapping complet `TruckSettings` front/back
- [x] Valider valeurs par defaut + fallback
- [x] Verifier non-regression Sidebar/SettingsView
- [x] Valider `npm run quality:ci`
- [ ] Commit: `chore(front): harden settings migration checks`
- [ ] Push `origin/main`

## Lot 3 - Products
Objectif: stabiliser lecture API des produits et compatibilite recette/variants

Checklist:
- [x] Verifier mapping `recipe`, `variants`, `loyaltyPrice`
- [x] Verifier affichage POS/Menu/KDS
- [x] Tester API vide -> fallback local
- [x] Tester API KO -> fallback local
- [x] Valider `npm run quality:ci`
- [ ] Commit: `feat(front): harden products adapter migration`
- [ ] Push `origin/main`

## Lot 4 - Customers
Objectif: stabiliser lecture API customers sans casser CRM/fidelite locale

Checklist:
- [x] Verifier mapping `loyaltyPoints`, `lastVisit`
- [x] Verifier creation client locale toujours fonctionnelle
- [x] Tester API vide/KO -> fallback local
- [x] Valider `npm run quality:ci`
- [ ] Commit: `feat(front): harden customers adapter migration`
- [ ] Push `origin/main`

## Lot 5 - Inventory
Objectif: migration reelle inventory (lecture API, ecriture locale au debut)

Checklist:
- [x] Verifier mapping unites (`kg/g/L/ml/unit`)
- [x] Verifier mapping reasons wastes (`Peremption/Péremption`)
- [x] Verifier statut stock produit
- [x] Tester API vide/KO -> fallback local
- [x] Valider `npm run quality:ci`
- [ ] Commit: `feat(front): migrate inventory with guarded fallback`
- [ ] Push `origin/main`

## Lot 6 - Orders
Objectif: migration reelle orders (lecture API, ecriture locale au debut)

Checklist:
- [x] Verifier mapping order/items/total/status/payment/serviceMode
- [x] Verifier POS/KDS non regressifs
- [x] Tester API vide/KO -> fallback local
- [x] Verifier numerotation tickets
- [x] Valider `npm run quality:ci`
- [ ] Commit: `feat(front): migrate orders with guarded fallback`
- [ ] Push `origin/main`

## Lot 7 - Sessions / End-of-Day
Objectif: finaliser migration sessions sans perte data

Checklist:
- [ ] Verifier ouverture/fermeture session
- [ ] Verifier recap ventes/methodes/TVA
- [ ] Verifier backup auto en cloture
- [ ] Verifier rollback complet via export/import JSON
- [ ] Valider `npm run quality:ci`
- [ ] Commit: `feat(front): migrate sessions with rollback safeguards`
- [ ] Push `origin/main`

## Procedure Commit + Push (a appliquer a chaque lot)
1. `git add -A`
2. `git commit -m "<message lot>"`
3. `git push origin main`
4. Verifier: `git status --short` (doit etre vide)
