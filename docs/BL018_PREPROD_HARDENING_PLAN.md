# BL-018 - Pre-Prod Hardening Plan

## Objectif
Preparer le projet pour une future mise en production sans changer la logique metier actuelle.

Principe:
- changements incrementaux
- 1 theme = 1 ticket = 1 PR
- zero casse fonctionnelle POS/KDS/orders/inventory/sessions

## Perimetre BL-018

### BL-018A - Configuration & Secrets Hardening
- Validation stricte des variables d'environnement backend au boot.
- Separation claire des valeurs `dev` / `test` / `prod`.
- Blocage des configurations faibles en mode `prod`.
- Livrable: guide env + checks de demarrage.

### BL-018B - Security HTTP Baseline
- `helmet` + `cors` configurable selon environnement.
- Rate limiting global API (baseline raisonnable).
- Standardisation minimale des headers de securite.
- Livrable: configuration securite HTTP documentee.

### BL-018C - Observability Ready
- Logs structures standards (request/error) avec correlation `requestId`.
- Verification endpoint readiness technique.
- Guide de diagnostic rapide en 5 minutes.
- Livrable: runbook observabilite finalise.

### BL-018D - Backups & Restore Automatisables
- Scripts npm dump/restore PostgreSQL.
- Procedure de verification restore sur environnement local/staging.
- Runbook backup/restore finalise.
- Livrable: procedure de reprise testable.

### BL-018E - CI Pre-Prod Gate
- Job CI "config sanity" (env + prisma validate).
- Gate de merge renforcee: quality + e2e + docker build + checks pre-prod.
- Livrable: pipeline pre-prod minimal professionnel.

## Ordre recommande
1. BL-018A
2. BL-018B
3. BL-018C
4. BL-018D
5. BL-018E

Justification:
- d'abord fiabiliser config/secrets
- ensuite durcir securite HTTP
- puis finaliser observabilite
- puis outillage exploitation (backup/restore)
- enfin verrouiller le gate CI final

## Definition of Done BL-018
- Tous les tickets A->E livres et valides.
- Aucune regression metier critique.
- CI verte avec nouveau gate pre-prod.
- Runbooks exploitation a jour.
