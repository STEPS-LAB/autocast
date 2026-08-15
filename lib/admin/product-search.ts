/** Strip LIKE wildcards / noise and cap length for admin product search. */
export function sanitizeAdminProductSearch(raw: string): string {
  return raw.replace(/[%_,.()"'\\]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 80)
}

export function adminSearchTokens(q: string): string[] {
  return q
    .split(' ')
    .map(token => token.trim())
    .filter(token => token.length >= 2)
    .slice(0, 8)
}

export type AdminProductSearchPlan = {
  tokens: string[]
  /** Short queries also match slug / brand / category. Long titles stay on name. */
  expandRelations: boolean
}

export function planAdminProductSearch(raw: string): AdminProductSearchPlan | null {
  const cleaned = sanitizeAdminProductSearch(raw)
  if (!cleaned) return null
  const tokens = adminSearchTokens(cleaned)
  if (tokens.length === 0) return null
  return {
    tokens,
    expandRelations: tokens.length === 1,
  }
}
