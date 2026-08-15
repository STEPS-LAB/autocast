import type { SupabaseClient } from '@supabase/supabase-js'

export const EXCEL_IMPORT_BUCKET = 'product-images'
export const EXCEL_IMPORT_PREFIX = 'imports/'
export const MAX_EXCEL_FILE_BYTES = 50 * 1024 * 1024

export function isExcelImportStoragePath(path: string): boolean {
  return /^imports\/[a-z0-9-]+\.xlsx$/i.test(path.trim())
}

export async function downloadExcelImportBuffer(
  serviceClient: SupabaseClient,
  path: string
): Promise<Buffer> {
  if (!isExcelImportStoragePath(path)) {
    throw new Error('Некоректний шлях файлу імпорту.')
  }
  const { data, error } = await serviceClient.storage.from(EXCEL_IMPORT_BUCKET).download(path)
  if (error || !data) {
    throw new Error(error?.message ?? 'Не вдалося завантажити Excel зі сховища.')
  }
  return Buffer.from(await data.arrayBuffer())
}

export async function removeExcelImportFile(
  serviceClient: SupabaseClient,
  path: string
): Promise<void> {
  if (!isExcelImportStoragePath(path)) return
  await serviceClient.storage.from(EXCEL_IMPORT_BUCKET).remove([path])
}
