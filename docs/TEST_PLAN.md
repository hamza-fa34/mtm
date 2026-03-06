# Test Plan - Scenarios Critiques

## 1) Regles d'Execution
- Statut autorise: `TODO`, `OK`, `KO`, `BLOQUE`
- Une campagne de test = un passage complet T01 -> T10
- Renseigner date, testeur, build/commit, environnement
- En cas de KO: capturer et ouvrir un ticket backlog

## 2) Contexte de Campagne
- Date:
- Testeur:
- Build/Version:
- Environnement: local / docker
- Navigateur:

## 2.1) Journal d'Execution

### Campagne 2026-03-05 - Pre-check technique
- Testeur: Codex
- Environnement: local
- Resultat:
  - `npm run lint`: OK
  - `npm run build`: OK
- Limite:
  - Les scenarios T01 -> T10 necessitent une execution manuelle UI (parcours metier complet).

### Campagne 2026-03-06 - E2E front automatise (Playwright)
- Testeur: Codex
- Environnement: local (Vite + Chromium Playwright)
- Resultat:
  - `npm run e2e`: OK (3/3)
  - Flux couverts:
    - ouverture session manager (T01 partiel)
    - creation commande POS + presence KDS (T02 + T04 partiel)
    - cloture session et retour dashboard (T05 partiel)
- Limite:
  - Les scenarios T03, T06, T07, T08, T09, T10 restent a valider manuellement.

### Campagne 2026-03-06 - Smoke manuel utilisateur
- Testeur: Hamza
- Environnement: Docker fullstack
- Resultat:
  - Connexion PIN: OK
  - Ouverture caisse/session: OK
  - Prise de commandes POS: OK
  - Fermeture puis reouverture session: OK
- Limite:
  - Validation formelle T01 -> T10 a finaliser dans le tableau de suivi ci-dessous.

## 3) Tableau de Suivi

| ID | Scenario | Statut | Date | Notes |
|---|---|---|---|---|
| T01 | Ouvrir session avec fond de caisse | TODO |  |  |
| T02 | Creer commande POS et encaisser | TODO |  |  |
| T03 | Verifier decrement stock apres vente | TODO |  |  |
| T04 | Faire passer commande KDS jusqu'au statut final | TODO |  |  |
| T05 | Cloturer session et verifier archive + backup auto | TODO |  |  |
| T06 | Ajouter depense et exporter CSV | TODO |  |  |
| T07 | Ajouter client et appliquer fidelite | TODO |  |  |
| T08 | Export global JSON puis import restauration | TODO |  |  |
| T09 | Verifier permissions STAFF vs MANAGER | TODO |  |  |
| T10 | Tester reset securise (double confirmation + manager) | TODO |  |  |

## 4) Scenarios Detailes

### T01 - Ouvrir session avec fond de caisse
Preconditions:
- App lancee
- Utilisateur connecte
- Aucune session ouverte

Etapes:
1. Aller sur EndOfDay
2. Saisir un fond de caisse (ex: 50)
3. Lancer l'ouverture de session

Attendu:
- Session passe a `OPEN`
- Fond de caisse enregistre
- Acces POS/KDS autorise

### T02 - Creer commande POS et encaisser
Preconditions:
- Session ouverte

Etapes:
1. Ajouter au moins 1 produit au panier
2. Choisir mode de service
3. Encaisser (CARTE ou CASH)

Attendu:
- Commande creee dans l'historique
- Total TTC coherent
- Paiement enregistre

### T03 - Verifier decrement stock apres vente
Preconditions:
- Stock initial note pour au moins 1 ingredient
- Session ouverte

Etapes:
1. Vendre un produit lie a une recette
2. Ouvrir l'ecran Stock
3. Comparer stock avant/apres

Attendu:
- Decrement applique selon recette x quantite
- Pas de valeur negative incoherente

### T04 - Faire passer commande KDS jusqu'au statut final
Preconditions:
- Une commande en `PENDING`

Etapes:
1. Ouvrir KDS
2. Passer statut `PENDING -> PREPARING`
3. Terminer la commande

Attendu:
- Le changement de statut est persiste
- La commande sort de la file active a la fin

### T05 - Cloturer session et verifier archive + backup auto
Preconditions:
- Session ouverte avec au moins 1 vente

Etapes:
1. Aller sur EndOfDay
2. Saisir cash final
3. Cloturer la session
4. Ouvrir Settings > Data Management

Attendu:
- Session archivee dans l'historique
- Session courante vide
- Un backup auto supplementaire est present

### T06 - Ajouter depense et exporter CSV
Preconditions:
- Session ouverte ou non (selon usage)

Etapes:
1. Ajouter une depense complete
2. Verifier affichage dans le journal
3. Exporter CSV

Attendu:
- Depense visible et persistante
- CSV telecharge avec les colonnes attendues

### T07 - Ajouter client et appliquer fidelite
Preconditions:
- Module CRM accessible

Etapes:
1. Creer un client
2. L'associer a une commande POS
3. Encaisser

Attendu:
- Client persiste
- Points fidelite mis a jour selon regle V1.1

### T08 - Export global JSON puis import restauration
Preconditions:
- Donnees existantes

Etapes:
1. Exporter JSON global
2. Modifier des donnees (ex: ajouter depense)
3. Importer le JSON exporte

Attendu:
- Donnees restaurees a l'etat du backup
- Message de succes + rechargement

### T09 - Verifier permissions STAFF vs MANAGER
Preconditions:
- Un compte STAFF et un compte MANAGER

Etapes:
1. Se connecter en STAFF
2. Tenter import/reset/cloture
3. Se connecter en MANAGER et retester

Attendu:
- STAFF bloque sur actions sensibles
- MANAGER autorise

### T10 - Tester reset securise (double confirmation + manager)
Preconditions:
- Connecte en MANAGER
- Donnees existantes

Etapes:
1. Ouvrir Data Management
2. Activer reset
3. Saisir token `RESET`
4. Confirmer l'alerte finale

Attendu:
- Backup pre-reset cree
- Donnees applicatives nettoyees
- App rechargee proprement

## 5) Criteres d'Acceptation Globaux
- 10/10 scenarios executes
- 0 scenario KO sur flux critiques (T01, T02, T03, T04, T05, T08, T10)
- Aucun blocage POS/KDS/EndOfDay
- Aucune perte de donnees non voulue
- `npm run lint` et `npm run build` passent
