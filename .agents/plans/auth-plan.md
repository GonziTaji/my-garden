# Authentication & Multi-User Plan

## Auth Strategy: Magic Link (Passwordless)

User enters email → receives link → clicks to verify → session cookie set.

- No passwords to manage
- Auto-registration (no separate signup form)
- `crypto/rand` for tokens, SHA-256 hash stored in DB
- `net/smtp` (stdlib) for email, or console-log in dev

---

## Env Vars

```
MY_GARDEN_SESSION_SECRET    # HMAC key for session cookies (required)
MY_GARDEN_SMTP_HOST         # e.g. smtp.gmail.com
MY_GARDEN_SMTP_PORT         # e.g. 587
MY_GARDEN_SMTP_USER         # email username
MY_GARDEN_SMTP_PASS         # email password/app-password
MY_GARDEN_SMTP_FROM         # from address
MY_GARDEN_ORIGIN            # public URL (for email links)
```

---

## Schema Changes

### New tables

```sql
create table if not exists users (
  id integer primary key autoincrement not null,
  email text not null unique,
  username text not null unique,
  created_at text default (datetime('now', 'localtime')) not null,
  updated_at text default (datetime('now', 'localtime')) not null
);

create table if not exists auth_tokens (
  id integer primary key autoincrement not null,
  email text not null,
  token_hash text not null,
  expires_at text not null,
  used_at text,
  created_at text default (datetime('now', 'localtime')) not null
);

create table if not exists plant_definition_favorites (
  id integer primary key autoincrement not null,
  user_id integer not null references users(id),
  plant_definition_id integer not null references plant_definitions(id) on delete cascade,
  created_at text default (datetime('now', 'localtime')) not null,
  unique(user_id, plant_definition_id)
);
```

### Columns to add

- `plant_definitions`: `user_id integer references users(id)`, `visibility text not null default 'private'`
- `plants`: `user_id integer references users(id)`
- `plant_journal_entries`: `user_id integer references users(id)`
- `plant_images`: `user_id integer references users(id)`
- `plant_location_history`: `user_id integer references users(id)`

Migration to backfill existing rows with user_id = 1 (first admin).

---

## New Files

| File | Purpose |
|---|---|
| `domain/user/types.go` | User, AuthToken, request/response types |
| `domain/user/store.go` | SQLite queries for users + auth_tokens |
| `domain/user/service.go` | RequestLogin, VerifyLogin business logic |
| `domain/user/controller.go` | HTTP handlers: send-link, verify, logout, me |
| `domain/user/router.go` | Auth route registration |
| `internal/auth/cookie.go` | HMAC session cookie sign/verify (~40 lines) |
| `internal/auth/middleware.go` | Optional + required auth middleware |
| `frontend/src/auth/AuthContext.tsx` | React context + provider (check session, login, logout) |
| `frontend/src/ui/pages/Login.tsx` | Email input + "Send magic link" flow |

---

## Router Structure

```
/api
├── (public)
│   ├── POST /auth/send-link
│   ├── GET  /auth/verify
│   ├── POST /auth/logout
│   ├── GET  /auth/me              ← OptionalAuth (returns user if session, 204 if not)
│   ├── GET  /plant-definitions    ← OptionalAuth
│   └── GET  /plant-definitions/:id ← OptionalAuth
│
├── (optional auth — sets userID if cookie present, no rejection)
│   └── [OptionalAuth middleware]
│
└── (protected — rejects with 401 if no valid session)
    └── [RequireAuth middleware]
        ├── POST /plant-definitions
        ├── PUT  /plant-definitions/:id
        ├── DELETE /plant-definitions/:id
        ├── POST /plant-definitions/:id/clone
        ├── POST /plant-definitions/:id/favorite
        └── all existing plants/journal/watering/image endpoints
```

**Two middleware variants:**
- `OptionalAuth` — reads the session cookie, parses userID if valid, stores it in `gin.Context` (e.g. `c.Set("user_id", userID)`), but **never rejects the request**. Handlers call `c.GetInt64("user_id")` and get 0 if no session.
- `RequireAuth` — wraps `OptionalAuth`, then rejects with 401 if `userID == 0`.

| File | Changes |
|---|---|
| `go.mod` | Add `golang.org/x/crypto` as direct dependency |
| `main.go` | Read new env vars for SMTP + session secret |
| `internal/database/schema.sql` | New tables + columns |
| `internal/database/database.go` | Migration steps for backfill |
| `internal/server/server.go` | SessionSecret in ServerConfig + RouterConfig |
| `internal/server/router.go` | Split /api into public (catalog reads, auth) and protected groups; mount both middlewares |
| `domain/plant/types.go` | UserID, Visibility fields on entities |
| `domain/plant/interfaces.go` | userID param on all store methods |
| `domain/plant/store.go` | user_id in every query + clone/favorite queries |
| `domain/plant/service.go` | userID param everywhere; clone + favorite logic |
| `domain/plant/controller.go` | Extract userID from context |
| `domain/plant/router.go` | + clone, favorite routes |
| `frontend/src/main.tsx` | Wrap with AuthProvider |
| `frontend/src/api/client.ts` | credentials: "include" |
| `frontend/src/ui/pages/Layout.tsx` | User info + logout in nav |
| `frontend/src/router/routes.ts` | + /login route |

---

## API Endpoints

### Auth (public)

| Method | Path | Description |
|---|---|---|
| POST | `/api/auth/send-link` | Send magic link to email |
| GET | `/api/auth/verify` | Verify token from link, set cookie, redirect |
| POST | `/api/auth/logout` | Clear session cookie |
| GET | `/api/auth/me` | Return current user (or empty 204 if no session) |

### Catalog reads (public — no auth required)

| Method | Path | Description |
|---|---|---|
| GET | `/api/plant-definitions?scope=public\|all` | List public definitions (optionally with user's own if logged in) |
| GET | `/api/plant-definitions/:id` | Get single definition (public entries always readable) |

`scope=public` — all public entries. `scope=all` — public entries + user's own (requires optional auth).

### Catalog mutations (auth required)

| Method | Path | Description |
|---|---|---|
| POST | `/api/plant-definitions` | Create definition (private by default) |
| PUT | `/api/plant-definitions/:id` | Update own definition |
| DELETE | `/api/plant-definitions/:id` | Delete own definition |
| POST | `/api/plant-definitions/:id/clone` | Clone a public definition |
| POST | `/api/plant-definitions/:id/favorite` | Toggle favorite |

### Personal data (auth required)

All existing endpoints for plants, journal, watering, images, etc. remain unchanged but scoped to user_id.

---

## Catalog Sharing Model

- `visibility` field: `"public"` or `"private"` (default)
- Public definitions are readable by everyone (no auth required), writable only by owner
- Unauthenticated users can browse the public catalog (read-only)
- Authenticated users can browse public catalog, clone entries → get their own private copy
- Authenticated users can favorite public entries for quick access
- Clone copies all definition fields + image references (shared filepaths)
- Frontend: catalog pages always render; mutation buttons (clone, favorite, create, edit, delete) are hidden when not logged in

---

## Implementation Order

1. Add `golang.org/x/crypto` to go.mod
2. Schema: new tables + migration backfill
3. `internal/auth/cookie.go` — HMAC session signing
4. `internal/auth/middleware.go` — OptionalAuth + RequireAuth
5. `domain/user/` — types, store, service, controller, router
6. Modify `domain/plant/` — add userId everywhere, catalog reads tolerate userId=0 (only show public)
7. Wire up in `server/router.go` + `main.go`
8. Frontend: AuthContext + Login page
9. Frontend: Guest browsing (catalog visible without login, nav shows "Iniciar sesión" instead of user info)
10. Frontend: Clone + favorite buttons (only shown when logged in)
11. SMTP email sending (or console fallback)
