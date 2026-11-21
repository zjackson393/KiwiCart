# KiwiCart frontend

Next.js (App Router) frontend for KiwiCart.

## Layout

```
app/
  groceryList/   Catalog search + grocery list (with mobile drawer)
  routechoice/   Cheapest / quickest / hybrid route comparison
  mapdisplay/    Leaflet map + turn-by-turn journey view
  signIn/        Google sign-in page
auth/            Auth context, useAuth hook, ProtectedRoute wrapper
lib/             Shared config (API_BASE) and pure helpers (search ranking)
types/           Shared TypeScript types
```

## Environment

Set `NEXT_PUBLIC_API_BASE_URL` to point at the backend (defaults to
`http://localhost:8000`). All API calls go through the single `API_BASE`
constant in `lib/api.ts` — don't hard-code the backend origin elsewhere.

## Getting started

```bash
corepack enable
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Testing

```bash
pnpm test        # vitest, unit tests for pure logic (search ranking, route formatting)
pnpm lint        # eslint
```

## Learn more

- [Next.js Documentation](https://nextjs.org/docs)
