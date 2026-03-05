# AGENTS.md — Molly’s Truck Manager

## 1) Contexte du projet
Molly’s Truck Manager est une application métier pour food-trucks et petites restaurations mobiles.  
Objectif: centraliser les opérations quotidiennes dans un outil rapide, lisible et fiable.

État actuel (au 04/03/2026):
- MVP avancé et fonctionnel
- Frontend React + TypeScript + Vite
- Modules disponibles: POS, KDS, stocks/recettes/marges, CRM, sessions (EndOfDay), dépenses, paramètres
- Persistance locale via `localStorage`
- Mode mono-appareil (stand-alone)

## 2) Objectif de ce document
Ce fichier définit:
- les règles de travail (humain + IA),
- les priorités produit/techniques,
- les garde-fous anti-régression,
- la stratégie de migration progressive vers une architecture complète (Docker + backend + DB).

## 3) Périmètre actuel (V1 Stand-alone)

### Inclus
- POS: prise de commande, panier, encaissement
- KDS: file de production, statuts de préparation
- Produits/Menu: catégories, recettes, coûts de base
- Stocks: ingrédients, seuils, déduction via ventes
- CRM: clients, points fidélité
- Sessions: ouverture/fermeture de caisse, historique
- Dépenses: saisie et export CSV
- Paramètres: PIN, équipe, configuration truck

### Hors périmètre immédiat
- Backend/API distant
- Base de données serveur
- Multi-appareils temps réel
- Offline-first synchronisé
- Paiements intégrés (TPE/provider)
- Multi-tenant SaaS

## 4) Principes directeurs (Guardrails)
1. Ne jamais casser les flux terrain critiques: POS, KDS, EndOfDay.
2. Prioriser la sécurité des données avant les nouvelles features.
3. Faire des changements incrémentaux: petits lots, testables, réversibles.
4. Éviter les refontes globales non justifiées.
5. Maintenir une voie de migration vers backend sans bloquer l’exploitation actuelle.

## 5) Priorités produit (ordre d’exécution)

### P0 — Data Safety (obligatoire)
- Export global JSON (toutes les entités)
- Import global JSON (restauration contrôlée)
- Backup automatique à la clôture de session
- Écran “Data Management” dans Settings (Export / Import / Reset sécurisé)
- Reset protégé (rôle manager + double confirmation)

### P1 — Robustesse terrain
- 10 scénarios manuels critiques documentés et rejouables
- Ergonomie POS tactile (rapidité, peu de frictions)
- Ergonomie KDS (lisibilité et actions rapides)
- Gestion des cas limites (stocks insuffisants, données incomplètes)

### P2 — Qualité & maintenabilité
- README opérationnel (run, build, backup/restore, rôles)
- Conventions code minimales (naming, structure, nettoyage)
- Tests unitaires sur fonctions critiques (`utils.ts`)
- Tag de release `v1-standalone` quand DoD atteint

### P3 — Containerisation
- Dockerfile frontend (dev + prod)
- `docker-compose` minimal
- Vérification run local stable en conteneur

### P4 — Préparation backend (sans bascule immédiate)
- Schéma de données cible (PostgreSQL)
- Contrats API (OpenAPI ou équivalent)
- Couche d’abstraction “repository” pour permettre mode local + mode API
- Plan de migration `localStorage -> DB` (scripté, traçable)

## 6) Règles de contribution (humain + IA)

Pour toute proposition de changement, fournir systématiquement:
- Objectif
- Fichiers impactés
- Changements
- Risques
- Tests manuels à exécuter
- Plan de rollback simple

Règles d’exécution:
- 1 sujet = 1 PR
- pas de refactor global non demandé
- conserver la compatibilité des données existantes
- si format de données modifié: migration ou fallback obligatoire

## 7) Définition of Done (DoD) — Release V1 Stand-alone

La V1 est validée si:
- Export/Import global JSON fonctionne
- EndOfDay déclenche un backup exploitable
- 10 scénarios critiques passent
- POS/KDS restent fluides en usage continu
- Reset data est protégé (manager + double confirmation)
- README opérationnel est présent
- Build passe sans erreur bloquante
- Aucune erreur console critique sur les parcours clés

## 8) Scénarios critiques minimaux (test manuel)
1. Ouvrir session avec fond de caisse
2. Créer commande POS et encaisser
3. Vérifier décrément stock
4. Faire passer commande dans KDS jusqu’au statut final
5. Clôturer session et vérifier archive
6. Ajouter dépense et exporter CSV
7. Ajouter client et appliquer fidélité
8. Export global JSON puis import de restauration
9. Vérifier permissions STAFF vs MANAGER
10. Tester reset sécurisé (avec confirmations)

## 9) Référentiel technique actuel
- Frontend: React + TypeScript + Vite
- Styling: Tailwind (actuellement injecté via CDN dans `index.html`)
- State: Context API (Orders, Products, Inventory, Customers, Settings)
- Persistance: `localStorage`
- Logique critique: `utils.ts`
- Modèle: `types.ts`

## 10) Journal des décisions (Decision Log)
- 2026-03-04: maintien d’une V1 stand-alone mono-appareil.
- 2026-03-04: priorité absolue à la protection des données (P0).
- 2026-03-04: backend/DB reportés après stabilisation P0/P1.
- 2026-03-04: migration future prévue via approche progressive (mode local puis mode API).
