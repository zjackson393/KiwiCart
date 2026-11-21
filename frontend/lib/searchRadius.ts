import { Cookies } from "react-cookie";

export const RADIUS_COOKIE = "kiwicart_radius_km";
export const RADIUS_COOKIE_MAX_AGE = 60 * 60 * 24 * 180; // 180 days
export const DEFAULT_RADIUS_KM = 5;

const cookies = new Cookies();

export function parseRadiusKm(raw: string | undefined | null): number {
    if (!raw) return DEFAULT_RADIUS_KM;
    const parsed = Number(raw);
    return Number.isFinite(parsed) ? parsed : DEFAULT_RADIUS_KM;
}

export function setRadiusKmCookie(km: number) {
    cookies.set(RADIUS_COOKIE, String(km), { path: "/", maxAge: RADIUS_COOKIE_MAX_AGE, sameSite: "lax" });
}

export function getRadiusKmClient(): number {
    return parseRadiusKm(cookies.get(RADIUS_COOKIE, { doNotParse: true }));
}
