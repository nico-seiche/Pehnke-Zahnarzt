# Server-side / RSC

App Router, React Server Components, and `sanityFetch`. All guidance is **in this file**.

## Server Actions security

Treat **Server Actions** like **API routes**: authenticate/authorize and validate input before mutating data.

## Per-request deduplication with `React.cache()`

Use **`React.cache()`** for per-request deduplication of expensive read-only work (same function, same args within one request).

## Cross-request caching (LRU)

Use an **LRU** (or similar) for **cross-request** caching only when you have a clear caching policy and invalidation story—do not add global caches casually.

## Minimal props to client components

Avoid passing **duplicate or redundant** serialized props to Client Components; prefer stable, minimal shapes.

## Hoist static I/O

**Hoist** static reads (fonts, logos, immutable config) to **module scope** (or a single cached loader) so they are not re-read per request unnecessarily.

## No shared mutable module state per request

Do not store **per-request mutable state** in module-level variables in RSC/SSR contexts; it can leak across requests.

## Minimize serialization at boundaries

Minimize **JSON-serializable** payload size at RSC boundaries. Pass what the client needs, no more.

## Parallel fetching via composition

RSC children can serialize fetches if nested poorly. **Split** async server components as **siblings** (or use composition) so independent fetches **overlap** instead of nesting awaits in one parent.

## Parallel nested fetches for lists

When a list needs N child fetches, **batch** with `Promise.all` (or bounded concurrency) instead of sequential `await` per item when dependencies allow.

## Non-blocking work with `after()`

Use **`after()`** for work that must not block the response (logging, analytics, non-critical side effects)—where supported.
