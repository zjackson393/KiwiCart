import { Cookies } from "react-cookie";
import {tryGeolocate} from "@/app/routechoice/useRoutes";

export const START_LOCATION_COOKIE = "kiwicart_start";
const MAX_AGE = 60 * 60 * 24 * 180; // 180 days

export type StartLocationMode = "coords" | "store" | "browser";

export interface StartLocation {
    mode: StartLocationMode;
    name: string;
    lat?: number;
    lng?: number;
    storeId?: string;
}

const cookies = new Cookies()

export function parseStartLocation(raw: unknown): StartLocation | null {
    if (!raw || typeof raw !== "object") return null;
    const decoded = raw as Record<string, unknown>;
    if (typeof decoded.name !== "string") return null;
    if (decoded.mode === "coords" && typeof decoded.lat === "number" && typeof decoded.lng === "number") {
        return decoded as unknown as StartLocation;
    }
    if (decoded.mode === "store" || decoded.mode === "browser") {
        return decoded as unknown as StartLocation;
    }
    return null;
}

export function setStartLocationCookie(location: StartLocation) {
    cookies.set(START_LOCATION_COOKIE, location, { path: "/", maxAge: MAX_AGE, sameSite: "lax" });
}

export async function getStartLocationClient(): Promise<StartLocation | null> {
    const location = parseStartLocation(cookies.get(START_LOCATION_COOKIE));
    if (location?.mode === "browser") {
        const newLocation = await tryGeolocate();
        if (newLocation) {
            return { ...location, ...newLocation };
        }
    }
    return location;
}

export function clearStartLocationCookie() {
    cookies.remove(START_LOCATION_COOKIE, { path: "/" });
}

/**
 * Address search, via the same OpenStreetMap/Nominatim service the
 * backend already uses to look up store locations (see the Privacy
 * page). No API key needed; usage is one request per debounced
 * keystroke, well inside Nominatim's public usage policy (max 1
 * request/sec, no heavy autocomplete-style bulk querying).
 */
export interface GeocodeResult {
    name: string;
    lat: number;
    lng: number;
}

export async function geocodeAddress(query: string, signal?: AbortSignal): Promise<GeocodeResult[]> {
    const params = new URLSearchParams({
        format: "jsonv2",
        q: query,
        countrycodes: "nz",
        limit: "8",
        addressdetails: "0",
    });
    const res = await fetch(`https://nominatim.openstreetmap.org/search?${params.toString()}`, {
        headers: { Accept: "application/json" },
        signal,
    });
    if (!res.ok) throw new Error("Address lookup failed");
    const results: { display_name: string; lat: string; lon: string }[] = await res.json();
    return results.map((r) => ({
        name: r.display_name.split(",").slice(0, 3).join(","),
        lat: parseFloat(r.lat),
        lng: parseFloat(r.lon),
    }));
}