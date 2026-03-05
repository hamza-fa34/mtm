# Molly's Truck Manager

Application metier pour food-truck: POS, KDS, stock, recettes/marges, CRM, sessions de caisse et depenses.

## Etat Actuel
- Frontend React + TypeScript + Vite
- Persistance locale via `localStorage`
- Mode stand-alone mono-appareil
- Aucune API backend ni base distante a ce stade

Cadre projet: voir [AGENTS.md](./AGENTS.md).

## Prerequis
- Node.js 20+ recommande
- npm 10+ recommande

## Lancement Local
1. Installer les dependances:
   `npm install`
2. Demarrer en developpement:
   `npm run dev`
3. Ouvrir:
   `http://localhost:3000`

## Lancement Docker
### Mode developpement
1. Construire et demarrer:
   `docker compose --profile dev --profile backend up --build`
2. Ouvrir:
   `http://localhost:3000`
   `http://localhost:4000/api` (backend)
3. Arreter:
   `docker compose --profile dev --profile backend down`

### Mode production (preview)
1. Construire et demarrer:
   `docker compose --profile prod --profile backend up --build`
2. Ouvrir:
   `http://localhost:4173`
   `http://localhost:4001/api` (backend)
3. Arreter:
   `docker compose --profile prod --profile backend down`

## Scripts
- `npm run dev`: demarrage local Vite
- `npm run typecheck`: verification TypeScript (`tsc --noEmit`)
- `npm run lint`: alias vers `typecheck`
- `npm run test`: tests unitaires en mode watch
- `npm run test:run`: execution one-shot des tests unitaires
- `npm run build`: build production
- `npm run preview`: previsualisation du build
- `npm run quality:ci`: gate qualite local (`typecheck + tests + build`)

## Donnees et Sauvegarde
- Les donnees sont stockees en local dans le navigateur (`localStorage`).
- La sauvegarde/restauration globale JSON est planifiee en priorite `P0` (voir `AGENTS.md`).

## Perimetre Fonctionnel (V1)
- POS: prise de commande et encaissement
- KDS: suivi preparation
- Menu/recettes: produits, ingredients, couts
- Stock: suivi et deduction via ventes
- CRM: clients et fidelite
- Sessions: ouverture/fermeture de caisse
- Depenses: saisie et export CSV

## Qualite
- Build et type-check doivent passer avant toute livraison.
- Les changements doivent rester incrementaux et testables.

## Prochaines Priorites
1. Data Safety: export/import JSON + backup a la cloture
2. Robustesse terrain: scenarios critiques POS/KDS/session
3. Dockerisation frontend
4. Preparation backend + base de donnees
