import { API_BASE } from "@/lib/api";

// Matches the real /stores response: just an id, name, and retailer brand.
// No address or coordinates are returned by this endpoint, so store
// selection can't be sorted by distance or searched by address.
export interface ApiStore {
    id: string;
    name: string;
    retailer: string;
    latitude: number;
    longitude: number;
}

/**
 * Store list changes rarely, so this is cached for a while rather than
 * refetched on every request.
 */
export async function fetchStores(): Promise<ApiStore[]> {
    const res = await fetch(`${API_BASE}/stores`, { next: { revalidate: 3600 } });
    if (!res.ok) throw new Error(`Failed to fetch stores (${res.status})`);
    return res.json();
}

export interface RetailerGroup {
    retailer: string;
    stores: ApiStore[];
}

/** Groups stores by their retailer brand, sorted A-Z within each group. */
export function groupStoresByRetailer(stores: ApiStore[]): RetailerGroup[] {
    const groups = new Map<string, ApiStore[]>();
    for (const store of stores) {
        const key = store.retailer || "Other";
        const list = groups.get(key) ?? [];
        list.push(store);
        groups.set(key, list);
    }
    return Array.from(groups.entries())
        .map(([retailer, list]) => ({
            retailer,
            stores: list.slice().sort((a, b) => a.name.localeCompare(b.name)),
        }))
        .sort((a, b) => a.retailer.localeCompare(b.retailer));
}
