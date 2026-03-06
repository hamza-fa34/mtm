# Runbook DB Backup / Restore (PostgreSQL)

## Objectif
Definir une procedure simple de sauvegarde et restauration PostgreSQL pour MTM.

## Backup (dump)
Depuis la racine du projet:

```bash
docker exec mtm_db pg_dump -U mtm -d mtm -Fc -f /tmp/mtm.dump
docker cp mtm_db:/tmp/mtm.dump ./backups/mtm_$(date +%Y%m%d_%H%M%S).dump
```

Version SQL texte:

```bash
docker exec mtm_db pg_dump -U mtm -d mtm -f /tmp/mtm.sql
docker cp mtm_db:/tmp/mtm.sql ./backups/mtm_$(date +%Y%m%d_%H%M%S).sql
```

## Restore
1. Arreter les ecritures applicatives.
2. Restaurer vers une DB cible.

Format custom (`.dump`):

```bash
docker cp ./backups/mtm_xxx.dump mtm_db:/tmp/restore.dump
docker exec mtm_db pg_restore -U mtm -d mtm --clean --if-exists /tmp/restore.dump
```

Format SQL (`.sql`):

```bash
docker cp ./backups/mtm_xxx.sql mtm_db:/tmp/restore.sql
docker exec -i mtm_db psql -U mtm -d mtm -f /tmp/restore.sql
```

## Validation apres restore
- `GET /api/health` = `200`
- `GET /api/products`
- `GET /api/inventory/ingredients`
- `GET /api/orders`
- `GET /api/sessions`

## Frequence recommandee
- Min: 1 dump quotidien + avant chaque cutover.
- Conserver au moins:
  - 7 backups journaliers
  - 4 backups hebdomadaires

