# KiwiCart backend

FastAPI service backed by grocer.nz's public DuckDB + per-store Parquet data.

## Layout

```
app/
  main.py        FastAPI app, CORS/session middleware, router wiring
  routes/        HTTP endpoints (Stores, Products, Route, Auth)
  grocerAPI/     GrocerAPI — thin, cached wrapper around DuckDB/httpfs
  schemas/       Pydantic response models
  database/      SQLAlchemy engine/session + models (Users, for auth)
  utils/         Settings (env config), JWT helpers
tests/           pytest suite (routes are tested against a fake GrocerAPI,
                 no real DuckDB/network access)
```

## Configuration

All configuration is via environment variables (see `.env.sample`). Nothing
sensitive is hard-coded in source — in particular `DATABASE_URL` must be set;
there is no default.

## Endpoints

See `/docs` (Swagger UI) once the app is running, or `/schema` for the
columns actually discovered in the live grocer.nz dataset.

Note: `GET /products/search` (a full N-store substring scan) has been
removed — it didn't scale with the number of stores. Use
`GET /stores/{store_id}/products?search=...` for a single store, or
`GET /products/compare` for a known set of product/store IDs.

## Testing

```bash
pip install -r requirements.txt
pytest
```

Route logic (nearest-neighbour TSP, hybrid cost/time trade-off) is unit
tested directly; HTTP routes are tested through FastAPI's `TestClient` with
`GrocerAPI` swapped for an in-memory fake (see `tests/conftest.py`).
