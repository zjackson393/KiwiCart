import type { Route } from "@/app/routechoice/types";

const KEY = "kiwicart:selectedRoute";
const CHECKS_KEY = "kiwicart:offlineChecks";

export function saveRouteSnapshot(route: Route): void {
    try {
        localStorage.setItem(KEY, JSON.stringify(route));
    } catch {}
}

export function loadRouteSnapshot(): Route | null {
    try {
        const raw = localStorage.getItem(KEY);
        return raw ? (JSON.parse(raw) as Route) : null;
    } catch {
        return null;
    }
}

export function clearRouteSnapshot(): void {
    try {
        localStorage.removeItem(KEY);
        localStorage.removeItem(CHECKS_KEY);
    } catch {}
}

export function routeToString(route: Route): string {
    return JSON.stringify(
        route.stops.map((s) => [s.name, s.items.map((i) => [i.name, i.qty])])
    );
}

export function loadChecks(signature: string): boolean[][] | null {
    try {
        const raw = localStorage.getItem(CHECKS_KEY);
        if (!raw) return null;
        const saved = JSON.parse(raw) as { signature: string; checked: boolean[][] };
        return saved.signature === signature ? saved.checked : null;
    } catch {
        return null;
    }
}

export function saveChecks(signature: string, checked: boolean[][]): void {
    try {
        localStorage.setItem(CHECKS_KEY, JSON.stringify({ signature, checked }));
    } catch {}
}
