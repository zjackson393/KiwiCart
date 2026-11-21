from __future__ import annotations

from typing import Optional

from fastapi import APIRouter, Request, Response

from app.schemas import CartPayload, Route, TripSummary
from app.utils import settings
from app.utils.workflow_store import workflow_store

router = APIRouter(prefix="/cart", tags=["Cart"])

WORKFLOW_COOKIE = "kiwicart_workflow_id"


def _workflow_id(request: Request, response: Response) -> str:
    """Read the workflow-id cookie, minting a fresh one on first use."""
    wid = request.cookies.get(WORKFLOW_COOKIE)
    if not wid:
        wid = workflow_store.new_id()
    response.set_cookie(
        WORKFLOW_COOKIE,
        wid,
        httponly=True,
        samesite="lax",
        secure=settings.env == "prod",
        max_age=60 * 60 * 6,  # 6 hours — long enough for one shopping session
        path="/",
    )
    return wid


@router.get(
    "",
    response_model=CartPayload,
    summary="Read the in-progress grocery list",
    description="Returns whatever the grocery-list step last saved for this browser session.",
)
def get_cart(request: Request, response: Response) -> CartPayload:
    wid = _workflow_id(request, response)
    items = workflow_store.get(wid, "cart_items", [])
    return CartPayload(items=items)


@router.put(
    "",
    response_model=CartPayload,
    summary="Save the in-progress grocery list",
    description=(
        "Called by the grocery-list page before moving on to route choice. "
        "Saving a new cart invalidates any previously selected route, since "
        "the stops/items it was built from may no longer match."
    ),
)
def set_cart(payload: CartPayload, request: Request, response: Response) -> CartPayload:
    wid = _workflow_id(request, response)
    workflow_store.set(wid, "cart_items", [item.model_dump() for item in payload.items])
    workflow_store.set(wid, "selected_route", None)
    return payload


@router.delete(
    "",
    summary="Clear the in-progress grocery list and any selected route",
    description="Called when a trip finishes, resetting the workflow for a new one.",
)
def clear_cart(request: Request, response: Response) -> dict:
    wid = request.cookies.get(WORKFLOW_COOKIE)
    if wid:
        workflow_store.clear(wid)
    return {"message": "cart cleared"}


@router.get(
    "/route",
    response_model=Optional[Route],
    summary="Read the route selected on the route-choice step",
    description="Returns null if no route has been picked yet for this session.",
)
def get_selected_route(request: Request, response: Response) -> Optional[Route]:
    wid = _workflow_id(request, response)
    data = workflow_store.get(wid, "selected_route")
    return Route.model_validate(data) if data else None


@router.put(
    "/route",
    response_model=Route,
    summary="Save the route the user picked",
    description="Called by the route-choice page when the user confirms cheapest/quickest/hybrid.",
)
def set_selected_route(route: Route, request: Request, response: Response) -> Route:
    wid = _workflow_id(request, response)
    workflow_store.set(wid, "selected_route", route.model_dump())
    return route


@router.get(
    "/trip-summary",
    response_model=Optional[TripSummary],
    summary="Read the finished trip's actual duration/stops/spend",
    description="Returns null until the map-display page saves it on 'Finish trip'.",
)
def get_trip_summary(request: Request, response: Response) -> Optional[TripSummary]:
    wid = _workflow_id(request, response)
    data = workflow_store.get(wid, "trip_summary")
    return TripSummary.model_validate(data) if data else None


@router.put(
    "/trip-summary",
    response_model=TripSummary,
    summary="Save the trip summary computed from checked-off items",
    description="Called by the map-display page when the user taps 'Finish trip'.",
)
def set_trip_summary(summary: TripSummary, request: Request, response: Response) -> TripSummary:
    wid = _workflow_id(request, response)
    workflow_store.set(wid, "trip_summary", summary.model_dump())
    return summary