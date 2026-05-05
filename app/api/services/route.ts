import { NextResponse } from 'next/server'
import { getServicesForListing } from '@/lib/data/services-db'

export const dynamic = 'force-dynamic'

export async function GET() {
  const services = await getServicesForListing()
  return NextResponse.json(
    { services },
    {
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      },
    }
  )
}
