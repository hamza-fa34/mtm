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
- Logs API:
  - `docker logs mtm_api_dev --tail 200`
- Etat DB:
  - `docker exec -it mtm_db pg_isready -U mtm -d mtm`

## Containment
- Si API indisponible:
  1. Repasser frontend en `VITE_DATA_SOURCE=local`.
  2. Redemarrer `api` + `db`.
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

