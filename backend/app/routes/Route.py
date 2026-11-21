from __future__ import annotations


import uuid
from dataclasses import dataclass


import httpx
import pandas as pd
from fastapi import APIRouter, HTTPException, Query


from app.grocerAPI import get_grocer_api
from app.schemas import Route, Location, Stop, Leg, Item


router = APIRouter(prefix="/route", tags=["Route"])


OSRM_BASE = "http://router.project-osrm.org"


def _coord_str(points: list[tuple[float, float]]) -> str:
    return ";".join(f"{lng},{lat}" for lat, lng in points)


def _fetch_table(points: list[tuple[float, float]]) -> list[list[float | None]]:
    resp = httpx.get(
        f"{OSRM_BASE}/table/v1/driving/{_coord_str(points)}?annotations=duration",
        timeout=30.0,
    )
    resp.raise_for_status()
    data = resp.json()
    if data.get("code") != "Ok":
        raise HTTPException(502, detail=f"OSRM table error: {data.get('message', data)}")
    return data["durations"]


def _fetch_leg(
    a: tuple[float, float],
    b: tuple[float, float],
    from_label: str,
    to_label: str,
) -> Leg:
    resp = httpx.get(
        f"{OSRM_BASE}/route/v1/driving/{_coord_str([a, b])}" "?overview=full&geometries=geojson",
        timeout=30.0,
    )
    resp.raise_for_status()
    data = resp.json()
    if data.get("code") != "Ok":
        raise HTTPException(502, detail=f"OSRM route error: {data.get('message', data)}")
    r = data["routes"][0]
    return Leg(
        from_label=from_label,
        to_label=to_label,
        duration=r["legs"][0]["duration"],
        coords=[coord[::-1] for coord in r["geometry"]["coordinates"]],
    )


_EXACT_TSP_LIMIT = 12


def _greedy_nearest_neighbour(matrix: list[list[float | None]], start: int = 0) -> list[int]:
    n = len(matrix)
    unvisited = set(range(n)) - {start}
    path, cur = [start], start
    while unvisited:
        best = min(
            unvisited,
            key=lambda j: matrix[cur][j] if matrix[cur][j] is not None else float("inf"),
        )
        path.append(best)
        unvisited.remove(best)
        cur = best
    path.append(start)
    return path


def _tour_table(matrix: list[list[float | None]], start: int = 0):
    inf = float("inf")
    others = [i for i in range(len(matrix)) if i != start]
    k = len(others)

    def edge(a: int, b: int) -> float:
        v = matrix[a][b]
        return inf if v is None else v

    d = [[edge(a, b) for b in others] for a in others]
    out = [edge(start, a) for a in others]
    back = [edge(a, start) for a in others]

    size = 1 << k
    dp = [[inf] * k for _ in range(size)]
    parent = [[-1] * k for _ in range(size)]
    for j in range(k):
        dp[1 << j][j] = out[j]

    for mask in range(1, size):
        row = dp[mask]
        for j in range(k):
            cur = row[j]
            if cur == inf:
                continue
            dj = d[j]
            for nxt in range(k):
                bit = 1 << nxt
                if mask & bit:
                    continue
                cand = cur + dj[nxt]
                nrow = dp[mask | bit]
                if cand < nrow[nxt]:
                    nrow[nxt] = cand
                    parent[mask | bit][nxt] = j

    tour = [inf] * size
    tour[0] = 0.0
    last = [-1] * size
    for mask in range(1, size):
        row = dp[mask]
        for j in range(k):
            if row[j] < inf:
                total = row[j] + back[j]
                if total < tour[mask]:
                    tour[mask] = total
                    last[mask] = j
    return others, tour, parent, last


def _tour_path(mask: int, others: list[int], parent, last, start: int) -> list[int]:
    order: list[int] = []
    j = last[mask]
    while j != -1:
        order.append(others[j])
        prev = parent[mask][j]
        mask ^= 1 << j
        j = prev
    order.reverse()
    return [start, *order, start]


def _optimal_tour(matrix: list[list[float | None]], start: int = 0) -> list[int]:
    n = len(matrix)
    others = [i for i in range(n) if i != start]
    if len(others) <= 1:
        return [start, *others, start]
    if len(others) > _EXACT_TSP_LIMIT:
        return _greedy_nearest_neighbour(matrix, start)

    others, tour, parent, last = _tour_table(matrix, start)
    full = (1 << len(others)) - 1
    if tour[full] == float("inf"):
        return [start, *others, start]
    return _tour_path(full, others, parent, last, start)


_nearest_neighbour = _optimal_tour


def _total_time(matrix: list[list[float | None]], visit_order: list[int]) -> float:
    return sum(
        (
            matrix[visit_order[i]][visit_order[i + 1]]
            if matrix[visit_order[i]][visit_order[i + 1]] is not None
            else float("inf")
        )
        for i in range(len(visit_order) - 1)
    )


def _build_route(
    start_lat: float,
    start_lng: float,
    start_name: str,
    required_store_ids: list[uuid.UUID],
    store_items: dict[uuid.UUID, list[Item]],
    store_coords: dict[uuid.UUID, tuple[float, float]],
    store_names: dict[uuid.UUID, str],
    store_retailers: dict[uuid.UUID, str],
) -> Route:
    waypoints: list[tuple[float, float]] = [(start_lat, start_lng)] + [
        store_coords[sid] for sid in required_store_ids
    ]
    labels: list[str] = [start_name] + [store_names[sid] for sid in required_store_ids]

    raw_matrix = _fetch_table(waypoints)
    visit_order = _optimal_tour(raw_matrix, start=0)

    legs: list[Leg] = [
        _fetch_leg(
            waypoints[visit_order[i]],
            waypoints[visit_order[i + 1]],
            from_label=labels[visit_order[i]],
            to_label=labels[visit_order[i + 1]],
        )
        for i in range(len(visit_order) - 1)
    ]

    ordered_stops: list[Stop] = [
        Stop(
            name=store_names[sid],
            retailer=store_retailers[sid],
            address="",
            lat=store_coords[sid][0],
            lng=store_coords[sid][1],
            items=store_items[sid],
        )
        for wp_idx in visit_order[1:-1]
        for sid in [required_store_ids[wp_idx - 1]]
    ]

    return Route(
        start=Location(lat=start_lat, lng=start_lng, display=start_name),
        stops=ordered_stops,
        legs=legs,
        matrix=raw_matrix,
        labels=labels,
        total_duration=sum(leg.duration for leg in legs),
        total_items=sum(len(s.items) for s in ordered_stops),
    )


def _geocode_stores(
    store_ids: list[uuid.UUID],
    api,
) -> tuple[dict[uuid.UUID, tuple[float, float]], dict[uuid.UUID, str], dict[uuid.UUID, str]]:
    coords: dict[uuid.UUID, tuple[float, float]] = {}
    names: dict[uuid.UUID, str] = {}
    retailer: dict[uuid.UUID, str] = {}
    for sid in store_ids:
        store = api.get_store(sid)
        names[sid] = store.name
        coords[sid] = store.latitude, store.longitude
        retailer[sid] = store.brand
    return coords, names, retailer


def _parse_ids(raw: str) -> list[uuid.UUID]:
    try:
        return [uuid.UUID(x.strip()) for x in raw.split(",")]
    except ValueError:
        raise HTTPException(
            400,
            detail=f"'{raw}' isn't a valid comma-separated list of IDs",
        )


def _parse_id_quantities(raw: str) -> dict[uuid.UUID, float]:
    out: dict[uuid.UUID, float] = {}
    for token in raw.split(","):
        token = token.strip()
        pid_str, _, qty_str = token.partition(":")
        try:
            pid = uuid.UUID(pid_str.strip())
            qty = float(qty_str) if qty_str else 1
        except ValueError:
            raise HTTPException(
                400,
                detail=f"'{token}' isn't a valid 'product_id' or 'product_id:qty'",
            )
        if qty <= 0:
            raise HTTPException(400, detail=f"Quantity for {pid} must be at least 0, got {qty}")
        out[pid] = out.get(pid, 0) + qty
    return out


def _first_present(row: pd.Series, *names: str):
    for name in names:
        if name in row.index and not pd.isna(row[name]):
            return row[name]
    return None


def _load_price_df(api, store_ids: list[uuid.UUID], quantities: dict[uuid.UUID, float]) -> pd.DataFrame:
    product_ids = list(quantities)
    rows: list[dict] = []
    for sid in store_ids:
        df = api.get_product_by_store_ids(sid, product_ids)
        for _, row in df.iterrows():
            try:
                price_cents = int(row["original_price"])
            except (TypeError, ValueError):
                continue

            sale = _first_present(row, "sale_price")
            multi_price = _first_present(row, "multi_price", "multibuy_price")
            multi_qty = _first_present(row, "multi_quantity", "multibuy_quantity")
            club_gated = _first_present(row, "club_required_multi", "club_required_multibuy")

            rows.append(
                {
                    "product_id": str(row["product_id"]),
                    "name": str(row["normalized_title"]).title(),
                    "price_cents": price_cents,
                    "sale_price_cents": int(sale) if sale is not None else None,
                    "multi_price_cents": int(multi_price) if multi_price is not None else None,
                    "multi_qty": int(multi_qty) if multi_qty else None,
                    "club_gated": bool(club_gated),
                    "store_id": sid,
                    "image": row["image"],
                    "sold_by": str(row["sold_by"]),
                }
            )

    missing = {str(p) for p in product_ids} - {r["product_id"] for r in rows}
    if missing:
        raise HTTPException(
            404,
            detail=(
                f"{len(missing)} item(s) in your cart aren't stocked at any of the selected "
                "stores, so a complete route isn't possible. Add another store or remove "
                f"them. (Product IDs: {', '.join(sorted(missing))})"
            ),
        )
    return pd.DataFrame(rows)


def _line_cost(row: pd.Series, qty: float) -> int:
    unit = row["price_cents"]
    if not pd.isna(row["sale_price_cents"]):
        unit = min(unit, row["sale_price_cents"])

    multi_price, multi_qty = row["multi_price_cents"], row["multi_qty"]
    if row["club_gated"] or pd.isna(multi_price) or pd.isna(multi_qty) or not multi_qty:
        return int(unit * qty)

    bundles, remainder = divmod(qty, int(multi_qty))
    return int(bundles * multi_price + remainder * unit)


def _make_item(row: pd.Series, qty: float, line_cost_cents: int) -> Item:
    return Item(
        name=str(row["name"]),
        price=f"${line_cost_cents / 100 / qty:.2f}",
        image_url=str(row["image"]),
        qty=qty,
        sold_by=row["sold_by"],
    )


_EXACT_SEARCH_LIMIT = 14
DEFAULT_CENTS_PER_MINUTE = 50.0


@dataclass(frozen=True)
class _Plan:
    mask: int
    cost: int
    time: float
    picks: tuple[int, ...]


def _score_cheapest(p: _Plan) -> tuple:
    return (p.cost, p.time, p.mask.bit_count())


def _score_quickest(p: _Plan) -> tuple:
    return (p.time, p.cost, p.mask.bit_count())


def _score_hybrid(cents_per_minute: float):
    def score(p: _Plan) -> tuple:
        blended = p.cost + (cents_per_minute * p.time / 60.0 if cents_per_minute else 0.0)
        return (blended, p.cost, p.time)

    return score


class _Planner:

    def __init__(
        self,
        price_df: pd.DataFrame,
        start: tuple[float, float],
        api,
        quantities: dict[str, float],
    ):
        self.price_df = price_df
        self.api = api
        self.quantities = quantities
        self.ids: list[uuid.UUID] = sorted(price_df["store_id"].unique().tolist())
        self.n = len(self.ids)
        bit = {sid: 1 << i for i, sid in enumerate(self.ids)}

        coords, _, _ = _geocode_stores(self.ids, api)
        self.matrix = _fetch_table([start] + [coords[sid] for sid in self.ids])

        self.offers: dict[str, list[tuple[int, int, int]]] = {}
        self.stock: list[set[str]] = [set() for _ in range(self.n)]
        for label, row in price_df.iterrows():
            b = bit[row["store_id"]]
            cost = _line_cost(row, quantities[row["product_id"]])
            self.offers.setdefault(row["product_id"], []).append((cost, label, b))
            self.stock[b.bit_length() - 1].add(row["product_id"])
        for offers in self.offers.values():
            offers.sort(key=lambda o: (o[0], o[1]))

        self._tour: list[float] | None = None
        self._tour_cache: dict[int, float] = {}
        if self.n <= _EXACT_SEARCH_LIMIT:
            _, self._tour, _, _ = _tour_table(self.matrix)

    def tour_time(self, mask: int) -> float:
        if self._tour is not None:
            return self._tour[mask]
        if mask not in self._tour_cache:
            idx = [0] + [i + 1 for i in range(self.n) if mask >> i & 1]
            sub = [[self.matrix[a][b] for b in idx] for a in idx]
            self._tour_cache[mask] = _total_time(sub, _optimal_tour(sub, start=0))
        return self._tour_cache[mask]

    def plan_for(self, mask: int) -> _Plan | None:
        cost, used, picks = 0, 0, []
        for offers in self.offers.values():
            for price, label, b in offers:
                if mask & b:
                    cost += price
                    used |= b
                    picks.append(label)
                    break
            else:
                return None
        return _Plan(used, cost, self.tour_time(used), tuple(picks))

    def every_plan(self):
        for mask in range(1, 1 << self.n):
            plan = self.plan_for(mask)
            if plan is not None and plan.mask == mask:
                yield plan

    def _seeds(self):
        yield self.plan_for((1 << self.n) - 1)

        for first in range(self.n):
            mask = 1 << first
            missing = set(self.offers) - self.stock[first]
            while missing:
                i = max(
                    range(self.n),
                    key=lambda i: (
                        len(self.stock[i] & missing),
                        -(
                            self.matrix[0][i + 1]
                            if self.matrix[0][i + 1] is not None
                            else float("inf")
                        ),
                    ),
                )
                mask |= 1 << i
                missing -= self.stock[i]
            yield self.plan_for(mask)

    def improve(self, plan: _Plan, score) -> _Plan:
        best = plan
        while True:
            step, best_score = None, score(best)
            for i in range(self.n):
                bit = 1 << i
                if best.mask & bit:
                    kept = best.mask & ~bit
                    moves = [kept] + [kept | 1 << j for j in range(self.n) if not best.mask >> j & 1]
                else:
                    moves = [best.mask | bit]
                for mask in moves:
                    neighbour = self.plan_for(mask)
                    if neighbour is None:
                        continue
                    s = score(neighbour)
                    if s < best_score:
                        step, best_score = neighbour, s
            if step is None:
                return best
            best = step

    def best(self, score) -> _Plan:
        pool = list(self.every_plan()) if self._tour is not None else []
        pool += [self.improve(seed, score) for seed in self._seeds()]
        return self.improve(min(pool, key=score), score)

    def items_for(self, plan: _Plan) -> dict[uuid.UUID, list[Item]]:
        store_items: dict[uuid.UUID, list[Item]] = {}
        for label in plan.picks:
            row = self.price_df.loc[label]
            qty = self.quantities[row["product_id"]]
            store_items.setdefault(row["store_id"], []).append(
                _make_item(row, qty, _line_cost(row, qty))
            )
        return store_items


def _validate_stores(api, store_ids: list[uuid.UUID]) -> None:
    all_stores_df = api.get_stores()
    missing = set(store_ids) - set(all_stores_df["id"])
    if missing:
        raise HTTPException(404, detail=f"Store ID(s) not found: {sorted(missing)}")


def _finalise_route(
    store_items: dict[uuid.UUID, list[Item]],
    start_lat: float,
    start_lng: float,
    start_name: str,
    api,
) -> Route:
    required_ids = sorted(store_items.keys())
    store_coords, store_names, store_retailers = _geocode_stores(required_ids, api)
    return _build_route(
        start_lat,
        start_lng,
        start_name,
        required_ids,
        store_items,
        store_coords,
        store_names,
        store_retailers,
    )


_STORE_Q = Query(..., min_length=1, description="Comma-separated store IDs to consider")
_PRODUCT_Q = Query(
    ...,
    min_length=1,
    description=(
        "Comma-separated product IDs to purchase. Each token is 'product_id' "
        "(quantity 1) or 'product_id:qty'."
    ),
)
_LAT_Q = Query(None, description="Starting latitude (default: the centre of the selected stores)")
_LNG_Q = Query(None, description="Starting longitude (default: the centre of the selected stores)")
_NAME_Q = Query(None, description="Label for the starting point")
_CPM_Q = Query(
    DEFAULT_CENTS_PER_MINUTE,
    ge=0,
    description=(
        "Hybrid only: what a minute of driving is worth to you, in cents. "
        "Higher values favour fewer stops; 0 makes hybrid identical to cheapest."
    ),
)


def _resolve_start(
    api,
    store_ids: list[uuid.UUID],
    lat: float | None,
    lng: float | None,
    name: str | None,
) -> tuple[float, float, str]:
    if lat is not None and lng is not None:
        return lat, lng, name or "Home"
    coords, _, _ = _geocode_stores(store_ids, api)
    pts = list(coords.values())
    return (
        sum(p[0] for p in pts) / len(pts),
        sum(p[1] for p in pts) / len(pts),
        name or "Starting point",
    )


def _plan_route(
    score,
    stores: str,
    products: str,
    start_lat: float | None,
    start_lng: float | None,
    start_name: str | None,
) -> Route:
    store_ids = _parse_ids(stores)
    quantities = _parse_id_quantities(products)
    quantities_by_str = {str(pid): qty for pid, qty in quantities.items()}
    api = get_grocer_api()

    _validate_stores(api, store_ids)
    price_df = _load_price_df(api, store_ids, quantities)
    start_lat, start_lng, start_name = _resolve_start(
        api, store_ids, start_lat, start_lng, start_name
    )

    planner = _Planner(price_df, (start_lat, start_lng), api, quantities_by_str)
    plan = planner.best(score)

    bought = sorted(price_df.loc[label, "product_id"] for label in plan.picks)
    if bought != sorted(quantities_by_str):
        raise HTTPException(500, detail="Internal error: route did not include every cart item")

    return _finalise_route(planner.items_for(plan), start_lat, start_lng, start_name, api)


@router.get(
    "/cheapest",
    response_model=Route,
    summary="Generate the cheapest shopping route",
    description=(
        "The lowest possible total price for the requested quantities: every product "
        "bought at whichever store makes buying that many cheapest, sale prices and "
        "'N for $X' multibuys included. Time is ignored, except to break exact price "
        "ties in favour of the shorter trip."
    ),
)
def route_cheapest(
    stores: str = _STORE_Q,
    products: str = _PRODUCT_Q,
    start_lat: float | None = _LAT_Q,
    start_lng: float | None = _LNG_Q,
    start_name: str | None = _NAME_Q,
) -> Route:
    return _plan_route(_score_cheapest, stores, products, start_lat, start_lng, start_name)


@router.get(
    "/quickest",
    response_model=Route,
    summary="Generate the quickest shopping route",
    description=(
        "The shortest possible door-to-door drive that still gets every product at the "
        "requested quantities: every store combination that covers the cart is timed "
        "exactly and the fastest wins. Price is ignored, except to break exact time ties "
        "in favour of the cheaper trip."
    ),
)
def route_quickest(
    stores: str = _STORE_Q,
    products: str = _PRODUCT_Q,
    start_lat: float | None = _LAT_Q,
    start_lng: float | None = _LNG_Q,
    start_name: str | None = _NAME_Q,
) -> Route:
    return _plan_route(_score_quickest, stores, products, start_lat, start_lng, start_name)


@router.get(
    "/hybrid",
    response_model=Route,
    summary="Generate a hybrid cost/time shopping route",
    description=(
        "The best trade between price and driving time for the requested quantities "
        "(sale prices and multibuys included in the price side). Every store combination "
        "is scored as price + (cents_per_minute x driving minutes) and the lowest wins, so "
        "a store is skipped exactly when the time saved is worth more than the extra cost "
        "(e.g. 25 minutes saved for $3 more at the default rate)."
    ),
)
def route_hybrid(
    stores: str = _STORE_Q,
    products: str = _PRODUCT_Q,
    start_lat: float | None = _LAT_Q,
    start_lng: float | None = _LNG_Q,
    start_name: str | None = _NAME_Q,
    cents_per_minute: float = _CPM_Q,
) -> Route:
    return _plan_route(
        _score_hybrid(cents_per_minute), stores, products, start_lat, start_lng, start_name
    )
