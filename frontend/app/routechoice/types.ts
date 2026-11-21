export interface Item {
    name: string;
    price: string;
    image_url: string;
    qty: number;
    sold_by: string;
}

export interface Stop {
    name: string;
    retailer: string;
    address: string;
    lat: number;
    lng: number;
    items: Item[];
}

export interface Leg {
    from_label: string;
    to_label: string;
    duration: number;
    coords: [number, number][];
}

export interface Route {
    start: { lat: number; lng: number; display: string };
    stops: Stop[];
    legs: Leg[];
    matrix: (number | null)[][];
    labels: string[];
    total_duration: number;
    total_items: number;
}

export type RouteKind = "cheapest" | "hybrid" | "quickest";

export interface RouteResult {
    kind: RouteKind;
    data: Route | null;
    error: string | null;
    loading: boolean;
}
