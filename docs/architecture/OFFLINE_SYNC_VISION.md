# Offline Sync Vision

## Objectif
Faire de PostgreSQL (via l'API backend) la seule source de verite metier, tout en gardant un fonctionnement hors ligne simple et robuste.

## Contexte actuel
- Backend NestJS + Prisma + PostgreSQL deja en place et stable.
- Frontend avec adapters par domaine (`local` / `api` / `fallback`).
- Docker + CI + tests deja operationnels.
- Une partie des lectures passe deja par l'API.
- Certaines ecritures frontend restent locales (`localStorage`).

## Principe d'architecture cible

### Source de verite
- Source unique: PostgreSQL, uniquement via API backend.
- Le frontend ne considere plus `local` comme source metier.

### Flux nominal (online)
- `UI -> API -> PostgreSQL`

### Flux degrade (offline)
- `UI -> offline queue locale (buffer temporaire)`

### Flux de reconnexion
- `offline queue -> API -> PostgreSQL`

## Role du buffer local
- Conserver temporairement les operations ecriture quand l'API est indisponible.
- Garantir "pas de perte operationnelle" en cas de coupure reseau.
- Ne pas devenir une base parallele permanente.

## Domaines metier concernes par l'offline

### Priorite haute (operations critiques)
- `orders`
- `inventory`
- `sessions / end-of-day`

### Priorite secondaire
- `customers`, `products`, `categories`, `settings`
- Ces domaines peuvent rester API-first avec cache local simple si necessaire.

## Strategie de synchronisation (simple)
- File d'attente locale d'operations (FIFO).
- Chaque operation contient au minimum:
  - `operationId` (unique)
  - `domain`
  - `action`
  - `payload`
  - `createdAt`
  - `retryCount`
  - `status` (`pending`, `syncing`, `synced`, `failed`)
- Replay automatique a la reconnexion.
- Retry avec backoff limite.
- Arret du replay en cas d'erreur fonctionnelle non recuperable.

## Strategie de conflits (simple et explicite)
- Par defaut: verite serveur (server wins).
- Conflits fonctionnels critiques:
  - operation marquee `failed`
  - message explicite cote UI
  - correction manuelle ou operation compensatoire
- Pas de merge automatique complexe dans cette phase.

## Idempotence
- Toute ecriture replayable doit etre idempotente.
- Chaque operation offline porte une cle idempotente (`operationId`) transmise a l'API.
- Le backend doit ignorer les doublons avec meme cle idempotente.

## Observabilite minimale attendue
- Logs de sync avec `operationId`, domaine, action, resultat.
- Compteurs simples:
  - operations en attente
  - operations en echec
  - dernier replay reussi
- Runbook incident sync (diagnostic + reprise).

## Hors scope explicite
- Offline-first complet multi-device avec resolution avancee.
- Synchronisation bidirectionnelle complexe en temps reel.
- Moteur de conflits automatique riche.
- Refonte front/back globale.

## Critere de succes de cette vision
- PostgreSQL devient la reference metier unique.
- L'app reste utilisable hors ligne sur operations critiques.
- Les operations offline sont rejouees sans doublon ni perte.
- Le projet reste maintenable et progressif, sans surcomplexification.
