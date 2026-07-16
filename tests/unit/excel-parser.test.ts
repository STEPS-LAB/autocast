import { describe, expect, it } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { parseExcelWorkbook } from '@/lib/import/excel/parser'
import { isNonProductSheetName } from '@/lib/import/excel/sheet-detect'

const SAMPLE_FILE = path.join(
  process.env['HOME'] ?? '',
  'Downloads',
  'Зал_08.07.26_Прайс_08.07.26_DriveX_Дил2.xlsx'
)

describe('parseExcelWorkbook', () => {
  it.skipIf(!fs.existsSync(SAMPLE_FILE))('parses dealer-style sample price list', async () => {
    const buffer = fs.readFileSync(SAMPLE_FILE)
    const result = await parseExcelWorkbook(buffer)

    expect(result.products.length).toBeGreaterThan(600)
    expect(result.products.length).toBeLessThan(700)
    expect(result.skippedOutOfStock).toBeGreaterThan(300)
    expect(result.priceChanges.length).toBeGreaterThan(100)
    expect(result.productSheets.length).toBeGreaterThan(0)
    expect(result.productSheets).not.toContain('Зміни у прайсі')

    const withImages = result.products.filter(product => product.images.length > 0)
    expect(withImages.length).toBeGreaterThan(100)

    const sample = result.products[0]
    expect(sample?.dealerCode).toBeTruthy()
    expect(sample?.price).toBeGreaterThan(0)
    expect(sample?.stock).toBeGreaterThan(0)
  })
})

describe('non-product sheet detection', () => {
  it('skips price-change and info sheets', () => {
    expect(isNonProductSheetName('Зміни у прайсі')).toBe(true)
    expect(isNonProductSheetName('зміни')).toBe(true)
    expect(isNonProductSheetName('Музика')).toBe(false)
    expect(isNonProductSheetName('LED лінзи')).toBe(false)
  })
})
