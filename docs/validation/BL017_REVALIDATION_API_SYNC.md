# BL-017R - Revalidation Finale (Mode API + Offline Queue)

## Objectif
Valider en conditions reelles la cible actuelle:
- mode nominal: `UI -> API -> PostgreSQL`
- mode degrade: `UI -> queue locale -> replay API`

Cette campagne cloture la phase technique offline-sync avant toute nouvelle evolution.

## Preconditions
- Frontend configure en `VITE_DATA_SOURCE=api`.
- API + DB up (`docker compose -f infra/docker-compose.yml --profile fullstack up -d`).
- Compte `MANAGER` et `STAFF` disponibles.
- Jeu de donnees realiste (pas mini seed).

## Validation auto (pre-run)
- [x] `npm run quality:ci`
- [x] Backend e2e en conditions CI-like (env + migrations + e2e):

```powershell
$env:DATABASE_URL='postgresql://mtm:mtm@localhost:5432/mtm'
$env:JWT_ACCESS_SECRET='mtm-access-dev-secret'
$env:JWT_REFRESH_SECRET='mtm-refresh-dev-secret'
$env:JWT_ACCESS_TTL='15m'
$env:JWT_REFRESH_TTL='7d'
$env:ALLOW_PLAIN_PIN_LOGIN='true'
npm --prefix apps/api run prisma:migrate:deploy
npm --prefix apps/api run test:e2e
```

- [x] Frontend E2E (Playwright): `npm --prefix apps/web run e2e`
- [x] Test degradation UI automatise (API indisponible simulee) en mode `VITE_DATA_SOURCE=api`: `Data: fallback` + flux POS/KDS maintenu
- [x] Test concurrence backend valide:
  - cas observe apres correctif: `201 + 409`
  - stock final non negatif et coherent
- [ ] Replay complet `fallback -> api` automatise en E2E UI (reste valide manuellement dans cette phase)

## Ordre d'execution recommande
1. Auth + ouverture session
2. Flux commandes POS/KDS
3. Flux inventory (achats/pertes)
4. Cloture session / end-of-day
5. Test degradation API indisponible
6. Test replay a la reconnexion
7. Test concurrence commandes stock limite
8. Gate final GO/NO-GO

## Checklist execution

### 1) Auth + Session Open
- [ ] Login manager OK
- [ ] `Data` affiche `api` (ou `fallback` uniquement si API KO)
- [ ] `open session` reussi sans incoherence

### 2) Orders / POS / KDS
- [ ] Creation commande POS
- [ ] Passage KDS `PENDING -> PREPARING -> READY -> SERVED`
- [ ] Donnees visibles apres refresh (lecture API)

### 3) Inventory
- [ ] Creation `purchase` validee
- [ ] Creation `waste` validee
- [ ] Stock et cout restent coherents

### 4) Session Close / EndOfDay
- [ ] `close session` reussie
- [ ] Rapprochement ventes/paiements/TVA coherent
- [ ] Backup de secours present

### 5) Degradation API indisponible
- [ ] Couper API pendant operation critique
- [ ] UI ne casse pas
- [ ] Statut passe en `fallback`
- [ ] Operation ecriture est queuee (pas perdue)

### 6) Reconnexion + Replay
- [ ] Redemarrer API
- [ ] Replay automatique execute
- [ ] Operation queuee visible en DB sans doublon
- [ ] Statut revient en `api`

### 7) Concurrence commandes (stock limite)
- [ ] Simuler 2 commandes quasi simultanees
- [ ] Pas de stock negatif
- [ ] Pas de double debit incoherent
- [ ] Une seule verite transactionnelle constatee en DB

### 8) Gate final
- [ ] `npm run quality:ci` vert
- [ ] `npm --prefix apps/api run test:e2e` vert (avec env CI-like ci-dessus)
- [ ] Aucun bug bloquant ouvert
- [ ] GO/NO-GO renseigne

## Resultat attendu
- GO si tous les scenarios critiques sont valides en mode `api` avec replay offline stable.
- NO-GO si perte operationnelle, doublon transactionnel, ou incoherence metier constatee.
