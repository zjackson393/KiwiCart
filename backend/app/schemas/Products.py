from __future__ import annotations

import uuid
from datetime import datetime
from typing import Self

from pydantic import BaseModel, ConfigDict, Field, computed_field, model_validator, field_validator
from supermarket_scraper.database.models import Store as DB_Store


class Store(BaseModel):
    id: uuid.UUID
    name: str
    retailer: str = Field(description="Brand extracted from store name, e.g. 'Woolworths'")
    address: str
    region: str
    latitude: float
    longitude: float

    @classmethod
    def from_row(cls, row: dict) -> "Store":
        return cls(
            id=row["id"],
            name=str(row["name"]),
            retailer=cls.retailer_from_brand(str(row["brand"])),
            address=str(row["address"]),
            region=str(row["region"]),
            latitude=float(row["latitude"]),
            longitude=float(row["longitude"]),
        )

    @classmethod
    def from_orm(cls, obj: DB_Store) -> Self:
        return cls(
            id=obj.id,
            name=obj.name,
            retailer=obj.brand,
            address=obj.address,
            region=obj.region,
            latitude=obj.latitude,
            longitude=obj.longitude,
        )

    @staticmethod
    def retailer_from_brand(brand_id: str) -> str:
        return _extract_retailer(brand_id)

class Price(BaseModel):
    id: uuid.UUID
    updated_at: datetime
    original_price: float
    sale_price: float | None
    club_price: float | None
    multi_price: float | None
    multi_quantity: int | None
    club_required_multi: bool
    uom: str | None
    uom_quantity: int | None
    price_per_uom: float | None
    price_per_uom_sale: float | None

    @field_validator('original_price', 'sale_price', 'club_price', 'multi_price', 'price_per_uom', 'price_per_uom_sale')
    @classmethod
    def convert_dollar(cls, v: float | None) -> float | None:
        if v is not None:
            return v/100
        return None


class Product(BaseModel):
    id: uuid.UUID = Field(validation_alias='product_id')
    normalized_title: str
    brand: str | None
    size_value: str | None
    image: str | None
    sold_by: str
    price: Price

    @field_validator('normalized_title')
    @classmethod
    def convert_title(cls, title: str) -> str:
        return title.title()

    @model_validator(mode='before')
    @classmethod
    def bundle_price(cls, data: dict) -> dict:
        if 'price' not in data:
            data['price'] = {
                'id': data.pop('id'),
                'updated_at': data.pop('updated_at'),
                'original_price': data.pop('original_price'),
                'sale_price': data.pop('sale_price'),
                'club_price': data.pop('club_price'),
                'multi_price': data.pop('multibuy_price'),
                'multi_quantity': data.pop('multibuy_quantity'),
                'club_required_multi': data.pop('club_required_multibuy'),
                'uom': data.pop('uom'),
                'uom_quantity': data.pop('uom_quantity'),
                'price_per_uom': data.pop('price_per_uom'),
                'price_per_uom_sale': data.pop('price_per_uom_sale'),
            }
        return data


class CatalogStorePrice(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    store_id: uuid.UUID = Field(serialization_alias="storeId")
    store_name: str = Field(serialization_alias="storeName")
    retailer: str
    price: Price


class CatalogItem(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    product_id: uuid.UUID = Field(serialization_alias="productId")
    name: str
    prices: list[CatalogStorePrice]
    quantity: int = 1
    image: str | None
    sold_by: str = Field(serialization_alias="soldBy")


class CatalogRequest(BaseModel):
    stores: list[uuid.UUID] = Field(
        min_length=1,
        description="Store IDs to include in the catalog merge",
    )
    search: str | None = Field(
        default=None,
        description="Optional case-insensitive substring filter on product name",
    )

# ── Retailer extraction ──────────────────────────────────────────────────────

_RETAILERS: dict[str, str] = {
    "WO": "Woolworths",
    "PNS": "Pak'nSave",
    "MNW": "New World"
}


def _extract_retailer(brand_id: str) -> str:
    if brand_id in _RETAILERS:
        return _RETAILERS[brand_id]
    else:
        return brand_id
