# Offline Sync Execution Plan

## Objectif du chantier
Faire evoluer l'architecture hybride actuelle vers:
- PostgreSQL source principale metier
- mode offline simple via queue locale temporaire
- synchronisation automatique a la reconnexion

Execution par lots progressifs sur branche dediee, avec validation et rollback a chaque etape.

## Principes d'execution
- 1 lot = 1 theme = 1 PR
- Aucun refactor global
- Aucun passage lot suivant sans GO du lot courant
- CI verte obligatoire a chaque lot

## Lot 1 - Fondations Offline Queue

### Objectif
Introduire les fondations techniques de queue locale et de replay, sans basculer les domaines metier critiques.

### Perimetre
- Modele d'operation offline
- Stockage de queue locale
- Moteur de replay (retry + backoff)
- Etat de sync minimal visible

### Risques
- Queue non durable
- Replay en boucle
- Statuts peu lisibles

### Validations
- Tests unitaires queue/retry/backoff
- Validation manuelle offline -> reconnexion -> replay
- CI complete verte

## Lot 2 - Orders API-first + Queue Offline

### Objectif
Passer les ecritures `orders` en API-first avec buffer offline queue.

### Perimetre
- Creation commande
- Update statut commande (si applicable)
- Prevention des doublons via idempotence

### Risques
- Doublons de commandes
- Divergence total/panier
- Erreurs de replay silencieuses

### Validations
- Test offline create order puis sync
- Test doublon/retry (meme operationId)
- Test degression POS/KDS
- CI verte

## Lot 3 - Inventory API-first + Queue Offline

### Objectif
Passer les ecritures `inventory` en API-first avec queue offline.

### Perimetre
- Achats
- Pertes/gaspillage
- Ajustements de stock lies aux flux metier

### Risques
- Incoherence stock
- Ordonnancement operations incorrect
- Replay partiel non detecte

### Validations
- Tests integration backend stock (transaction)
- Scenario concurrence simple
- Scenario offline inventory -> sync
- CI verte

## Lot 4 - Sessions / End-of-Day

### Objectif
Basculer `sessions/end-of-day` vers API-first avec comportement degrade clair hors ligne.

### Perimetre
- Open session
- Close session
- Calculs et etats de cloture relies au backend

### Risques
- Double cloture
- Session incoherente
- Mismatch ventes/stock/session

### Validations
- Scenarios metier session complets
- Test coupure reseau pendant cloture
- Verification rollback lot
- CI verte

## Lot 5 - Suppression progressive du local metier

### Objectif
Retirer progressivement le mode `local` comme mode metier principal.

### Perimetre
- Local conserve uniquement comme buffer offline technique
- Harmonisation message UI et statut data source
- Nettoyage des chemins legacy local metier

### Risques
- Regression UX hors ligne
- Fallback ambigu
- Dette technique residuelle

### Validations
- Campagne finale GO/NO-GO
- Runbooks sync/migration a jour
- CI verte + smoke Docker

## Gates de passage entre lots
- Gate technique:
  - build web/api OK
  - tests cibles lot OK
  - CI verte
- Gate metier:
  - scenarios critiques du lot passes
  - aucune regression bloquante constatee
- Gate rollback:
  - mecanisme de retour au lot precedent valide

## Resultat attendu en fin de plan
- Flux nominal: `UI -> API -> PostgreSQL`
- Flux offline: `UI -> queue locale -> replay API`
- PostgreSQL devient reference metier unique
- Offline simple operationnel sans architecture offline-first complexe

## Etat d'avancement (2026-03-09)
- Lot 1: termine (fondations queue offline + replay + tests unitaires)
- Lot 2: termine (orders ecriture API-first + queue + replay)
- Lot 3: termine (inventory ecriture API-first + queue + replay)
- Lot 4: termine (sessions open/close API-first + queue + replay)
- Lot 5: en finalisation (mode nominal `api`, lectures/ecritures critiques alignees API-first, chemins non critiques local clarifies comme fallback/cache)
- Validation finale restante: campagne metier GO/NO-GO complete en mode `api` + scenarios degrade/reconnexion
