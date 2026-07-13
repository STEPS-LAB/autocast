import type ExcelJS from 'exceljs'

export function readCell(row: ExcelJS.Row, col: number): unknown {
  const cell = row.getCell(col)
  const value = cell.value
  if (value == null) return null

  if (typeof value === 'object') {
    if ('richText' in value && Array.isArray(value.richText)) {
      return value.richText.map(part => part.text).join('')
    }
    if ('hyperlink' in value && 'text' in value) {
      return value.text
    }
    if ('text' in value && typeof value.text === 'string') return value.text
    if ('result' in value && value.result != null) return value.result
    if (value instanceof Date) return value
  }

  return value
}

export function readCellString(row: ExcelJS.Row, col: number): string | null {
  const raw = readCell(row, col)
  if (raw == null) return null
  const text = String(raw).trim()
  return text || null
}

export function readCellNumber(row: ExcelJS.Row, col: number): number | null {
  const raw = readCell(row, col)
  if (raw == null || raw === '') return null
  const num = typeof raw === 'number' ? raw : Number(String(raw).replace(',', '.'))
  if (!Number.isFinite(num)) return null
  return num
}
