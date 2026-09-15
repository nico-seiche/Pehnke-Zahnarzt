# Async: eliminating waterfalls

Highest-impact area for latency. Content consolidated from the former performance rule set; everything below lives **only** in this file.

## Cheap synchronous checks before async flags

When a branch uses `await` for a flag or remote value **and** a **cheap synchronous** condition (props, request metadata, already-loaded state), evaluate the cheap condition **first**. Otherwise you pay for the async call when the compound condition can never be true.

**Incorrect:**

```typescript
const someFlag = await getFlag()

if (someFlag && someCondition) {
  // ...
}
```

**Correct:**

```typescript
if (someCondition) {
  const someFlag = await getFlag()
  if (someFlag) {
    // ...
  }
}
```

Keep the original order if the sync check is expensive, depends on the flag, or side effects must run in a fixed order.

## Defer `await` until the branch that needs it

Move `await` into the branches where the result is used so you do not block paths that return early.

**Incorrect (always waits for user data):**

```typescript
async function handleRequest(userId: string, skipProcessing: boolean) {
  const userData = await fetchUserData(userId)

  if (skipProcessing) {
    return { skipped: true }
  }

  return processUserData(userData)
}
```

**Correct:**

```typescript
async function handleRequest(userId: string, skipProcessing: boolean) {
  if (skipProcessing) {
    return { skipped: true }
  }

  const userData = await fetchUserData(userId)
  return processUserData(userData)
}
```

**Reorder when validation order allows (fetch resource before permissions if not found exits early):**

```typescript
async function updateResource(resourceId: string, userId: string) {
  const resource = await getResource(resourceId)

  if (!resource) {
    return { error: "Not found" }
  }

  const permissions = await fetchPermissions(userId)

  if (!permissions.canEdit) {
    return { error: "Forbidden" }
  }

  return await updateResourceData(resource, permissions)
}
```

## Parallel independent work

```typescript
const [a, b, c] = await Promise.all([fetchA(), fetchB(), fetchC()])
```

## Partial dependencies between tasks

When **B** depends on **A** but **C** is independent of both, avoid forcing a strict sequence. Options:

1. **Manual promise graph** — start independent work immediately, chain dependents:

```typescript
const userPromise = fetchUser()
const profilePromise = userPromise.then((user) => fetchProfile(user.id))

const [user, config, profile] = await Promise.all([
  userPromise,
  fetchConfig(),
  profilePromise,
])
```

2. **Small helper library** (e.g. **better-all**) — only if the team explicitly adds it; do not introduce a new dependency for one call site.

## Route handlers and Server Actions: start early, await late

Start independent operations immediately; await when you need the value.

**Incorrect (serializes independent work):**

```typescript
export async function GET(request: Request) {
  const session = await auth()
  const config = await fetchConfig()
  const data = await fetchData(session.user.id)
  return Response.json({ data, config })
}
```

**Correct (overlap where dependencies allow):**

```typescript
export async function GET(request: Request) {
  const sessionPromise = auth()
  const configPromise = fetchConfig()
  const session = await sessionPromise
  const [config, data] = await Promise.all([
    configPromise,
    fetchData(session.user.id),
  ])
  return Response.json({ data, config })
}
```

## Suspense boundaries

Avoid blocking the whole page on one `await` when only a subtree needs data. Wrap slow segments in `<Suspense fallback={…}>` so shell UI paints first.

**Incorrect (entire page waits):**

```tsx
async function Page() {
  const data = await fetchData()
  return (
    <div>
      <Sidebar />
      <Header />
      <DataDisplay data={data} />
      <Footer />
    </div>
  )
}
```

**Correct (only the slow region suspends):**

```tsx
function Page() {
  return (
    <div>
      <Sidebar />
      <Header />
      <Suspense fallback={<Skeleton />}>
        <DataDisplay />
      </Suspense>
      <Footer />
    </div>
  )
}

async function DataDisplay() {
  const data = await fetchData()
  return <div>{data.content}</div>
}
```

**Share one promise across children** (single fetch, multiple consumers) — pass a started `Promise` and unwrap with `React.use()` inside the Suspense subtree when that fits your React version.

**When to skip Suspense for a segment:** critical layout/SEO above the fold, tiny fast queries, or when avoiding layout shift matters more than TTI.
