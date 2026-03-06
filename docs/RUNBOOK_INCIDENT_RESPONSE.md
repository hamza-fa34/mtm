# Runbook Incident - MTM

## Objectif
Fournir une procedure courte pour diagnostiquer et contenir un incident production/dev (API indisponible, erreurs ecritures, incoherence metier).

## Triage (0-15 min)
1. Identifier le scope: `frontend`, `api`, `db`, ou flux metier (`orders`, `inventory`, `sessions`).
2. Confirmer l'impact:
   - commandes bloquees
   - stock incoherent
   - cloture session impossible
3. Geler les changements en cours (pas de deploiement pendant incident).

## Verification rapide
- API health:
  - `GET /api/health`
  - `GET /api/health/readiness`
- Logs API:
  - `docker logs mtm_api_dev --tail 200`
  - Les logs sont JSON structures avec:
    - `event=http_request` pour les requetes
    - `event=http_error` pour les erreurs
    - `requestId` pour correler une requete et son erreur
- Etat DB:
  - `docker exec -it mtm_db pg_isready -U mtm -d mtm`

## Correlation d'une erreur
1. Recuperer `x-request-id` depuis la reponse HTTP (header).
2. Filtrer les logs sur cette valeur:
   - `docker logs mtm_api_dev --tail 500 | grep "<request-id>"`
3. Verifier la sequence:
   - `http_error` (cause)
   - `http_request` (status final + latence)

## Containment
- Si API indisponible:
  1. Repasser frontend en `VITE_DATA_SOURCE=local`.
  2. Redemarrer `api` + `db`.
- Si erreurs `429 Too Many Requests`:
  1. Verifier `RATE_LIMIT_WINDOW_MS` et `RATE_LIMIT_MAX_REQUESTS`.
  2. Ajuster en environnement non-prod si charge de test elevee.
- Si ecriture critique incoherente:
  1. Bloquer temporairement les ecritures concernees (feature flag ou rollback release).
  2. Utiliser `dry-run` migration/import pour analyser l'etat avant correction.

## Recovery
1. Corriger la cause (code/config/data).
2. Rejouer tests critiques:
   - `api` e2e (`test:e2e`)
   - smoke orders/inventory/sessions
3. Reouvrir progressivement les flux.

## Post-incident
1. Documenter cause racine + impact + timeline.
2. Ajouter test de non-regression.
3. Mettre a jour checklist BL-017 / backlog.
