from __future__ import annotations

import logging
import uuid
from collections.abc import Callable
from functools import lru_cache

import pandas as pd
from pandas import DataFrame
from sqlalchemy import func, desc

from sqlalchemy.orm import Session, joinedload
from supermarket_scraper.database.models import Store, Product, Price

from app.database import SessionScraper

logger = logging.getLogger(__name__)


class GrocerAPI:

    BASE_URL = "https://assets-prod.grocer.nz/public"
    IMAGE_URL = f"{BASE_URL}/product_images/product_{{product_id}}.avif"

    def __init__(self, session_factory: Callable[[], Session] = SessionScraper) -> None:
        self._session_factory = session_factory

    # ── Store helpers (ORM) ──────────────────────────────────────────────────

    def get_stores(self, brand: str | None = None) -> DataFrame:
        if brand:
            return self.get_stores_by_brand(brand)
        with self._session_factory() as db:
            return pd.read_sql(db.query(Store).statement, db.connection())

    def get_stores_by_brand(self, brand: str) -> DataFrame:
        if brand.lower() == "woolworths":
            brand = "WO"
        elif brand.lower() == "pak n save":
            brand = "PNS"
        elif brand.lower() == "new world":
            brand = "MNW"

        with self._session_factory() as db:
            stmt = db.query(Store).filter(Store.brand == brand).statement
            return pd.read_sql(stmt, db.connection())

    def get_store(self, store_id: uuid.UUID) -> Store | None:
        with self._session_factory() as db:
            return db.query(Store).filter(Store.id == store_id).one_or_none()

    def get_store_name(self, store_id: uuid.UUID) -> str:
        with self._session_factory() as db:
            name = db.query(Store.name).where(Store.id == store_id).scalar()
        if name is None:
            raise KeyError(store_id)
        return name

    def get_stores_by_ids(self, store_ids: list[uuid.UUID]) -> DataFrame:
        with self._session_factory() as db:
            statement = db.query(Store).where(Store.id.in_(store_ids))
            return pd.read_sql(statement.statement, db.connection())

    # ── Product + price helpers (Iceberg + ORM) ──────────────────────────────

    def get_all_products_by_store(self, store_id: uuid.UUID, query: str | None = None) -> DataFrame:
        with self._session_factory() as db:
            statement = (db.query(Price)
                         .join(Product, Price.product_id == Product.id)
                         .where(Price.store_id == store_id)
                         .options(joinedload(Price.product)))
            if query:
                statement = statement.where(Product.normalized_title.ilike(f"%{query}%"))
            return pd.read_sql(statement.statement, db.connection())

    def get_product_by_store_ids(
            self,
            store_id: uuid.UUID,
            product_ids: list[uuid.UUID]
    ):
        with self._session_factory() as db:
            statement = (db.query(Price)
                         .join(Product, Price.product_id == Product.id)
                         .where(Price.store_id == store_id)
                         .where(Product.id.in_(product_ids))
                         .options(joinedload(Price.product))
                         )
            return pd.read_sql(statement.statement, db.connection())

    def get_products_by_stores(
        self,
        store_ids: list[uuid.UUID],
        query: str | None = None,
    ) -> DataFrame:
        with self._session_factory() as db:
            base = (
                db.query(
                    Price.id.label("id"),
                    Price.updated_at.label("updated_at"),
                    Price.original_price.label("original_price"),
                    Price.sale_price.label("sale_price"),
                    Price.club_price.label("club_price"),
                    Price.multibuy_price.label("multibuy_price"),
                    Price.multibuy_quantity.label("multibuy_quantity"),
                    Price.club_required_multibuy.label("club_required_multibuy"),
                    Price.uom.label("uom"),
                    Price.uom_quantity.label("uom_quantity"),
                    Price.price_per_uom.label("price_per_uom"),
                    Price.price_per_uom_sale.label("price_per_uom_sale"),
                    Product.id.label("product_id"),
                    Product.normalized_title.label("normalized_title"),
                    Product.brand.label("brand"),
                    Product.size_value.label("size_value"),
                    Product.image.label("image"),
                    Product.sold_by.label("sold_by"),
                    Store.id.label("store_id"),
                    Store.name.label("store_name"),
                    Store.brand.label("store_brand"),
                )
                .join(Product, Price.product_id == Product.id)
                .join(Store, Price.store_id == Store.id)
                .where(Price.store_id.in_(store_ids))
            )

            if query is None:
                statement = base.limit(200)
                return pd.read_sql(statement.statement, db.connection())

            tsquery_str = Product._build_prefix_tsquery(query)
            if tsquery_str is None:
                statement = base.limit(200)
                return pd.read_sql(statement.statement, db.connection())

            tsquery = func.to_tsquery("english", tsquery_str)

            fts_rank = func.ts_rank_cd(Product.search_vector, tsquery, 4)
            trgm_sim = func.similarity(Product.normalized_title, query.lower())
            combined_rank = (fts_rank + trgm_sim).label("rank")

            statement = (
                base.add_columns(combined_rank)
                .where(
                    Product.search_vector.op("@@")(tsquery)
                    | (trgm_sim > 0.3)
                )
                .order_by(desc(combined_rank), Price.id)
                .limit(200)
            )
            return pd.read_sql(statement.statement, db.connection())

@lru_cache(maxsize=1)
def get_grocer_api() -> GrocerAPI:
    return GrocerAPI()
