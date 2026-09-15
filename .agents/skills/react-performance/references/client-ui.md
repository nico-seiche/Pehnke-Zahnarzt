# Client: listeners and storage (no SWR)

Patterns for **global listeners**, **scroll performance**, and **`localStorage`**. This repo does **not** assume SWR or other client fetch libraries for deduplication—use **sanity** / server data paths for fetching.

## Deduplicate global event listeners

**Incorrect:** each hook instance registers its own `window` listener (N instances → N listeners).

```tsx
function useKeyboardShortcut(key: string, callback: () => void) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.metaKey && e.key === key) {
        callback()
      }
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [key, callback])
}
```

**Correct:** one module-level listener dispatches to registered callbacks (pattern sketch):

```tsx
const keyCallbacks = new Map<string, Set<() => void>>()
let attached = false

function ensureGlobalKeydown() {
  if (attached) {
    return
  }
  attached = true
  window.addEventListener("keydown", (e) => {
    if (!e.metaKey) {
      return
    }
    const set = keyCallbacks.get(e.key)
    set?.forEach((cb) => {
      cb()
    })
  })
}

function useKeyboardShortcut(key: string, callback: () => void) {
  useEffect(() => {
    ensureGlobalKeydown()
    if (!keyCallbacks.has(key)) {
      keyCallbacks.set(key, new Set())
    }
    keyCallbacks.get(key)!.add(callback)
    return () => {
      const set = keyCallbacks.get(key)
      if (!set) {
        return
      }
      set.delete(callback)
      if (set.size === 0) {
        keyCallbacks.delete(key)
      }
    }
  }, [key, callback])
}
```

Prefer **mantine-hooks** (`useWindowEvent`, etc.) when they already encode this contract.

## Passive listeners for scroll/touch

Add **`{ passive: true }`** to `touch` / `wheel` listeners when you do **not** call `preventDefault()`—reduces scroll jank.

**Incorrect:** default (blocking) listener for logging-only handlers.

**Correct:** `addEventListener('wheel', handler, { passive: true })`.

**Do not** use passive when implementing custom gestures that need `preventDefault()`.

## Version and minimize `localStorage`

- Prefix keys with a **version** (e.g. `userConfig:v2`) and migrate from old keys when schemas change.
- Store **minimal** fields; avoid dumping full API payloads (tokens, PII).
- Wrap **`getItem` / `setItem`** in try/catch (private mode, quota, disabled storage).
