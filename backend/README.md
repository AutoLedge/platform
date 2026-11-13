# Backend

Python API for the platform, managed with [uv](https://docs.astral.sh/uv/). The `dev` script is defined in `pyproject.toml` and starts the server in development mode.

## Contents

- [Prerequisites](#prerequisites)
- [Environment variables](#environment-variables)
- [Setup](#setup)
- [Running](#running)
- [API structure and auth](#api-structure-and-auth)
- [Plaid (Sandbox)](#plaid-sandbox)
- [Code quality](#code-quality)
- [Database migrations](#database-migrations)

## Prerequisites

| Requirement | Notes |
| --- | --- |
| [uv](https://docs.astral.sh/uv/) | Manages the Python version, virtual environment and dependencies |
| Python | Version is pinned in `.python-version`; `uv` installs it automatically when needed |
| Database | A reachable database for `DATABASE_URL` |

### Installing uv (Windows, Scoop)

Install [Scoop](https://scoop.sh/) if it is not already available, then run this in PowerShell:

```powershell
scoop install uv
uv --version
```

## Environment variables

> **Required.** The backend will not start unless these variables are set. Settings are validated at startup (see `src/autoledge/core/config.py`), so a missing value fails immediately.

Copy `.env.development.example` to `.env.development` in the `backend` directory and fill in the values:

```powershell
Copy-Item .env.development.example .env.development
```

`APP_ENV` (set by `uv run dev` / `uv run prod`) picks `.env.development` or `.env.production` from the `backend` folder, wherever the command runs from. Real environment variables override the file.

> Upgrading from a single `.env`? Rename it to `.env.development` and add `SUPABASE_URL`.

| Variable | Type | Description |
| --- | --- | --- |
| `APP_ENV` | string | `development` (default) or `production`. Set by the run scripts; rarely set by hand |
| `ENVIRONMENT` | string | `development` or `production`; must match `APP_ENV` |
| `DEBUG` | boolean | Enables debug behaviour (`true` / `false`); must be `false` in production |
| `DATABASE_URL` | secret | Supabase session pooler connection string (Supabase → Connect → Session pooler); URL-encode special characters in the password |
| `SUPABASE_URL` | string | Supabase project URL, same as the frontend's `VITE_SUPABASE_URL` |
| `CORS_ORIGINS` | string | Comma-separated browser origins allowed to call the API. Defaults to the Vite dev server; required in production, with no localhost |
| `PLAID_TOKEN_ENCRYPTION_KEY` | secret | Fernet key used to encrypt Plaid access tokens. Generate with the command in `.env.development.example`; use a different key per environment |
| `PLAID_CLIENT_ID` | string | Plaid client id (Plaid Dashboard → Keys); the same in every environment |
| `PLAID_SECRET` | secret | Plaid secret for this environment: the **Sandbox** secret in development, the Production secret in production |
| `PLAID_COUNTRY_CODES` | string | Comma-separated countries offered in Plaid Link. Defaults to `CA,US` |
| `PLAID_WEBHOOK_URL` | string | Where Plaid sends webhooks; `https://` only. Leave unset in day-to-day development |

Sandbox keys come from the [Plaid Dashboard](https://dashboard.plaid.com/developers/keys)'s **Keys** page: copy the client id and the Sandbox secret into `.env.development`. Development always talks to Plaid Sandbox.

See `.env.development.example` and `.env.production.example` for every variable with a placeholder value.

Never commit `.env.development`, `.env.production` or real credentials.

### Connection budget

The API connects through Supabase's **session pooler**, where every connection the app holds uses one of the project's database connections (shared with the dashboard, migrations and every other running copy of the app). Each API process holds at most 10 (`pool_size=5` + `max_overflow=5` in `src/autoledge/db/session.py`), so:

> instances × uvicorn workers × 10 must stay well under the project's connection limit (Supabase → Database → Settings).

Raise the pool sizes, or add workers or instances, only after checking that sum.

## Setup

Run these from the `backend` directory.

1. Optionally install the pinned Python version up front:

   ```powershell
   uv python install
   ```

2. Install dependencies:

   ```powershell
   uv sync
   ```

   This creates `.venv` if needed and installs the packages from `pyproject.toml`, pinned by `uv.lock`. Re-run it whenever dependencies change.

## Running

Start the development server:

```powershell
uv run dev
```

| | |
| --- | --- |
| URL | `http://127.0.0.1:8000` |
| OpenAPI schema | `http://127.0.0.1:8000/openapi.json` |
| Reload | Automatic on code changes |

The OpenAPI schema is what the frontend uses to generate its API types (see `../frontend/README.md`).

### Production

```powershell
uv run prod
```

Reads `.env.production` or the host's environment variables, binds `0.0.0.0` on port `PORT` (default 8000), no reload.

It refuses to start if `DEBUG=true`, if `ENVIRONMENT` isn't `production`, or if `CORS_ORIGINS` is empty or contains localhost.

## API structure and auth

- Routes live in `src/autoledge/api/routes/`, one module per resource, each with a `router` included in `src/autoledge/main.py`.
- Start every new router from `user_router()` or `business_router()` in `src/autoledge/api/routers.py`, so it is protected by default. Plain `APIRouter()` is for public health checks only.
- Routes get the database session and the signed-in user or business from `src/autoledge/api/deps.py` (`DbSession`, `CurrentUser`, `CurrentBusiness`, `OwnerBusiness`).
- Auth is a Supabase access token sent as `Authorization: Bearer <token>`, verified against the project's ES256 public keys (no secret is stored).

| Status | When |
| --- | --- |
| 401 | No token, or an invalid, expired or anonymous token, or no profile for the user. The frontend signs the user out |
| 503 | Supabase's key endpoint is unreachable. A server problem, so the user is not signed out |
| 404 | The caller isn't a member of the business in the path, or no such business exists |
| 403 | A member who isn't the owner, on an owner-only route |
| 400 | Plaid Link's public token is invalid or expired: open Link again |
| 409 | A conflict: the bank is already connected to this business, or a connection belongs to another Plaid environment |
| 502 | Plaid failed or is unreachable. The detail is generic; Plaid's error codes are only logged |

Plaid responses never include access tokens, Plaid's own item or account ids, or sync cursors: `id` is always AutoLedge's id.

Two data rules for every route:

1. Ownership ids (`user_id`, `business_id`) come only from the dependencies, never from a request body.
2. Child rows are looked up by both their own id and `business_id`, so an id from another business is a 404.

### Endpoints

Routes return `src/autoledge/schemas/` models, never SQLAlchemy models. Request bodies reject unknown fields with 422. Interactive docs are at `/docs` while the server runs.

| Method | Path | Router | Returns |
| --- | --- | --- | --- |
| GET | `/`, `/health`, `/health/db` | public | Liveness, and database connectivity (503 if the database is down) |
| GET | `/me` | user | The caller's profile: `id`, `email`, `full_name` |
| GET | `/businesses` | user | Only the businesses the caller is a member of, each with `id`, `name` and the caller's `role` |
| POST | `/businesses` | user | **201** and the new business. Body: `{"name": "..."}` (trimmed, 1–200 characters). The creator becomes the owner; the business and the owner membership are created in one transaction |
| GET | `/businesses/{business_id}` | business | That business and the caller's `role`. 404 if the caller isn't a member |
| POST | `/businesses/{business_id}/plaid/link-token` | owner | A Plaid Link token (`link_token`, `expiration`) for CA and US institutions with 180 days of history. 403 for members, 502 if Plaid fails |
| POST | `/businesses/{business_id}/plaid/items` | owner | **201** and the new connection with its accounts. Body: `{"public_token": "...", "institution_id": "..."}` from Link's `onSuccess` (`institution_id` optional). 400 expired or invalid public token, 403 for members, 409 bank already connected, 502 if Plaid fails. A failure after the exchange removes the item at Plaid again. Then runs the connection's first transaction sync; the connection is kept (still 201) even if that sync fails |
| GET | `/businesses/{business_id}/plaid/items` | business | The business's connections, newest first, each with `status` (`ok` / `needs_attention`) and its accounts |
| POST | `/businesses/{business_id}/plaid/items/{item_id}/sync` | business | Syncs one connection's transactions now (Refresh). **200** with Plaid's `added` / `modified` / `removed` counts and the connection. 404 unknown connection or another business's, 409 a sync is already running / the connection needs to be reconnected / connection from another Plaid environment, 502 if Plaid fails (nothing changes) |
| GET | `/businesses/{business_id}/accounts` | business | Every account of the business, including inactive ones from removed connections (`connected: false`). Connected accounts first, then by name |
| DELETE | `/businesses/{business_id}/plaid/items/{item_id}` | owner | **204**. Removes the connection at Plaid and here; its accounts and transactions stay, marked inactive. 403 for members, 404 unknown connection or another business's, 409 connection from another Plaid environment, 502 if Plaid fails (nothing changes) |

## Plaid (Sandbox)

Bank connections go through [Plaid](https://plaid.com/docs/). All Plaid calls live in `src/autoledge/services/plaid.py`; routes never touch the SDK or access tokens directly.

- **Keys:** put `PLAID_CLIENT_ID` and the **Sandbox** `PLAID_SECRET` from the Plaid Dashboard's Keys page in `.env.development` (see [Environment variables](#environment-variables)).
- **Sandbox only in development.** The Plaid environment follows `ENVIRONMENT`: Sandbox unless it is `production`. Every stored connection records its environment, and a token from another environment is refused (409).
- **Test logins** in Plaid Link: `user_good` / `pass_good` (for example with *First Platypus Bank*, a non-OAuth institution). Use `user_small_business` for demo data.
- **Refresh** is `POST …/plaid/items/{item_id}/sync`. Without webhooks it is also how local data stays current.
- **Right after connecting**, Plaid may not have transactions ready yet (the first sync then brings nothing). Refresh again after a few seconds; the first Refreshes also bring the rest of the history, reported as `modified`.
- With the Sandbox user `user_transactions_dynamic`, Plaid's `/sandbox/transactions/refresh` creates new activity (new transactions, pending ones posting) to sync.
- **Webhooks stay off day to day:** leave `PLAID_WEBHOOK_URL` unset. Testing webhooks through a tunnel is covered in N16.
- Access tokens are stored only encrypted (`PLAID_TOKEN_ENCRYPTION_KEY`) and never returned or logged.

## Code quality

[Ruff](https://docs.astral.sh/ruff/) lints and formats the code. Its settings are in `pyproject.toml`. Run both before every commit:

```powershell
uv run ruff check .
uv run ruff format .
```

`ruff check --fix .` fixes what it safely can (for example import order). Migrations in `alembic/versions/` are excluded on purpose.

## Database migrations

The database schema is managed with [Alembic](https://alembic.sqlalchemy.org/). Migrations live in `alembic/versions/` and are the only way the schema changes: never edit tables in the Supabase dashboard. Run every command from the `backend` directory.

Alembic reads the development settings by default. To migrate production, run `$env:APP_ENV = "production"; uv run alembic upgrade head` in a terminal with production values, then `Remove-Item Env:APP_ENV`.

### Team rules

1. **After every pull, apply migrations** before running the server:

   ```powershell
   uv run alembic upgrade head
   ```

2. **One migration per pull request.** If a PR changes models, it includes exactly one new migration for those changes.
3. **Never edit a migration that has been merged** to `main`. To fix or undo it, write a new migration.
4. **Read every autogenerated migration before applying it.** Autogenerate is a draft, not a final answer (see below).
5. **Every migration must downgrade.** Hand-written SQL (functions, triggers) needs a matching `downgrade()` that removes it.

### Common commands

| Task | Command |
| --- | --- |
| Apply all pending migrations | `uv run alembic upgrade head` |
| Show the database's current revision | `uv run alembic current` |
| Show the migration history | `uv run alembic history` |
| Create a migration from model changes | `uv run alembic revision --autogenerate -m "short description"` |
| Undo the most recent migration | `uv run alembic downgrade -1` |

### Making a schema change

1. Change or add the model in `src/autoledge/models/`. New model modules must be imported in `models/__init__.py`, or Alembic won't see them.
2. Generate the migration:

   ```powershell
   uv run alembic revision --autogenerate -m "add invoices"
   ```

3. Open the new file in `alembic/versions/` and check it:
   - A renamed column or table shows up as a **drop plus an add**, which deletes data. Replace it with `op.alter_column(..., new_column_name=...)` or `op.rename_table(...)`.
   - A new `NOT NULL` column on a table that already has rows needs a `server_default`.
   - Partial unique indexes and check constraints sometimes need hand edits.
4. Apply it, then check that it reverses cleanly:

   ```powershell
   uv run alembic upgrade head
   uv run alembic downgrade -1
   uv run alembic upgrade head
   ```

5. Commit the model change and the migration together.

### When two branches both add a migration

If both developers add a migration from the same starting point, Alembic ends up with two heads and `upgrade head` fails with a "multiple heads" error. Whoever merges second fixes it: rebase on `main`, then change the `down_revision` in your own migration file to the revision id of the migration that was merged first. Check with:

```powershell
uv run alembic heads
```

It should list exactly one revision.
