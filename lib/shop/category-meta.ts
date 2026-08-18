import type { LucideIcon } from 'lucide-react'
import {
  Camera,
  CircuitBoard,
  Droplets,
  LayoutGrid,
  Lightbulb,
  MonitorSmartphone,
  ParkingSquare,
  Radio,
  Shield,
  Speaker,
  Video,
  Wrench,
} from 'lucide-react'

/** Icon + short blurb for root shop categories (by slug). */
const CATEGORY_META: Record<
  string,
  { icon: LucideIcon; blurb: string }
> = {
  avtozvuk: {
    icon: Speaker,
    blurb: 'Акустика, сабвуфери, підсилювачі',
  },
  avtokhimiya: {
    icon: Droplets,
    blurb: 'Шампуні, очисники, віск',
  },
  avtomahnitoly: {
    icon: MonitorSmartphone,
    blurb: 'Головні пристрої, рамки, роз\'єми',
  },
  // Legacy slug before rename Автомагнітоли та мультимедіа → Автомагнітоли
  'avtomahnitoly-ta-multymedia': {
    icon: MonitorSmartphone,
    blurb: 'Головні пристрої, рамки, роз\'єми',
  },
  avtosvitlo: {
    icon: Lightbulb,
    blurb: 'LED/HID лампи, фари, додаткове світло',
  },
  'parkuvalni-kamery-ta-radary': {
    icon: Camera,
    blurb: 'Камери, парктроніки, відеопаркування',
  },
  // Legacy slugs before merge
  'parkuvalni-kamery': {
    icon: Camera,
    blurb: 'Камери, парктроніки, відеопаркування',
  },
  'kamery-parkuvalni': {
    icon: Camera,
    blurb: 'Камери, парктроніки, відеопаркування',
  },
  multymedia: {
    icon: Radio,
    blurb: 'Магнітоли, перехідні рамки',
  },
  videoreyestratory: {
    icon: Video,
    blurb: 'Реєстратори та аксесуари',
  },
  'parkuvalni-radary': {
    icon: ParkingSquare,
    blurb: 'Парктроніки та датчики',
  },
  'parkuvalni-radary-ta-systemy-videoparkuvannya': {
    icon: ParkingSquare,
    blurb: 'Парктроніки, датчики, відеопаркування',
  },
  'okhoronni-systemy': {
    icon: Shield,
    blurb: 'Сигналізації, GSM, іммобілайзери',
  },
  'zakhyst-vid-uhonu': {
    icon: Shield,
    blurb: 'Сигналізації та трекери',
  },
  'vse-dlya-montazhu': {
    icon: Wrench,
    blurb: 'Адаптери, інвертори, запобіжники',
  },
  avtoelektronika: {
    icon: CircuitBoard,
    blurb: 'ISO, адаптери, TPMS',
  },
}

export const ALL_PRODUCTS_ICON = LayoutGrid

export function getCategoryIcon(slug: string): LucideIcon {
  return CATEGORY_META[slug]?.icon ?? CircuitBoard
}

export function getCategoryBlurb(slug: string): string {
  return CATEGORY_META[slug]?.blurb ?? ''
}
