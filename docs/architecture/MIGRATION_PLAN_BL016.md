# BL-016 - Plan de Migration Operationnel

## Objectif
Definir une migration progressive de `localStorage` vers `API + PostgreSQL`, sans casser les flux critiques du MVP (POS, KDS, inventory, sessions/EndOfDay).

Ce document couvre:
- ordre de migration domaine par domaine
- mode de lecture/ecriture pendant chaque etape
- fallback et conditions de bascule
- procedure de rollback

## Principes de migration
- Pas de big-bang: une bascule par domaine.
- Lecture API seulement quand le domaine est explicitement active.
- Ecriture locale maintenue tant que la stabilite API n'est pas prouvee.
- Fallback automatique vers local si API indisponible/incoherente.
- Toute bascule doit etre reversible dans la meme release.

## Ordre de migration (domaine par domaine)
Ordre retenu:
1. `categories`
2. `settings`
3. `products`
4. `customers`
5. `inventory`
6. `orders`
7. `sessions / end-of-day`

Justification:
- commencer par les donnees de reference (faible risque)
- ensuite domaines semi-critiques (customers)
- finir par domaines transactionnels critiques (orders/sessions)

## Plan operationnel par domaine

### 1) Categories
- Source actuelle: `constants.tsx` (statique frontend)
- Source cible: API `GET /api/categories` + table `Category`
- Lecture: `local` par defaut, `api` via data adapter sous flag
- Ecriture: locale uniquement (pas d'ecriture API dans cette etape)
- Fallback: si API vide/KO -> conserver categories locales
- Conditions de bascule:
  - endpoint stable en environnement cible
  - mapping `color` + `ordre` valide
  - navigation POS/menu intacte

### 2) Settings
- Source actuelle: `localStorage` (`molls_settings`)
- Source cible: API `GET /api/settings` + table `TruckSettings`
- Lecture: adapter `api -> fallback local` (deja en place)
- Ecriture: locale (API write reportee)
- Fallback: API KO/vide -> local
- Conditions de bascule:
  - `settings` charges en API sans regression UI
  - valeurs TVA et labels coherents
  - lock/login et sidebar non impacts

### 3) Products
- Source actuelle: `localStorage` (`molls_products`) + seed constants
- Source cible: API `GET /api/products` + tables `Product/Variant/RecipeItem`
- Lecture: adapter `api -> fallback local` (deja en place)
- Ecriture: locale (API write reportee)
- Fallback: API vide/KO -> local
- Conditions de bascule:
  - structure produit complete (variants + recipe)
  - affichage POS/menu identique
  - calculs prix/TVA inchanges

### 4) Customers
- Source actuelle: `localStorage` (`molls_customers`) + seed constants
- Source cible: API `GET /api/customers` + table `Customer`
- Lecture: adapter `api -> fallback local` (deja en place)
- Ecriture: locale (API write reportee)
- Fallback: API vide/KO -> local
- Conditions de bascule:
  - listing CRM correct
  - points fidelite et `lastVisit` coherents
  - creation customer locale non bloquee

### 5) Inventory
- Source actuelle: `localStorage` (`molls_ingredients`, `molls_wastes`)
- Source cible: API `GET /api/inventory/ingredients|wastes|purchases` + tables `Ingredient/Waste/Purchase`
- Lecture: adapter `api -> fallback local` (prepare)
- Ecriture: locale tant que write API non valide
- Fallback: API vide/KO -> local
- Conditions de bascule:
  - unites normalisees (`kg/g/L/ml/unit`)
  - couts et stocks non regressifs
  - statut stock produit inchange (AVAILABLE/CRITICAL/OUT_OF_STOCK)

### 6) Orders
- Source actuelle: `localStorage` (`molls_orders`)
- Source cible: API `GET /api/orders` + tables `Order/OrderItem`
- Lecture: adapter `api -> fallback local` (prepare)
- Ecriture: locale tant que write API transactionnelle non activee
- Fallback: API vide/KO -> local
- Conditions de bascule:
  - ticket order complet (items, total, payment, serviceMode)
  - numerotation order stable
  - KDS statut workflow intact

### 7) Sessions / End-of-Day
- Source actuelle: `localStorage` (`molls_current_session`, `molls_sessions_history`) + auto backup
- Source cible: API + table `DailySession`
- Lecture: locale prioritaire pendant la phase de securisation
- Ecriture: locale uniquement jusqu'a validation forte
- Fallback: toujours local + backup JSON
- Conditions de bascule:
  - cloture session sans perte
  - recap ventes/methodes TVA identique
  - backup auto continue de fonctionner

## Strategie de fallback (runtime)
- Si API indisponible:
  - timeout/erreur HTTP -> fallback local immediat
  - afficher statut `fallback` (deja expose en UI)
- Si DB vide:
  - si local contient des donnees, ne pas remplacer par vide
  - conserver local comme source active
- Si donnees incoherentes:
  - ignorer payload API du domaine
  - logguer erreur (console/dev)
  - continuer sur local
- Si regression fonctionnelle:
  - remettre `VITE_DATA_SOURCE=local`
  - desactiver domaine concerne (feature flag)

## Strategie de rollback

### Niveau 1 - Configuration (immediat)
- Action: `VITE_DATA_SOURCE=local`
- Effet: toute lecture repasse locale
- Delai: instantane (redemarrage front)

### Niveau 2 - Domaine cible (controle)
- Action: desactiver seulement le domaine en cours de bascule
- Effet: rollback partiel, autres domaines inchanges
- Delai: court (rebuild/deploy front)

### Niveau 3 - Donnees (restauration)
- Action: restaurer export JSON global ou auto-backup
- Effet: retour etat pre-migration
- Delai: selon volume de donnees

### Niveau 4 - Release
- Action: rollback release front/back vers tag precedent
- Effet: retour complet de la stack
- Delai: selon pipeline de deploiement

## Garde-fous MVP (obligatoires)
- POS/KDS/sessions ne changent pas dans la meme PR qu'une bascule data critique.
- 1 domaine = 1 PR = 1 checklist de tests.
- Go/No-Go explicite avant chaque domaine.
- Verifier `quality:ci` a chaque etape.
- En mode API, refuser toute suppression implicite de donnees locales.
- Toujours conserver export/import JSON operationnel.

## Checklist Go/No-Go par domaine
- API domaine disponible et stable.
- Mapping type frontend <-> backend valide.
- Fallback local teste manuellement.
- Aucun blocage POS/KDS/EndOfDay.
- Rollback configuration teste (`VITE_DATA_SOURCE=local`).

## Lot BL-016 propose (sans bascule complete)
1. Documenter ce plan et valider avec l'equipe.
2. Ajouter feature flags domaine par domaine (`categories`, `inventory`, `orders`, etc.).
3. Materialiser une checklist d'execution par domaine (template run).
4. Demarrer migration reelle par `categories` seulement apres validation GO.
