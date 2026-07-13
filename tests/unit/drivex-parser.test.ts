import { describe, expect, it } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { parseDrivexWorkbook } from '@/lib/import/drivex/parser'

const SAMPLE_FILE = path.join(
  process.env['HOME'] ?? '',
  'Downloads',
  'Зал_08.07.26_Прайс_08.07.26_DriveX_Дил2.xlsx'
)

describe('parseDrivexWorkbook', () => {
  it.skipIf(!fs.existsSync(SAMPLE_FILE))('parses DriveX sample price list', async () => {
    const buffer = fs.readFileSync(SAMPLE_FILE)
    const result = await parseDrivexWorkbook(buffer)

    expect(result.products.length).toBeGreaterThan(600)
    expect(result.products.length).toBeLessThan(700)
    expect(result.skippedOutOfStock).toBeGreaterThan(300)
    expect(result.priceChanges.length).toBeGreaterThan(100)

    const withImages = result.products.filter(product => product.images.length > 0)
    expect(withImages.length).toBeGreaterThan(100)

    const sample = result.products[0]
    expect(sample?.dealerCode).toMatch(/^DR-/)
    expect(sample?.price).toBeGreaterThan(0)
    expect(sample?.stock).toBeGreaterThan(0)
  })
})
