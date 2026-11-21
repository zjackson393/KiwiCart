const STORAGE_KEY = "kiwicart:cart-in-progress";

export interface LocalCartLine {
    productId: string;
    quantity: number;
}

export function loadLocalCart(): LocalCartLine[] {
    if (typeof window === "undefined") return [];
    try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
}

export function saveLocalCart(lines: LocalCartLine[]) {
    if (typeof window === "undefined") return;
    try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
    } catch {
        // Storage can fail (quota, private mode) - losing the safety net
        // here isn't worth surfacing an error over.
    }
}

export function clearLocalCart() {
    if (typeof window === "undefined") return;
    window.localStorage.removeItem(STORAGE_KEY);
}
