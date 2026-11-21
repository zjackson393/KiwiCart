import { Cookies } from "react-cookie";

/**
 * The user's chosen stores travel between the store-select page (client)
 * and the grocery-list page (server component, so it can't read
 * localStorage) via a plain, readable cookie, the same pattern the app
 * already uses for the post-sign-in `redirectTo` cookie.
 */
export const STORE_COOKIE = "kiwicart_stores";
export const STORE_COOKIE_MAX_AGE = 60 * 60 * 24 * 180; // 180 days

const cookies = new Cookies();

export function parseStoreIds(raw: string | undefined | null): string[] {
    if (!raw) return [];
    return raw
        .split(",");
}

export function setSelectedStoreIdsCookie(ids: string[]) {
    cookies.set(STORE_COOKIE, ids.join(","), { path: "/", maxAge: STORE_COOKIE_MAX_AGE, sameSite: "lax" });
}

export function getSelectedStoreIdsClient(): string[] {
    return parseStoreIds(cookies.get(STORE_COOKIE, { doNotParse: true }));
}

export function clearSelectedStoreIdsCookie() {
    cookies.remove(STORE_COOKIE, { path: "/" });
}