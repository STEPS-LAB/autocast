import { createClient, createServiceClient } from '@/lib/supabase/server'
import { rateLimit } from '@/lib/security/rateLimit'
import { runExcelImport } from '@/lib/import/excel/run-import'
import { revalidateCatalogCache } from '@/lib/admin/revalidate-catalog'
import { downloadExcelImportBuffer, removeExcelImportFile } from '@/lib/import/excel/storage'
import type { ImportProgressEvent } from '@/lib/import/types'
import { NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const maxDuration = 300

const TIME_BUDGET_MS = 240_000

async function isCurrentUserAdmin() {
  const supabase = await createClient()
  const { data: userData } = await supabase.auth.getUser()
  const userId = userData.user?.id
  if (!userId) return false

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .maybeSingle()

  return profile?.role === 'admin'
}

export async function POST(request: Request) {
  const rl = rateLimit(request, { bucket: 'admin:import-products', limit: 20, windowMs: 60_000 })
  if (!rl.ok) return rl.response

  const allowed = await isCurrentUserAdmin()
  if (!allowed) return NextResponse.json({ error: 'Доступ заборонено.' }, { status: 403 })

  let path = ''
  let offset = 0
  try {
    const body = (await request.json()) as { path?: string; offset?: number }
    path = (body.path ?? '').trim()
    offset = Math.max(0, Math.floor(body.offset ?? 0))
  } catch {
    return NextResponse.json({ error: 'Некоректний запит.' }, { status: 400 })
  }

  const encoder = new TextEncoder()
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: ImportProgressEvent) => {
        try {
          controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`))
        } catch {
          // Client disconnected or the stream already closed.
        }
      }

      const service = createServiceClient()
      try {
        send({
          type: 'status',
          message: offset > 0 ? `Продовження з рядка ${offset + 1}…` : 'Завантаження Excel…',
        })
        const buffer = await downloadExcelImportBuffer(service, path)
        const result = await runExcelImport(buffer, {
          offset,
          deadlineMs: Date.now() + TIME_BUDGET_MS,
          onProgress: progress => {
            send({
              type: 'progress',
              processed: progress.processed,
              total: progress.total,
              created: progress.created,
              updated: progress.updated,
              skipped: progress.skipped,
              message: progress.message ?? `Оброблено ${progress.processed} з ${progress.total}`,
            })
          },
        })
        if (result.done !== false) {
          try {
            revalidateCatalogCache()
          } catch {
            // Cache revalidation must not block completion.
          }
          await removeExcelImportFile(service, path).catch(() => undefined)
        }
        send({
          type: 'done',
          result,
          message:
            result.done === false
              ? 'Часовий ліміт — продовжуємо наступним проходом.'
              : 'Готово',
        })
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Не вдалося виконати імпорт.'
        send({ type: 'error', error: message })
      } finally {
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'application/x-ndjson; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  })
}
