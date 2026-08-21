/**
 * Cap on cached entries. The shop has ~90 categories, but a supplier YML
 * import can stream tens of thousands of distinct names through the same
 * helpers — this keeps the cache from growing without bound during a long
 * import while still covering the catalog many times over.
 */
const MAX_ENTRIES = 5000

/**
 * Memoize a pure `string -> T` function.
 *
 * The category predicates (`isCarAudioChildName`, `isInstallChildName`, …)
 * call each other in cascades, so a single category name passes through the
 * same normalization dozens of times per rule, and `matchesNamedList`
 * re-normalizes every constant in its list on each call. Caching by input
 * turns that quadratic re-computation into one lookup.
 *
 * Only safe for deterministic functions with no external state — all of the
 * normalizers here depend solely on module constants.
 */
export function memoizeByString<T>(fn: (value: string) => T): (value: string) => T {
  const cache = new Map<string, T>()
  return (value: string): T => {
    const hit = cache.get(value)
    // `undefined` is never a valid result for these helpers, but check
    // membership anyway so a falsy result still hits the cache.
    if (hit !== undefined || cache.has(value)) return hit as T

    const result = fn(value)
    if (cache.size >= MAX_ENTRIES) cache.clear()
    cache.set(value, result)
    return result
  }
}
