from __future__ import annotations

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.sessions import SessionMiddleware

from app.utils import settings
from app.grocerAPI import get_grocer_api
from app.routes import stores_router, route_router, auth_router, cart_router


def _configure_logging() -> None:
  root_logger = logging.getLogger()
  root_logger.setLevel(logging.INFO)

  if root_logger.handlers:
    return

  handler = logging.StreamHandler()
  handler.setFormatter(logging.Formatter("%(asctime)s %(levelname)s [%(name)s] %(message)s"))
  root_logger.addHandler(handler)


_configure_logging()

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
  """
  Warm the DuckDB connection and pre-fetch the stores list on startup so
  the first real request doesn't pay the ~2-3 s connection cost.
  """
  logger.info("Connecting to grocer.nz DuckDB…")
  try:
    api = get_grocer_api()
    # api.get_stores()  no longer needed as data is auto loaded on class creation
    logger.info("grocer.nz DB ready")
  except Exception as exc:
    logger.warning("DB warm-up failed (will retry on first request): %s", exc)
  yield


app = FastAPI(
    title="Grocer Route API",
    description=(
      "Price comparison and optimised shopping-route generation powered by "
      "[grocer.nz](https://grocer.nz) data.\n\n"
      "## Quick start\n"
      "1. `GET /stores` — find store IDs\n"
      "2. `GET /stores/{id}/products?search=milk` — find product IDs\n"
      "3. `GET /products/compare?product_ids=…&store_ids=…` — compare prices\n"
      "4. `GET /route?stores=…&products=…&start_lat=…&start_lng=…` — get the route\n"
    ),
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(SessionMiddleware, secret_key=settings.session_key)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_origin],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(stores_router)
app.include_router(route_router)
app.include_router(auth_router)
app.include_router(cart_router)


@app.get("/", tags=["Meta"], summary="API health check")
def root() -> dict:
  return {"status": "ok", "version": app.version}
