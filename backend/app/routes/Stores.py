from __future__ import annotations

import uuid

import numpy as np
from fastapi import APIRouter, HTTPException, Query

from app.grocerAPI import get_grocer_api
from app.schemas import CatalogItem, CatalogRequest, CatalogStorePrice, Product, Store

router = APIRouter(prefix="/stores", tags=["Stores"])


@router.get(
    "",
    response_model=list[Store],
    summary="List all stores",
)
def list_stores(
    retailer: str | None = Query(
        None,
        description="Filter by retailer brand, e.g. 'Woolworths' or 'New World'",
    ),
) -> list[Store]:
    """
    Return every store in the Grocer database.
    Optionally filter by **retailer** brand name (case-insensitive prefix match).
    """
    api = get_grocer_api()

    return [Store.from_row(r) for r in api.get_stores(brand=retailer).to_dict(orient="records")]


@router.post(
    "/catalog",
    response_model=list[CatalogItem],
    summary="Combined catalog for selected stores",
)
def get_catalog(
    request: CatalogRequest,
) -> list[CatalogItem]:
    api = get_grocer_api()

    # Keep first-seen order while removing duplicates.
    store_ids = list(dict.fromkeys(request.stores))
    stores_df = api.get_stores_by_ids(store_ids)
    found_store_ids = set(stores_df["id"].tolist())
    missing = [sid for sid in store_ids if sid not in found_store_ids]
    if missing:
        raise HTTPException(status_code=404, detail=f"Store {missing[0]} not found")

    products_df = api.get_products_by_stores(store_ids, request.search)
    if products_df.empty:
        return []

    merged: dict[uuid.UUID, CatalogItem] = {}

    for row in products_df.replace({np.nan: None}).to_dict(orient="records"):
        product = Product.model_validate(row)
        store_price = CatalogStorePrice(
            store_id=row["store_id"],
            store_name=str(row["store_name"]),
            retailer=Store.retailer_from_brand(str(row["store_brand"])),
            price=product.price,
        )

        existing = merged.get(product.id)
        if existing is None:
            merged[product.id] = CatalogItem(
                product_id=product.id,
                name=product.normalized_title.strip(),
                prices=[store_price],
                quantity=1,
                image=product.image,
                sold_by=product.sold_by
            )
        else:
            existing.prices.append(store_price)

    return list(merged.values())


@router.get(
    "/{store_id}",
    response_model=Store,
    summary="Get a single store",
)
def get_store(store_id: uuid.UUID) -> Store:
    """Return metadata for a single store by ID."""
    api = get_grocer_api()
    row = api.get_store(store_id)
    if row is None:
        raise HTTPException(status_code=404, detail=f"Store {store_id} not found")
    return Store.from_orm(row)
