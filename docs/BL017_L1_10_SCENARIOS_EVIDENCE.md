# BL-017 - L1 Evidence (10 Scenarios Critiques)

## Contexte
- Objectif: valider le critere L1 "Aucune commande incoherente observee sur 10 scenarios critiques".
- Perimetre: flux metier orders/POS/KDS/session lies a la prise de commande.
- Regle: un scenario = `OK` ou `KO` (pas de validation implicite).

## Campagne
- Date:
- Testeur:
- Environnement: Docker fullstack / local
- Commit ref:

## Resultats

| ID | Scenario | Statut (`OK`/`KO`) | Evidence courte |
|---|---|---|---|
| S01 | Ouvrir session manager puis creer une commande simple |  |  |
| S02 | Creer commande multi-lignes (2+ produits) |  |  |
| S03 | Encaisser en `CASH` et verifier total historique |  |  |
| S04 | Encaisser en `CARD` et verifier total historique |  |  |
| S05 | Enchainer POS -> KDS (`PENDING` -> `PREPARING` -> `READY`) |  |  |
| S06 | Verifier decrement stock apres vente recette simple |  |  |
| S07 | Verifier rejet commande si stock insuffisant |  |  |
| S08 | Simuler 2 commandes quasi simultanees stock limite (1 succes + 1 rejet) |  |  |
| S09 | Fermer puis reouvrir session, reprendre commande |  |  |
| S10 | Verifier persistance commandes apres reload application |  |  |

## Critere de passage
- 10/10 scenarios `OK`
- 0 incoherence commande (montants, statuts, persistance)
- 0 incoherence stock observee sur les scenarios commandes

## Decision
- GO L1:
- Valide par:
- Date validation:
