# BL-017R - Execution Log (API + Offline Queue)

## Meta
- Date: 2026-03-10
- Executant: team + codex
- Branche: `feat/offline-sync-lot1-foundations`
- Environnement: local monorepo + CI
- Version front/api: current branch head

## Resultats par bloc

| Bloc | Statut (PASS/FAIL) | Notes |
|---|---|---|
| 1. Auth + Session Open | PASS (auto) | Playwright `manager can open a session` |
| 2. Orders / POS / KDS | PASS (auto) | Playwright `order created from POS appears in KDS` |
| 3. Inventory | PASS (API e2e) | `critical-flows.e2e` couvre ecriture stock transactionnelle |
| 4. Session Close / EndOfDay | PASS (auto) | Playwright `manager can close session` + backend e2e |
| 5. Degradation API indisponible | PASS | Valide explicitement en mode `VITE_DATA_SOURCE=api` (etat UI `fallback`, flux maintenu) |
| 6. Reconnexion + Replay | PASS (manuel) | Validation operateur effectuee, replay confirme sans incoherence metier |
| 7. Concurrence stock limite | PASS (auto) | Backend e2e + simulation live (`201+409`, stock non negatif) |
| 8. Gate final | DONE | GO signe |

## Incidents observes
- Incident 1: test de concurrence live a revele initialement une survente (`201+201`, stock negatif).
- Incident 2: aucun autre incident bloquant apres correctif.

## Actions correctives
- Action 1: correction backend `orders` pour decrement stock atomique sous concurrence (`updateMany ... currentStock >= required`).
- Action 2: ajout test e2e backend `prevents concurrent oversell on limited stock`.

## Decision finale
- GO / NO-GO: GO
- Justification:
  - flux critiques stables en mode nominal API-first (`orders`, `inventory`, `sessions`)
  - queue offline + replay/backoff en place et valides techniquement
  - test de degradation API explicitement valide en mode `api`
  - protection concurrence stock validee (`201+409`, stock coherent)
  - quality gates verts (`quality:ci`, e2e web, e2e backend)
- Conditions de passage phase suivante:
  - demarrer BL-019 avec URL staging disponible pour activation monitoring GitHub
