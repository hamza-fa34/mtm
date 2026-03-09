# Offline Sync Checklist

## Utilisation
Checklist de pilotage pour executer le chantier offline sync par lots, sans casse.

Regle: aucun lot suivant sans validation GO du lot courant.

## Etat actuel (2026-03-09)
- [x] Lot 1 implemente et valide techniquement
- [x] Lot 2 implemente et valide techniquement
- [x] Lot 3 implemente et valide techniquement
- [x] Lot 4 implemente et valide techniquement
- [~] Lot 5 en cours (lectures securisees + mode nominal `api` + nettoyage progressif local metier)
- [ ] Validation metier finale GO/NO-GO a rejouer completement

## Checklist globale GO/NO-GO
- [ ] PostgreSQL confirme comme source de verite metier
- [ ] Ecritures critiques passent en API-first
- [ ] Queue offline operationnelle et persistante
- [ ] Replay a la reconnexion valide
- [ ] Idempotence verifiee (pas de doublons)
- [ ] CI verte
- [ ] Rollback de lot possible

## Checklist par lot

### 1. Cadrage du lot
- [ ] Objectif du lot defini
- [ ] Perimetre du lot defini (in/out)
- [ ] Risques du lot identifies
- [ ] Plan de test du lot prepare
- [ ] Strategie rollback du lot preparee

### 2. Validation technique
- [ ] Build frontend OK
- [ ] Build backend OK
- [ ] Tests unitaires/integration pertinents OK
- [ ] Docker stack demarre sans erreur
- [ ] CI green sur PR

### 3. Validation metier
- [ ] Scenarios critiques du lot executes
- [ ] Resultats conformes attendus
- [ ] Aucune regression bloquante sur POS/KDS/Stock/Sessions
- [ ] Message utilisateur correct en mode offline/degrade

### 4. Validation offline sync
- [ ] Operation capturee dans la queue en mode offline
- [ ] Replay automatique a la reconnexion
- [ ] Statut operation passe a `synced` en cas de succes
- [ ] Statut operation passe a `failed` si erreur fonctionnelle
- [ ] Aucun doublon en backend apres replay

### 5. Validation rollback
- [ ] Retour lot precedent documente
- [ ] Test de rollback execute (au moins une fois)
- [ ] Reprise stable apres rollback

### 6. Documentation lot
- [ ] Decisions et hypotheses documentees
- [ ] Changement runbook mis a jour
- [ ] Backlog/statut lot mis a jour

### 7. Hygiene git (methode de travail)
- [ ] 1 lot = 1 branche/PR
- [ ] commits clairs et scopes
- [ ] push apres validation locale
- [ ] merge seulement apres CI verte

## Checkpoints techniques minimaux (a repeter chaque lot)
- [ ] `npm run quality:ci`
- [ ] tests lot-specifiques executes
- [ ] verification API health/readiness

## Checkpoints metier minimaux (a repeter chaque lot)
- [ ] ordre metier respecte (orders -> inventory -> sessions)
- [ ] etat stock coherent apres operations
- [ ] cloture session coherent avec ventes

## Critere de cloture du chantier
- [ ] Mode nominal confirme: `UI -> API -> PostgreSQL`
- [ ] Local conserve uniquement comme buffer offline temporaire
- [ ] Replay offline stable sur domaines critiques
- [ ] Runbooks et docs finales a jour
- [ ] Decision GO finale validee
