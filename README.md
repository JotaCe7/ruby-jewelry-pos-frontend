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
