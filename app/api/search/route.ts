import { NextRequest, NextResponse } from 'next/server'
import { searchProducts } from '@/lib/data/seed'

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get('q') ?? ''
  if (!query.trim()) {
    return NextResponse.json({ results: [] })
  }
  const results = searchProducts(query).slice(0, 8).map(p => ({
    id: p.id,
    slug: p.slug,
    name_ua: p.name_ua,
    price: p.price,
    sale_price: p.sale_price,
    images: p.images.slice(0, 1),
  }))
  return NextResponse.json({ results })
}
