# Frontend

React + TypeScript + Vite app, styled with Tailwind CSS and built on React Router, TanStack Query and Supabase.

## Contents

- [Prerequisites](#prerequisites)
- [Environment variables](#environment-variables)
- [Running](#running)
- [Scripts](#scripts)
- [Generating OpenAPI types](#generating-openapi-types)

## Prerequisites

| Requirement | Notes |
| --- | --- |
| Node.js and npm | Used to install dependencies and run scripts |
| Backend | Must be running locally on port 8000 for API calls and type generation (see `../backend/README.md`) |
| Supabase project | Provides the URL and publishable key used for the client |

## Environment variables

> **Required.** The frontend needs these variables to talk to Supabase and the backend. Without them, authentication and API requests will not work.

Copy the example file and fill in your values:

```bash
cp .env.example .env
```

| Variable | Description |
| --- | --- |
| `VITE_SUPABASE_URL` | URL of your Supabase project |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Supabase publishable (public) key |
| `VITE_API_URL` | Base URL of the backend API, for example `http://127.0.0.1:8000` |

Vite only exposes variables prefixed with `VITE_` to the browser, and they are embedded in the built bundle. Never put secret keys in them. Restart the dev server after changing any value.

## Running

Install dependencies, then start the dev server (Vite, with HMR):

```bash
npm install
npm run dev
```

## Scripts

Defined in [package.json](package.json):

| Script | Command | Description |
| --- | --- | --- |
| `npm run dev` | `vite` | Start the dev server |
| `npm run build` | `tsc -b && vite build` | Type-check and create a production build |
| `npm run preview` | `vite preview` | Serve the production build locally |
| `npm run lint` | `eslint .` | Lint the project |
| `npm run gen:api` | `openapi-typescript` | Generate API types from the backend OpenAPI spec |

## Generating OpenAPI types

API types are generated from the backend's OpenAPI schema into `src/lib/api-schema.d.ts`.

1. Start the backend so it serves `http://localhost:8000/openapi.json`.
2. From the `frontend` directory, run:

   ```bash
   npm run gen:api
   ```

This runs `npx openapi-typescript@7 http://localhost:8000/openapi.json -o src/lib/api-schema.d.ts`. Re-run it whenever the backend API changes, and commit the updated `api-schema.d.ts`.
