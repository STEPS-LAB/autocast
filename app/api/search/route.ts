import { NextRequest, NextResponse } from 'next/server'
import { getProductCardsFromDb } from '@/lib/data/catalog-db'

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get('q') ?? ''
  if (!query.trim()) {
    return NextResponse.json({ results: [] })
  }
  const products = await getProductCardsFromDb()
  const q = query.trim().toLowerCase()
  const results = products
    .filter(p => p.name_ua.toLowerCase().includes(q))
    .slice(0, 8)
    .map(p => ({
    id: p.id,
    slug: p.slug,
    name_ua: p.name_ua,
    price: p.price,
    sale_price: p.sale_price,
    images: p.images.slice(0, 1),
    }))
  return NextResponse.json({ results })
}
