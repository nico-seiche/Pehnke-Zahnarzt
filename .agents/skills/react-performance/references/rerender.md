# Re-render optimization

Apply when profiling shows avoidable renders or jank. All guidance is **in this file**—there are no separate per-topic files elsewhere.

## Defer state reads

Do not subscribe to state that is only read inside callbacks—use refs or narrow subscriptions.

## Memo for expensive subtrees

Extract expensive subtrees into memoized components when profiling shows benefit.

## Stable default props for memoized components

Hoist **non-primitive default props** (objects/arrays/functions) out of JSX defaults so memo compares stable references.

## Narrow effect dependencies

Prefer **primitive** or stable deps in effect deps; avoid object identity churn.

## Derived subscriptions

Subscribe to **derived booleans** (or small derived values) instead of raw sources when that reduces updates.

## Derive during render, not in an effect

Derive during render when possible; avoid `useEffect` + `setState` just to mirror props/state.

## Functional `setState`

Use **functional** `setState` when the next state depends on the previous.

## Lazy `useState` initialization

`useState(() => expensive)` for expensive initial state.

## Do not memoize trivial values

Do not wrap trivial primitives in `useMemo`.

## Split hooks with unrelated dependencies

Split hooks when dependency lists are unrelated—reduces unnecessary effect runs.

## Prefer events over effects for user-driven work

Prefer event handlers for user-driven work instead of effects that mirror events.

## `startTransition` for non-urgent updates

Use **`startTransition`** for non-urgent updates.

## `useDeferredValue` for expensive derived UI

**`useDeferredValue`** for expensive derived UI driven by fast-changing input.

## Refs for transient high-frequency values

**Refs** for high-frequency values that should not trigger re-render.

## Avoid components defined inside render

Defining a component inside another creates a **new component type every render** → remounts, lost state, effects re-run, DOM recreated. Pass props to components declared at module scope instead of closing over parent scope inline.

**Incorrect (remounts every parent render):**

```tsx
function UserProfile({ user, theme }) {
  const Avatar = () => (
    <img
      src={user.avatarUrl}
      className={theme === "dark" ? "avatar-dark" : "avatar-light"}
    />
  )

  const Stats = () => (
    <div>
      <span>{user.followers} followers</span>
      <span>{user.posts} posts</span>
    </div>
  )

  return (
    <div>
      <Avatar />
      <Stats />
    </div>
  )
}
```

**Correct:**

```tsx
function Avatar({ src, theme }: { src: string; theme: string }) {
  return (
    <img
      src={src}
      className={theme === "dark" ? "avatar-dark" : "avatar-light"}
    />
  )
}

function Stats({ followers, posts }: { followers: number; posts: number }) {
  return (
    <div>
      <span>{followers} followers</span>
      <span>{posts} posts</span>
    </div>
  )
}

function UserProfile({ user, theme }) {
  return (
    <div>
      <Avatar src={user.avatarUrl} theme={theme} />
      <Stats followers={user.followers} posts={user.posts} />
    </div>
  )
}
```

**Symptoms:** inputs lose focus each keystroke, animations restart, effects fire every parent render, scroll position resets.
