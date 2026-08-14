import { createClient } from '@/lib/supabase/server'
import { rateLimit } from '@/lib/security/rateLimit'
import { resolveYmlFeedUrl } from '@/lib/import/yml/feeds'
import { runYmlImport } from '@/lib/import/yml/run-import'
import { revalidateCatalogCache } from '@/lib/admin/revalidate-catalog'
import type { ImportProgressEvent } from '@/lib/import/types'
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

export async function POST(request: Request) {
  const rl = rateLimit(request, { bucket: 'admin:import-yml', limit: 2, windowMs: 60_000 })
  if (!rl.ok) return rl.response

  const allowed = await isCurrentUserAdmin()
  if (!allowed) return NextResponse.json({ error: 'Доступ заборонено.' }, { status: 403 })

  let body: { feedId?: string; url?: string; expectedTotal?: number }
  try {
    body = (await request.json()) as { feedId?: string; url?: string; expectedTotal?: number }
  } catch {
    return NextResponse.json({ error: 'Очікується JSON з feedId або url.' }, { status: 400 })
  }

  let resolved: ReturnType<typeof resolveYmlFeedUrl>
  try {
    resolved = resolveYmlFeedUrl(body)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Некоректне посилання на XML/YML.'
    return NextResponse.json({ error: message }, { status: 400 })
  }

  const encoder = new TextEncoder()
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: ImportProgressEvent) => {
        controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`))
      }

      try {
        send({ type: 'status', message: 'Завантаження та розбір XML/YML…' })
        const result = await runYmlImport(resolved.url, {
          expectedTotal: body.expectedTotal,
          onProgress: progress => {
            send({
              type: 'progress',
              processed: progress.processed,
              total: progress.total,
              created: progress.created,
              updated: progress.updated,
              skipped: progress.skipped,
              message: `Оброблено ${progress.processed} з ${progress.total}`,
            })
          },
        })
        try {
          revalidateCatalogCache()
        } catch {
          // Cache revalidation must not block completion.
        }
        send({ type: 'done', result })
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Не вдалося виконати імпорт фіду.'
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
