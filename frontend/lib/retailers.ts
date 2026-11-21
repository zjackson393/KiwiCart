/**
 * Single source of truth for retailer branding.
 *
 * The API's Store and Stop objects both carry a `retailer` field
 * directly (e.g. "New World", "PAK'nSAVE", "Woolworths"), so that's the
 * primary match here. Product objects only carry a `store_name` string
 * with no retailer field, so a name-based fallback is kept for that case.
 *
 * Previously this logic guessed from the store name alone, in two
 * duplicated copies (map.tsx and mapdisplay/page.tsx), and anything that
 * didn't match fell back to a hot-pink debug colour that was never meant
 * to reach production. That's fixed by matching on the real retailer
 * field first, and using a neutral, non-alarming colour as the last
 * resort.
 */

export interface RetailerBrand {
    id: string;
    label: string;
    match: (nameLower: string) => boolean;
    color: string;
    onColor: string;
}

const RETAILERS: RetailerBrand[] = [
    {
        id: "MNW",
        label: "New World",
        match: (n) => n.includes("new world"),
        color: "#D03132", // --nwRed
        onColor: "#FFFFFF",
    },
    {
        id: "PNS",
        label: "PAK'nSAVE",
        match: (n) => n.includes("pak") && n.includes("save"),
        color: "#D9B83C", // darkened --psYellow for adequate contrast as a solid fill
        onColor: "#FFFFFF",
    },
    {
        id: "WO",
        label: "Woolworths",
        match: (n) => n.includes("woolworth") || n.includes("countdown"),
        color: "#3A5F3E", // --wwGreen
        onColor: "#FFFFFF",
    }
];

/** Neutral, intentional fallback for any retailer we don't recognise. */
const UNKNOWN_RETAILER: RetailerBrand = {
    id: "unknown",
    label: "Store",
    match: () => true,
    color: "#75512F", // --kcBrown, reads as "store", not "error"
    onColor: "#FFFFFF",
};

/** Preferred path: match on the API's own retailer field (Store, Stop). */
export function retailerById(retailer: string | undefined | null): RetailerBrand {
    if (!retailer) return UNKNOWN_RETAILER;

    const trimmed = retailer.trim();
    const upper = trimmed.toUpperCase();
    const lower = trimmed.toLowerCase();

    return (
        RETAILERS.find((r) => r.id.toUpperCase() === upper) ??
        RETAILERS.find((r) => r.match(lower)) ??
        UNKNOWN_RETAILER
    );
}

/** Fallback path for objects with only a free-text store name (e.g. Product). */
export function retailerFor(storeName: string): RetailerBrand {
    return retailerById(storeName);
}

export function colourFromStoreName(storeName: string): string {
    return retailerFor(storeName).color;
}

/** Retailers with an identifiable loyalty programme, for the settings page. */
export const LOYALTY_PROGRAMS = [
    { retailerId: "new-world", programName: "Clubcard", operator: "Foodstuffs" },
    { retailerId: "paknsave", programName: "Clubcard", operator: "Foodstuffs" },
    { retailerId: "woolworths", programName: "Everyday Rewards", operator: "Woolworths NZ" },
] as const;

export function retailerBrand(id: string): RetailerBrand | undefined {
    return RETAILERS.find((r) => r.id === id);
}

export { RETAILERS };
