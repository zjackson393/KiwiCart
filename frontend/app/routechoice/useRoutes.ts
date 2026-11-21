import { useState, useEffect } from "react";
import type { Route, RouteKind, RouteResult } from "./types";
import { API_BASE } from "@/lib/api";
import { getCart } from "@/lib/cart";
import { getStartLocationClient } from "@/lib/startLocation";
import { fetchStores } from "@/lib/stores";
import { getSelectedStoreIdsClient } from "@/lib/storeSelection";

interface StartPoint {
  lat?: number;
  lng?: number;
  name?: string;
}

interface ResolvedStart {
  point: StartPoint;
  isFallback: boolean;
}

export async function tryGeolocate(): Promise<{ lat: number; lng: number; name: string } | null> {
  if (typeof window === "undefined" || !("geolocation" in navigator)) return null;
  return new Promise((resolve) => {
    const timer = setTimeout(() => resolve(null), 4000);
    navigator.geolocation.getCurrentPosition(
        (pos) => {
          clearTimeout(timer);
          resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude, name: "Your Location" });
        },
        () => {
          clearTimeout(timer);
          resolve(null);
        },
        { timeout: 3500 },
    );
  });
}

async function resolveStartPoint(): Promise<ResolvedStart> {
  const saved = await getStartLocationClient();

  if ((saved?.mode === "coords" || saved?.mode === "browser") && saved.lat !== undefined && saved.lng !== undefined) {
    return { point: { lat: saved.lat, lng: saved.lng, name: saved.name }, isFallback: false };
  }

  if (saved?.mode === "store" && saved.storeId !== undefined) {
    const stores = await fetchStores().catch(() => []);
    const store = stores.find((s) => s.id === saved.storeId);
    if (store) {
      return { point: { lat: store.latitude, lng: store.longitude, name: saved.name }, isFallback: false };
    }
  }

  if (saved?.mode === "store") {
    return { point: {}, isFallback: true };
  }

  const located = await tryGeolocate();
  if (located) return { point: located, isFallback: false };
  return { point: {}, isFallback: true };
}

async function fetchRoute(kind: RouteKind, stores: string, products: string, start: StartPoint): Promise<Route> {
  const params = new URLSearchParams({ stores, products });
  if (start.lat !== undefined && start.lng !== undefined) {
    params.set("start_lat", String(start.lat));
    params.set("start_lng", String(start.lng));
    if (start.name) params.set("start_name", start.name);
  }

  const res = await fetch(`${API_BASE}/route/${kind}?${params.toString()}`);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.detail ?? `HTTP ${res.status}`);
  }
  return res.json();
}

const ROUTE_CACHE_KEY = "kiwicart_route_cache";
const ROUTE_CACHE_GRID_METERS = 50;

function snapPosition(lat: number, lng: number): string {
  const latRad = (lat * Math.PI) / 180;
  const latCellDeg = ROUTE_CACHE_GRID_METERS / 111320;
  const lngCellDeg = ROUTE_CACHE_GRID_METERS / (111320 * Math.max(Math.cos(latRad), 0.01));
  return `${Math.round(lat / latCellDeg)}:${Math.round(lng / lngCellDeg)}`;
}

function routeCacheSignature(stores: string, products: string, start: StartPoint): string {
  const position = start.lat !== undefined && start.lng !== undefined ? snapPosition(start.lat, start.lng) : "";
  return `${stores}|${products}|${position}:${start.name ?? ""}`;
}

function readRouteCache(signature: string): RouteResult[] | null {
  try {
    const raw = sessionStorage.getItem(ROUTE_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { signature: string; results: RouteResult[] };
    if (parsed.signature !== signature) return null;
    return parsed.results;
  } catch {
    return null;
  }
}

function writeRouteCache(signature: string, results: RouteResult[]): void {
  try {
    sessionStorage.setItem(ROUTE_CACHE_KEY, JSON.stringify({ signature, results }));
  } catch {
  }
}

export type CartState = "loading" | "empty" | "ready";

export function useRoutes() {
  const [results, setResults] = useState<RouteResult[]>([
    { kind: "cheapest", data: null, error: null, loading: true },
    { kind: "hybrid", data: null, error: null, loading: true },
    { kind: "quickest", data: null, error: null, loading: true },
  ]);
  const [cartState, setCartState] = useState<CartState>("loading");
  const [usingFallbackStart, setUsingFallbackStart] = useState(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const [cart, resolvedStart] = await Promise.all([getCart(), resolveStartPoint()]);
      if (cancelled) return;

      setUsingFallbackStart(resolvedStart.isFallback);
      const start = resolvedStart.point;

      const items = cart.items;
      if (items.length === 0) {
        setCartState("empty");
        return;
      }
      setCartState("ready");

      const kinds: RouteKind[] = ["cheapest", "hybrid", "quickest"];

      const candidateStoreIds = Array.from(new Set(items.flatMap((i) => i.store_ids)));
      const selectedStoreIds = getSelectedStoreIdsClient();
      const usableStoreIds = selectedStoreIds.length > 0
          ? candidateStoreIds.filter((id) => selectedStoreIds.includes(id))
          : candidateStoreIds;

      if (usableStoreIds.length === 0) {
        setResults(kinds.map((kind) => ({
          kind,
          data: null,
          error: "None of your selected stores stock anything in this cart",
          loading: false,
        })));
        return;
      }

      const stores = usableStoreIds.join(",");
      const products = items.map((i) => `${i.product_id}:${i.quantity}`).join(",");

      const signature = routeCacheSignature(stores, products, start);
      const cached = readRouteCache(signature);
      if (cached) {
        setResults(cached);
        return;
      }
      const settled: Record<RouteKind, RouteResult> = {
        cheapest: { kind: "cheapest", data: null, error: null, loading: true },
        hybrid: { kind: "hybrid", data: null, error: null, loading: true },
        quickest: { kind: "quickest", data: null, error: null, loading: true },
      };
      let doneCount = 0;

      kinds.forEach((kind) => {
        fetchRoute(kind, stores, products, start)
        .then((data) => {
          if (cancelled) return;
          settled[kind] = { kind, data, error: null, loading: false };
          setResults((prev) => prev.map((r) => (r.kind === kind ? { ...r, data, loading: false } : r)));
        })
        .catch((err) => {
          if (cancelled) return;
          settled[kind] = { kind, data: null, error: String(err.message), loading: false };
          setResults((prev) => prev.map((r) => (r.kind === kind ? { ...r, error: String(err.message), loading: false } : r)));
        })
        .finally(() => {
          if (cancelled) return;
          doneCount += 1;
          if (doneCount === kinds.length) {
            const allOk = kinds.every((k) => settled[k].data !== null);
            if (allOk) writeRouteCache(signature, kinds.map((k) => settled[k]));
          }
        });
      });
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return { results, cartState, usingFallbackStart };
}