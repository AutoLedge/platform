# Backend

Python API for the platform, managed with [uv](https://docs.astral.sh/uv/). The `dev` script is defined in `pyproject.toml` and starts the server in development mode.

## Contents

- [Prerequisites](#prerequisites)
- [Environment variables](#environment-variables)
- [Setup](#setup)
- [Running](#running)

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

Create a `.env` file in the `backend` directory. Variables are loaded from it automatically, or from the process environment.

| Variable | Type | Description |
| --- | --- | --- |
| `ENVIRONMENT` | string | Deployment environment name, for example `development` or `production` |
| `DEBUG` | boolean | Enables debug behaviour (`true` / `false`) |
| `DATABASE_URL` | string | Connection string for the database |

Example `.env`:

```dotenv
ENVIRONMENT=development
DEBUG=true
DATABASE_URL=<your-database-connection-string>
```

Never commit `.env` or real credentials.

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
