/**
 * Prefix-based multi-word fuzzy matching for the grocery catalog search.
 * Extracted from ItemSearch so the matching/ranking logic can be unit
 * tested without rendering the component.
 */

export function matchesQuery(name: string, query: string): boolean {
    const queryWords = query.toLowerCase().trim().split(/\s+/).filter(Boolean);
    if (queryWords.length === 0) return false;

    const nameWords = name.toLowerCase().split(/\s+/);
    return queryWords.every((qw) => nameWords.some((nw) => nw.startsWith(qw)));
}

/**
 * Lower rank sorts first. Exact match > prefix match > match on a later word
 * > no match.
 */
export function rankMatch(name: string, query: string): number {
    const q = query.toLowerCase().trim();
    const words = name.toLowerCase().split(/\s+/);
    const queryWords = q.split(/\s+/).filter(Boolean);

    if (name.toLowerCase() === q) return 0;
    if (name.toLowerCase().startsWith(q)) return 1;

    const lastMatchIndex = Math.max(...queryWords.map((qw) => words.findIndex((w) => w.startsWith(qw))));
    return lastMatchIndex >= 0 ? 2 + lastMatchIndex : 1000;
}
