import ExcelJS from 'exceljs'
import {
  DRIVEX_PRICE_CHANGES_SHEET,
  DRIVEX_PRODUCT_SHEETS,
  type DrivexImage,
  type DrivexParseResult,
  type ParsedDrivexPriceChange,
  type ParsedDrivexProduct,
} from './types'
import { readCell, readCellNumber, readCellString } from './cell'
import { parseDrivexStock } from './stock'

const HEADER_ROW = 3
const COL_CHARACTERISTICS = 1
const COL_BASE_NAME = 3
const COL_DEALER_2 = 4
const COL_DEALER = 5
const COL_WHOLESALE = 6
const COL_RETAIL = 7
const COL_WARRANTY = 8
const COL_NOTE = 9
const COL_STOCK = 11
const COL_CODE = 14

const PRICE_CHANGE_NAME_COL = 2
const PRICE_CHANGE_OLD_RETAIL_COL = 6
const PRICE_CHANGE_NEW_RETAIL_COL = 10

function isProductRow(row: ExcelJS.Row): boolean {
  const code = readCellString(row, COL_CODE)
  const baseName = readCellString(row, COL_BASE_NAME)
  const retail = readCellNumber(row, COL_RETAIL)
  return Boolean(code) || Boolean(baseName && retail != null)
}

function buildDescription(row: ExcelJS.Row): string {
  const text = readCellString(row, COL_CHARACTERISTICS)
  if (!text) return ''
  if (text.startsWith('•')) return text
  return ''
}

function extractSheetImages(
  worksheet: ExcelJS.Worksheet,
  workbook: ExcelJS.Workbook
): Map<number, DrivexImage[]> {
  const byRow = new Map<number, DrivexImage[]>()

  for (const image of worksheet.getImages()) {
    const media = workbook.getImage(image.imageId)
    if (!media?.buffer) continue

    const excelRow = image.range.tl.nativeRow + 1
    const entry: DrivexImage = {
      buffer: Buffer.from(media.buffer),
      extension: media.extension || 'jpeg',
      excelRow,
    }

    const list = byRow.get(excelRow) ?? []
    list.push(entry)
    byRow.set(excelRow, list)
  }

  return byRow
}

function attachImages(
  product: ParsedDrivexProduct,
  imagesByRow: Map<number, DrivexImage[]>
): void {
  const rows = [product.excelRow, product.excelRow - 1, product.excelRow + 1]
  const seen = new Set<string>()

  for (const row of rows) {
    for (const image of imagesByRow.get(row) ?? []) {
      const key = `${image.excelRow}:${image.buffer.length}`
      if (seen.has(key)) continue
      seen.add(key)
      product.images.push(image)
    }
  }
}

function parseProductSheet(
  sheetName: (typeof DRIVEX_PRODUCT_SHEETS)[number],
  worksheet: ExcelJS.Worksheet,
  workbook: ExcelJS.Workbook
): { products: ParsedDrivexProduct[]; skippedOutOfStock: number } {
  const imagesByRow = extractSheetImages(worksheet, workbook)
  const products: ParsedDrivexProduct[] = []
  let skippedOutOfStock = 0

  for (let rowNumber = HEADER_ROW + 1; rowNumber <= worksheet.actualRowCount; rowNumber++) {
    const row = worksheet.getRow(rowNumber)
    if (!isProductRow(row)) continue

    const dealerCode = readCellString(row, COL_CODE)
    const baseName = readCellString(row, COL_BASE_NAME)
    const retail = readCellNumber(row, COL_RETAIL)
    const stockRaw = readCell(row, COL_STOCK)
    const { stock, label } = parseDrivexStock(stockRaw)

    if (stock <= 0) {
      skippedOutOfStock++
      continue
    }

    if (!dealerCode || !baseName || retail == null) continue

    const product: ParsedDrivexProduct = {
      sheet: sheetName,
      dealerCode,
      name: baseName,
      description: buildDescription(row),
      price: Math.round(retail * 100) / 100,
      stock,
      stockLabel: label,
      warranty: readCellString(row, COL_WARRANTY),
      note: readCellString(row, COL_NOTE),
      dealerPrice2: readCellNumber(row, COL_DEALER_2),
      dealerPrice: readCellNumber(row, COL_DEALER),
      wholesalePrice: readCellNumber(row, COL_WHOLESALE),
      excelRow: rowNumber,
      images: [],
    }

    attachImages(product, imagesByRow)
    products.push(product)
  }

  return { products, skippedOutOfStock }
}

function parsePriceChangesSheet(worksheet: ExcelJS.Worksheet | undefined): ParsedDrivexPriceChange[] {
  if (!worksheet) return []

  const changes: ParsedDrivexPriceChange[] = []

  for (let rowNumber = HEADER_ROW + 1; rowNumber <= worksheet.actualRowCount; rowNumber++) {
    const row = worksheet.getRow(rowNumber)
    const name = readCellString(row, PRICE_CHANGE_NAME_COL)
    if (!name) continue

    const oldRetail = readCellNumber(row, PRICE_CHANGE_OLD_RETAIL_COL)
    const newRetail = readCellNumber(row, PRICE_CHANGE_NEW_RETAIL_COL)
    if (oldRetail == null && newRetail == null) continue

    changes.push({
      name,
      oldRetailPrice: oldRetail,
      newRetailPrice: newRetail ?? oldRetail,
    })
  }

  return changes
}

function dedupeByDealerCode(products: ParsedDrivexProduct[]): {
  products: ParsedDrivexProduct[]
  skippedDuplicateCode: number
} {
  const seen = new Set<string>()
  const unique: ParsedDrivexProduct[] = []
  let skippedDuplicateCode = 0

  for (const product of products) {
    if (seen.has(product.dealerCode)) {
      skippedDuplicateCode++
      continue
    }
    seen.add(product.dealerCode)
    unique.push(product)
  }

  return { products: unique, skippedDuplicateCode }
}

export async function parseDrivexWorkbook(buffer: Buffer): Promise<DrivexParseResult> {
  const workbook = new ExcelJS.Workbook()
  await workbook.xlsx.load(buffer)

  let allProducts: ParsedDrivexProduct[] = []
  let skippedOutOfStock = 0

  for (const sheetName of DRIVEX_PRODUCT_SHEETS) {
    const worksheet = workbook.getWorksheet(sheetName)
    if (!worksheet) continue

    const parsed = parseProductSheet(sheetName, worksheet, workbook)
    allProducts = allProducts.concat(parsed.products)
    skippedOutOfStock += parsed.skippedOutOfStock
  }

  const { products, skippedDuplicateCode } = dedupeByDealerCode(allProducts)
  const priceChanges = parsePriceChangesSheet(workbook.getWorksheet(DRIVEX_PRICE_CHANGES_SHEET))

  return {
    products,
    priceChanges,
    skippedOutOfStock,
    skippedDuplicateCode,
  }
}
