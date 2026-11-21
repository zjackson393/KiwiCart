from __future__ import annotations

import os
import sys

import pandas as pd
import pytest
from fastapi.testclient import TestClient

# Required env vars for Settings() — dummy values, nothing real is contacted.
os.environ.setdefault("GOOGLE_CLIENT_ID", "test-client-id")
os.environ.setdefault("GOOGLE_CLIENT_SECRET", "test-client-secret")
os.environ.setdefault("JWT_SECRET", "test-secret")
os.environ.setdefault("SESSION_KEY", "test-session-key")
os.environ.setdefault("DATABASE_SCRAPER", "sqlite:///:memory:")
os.environ.setdefault("DATABASE_USERS", "sqlite:///:memory:")

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))


class FakeGrocerAPI:
    """
    In-memory stand-in for GrocerAPI so route tests never touch DuckDB,
    the network, or the real grocer.nz dataset.
    """

    def __init__(self) -> None:
        self._stores = pd.DataFrame(
            [
                {"id": 1, "name": "New World Wellington"},
                {"id": 2, "name": "Woolworths Lambton Quay"},
            ]
        )
        self._products = {
            1: pd.DataFrame(
                [
                    {"product_id": 100, "name": "Milk 2L", "original_price_cent": 450},
                    {"product_id": 101, "name": "Bread", "original_price_cent": 380},
                ]
            ),
            2: pd.DataFrame(
                [
                    {"product_id": 100, "name": "Milk 2L", "original_price_cent": 399},
                ]
            ),
        }

    def get_stores(self) -> pd.DataFrame:
        return self._stores

    def get_store(self, store_id: int):
        row = self._stores[self._stores["id"] == store_id]
        return None if row.empty else row.iloc[0].to_dict()

    def get_store_name(self, store_id: int) -> str:
        row = self._stores[self._stores["id"] == store_id]
        if row.empty:
            raise KeyError(store_id)
        return str(row.iloc[0]["name"])

    def get_products(self, store_id: int) -> pd.DataFrame:
        return self._products.get(store_id, pd.DataFrame())

    def get_product_prices(self, product_id: int) -> pd.DataFrame:
        rows = []
        for sid, df in self._products.items():
            hit = df[df["product_id"] == product_id]
            if not hit.empty:
                row = hit.iloc[0].to_dict()
                row["store_id"] = sid
                row["store_name"] = self.get_store_name(sid)
                rows.append(row)
        if not rows:
            return pd.DataFrame()
        return pd.DataFrame(rows).sort_values("original_price_cent").reset_index(drop=True)

    def compare_products(self, product_ids: list[int], store_ids: list[int]) -> pd.DataFrame:
        rows = []
        for sid in store_ids:
            df = self.get_products(sid)
            hits = df[df["product_id"].isin(product_ids)]
            for _, row in hits.iterrows():
                rows.append(
                    {
                        "product_id": int(row["product_id"]),
                        "name": str(row["name"]),
                        "original_price_cent": int(row["original_price_cent"]),
                        "store_id": sid,
                        "store_name": self.get_store_name(sid),
                    }
                )
        if not rows:
            return pd.DataFrame()
        df = pd.DataFrame(rows)
        min_prices = df.groupby("product_id")["original_price_cent"].transform("min")
        df["is_cheapest"] = df["original_price_cent"] == min_prices
        return df

    def image_url(self, product_id: int) -> str:
        return f"https://assets-prod.grocer.nz/public/product_images/product_{product_id}.avif"


@pytest.fixture
def fake_api() -> FakeGrocerAPI:
    return FakeGrocerAPI()


@pytest.fixture
def client(fake_api, monkeypatch) -> TestClient:
    """A TestClient with GrocerAPI swapped out for the in-memory fake everywhere it's imported."""
    from app.main import app
    import app.grocerAPI as grocerAPI_pkg
    import app.routes.Products as products_route
    import app.routes.Stores as stores_route
    import app.routes.Route as route_route

    monkeypatch.setattr(grocerAPI_pkg, "get_grocer_api", lambda: fake_api)
    monkeypatch.setattr(products_route, "get_grocer_api", lambda: fake_api)
    monkeypatch.setattr(stores_route, "get_grocer_api", lambda: fake_api)
    monkeypatch.setattr(route_route, "get_grocer_api", lambda: fake_api)

    return TestClient(app)
