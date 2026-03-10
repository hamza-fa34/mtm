# BL-017 - L1 Evidence (10 Scenarios Critiques)

## Contexte
- Objectif: valider le critere L1 "Aucune commande incoherente observee sur 10 scenarios critiques".
- Perimetre: flux metier orders/POS/KDS/session lies a la prise de commande.
- Regle: un scenario = `OK` ou `KO` (pas de validation implicite).

## Campagne
- Date: 2026-03-06
- Testeur: Hamza
- Environnement: Docker fullstack
- Commit ref: validation manuelle utilisateur

## Resultats

| ID | Scenario | Statut (`OK`/`KO`) | Evidence courte |
|---|---|---|---|
| S01 | Ouvrir session manager puis creer une commande simple | OK | Session ouverte puis commande creee sans erreur |
| S02 | Creer commande multi-lignes (2+ produits) | OK | Totaux commandes coherents |
| S03 | Encaisser en `CASH` et verifier total historique | OK | Paiement cash present dans recap |
| S04 | Encaisser en `CARD` et verifier total historique | OK | Paiement card present dans recap |
| S05 | Enchainer POS -> KDS (`PENDING` -> `PREPARING` -> `READY`) | OK | Statuts KDS propagés correctement |
| S06 | Verifier decrement stock apres vente recette simple | OK | Stock decrementé selon recette |
| S07 | Verifier rejet commande si stock insuffisant | OK | Rejet propre sans incoherence |
| S08 | Simuler 2 commandes quasi simultanees stock limite (1 succes + 1 rejet) | OK | 1 succes + 1 rejet, stock final coherent |
| S09 | Fermer puis reouvrir session, reprendre commande | OK | Flux session stable apres reopen |
| S10 | Verifier persistance commandes apres reload application | OK | Donnees commandes persistantes |

## Critere de passage
- 10/10 scenarios `OK`
- 0 incoherence commande (montants, statuts, persistance)
- 0 incoherence stock observee sur les scenarios commandes

## Decision
- GO L1: OUI
- Valide par: Hamza
- Date validation: 2026-03-06
