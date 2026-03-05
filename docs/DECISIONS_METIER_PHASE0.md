# Decisions Metier - Phase 0

## 1) Cible Produit (3 mois)
Decision:
- Priorite a une V1.1 stand-alone robuste, orientee usage terrain, avant bascule backend.

Impact:
- Minimiser les regressions.
- Securiser les donnees locales.
- Standardiser les operations quotidiennes.

## 2) Scope V1.1

### In Scope
- Data Safety: export/import JSON + backup session + reset protege.
- Robustesse des flux critiques: POS, KDS, EndOfDay.
- Hygiene repo/doc/qualite minimale.
- Dockerisation frontend.

### Out of Scope (temporaire)
- Multi-appareils synchronises en temps reel.
- Paiements integres (provider externe).
- SaaS multi-tenant.

## 3) Regles Metier Critiques

### POS
- Encaissement uniquement si panier non vide.
- Paiement enregistre avec mode (CASH/CARD/TR).
- Toute vente validee impacte le stock.

### KDS
- File sur commandes actives.
- Progression de statut controlee.
- Actions rapides prioritaires pour usage cuisine.

### Stock
- Decrement automatique via recette.
- Alerte sur seuil critique.
- Gestion des cas limites (ingredient manquant, quantite insuffisante).

### Fidelite (decision V1.1)
- Earning: `1 EUR TTC = 1 point` (arrondi inferieur du total ticket).
- Redemption: `100 points = 1 produit offert`.
- Redemption autorisee uniquement si client selectionne et points suffisants.

### Session / EndOfDay
- Ouverture avec fond de caisse.
- Cloture avec recap ventes + TVA + cash.
- Backup automatique declenche a la cloture.

## 4) Matrice Roles / Droits (V1.1)

| Action | STAFF | MANAGER |
|---|---|---|
| Prendre commande POS | Oui | Oui |
| Encaisser commande | Oui | Oui |
| Faire avancer statut KDS | Oui | Oui |
| Ajouter depense | Oui | Oui |
| Modifier settings sensibles | Non | Oui |
| Export global JSON | Oui | Oui |
| Import global JSON | Non | Oui |
| Reset donnees | Non | Oui |
| Cloture session | Non | Oui |

## 5) KPI de Succes
- 0 perte de donnees sur operations P0 (export/import/backup verifies).
- 10/10 scenarios critiques executables sans blocage.
- Temps de prise de commande: objectif terrain <= 10 secondes pour une commande simple.
- Build et lint passent avant chaque merge.

## 6) Decisions Complementees
- Remises et annulations: reservees manager (ou validation manager) des que la fonctionnalite est activee.
- Export comptable V1.1: CSV minimum avec Date, Ticket, Mode, Paiement, Total TTC, Base HT, TVA, Depenses TTC, Categorie depense.

## 7) Gate Go/No-Go vers Phase 1
- Regle fidelite V1.1 validee.
- Matrice roles/droits validee.
- KPI de succes valides.
- Format export comptable minimum valide.
