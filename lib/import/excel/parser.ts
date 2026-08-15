import ExcelJS from 'exceljs'
import type {
  ExcelImage,
  ExcelParseResult,
  ParsedExcelPriceChange,
  ParsedExcelProduct,
} from './types'
import { readCell, readCellNumber, readCellString } from './cell'
import { parseExcelStock } from './stock'
import { isNonProductSheetName } from './sheet-detect'

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

/** Minimum product rows (in stock or skipped) for a sheet to count as a catalog. */
const MIN_PRODUCT_ROWS = 1

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
  workbook: ExcelJS.Workbook,
  allowedRows?: Set<number>
): Map<number, ExcelImage[]> {
  const byRow = new Map<number, ExcelImage[]>()

  for (const image of worksheet.getImages()) {
    const excelRow = image.range.tl.nativeRow + 1
    if (allowedRows && !allowedRows.has(excelRow)) continue

    const media = workbook.getImage(Number(image.imageId))
    if (!media?.buffer) continue

    const entry: ExcelImage = {
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
  product: ParsedExcelProduct,
  imagesByRow: Map<number, ExcelImage[]>
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
  sheetName: string,
  worksheet: ExcelJS.Worksheet
): { products: ParsedExcelProduct[]; skippedOutOfStock: number } {
  const products: ParsedExcelProduct[] = []
  let skippedOutOfStock = 0

  for (let rowNumber = HEADER_ROW + 1; rowNumber <= worksheet.actualRowCount; rowNumber++) {
    const row = worksheet.getRow(rowNumber)
    if (!isProductRow(row)) continue

    const dealerCode = readCellString(row, COL_CODE)
    const baseName = readCellString(row, COL_BASE_NAME)
    const retail = readCellNumber(row, COL_RETAIL)
    const stockRaw = readCell(row, COL_STOCK)
    const { stock, label } = parseExcelStock(stockRaw)

    if (stock <= 0) {
      skippedOutOfStock++
      continue
    }

    if (!dealerCode || !baseName || retail == null) continue

    const product: ParsedExcelProduct = {
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

    products.push(product)
  }

  return { products, skippedOutOfStock }
}

function parsePriceChangesSheet(worksheet: ExcelJS.Worksheet | undefined): ParsedExcelPriceChange[] {
  if (!worksheet) return []

  const changes: ParsedExcelPriceChange[] = []

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

function dedupeByDealerCode(products: ParsedExcelProduct[]): {
  products: ParsedExcelProduct[]
  skippedDuplicateCode: number
} {
  const seen = new Set<string>()
  const unique: ParsedExcelProduct[] = []
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

function findPriceChangesWorksheet(workbook: ExcelJS.Workbook): ExcelJS.Worksheet | undefined {
  for (const worksheet of workbook.worksheets) {
    if (isNonProductSheetName(worksheet.name) && /змін/i.test(worksheet.name)) {
      return worksheet
    }
  }
  return workbook.worksheets.find(ws => /зміни у прайсі/i.test(ws.name.trim()))
}

export async function loadExcelWorkbook(buffer: Buffer): Promise<ExcelJS.Workbook> {
  const workbook = new ExcelJS.Workbook()
  await workbook.xlsx.load(buffer as never)
  return workbook
}

export function imagesForProduct(
  workbook: ExcelJS.Workbook,
  product: ParsedExcelProduct
): ExcelImage[] {
  const worksheet = workbook.worksheets.find(ws => ws.name.trim() === product.sheet)
  if (!worksheet) return []
  const allowed = new Set([product.excelRow, product.excelRow - 1, product.excelRow + 1])
  const imagesByRow = extractSheetImages(worksheet, workbook, allowed)
  const holder: ParsedExcelProduct = { ...product, images: [] }
  attachImages(holder, imagesByRow)
  return holder.images
}

export type ParseExcelOptions = {
  /** Skip copying embedded image buffers (preview / pass writes). */
  skipImages?: boolean
}

export function parseExcelFromWorkbook(
  workbook: ExcelJS.Workbook,
  options?: ParseExcelOptions
): ExcelParseResult {
  let allProducts: ParsedExcelProduct[] = []
  let skippedOutOfStock = 0
  const productSheets: string[] = []

  for (const worksheet of workbook.worksheets) {
    const sheetName = worksheet.name.trim()
    if (!sheetName || isNonProductSheetName(sheetName)) continue

    const parsed = parseProductSheet(sheetName, worksheet)
    const totalRows = parsed.products.length + parsed.skippedOutOfStock
    if (totalRows < MIN_PRODUCT_ROWS) continue

    productSheets.push(sheetName)
    allProducts = allProducts.concat(parsed.products)
    skippedOutOfStock += parsed.skippedOutOfStock
  }

  const { products, skippedDuplicateCode } = dedupeByDealerCode(allProducts)
  const priceChanges = parsePriceChangesSheet(findPriceChangesWorksheet(workbook))

  if (!options?.skipImages) {
    for (const product of products) {
      product.images = imagesForProduct(workbook, product)
    }
  }

  return {
    products,
    priceChanges,
    skippedOutOfStock,
    skippedDuplicateCode,
    productSheets,
  }
}

/**
 * Parse a dealer-style .xlsx price list.
 * Product sheets are auto-detected (any sheet with product rows that is not a
 * price-changes / info sheet). Sheet name becomes the category name.
 */
export async function parseExcelWorkbook(
  buffer: Buffer,
  options?: ParseExcelOptions
): Promise<ExcelParseResult> {
  const workbook = await loadExcelWorkbook(buffer)
  return parseExcelFromWorkbook(workbook, options)
}
