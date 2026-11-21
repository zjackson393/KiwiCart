from __future__ import annotations
from typing import Optional
from pydantic import BaseModel, Field


class Item(BaseModel):
    name: str
    price: str = Field(description="Price at this store, e.g. '$3.49'")
    image_url: str
    qty: float
    sold_by: str


class Stop(BaseModel):
    name: str
    retailer: str
    address: str
    lat: float
    lng: float
    items: list[Item]

    @property
    def subtotal_cents(self) -> int:
        return sum(int(item.price.replace("$", "").replace(".", "")) for item in self.items)


class Location(BaseModel):
    lat: float
    lng: float
    display: str


class Leg(BaseModel):
    from_label: str
    to_label: str
    duration: float = Field(description="Driving duration in seconds")
    coords: list[list[float]] = Field(description="GeoJSON polyline [[lat, lng], ...]")


class Route(BaseModel):
    start: Location
    stops: list[Stop]
    legs: list[Leg] = Field(description="Ordered legs including return to start")
    matrix: list[list[Optional[float]]] = Field(
        description="NxN driving-duration matrix (seconds) for all waypoints"
    )
    labels: list[str] = Field(description="Waypoint labels aligned with matrix rows/cols")
    total_duration: float = Field(description="Total route driving time in seconds")
    total_items: int
