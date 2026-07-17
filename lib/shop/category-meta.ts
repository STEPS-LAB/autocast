import type { LucideIcon } from 'lucide-react'
import {
  BatteryCharging,
  Camera,
  CircuitBoard,
  LayoutGrid,
  Lightbulb,
  MonitorSmartphone,
  ParkingSquare,
  Shield,
  Speaker,
  Video,
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
  avtosvitlo: {
    icon: Lightbulb,
    blurb: 'Лампи, лінзи, додаткове світло',
  },
  'kamery-parkuvalni': {
    icon: Camera,
    blurb: 'Камери заднього та кругового огляду',
  },
  multymedia: {
    icon: MonitorSmartphone,
    blurb: 'Головні пристрої, CarPlay, Android',
  },
  videoreyestratory: {
    icon: Video,
    blurb: 'Реєстратори та аксесуари',
  },
  'parkuvalni-radary': {
    icon: ParkingSquare,
    blurb: 'Парктроніки та датчики',
  },
  'okhoronni-systemy': {
    icon: Shield,
    blurb: 'Сигналізації, іммобілайзери',
  },
  'zakhyst-vid-uhonu': {
    icon: Shield,
    blurb: 'Сигналізації та трекери',
  },
  'rezervne-zhyvlennya': {
    icon: BatteryCharging,
    blurb: 'Інвертори, АКБ, зарядка',
  },
  avtoelektronika: {
    icon: CircuitBoard,
    blurb: 'Гаджети та електроніка для авто',
  },
}

export const ALL_PRODUCTS_ICON = LayoutGrid

export function getCategoryIcon(slug: string): LucideIcon {
  return CATEGORY_META[slug]?.icon ?? CircuitBoard
}

export function getCategoryBlurb(slug: string): string {
  return CATEGORY_META[slug]?.blurb ?? ''
}
