import { createClient, createServiceClient } from '@/lib/supabase/server'
import { rateLimit } from '@/lib/security/rateLimit'
import { revalidateCatalogCache } from '@/lib/admin/revalidate-catalog'
import { runCaralarmSync } from '@/lib/import/caralarm/sync'
import type { CaralarmSyncMode } from '@/lib/import/caralarm/types'
import type { ImportProgressEvent, ImportResult } from '@/lib/import/types'
import { NextResponse } from 'next/server'

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

export const runtime = 'nodejs'
export const maxDuration = 300

const TIME_BUDGET_MS = 240_000

export async function POST(request: Request) {
  const rl = rateLimit(request, { bucket: 'admin:import-caralarm', limit: 2, windowMs: 60_000 })
  if (!rl.ok) return rl.response

  const allowed = await isCurrentUserAdmin()
  if (!allowed) return NextResponse.json({ error: 'Доступ заборонено.' }, { status: 403 })

  let body: { mode?: string }
  try {
    body = (await request.json()) as { mode?: string }
  } catch {
    return NextResponse.json({ error: 'Очікується JSON з mode.' }, { status: 400 })
  }

  const mode: CaralarmSyncMode = body.mode === 'prices' ? 'prices' : 'catalog'

  if (!process.env['CARALARM_LOGIN']?.trim() || !process.env['CARALARM_PASSWORD']?.trim()) {
    return NextResponse.json(
      {
        error:
          'Не налаштовано CARALARM_LOGIN / CARALARM_PASSWORD у змінних середовища.',
      },
      { status: 500 }
    )
  }

  const encoder = new TextEncoder()
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: ImportProgressEvent) => {
        controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`))
      }

      try {
        send({
          type: 'status',
          message:
            mode === 'catalog'
              ? 'Caralarm: повний каталог (market + export)…'
              : 'Caralarm: оновлення цін і залишків…',
        })

        const supabase = createServiceClient()
        const deadlineMs = Date.now() + TIME_BUDGET_MS

        const syncResult = await runCaralarmSync({
          mode,
          supabase,
          deadlineMs,
          onProgress: progress => {
            send({
              type: 'progress',
              processed: progress.processed,
              total: progress.total,
              created: progress.created,
              updated: progress.updated,
              skipped: progress.skipped,
              deleted: progress.deleted,
              message: progress.message ?? `Оброблено ${progress.processed} з ${progress.total}`,
            })
          },
        })

        const result: ImportResult = {
          created: syncResult.created,
          updated: syncResult.updated,
          skipped: syncResult.skipped,
          priceUpdates: syncResult.priceUpdates,
          imagesUploaded: 0,
          errors: syncResult.errors,
          processed: syncResult.processed,
          total: syncResult.total,
          deleted: syncResult.deleted,
          done: syncResult.done,
        }

        if (syncResult.done) {
          try {
            revalidateCatalogCache()
          } catch {
            // Cache revalidation must not block completion.
          }
        }

        send({
          type: 'done',
          result,
          message: syncResult.done
            ? 'Готово'
            : 'Часовий ліміт — запустіть ще раз для продовження (diff-skip прискорить повтор).',
        })
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Не вдалося виконати синхронізацію Caralarm.'
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
