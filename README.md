# KiwiCart

Grocery price comparison and shopping-route optimisation for NZ supermarkets,
powered by [grocer.nz](https://grocer.nz) data.

> Team project built by four students for the Victoria University of Wellington
> engineering project course (ENGR301/302). See `RACI.md` for the
> responsibility split. The hosted app (kiwicart.app) has been decommissioned,
> so this repository is a code and documentation snapshot only.

- **`backend/`** — FastAPI service that reads grocer.nz's DuckDB/Parquet data,
  compares prices across stores, and generates optimised shopping routes
  (cheapest / quickest / hybrid) via OSRM.
- **`frontend/`** — Next.js app: Google sign-in, catalog search, a grocery
  list, and a map/route view.

## Quick start

### Backend

```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.sample .env   # fill in Google OAuth, JWT, session, and DATABASE_URL
uvicorn app.main:app --reload
```

API docs are served at `http://localhost:8000/docs` once running.

Run the test suite:

```bash
pytest
```

### Frontend

```bash
cd frontend
corepack enable
pnpm install
pnpm dev
```

Set `NEXT_PUBLIC_API_BASE_URL` (e.g. in `.env.local`) to point at your
backend — it defaults to `http://localhost:8000`.

Run the test suite:

```bash
pnpm test
```

## Private dependency

The backend imports `supermarket_scraper` (package `nz-supermarket-scraper`),
the course-hosted scraper that populates the grocer.nz-style product database.
It is **not publicly available**, so the backend cannot be run end-to-end from
this repository alone. It is commented out in `backend/requirements.txt`; the
frontend and the rest of the code are provided for reading and review.

## CI/CD

`.gitlab-ci.yml` is kept for reference. It ran backend/frontend unit tests on
every change to the relevant directory, built the frontend, and deployed
previews/production to Vercel from the `dev`/`main` branches. The original
production-backend deploy job has been removed.

## Data and test material

Product and price data comes from [grocer.nz](https://grocer.nz); see their
terms before reusing it. `test_data/` holds the spreadsheets from our price
accuracy and route load-time testing.

## Licence

MIT, see `LICENSE`.

## Security notes

- Secrets (Google OAuth credentials, JWT signing key, session key, database
  URL) are read from environment variables only — see `backend/.env.sample`
  for the full list. Never commit real values.
