from __future__ import annotations

import uuid

from pydantic import BaseModel, Field, ConfigDict
from pydantic.alias_generators import to_camel

class CartItem(BaseModel):
    """One product line in a user's in-progress grocery list."""

    product_id: uuid.UUID
    name: str
    quantity: float = Field(1, ge=0)
    store_ids: list[uuid.UUID] = Field(
        default_factory=list, description="Stores that stock this product"
    )


class CartPayload(BaseModel):
    items: list[CartItem] = Field(default_factory=list)

class TripSummary(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)

    duration: float
    stop_count: int
    spent: float
