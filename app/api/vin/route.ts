import { NextRequest, NextResponse } from 'next/server'
import { rateLimit } from '@/lib/security/rateLimit'

interface VINDecoder {
  decode(vin: string): Promise<{
    make: string
    model: string
    year: number
    engine: string
    body_type: string
  }>
}

class DemoVINDecoder implements VINDecoder {
  async decode(vin: string) {
    await new Promise(r => setTimeout(r, 500))
    const year = 2000 + (vin.charCodeAt(9) % 25)
    const makeMap: Record<string, string> = {
      W: 'BMW', 1: 'Chevrolet', J: 'Toyota', S: 'Mercedes-Benz', V: 'Volkswagen',
    }
    const make = makeMap[vin[0]!] ?? 'Toyota'
    return {
      make,
      model: 'Series 3',
      year,
      engine: '2.0L 4-cyl',
      body_type: 'Sedan',
    }
  }
}

const decoder: VINDecoder = new DemoVINDecoder()

export async function POST(req: NextRequest) {
  const rl = rateLimit(req, { bucket: 'vin:decode', limit: 20, windowMs: 60_000 })
  if (!rl.ok) return rl.response

  const { vin } = (await req.json()) as { vin: string }
  if (!vin || !/^[A-HJ-NPR-Z0-9]{17}$/i.test(vin)) {
    return NextResponse.json({ error: 'Invalid VIN' }, { status: 400 })
  }
  const result = await decoder.decode(vin.toUpperCase())
  return NextResponse.json({ vin: vin.toUpperCase(), ...result })
}
