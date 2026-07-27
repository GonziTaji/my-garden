# My garden

Small webapp to organize the information of the plants I have in my house, and as a log about their care

## Docker

```shell
cp .env.example .env
# Edit .env and set MY_GARDEN_SESSION_SECRET to a random secret
docker compose up -d
```

## Database

### Migrations

Migrations run automatically on app startup via [goose](https://github.com/pressly/goose).

To create a new migration:

```shell
goose -dir internal/database/migrations sqlite <db_path> create <name> sql
```

This generates an `up`/`down` SQL file in `internal/database/migrations/`.

### Seeding

**Docker:** The entrypoint auto-seeds on first run (admin user, plant species, images).

**Local dev:** Run the full seed (clean + re-seed everything):

```shell
bash internal/database/test-data/seed.sh
```

Seed files:

| File | Purpose |
|---|---|
| `users.sql` | Admin user |
| `plant-species-popular.sql` | ~30 common plant species |
| `plants.sql` | 10 dev plants for admin (dev only) |
| `seed-species-images.sh` | Copies species images to uploads dir |
| `docker-seed-images.sh` | Docker wrapper for image seeding |

