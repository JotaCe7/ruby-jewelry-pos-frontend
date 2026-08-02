# Ruby Jewelry POS — Frontend

React + Vite + TypeScript single-page app for Joyería Ruby's ERP/POS system. Consumes the API from [ruby-jewelry-pos](https://github.com/JotaCe7/ruby-jewelry-pos) (Django + DRF) over REST/JSON with JWT auth. The two projects are independent — this one has no server-side code of its own.

## Stack

- React 19 + TypeScript, built with Vite
- Tailwind CSS v4 — "Ruby Red" dark premium theme
- React Router, TanStack Query
- `react-i18next` — Spanish is the only shipped locale today, but every string goes through `t()` so more locales can be added later without touching component code
- `axios` client with automatic JWT refresh (`src/api/client.ts`)
- Chart.js (`react-chartjs-2` + `chartjs-plugin-datalabels`) for the dashboard

## Getting started

1. Copy the environment template and point it at your running backend:

   ```bash
   cp .env.example .env
   ```

2. Install dependencies and start the dev server:

   ```bash
   npm install
   npm run dev
   ```

   The app runs at `http://localhost:5173/`. It expects the backend to be running at the URL in `VITE_API_BASE_URL` (defaults to `http://localhost:8000/api`).

## Deployment

Same model as the [backend](https://github.com/JotaCe7/ruby-jewelry-pos): **dev** is always local (`npm run dev` above, never deployed); **staging** and **production** run on the same VPS as the backend, as a separate `frontend` (nginx) container joined to a shared per-environment Docker network so it can reach `backend` by name.

- `Dockerfile` builds the Vite production bundle and serves it via nginx, which also reverse-proxies `/api`, `/admin`, `/static`, and `/media` to the backend container. `VITE_API_BASE_URL` is baked in as the relative path `/api` at build time (not the `http://localhost:8000/api` used for local dev) — so the exact same image is deployed to every environment, no per-environment rebuild.
- **To deploy:** GitHub → Actions tab → "Deploy Frontend" workflow → "Run workflow" → pick the branch and the target environment (`staging` or `production`).
- Per-environment config lives in this repo's GitHub Settings → Environments — never committed. See `.env.staging.example` / `.env.production.example` for the variables each environment needs.

## Project layout

```
src/
├── api/        # typed HTTP client per module (finance, inventory, pos, dashboard)
├── features/   # one folder per business module (catalogs, contacts, finance, inventory, pos, dashboard)
├── components/ # shared UI (inputs, tables, cards)
├── locales/es/ # i18next translation files
└── theme/      # Tailwind "Ruby Red" theme tokens
```

## Language conventions

All code (identifiers, comments) is written in English. All user-facing text is Spanish content routed through `react-i18next` — never hardcode a string directly in JSX.
