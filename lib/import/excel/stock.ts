const STOCK_MAP: Record<string, number> = {
  'багато': 100,
  'мало': 10,
  'немає': 0,
  'нема': 0,
}

/** Textual stock labels (Багато/Мало/Немає) or numeric → stock qty. */
export function parseExcelStock(raw: unknown): { stock: number; label: string | null } {
  if (raw == null) return { stock: 0, label: null }

  const label = String(raw).trim()
  if (!label || label === '-') return { stock: 0, label: label || null }

  const mapped = STOCK_MAP[label.toLowerCase()]
  if (mapped !== undefined) return { stock: mapped, label }

  const asNumber = Number(label.replace(',', '.'))
  if (Number.isFinite(asNumber) && asNumber >= 0) {
    return { stock: Math.floor(asNumber), label }
  }

  return { stock: 0, label }
}
