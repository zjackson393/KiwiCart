/**
 * Thin client for the backend's /cart API.
 *
 * This is the "middle man" the grocery-list, route-choice, and map-display
 * pages use to hand state to each other. Each of those pages is its own
 * Next.js route (a full navigation, not a shared React tree), so plain
 * component state can't survive the trip between them, the backend does,
 * keyed off an httpOnly cookie it sets the first time you save a cart.
 */
import { API_BASE } from "@/lib/api";
import type { Route } from "@/app/routechoice/types";

export interface CartItem {
    product_id: string;
    name: string;
    quantity: number;
    store_ids: string[];
}

export interface CartPayload {
    items: CartItem[];
}

async function json<T>(res: Response): Promise<T> {
    if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.detail ?? `HTTP ${res.status}`);
    }
    return res.json();
}

export async function getCart(): Promise<CartPayload> {
    const res = await fetch(`${API_BASE}/cart`, { credentials: "include", cache: "no-store" });
    return json<CartPayload>(res);
}

export async function saveCart(items: CartItem[]): Promise<CartPayload> {
    const res = await fetch(`${API_BASE}/cart`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items }),
    });
    return json<CartPayload>(res);
}

export async function clearCart(): Promise<void> {
    await fetch(`${API_BASE}/cart`, { method: "DELETE", credentials: "include" });
}

export async function getSelectedRoute(): Promise<Route | null> {
    const res = await fetch(`${API_BASE}/cart/route`, { credentials: "include", cache: "no-store" });
    const data = await json<Route | null>(res);
    return data ?? null;
}

export async function saveSelectedRoute(route: Route): Promise<Route> {
    const res = await fetch(`${API_BASE}/cart/route`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(route),
    });
    return json<Route>(res);
}

export interface TripSummary {
    duration: number;
    stopCount: number;
    spent: number;
}

export async function getTripSummary(): Promise<TripSummary | null> {
    const res = await fetch(`${API_BASE}/cart/trip-summary`, { credentials: "include", cache: "no-store" });
    const data = await json<TripSummary | null>(res);
    return data ?? null;
}

export async function saveTripSummary(summary: TripSummary): Promise<TripSummary> {
    const res = await fetch(`${API_BASE}/cart/trip-summary`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(summary),
    });
    return json<TripSummary>(res);
}