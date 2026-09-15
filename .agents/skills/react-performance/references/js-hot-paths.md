# JavaScript micro-optimizations (hot paths only)

These patterns address **tight loops**, **large collections**, or **hot** handlers. They are **low–medium** impact compared to waterfalls and bundle work. Prefer clarity and **code-style** unless profiling shows a hotspot.

| Topic | Do |
|--------|-----|
| Batch DOM/CSS writes | Prefer toggling **classes** or **`cssText`** over many sequential style mutations. |
| Index maps | Build a **`Map`** for repeated lookups by id/key in a loop. |
| Cache property reads | Hoist repeated `obj.prop` reads inside hot loops. |
| Cache pure function results | Module-level **`Map`** for repeated calls with same args (only when proven pure). |
| Cache storage reads | If you read `localStorage` repeatedly in one scope, read once and reuse. |
| Combine iterations | One loop instead of `filter` + `map` when both passes are required. |
| Length check first | Cheap `length` compare before expensive deep equality on arrays. |
| Early return | Exit functions as soon as outcome is known. |
| Hoist `RegExp` | Create **once** outside loops, not per iteration. |
| Min/max | Single loop for min/max instead of **sort** for that purpose. |
| Set/Map membership | **`Set`** / **`Map`** for O(1) membership instead of repeated `array.includes`. |
| Immutable sort | Prefer **`toSorted`** when you must not mutate the source array. |
| `flatMap` | Combine map + filter in one pass when appropriate. |
| Idle deferral | **`requestIdleCallback`** (where available) for non-critical work after paint. |
