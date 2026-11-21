/**
 * Single source of truth for the backend API origin.
 *
 * Reads NEXT_PUBLIC_API_BASE_URL so each environment (local, preview, prod)
 * can point at the right FastAPI deployment without editing source. Falls
 * back to the local dev server when unset.
 */
export const API_BASE =
    process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";
