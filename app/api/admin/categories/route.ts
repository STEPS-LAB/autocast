import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { revalidateCatalogCache } from '@/lib/admin/revalidate-catalog'
import { rateLimit } from '@/lib/security/rateLimit'
import { fetchAllCategories } from '@/lib/data/categories'

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

export async function GET(request: Request) {
  const rl = rateLimit(request, { bucket: 'admin:categories:get', limit: 60, windowMs: 60_000 })
  if (!rl.ok) return rl.response

  const allowed = await isCurrentUserAdmin()
  if (!allowed) return NextResponse.json({ error: 'Доступ заборонено.' }, { status: 403 })

  try {
    const supabase = createServiceClient()
    const { data, error } = await fetchAllCategories(supabase)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ categories: data })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Не вдалося завантажити категорії.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  const rl = rateLimit(request, { bucket: 'admin:categories:delete', limit: 30, windowMs: 60_000 })
  if (!rl.ok) return rl.response

  const allowed = await isCurrentUserAdmin()
  if (!allowed) return NextResponse.json({ error: 'Доступ заборонено.' }, { status: 403 })

  const id = new URL(request.url).searchParams.get('id')?.trim()
  if (!id) {
    return NextResponse.json({ error: 'Не вказано id категорії.' }, { status: 400 })
  }

  try {
    const supabase = createServiceClient()

    const { count: productCount } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('category_id', id)

    if ((productCount ?? 0) > 0) {
      return NextResponse.json(
        { error: 'Неможливо видалити: ця категорія використовується у товарах.' },
        { status: 409 }
      )
    }

    // Child categories keep existing via ON DELETE SET NULL (become roots).
    const { data, error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id)
      .select('id')

    if (error) {
      const message = error.message?.toLowerCase() ?? ''
      if (message.includes('foreign key') || message.includes('violates')) {
        return NextResponse.json(
          { error: 'Неможливо видалити: ця категорія використовується у товарах.' },
          { status: 409 }
        )
      }
      return NextResponse.json({ error: 'Не вдалося видалити категорію.' }, { status: 500 })
    }

    if (!data?.length) {
      return NextResponse.json({ error: 'Категорію не знайдено.' }, { status: 404 })
    }

    revalidateCatalogCache()
    return NextResponse.json({ ok: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Не вдалося видалити категорію.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
