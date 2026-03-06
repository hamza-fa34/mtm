# BL-017 - Runbook Cutover Local -> DB

## Objectif
Executer une migration reelle depuis un export JSON global (`Data Management`) vers PostgreSQL, avec un mode `dry-run` obligatoire avant `apply`.

## Prerequis
- Stack backend up (`api` + `db`)
- Migration Prisma appliquee
- Fichier backup JSON exporte depuis l'app (`mollys_truck_backup_global_YYYY-MM-DD.json`)

## Commandes
Depuis `api/`:

```bash
npm run migration:import:dry-run -- --file "<chemin-vers-backup.json>"
```

```bash
npm run migration:import:apply -- --file "<chemin-vers-backup.json>"
```

Option: limiter au domaine:

```bash
npm run migration:import:dry-run -- --file "<backup.json>" --domains sessions,orders,inventory
```

Domaines supportes:
- `settings`
- `users`
- `categories`
- `ingredients`
- `products`
- `customers`
- `sessions`
- `orders`
- `purchases`
- `wastes`
- `expenses`

## Procedure recommandee
1. Exporter un backup JSON depuis l'app (avant cutover).
2. Executer `dry-run`.
3. Verifier le rapport:
   - `counts`
   - `warnings` (references manquantes)
4. Si rapport acceptable, executer `apply`.
5. Verifier apres import:
   - `GET /api/products`
   - `GET /api/customers`
   - `GET /api/inventory/ingredients`
   - `GET /api/orders`
   - `GET /api/sessions`

## Rollback rapide
1. Repasser front en `VITE_DATA_SOURCE=local`.
2. Restaurer backup JSON local via `Data Management > Importer JSON Global`.
3. Si rollback DB requis:
   - restaurer dump PostgreSQL precedent (runbook DB).

## Notes de securite
- Le script importe les PIN utilisateurs tels que presents dans le backup (mode transitoire).
- En production, desactiver `ALLOW_PLAIN_PIN_LOGIN` (`false`) et migrer vers PIN hashes bcrypt.
- Toujours conserver un backup JSON pre-cutover.

