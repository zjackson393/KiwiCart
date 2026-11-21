const STORAGE_KEY = "kiwicart:loyalty";

/**
 * There's no /loyalty endpoint on the API yet, so which programmes are
 * linked is kept in this browser's localStorage rather than synced to an
 * account. It won't follow the user to another device until the backend
 * grows support for it.
 */
export function getLinkedRetailers(): Record<string, boolean> {
    if (typeof window === "undefined") return {};
    try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : {};
    } catch {
        return {};
    }
}

export function setRetailerLinked(retailerId: string, linked: boolean) {
    if (typeof window === "undefined") return;
    const current = getLinkedRetailers();
    if (linked) {
        current[retailerId] = true;
    } else {
        delete current[retailerId];
    }
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
}
