import {
  CANONICAL_CAR_CARE_CATEGORY,
  canonicalizeImportCategoryName,
  isCarCareChildName,
  isCarCareParentName,
} from './category-locale'
import { categoryKeysEquivalent, normalizeCategoryKey } from './category-match'
import type { YmlCategory } from './types'

/** Parent category for car-audio leaves (Акустика, Підсилювачі…). */
export const CANONICAL_CAR_AUDIO_PARENT = 'Автозвук'

/** Parent for frames, ISO adapters, radio connectors, head units. */
export const CANONICAL_HEAD_UNIT_PARENT = 'Автомагнітоли'

/** Parent for climate panels / remaining multimedia accessories. */
export const CANONICAL_MULTIMEDIA_PARENT = 'Мультимедіа'

/** Parent for install kits / wiring accessories when feed has no tree. */
export const CANONICAL_INSTALL_PARENT = 'Все для монтажу'

/** Parent for TPMS and similar sensors / electronics. */
export const CANONICAL_ELECTRONICS_PARENT = 'Автоелектроніка'

/** Parent for parking cameras + radars (merged). */
export const CANONICAL_PARKING_CAM_PARENT = 'Паркувальні камери та радари'

/** @deprecated Use CANONICAL_PARKING_CAM_PARENT — kept as alias for imports. */
export const CANONICAL_PARKING_RADAR_PARENT = CANONICAL_PARKING_CAM_PARENT

/** Parent for lamps / headlights. */
export const CANONICAL_LIGHTING_PARENT = 'Автосвітло'

/** Parent for alarms / immobilizers. */
export const CANONICAL_SECURITY_PARENT = 'Охоронні системи'

/** Stable synthetic feed ids (not from supplier XML). */
export const CAR_AUDIO_PARENT_FEED_ID = '__taxonomy_avtozvuk__'
export const CAR_CARE_PARENT_FEED_ID = '__taxonomy_avtokhimiya__'
export const HEAD_UNIT_PARENT_FEED_ID = '__taxonomy_avtomagnitoly__'
export const MULTIMEDIA_PARENT_FEED_ID = '__taxonomy_multymedia__'
export const INSTALL_PARENT_FEED_ID = '__taxonomy_montazh__'
export const ELECTRONICS_PARENT_FEED_ID = '__taxonomy_avtoelektronika__'
export const PARKING_CAM_PARENT_FEED_ID = '__taxonomy_parkuvalni_kamery__'
export const LIGHTING_PARENT_FEED_ID = '__taxonomy_avtosvitlo__'
export const SECURITY_PARENT_FEED_ID = '__taxonomy_okhoronni_systemy__'
/** @deprecated Same feed id as parking cameras — merged category. */
export const PARKING_RADAR_PARENT_FEED_ID = PARKING_CAM_PARENT_FEED_ID

const CAR_AUDIO_CHILD_NAMES = [
  'Акустика',
  'Аудіопроцесори',
  'Підсилювачі звуку',
  'Підсилювачі',
  'Сабвуфери',
  'Проставки для динаміків',
  'Кабелі монтажні',
  'Аксесуари для автозвуку',
  'Адаптери для підсилювача',
  "Роз'єми динаміків",
  'Музика',
] as const

const HEAD_UNIT_CHILD_NAMES = [
  'Головні пристрої',
  'Штатні головні пристрої',
  'Перехідні рамки',
  "Роз'єми для магнітол",
  "Універсальні роз'єми",
  'Пульти дистанційного керування для автозвуку',
  'Аксесуари для магнітол',
  'GPS, FM автомобільні антени',
  'Стельові монітори',
] as const

const MULTIMEDIA_CHILD_NAMES = [
  'Панель клімат контролю',
  'Панель клімату контролю',
  'Захисне скло',
] as const

const INSTALL_CHILD_NAMES = [
  'Універсальні кишені, заглушки',
  'USB подовжувачі та зарядні пристрої',
  'AUX / Bluetooth адаптери',
  "Гучний зв'язок, Bluetooth адаптери",
  'Перетворювачі рівня сигналу (конвертери)',
  'Шумоподавлювачі, фільтри живлення',
  'Запобіжники',
  "Клеми, роз'єми, піни",
  'Клеми та монтажні матеріали',
  "Адаптери для штатних USB/AUX-роз'ємів",
  'Бездротові зарядні пристрої',
  'Інвертори',
  'Аксесуари та інструменти',
] as const

const ELECTRONICS_CHILD_NAMES = [
  'Датчики тиску в шинах',
  'TPMS',
  'Адаптери кнопок керма',
  'Антенні адаптери',
  'Перехідники ISO',
] as const

const PARKING_CAM_CHILD_NAMES = [
  'Камери',
  'Камери в логотип',
  'Камери в ручку',
  'Камери в стоп сигнал',
  'Камери кругового огляду 360',
  'Камери переднього виду',
  'Універсальні камери',
  'Штатні камери',
  'Рамки перехідні для камер',
  'Адаптери для підключення камери заднього виду',
  'Парктроніки',
  'Адаптери підключення',
  'Відеопарктроніки',
  'Комплектуючі та аксесуари',
] as const

const LIGHTING_CHILD_NAMES = [
  'LED та HID лампи',
  'LED малі',
  'Фари',
  'LED лампи',
  'HID лампи',
] as const

const SECURITY_CHILD_NAMES = [
  'Автосигналізації',
  'GSM-сигналізації для дому',
  'GSM сигналізації',
  'Замки капота',
  'Механічні замки КПП',
] as const

const CAR_CARE_EXTRA_CHILD_NAMES = [
  'Очищувач екрану',
  'Очисник екрану',
] as const

export function isCarAudioParentName(name: string): boolean {
  return normalizeCategoryKey(name) === normalizeCategoryKey(CANONICAL_CAR_AUDIO_PARENT)
}

export function isHeadUnitParentName(name: string): boolean {
  const key = normalizeCategoryKey(name)
  if (key === normalizeCategoryKey(CANONICAL_HEAD_UNIT_PARENT)) return true
  if (key === 'магнітоли та мультимедіа' || key === 'автомагнітоли та мультимедіа') return true
  return key.includes('магнітол') && key.includes('мультимедіа')
}

export function isMultimediaParentName(name: string): boolean {
  return normalizeCategoryKey(name) === normalizeCategoryKey(CANONICAL_MULTIMEDIA_PARENT)
}

export function isInstallParentName(name: string): boolean {
  return normalizeCategoryKey(name) === normalizeCategoryKey(CANONICAL_INSTALL_PARENT)
}

export function isElectronicsParentName(name: string): boolean {
  const key = normalizeCategoryKey(name)
  return (
    key === normalizeCategoryKey(CANONICAL_ELECTRONICS_PARENT) ||
    key === 'автоелектроніка датчики'
  )
}

export function isParkingCamParentName(name: string): boolean {
  const key = normalizeCategoryKey(name)
  return (
    key === normalizeCategoryKey(CANONICAL_PARKING_CAM_PARENT) ||
    key === 'паркувальні камери' ||
    key === 'камери паркувальні' ||
    key === 'паркувальні радари та системи відеопаркування' ||
    key === normalizeCategoryKey('Камери паркувальні')
  )
}

export function isLightingParentName(name: string): boolean {
  return normalizeCategoryKey(name) === normalizeCategoryKey(CANONICAL_LIGHTING_PARENT)
}

export function isSecurityParentName(name: string): boolean {
  return normalizeCategoryKey(name) === normalizeCategoryKey(CANONICAL_SECURITY_PARENT)
}

/** @deprecated Alias — parking radars merged into cameras parent. */
export function isParkingRadarParentName(name: string): boolean {
  return isParkingCamParentName(name)
}

function matchesNamedList(name: string, list: readonly string[]): boolean {
  const canonical = canonicalizeImportCategoryName(name)
  return list.some(child => categoryKeysEquivalent(canonical, child))
}

export function isCarAudioChildName(name: string): boolean {
  const canonical = canonicalizeImportCategoryName(name)
  if (isCarAudioParentName(canonical)) return false
  if (isCarCareParentName(canonical) || isCarCareChildName(canonical)) return false
  return matchesNamedList(canonical, CAR_AUDIO_CHILD_NAMES)
}

export function isElectronicsChildName(name: string): boolean {
  const canonical = canonicalizeImportCategoryName(name)
  if (isElectronicsParentName(canonical)) return false
  const key = normalizeCategoryKey(canonical)
  if (key.includes('tpms') || (key.includes('тиск') && key.includes('шин'))) return true
  if (key.includes('датчик') && (key.includes('тиск') || key.includes('шин') || key.includes('парков'))) {
    return true
  }
  if (key.includes('адаптер') && (key.includes('керм') || key.includes('антен'))) return true
  if (key.includes('перехідник') && key.includes('iso')) return true
  if (key.includes('перехідники') && key.includes('iso')) return true
  if (/\biso\b/.test(key) && key.includes('перехід')) return true
  return matchesNamedList(canonical, ELECTRONICS_CHILD_NAMES)
}

export function isParkingCamChildName(name: string): boolean {
  const canonical = canonicalizeImportCategoryName(name)
  if (isParkingCamParentName(canonical)) return false
  const key = normalizeCategoryKey(canonical)
  if (key === 'камери') return true
  if (key === 'парктроніки' || key === 'паркувальні радари') return true
  if (key === '4 датчики' || key === '8 датчиків') return true
  if (key.includes('парктронік') || key.includes('відеопарктронік')) return true
  if (key.includes('камер') && !key.includes('радар')) {
    if (
      key.includes('паркуваль') ||
      key.includes('задн') ||
      key.includes('передн') ||
      key.includes('штатн') ||
      key.includes('універсальн') ||
      key.includes('логотип') ||
      key.includes('ручку') ||
      key.includes('стоп') ||
      key.includes('360') ||
      key.includes('огляду')
    ) {
      return true
    }
  }
  if (key.includes('адаптер') && key.includes('камер')) return true
  return matchesNamedList(canonical, PARKING_CAM_CHILD_NAMES)
}

export function isLightingChildName(name: string): boolean {
  const canonical = canonicalizeImportCategoryName(name)
  if (isLightingParentName(canonical)) return false
  const key = normalizeCategoryKey(canonical)
  if (key === 'фари' || key === 'led малі' || key === 'ledmali') return true
  if (key.includes('led') && key.includes('hid')) return true
  if (key.includes('led') && key.includes('ламп')) return true
  if (key.includes('hid') && key.includes('ламп')) return true
  return matchesNamedList(canonical, LIGHTING_CHILD_NAMES)
}

export function isSecurityChildName(name: string): boolean {
  const canonical = canonicalizeImportCategoryName(name)
  if (isSecurityParentName(canonical)) return false
  const key = normalizeCategoryKey(canonical)
  if (key.includes('автосигналізац')) return true
  if (key.includes('gsm') && key.includes('сигналізац')) return true
  if (key.includes('замк') && (key.includes('капот') || key.includes('кпп') || key.includes('коробк'))) {
    return true
  }
  return matchesNamedList(canonical, SECURITY_CHILD_NAMES)
}

/** @deprecated Alias — parking radars merged into cameras children. */
export function isParkingRadarChildName(name: string): boolean {
  return isParkingCamChildName(name)
}

export function isMultimediaChildName(name: string): boolean {
  const canonical = canonicalizeImportCategoryName(name)
  if (isMultimediaParentName(canonical)) return false
  if (isHeadUnitParentName(canonical)) return false
  if (isCarCareParentName(canonical) || isCarCareChildName(canonical)) return false
  if (isCarAudioParentName(canonical) || matchesNamedList(canonical, CAR_AUDIO_CHILD_NAMES)) {
    return false
  }
  const key = normalizeCategoryKey(canonical)
  if (key.includes('клімат') && key.includes('панел')) return true
  if (key.includes('захисне') && key.includes('скло')) return true
  return matchesNamedList(canonical, MULTIMEDIA_CHILD_NAMES)
}

export function isHeadUnitChildName(name: string): boolean {
  const canonical = canonicalizeImportCategoryName(name)
  if (isHeadUnitParentName(canonical)) return false
  if (isMultimediaParentName(canonical) || isMultimediaChildName(canonical)) return false
  if (isCarCareParentName(canonical) || isCarCareChildName(canonical)) return false
  if (isCarAudioParentName(canonical) || matchesNamedList(canonical, CAR_AUDIO_CHILD_NAMES)) {
    return false
  }
  if (isElectronicsChildName(canonical) || isParkingCamChildName(canonical)) return false

  const key = normalizeCategoryKey(canonical)
  if (key.includes('роз') && key.includes('магнітол')) return true
  if (key.includes('перехідн') && key.includes('рамк')) return true
  if (key.includes('стельов') && key.includes('монітор')) return true
  if (key.includes('головн') && key.includes('пристро')) return true

  return matchesNamedList(canonical, HEAD_UNIT_CHILD_NAMES)
}

export function isInstallChildName(name: string): boolean {
  const canonical = canonicalizeImportCategoryName(name)
  if (isInstallParentName(canonical)) return false
  if (isHeadUnitParentName(canonical) || isHeadUnitChildName(canonical)) return false
  if (isMultimediaParentName(canonical) || isMultimediaChildName(canonical)) return false
  if (isCarAudioParentName(canonical) || matchesNamedList(canonical, CAR_AUDIO_CHILD_NAMES)) {
    return false
  }
  if (isCarCareParentName(canonical) || isCarCareChildName(canonical)) return false
  if (isElectronicsChildName(canonical) || isParkingCamChildName(canonical)) return false

  const key = normalizeCategoryKey(canonical)
  // Hands-free modules merge into AUX / Bluetooth install leaf
  if (key.includes('гучний') && (key.includes('звязок') || key.includes('bluetooth'))) return true
  if (key.includes('aux') && key.includes('bluetooth')) return true
  if (key.includes('інвертор')) return true

  return matchesNamedList(canonical, INSTALL_CHILD_NAMES)
}

/** Extra care leaves that are not in the default car-care map (screen glass / cleaner). */
export function isExtraCarCareChildName(name: string): boolean {
  return matchesNamedList(name, CAR_CARE_EXTRA_CHILD_NAMES)
}

export type ShopTaxonomyRule = {
  parentName: string
  parentFeedId: string
  isParent: (name: string) => boolean
  isChild: (name: string) => boolean
}

export const SHOP_TAXONOMY_RULES: ShopTaxonomyRule[] = [
  {
    isParent: isElectronicsParentName,
    isChild: isElectronicsChildName,
    parentName: CANONICAL_ELECTRONICS_PARENT,
    parentFeedId: ELECTRONICS_PARENT_FEED_ID,
  },
  {
    isParent: isParkingCamParentName,
    isChild: isParkingCamChildName,
    parentName: CANONICAL_PARKING_CAM_PARENT,
    parentFeedId: PARKING_CAM_PARENT_FEED_ID,
  },
  {
    isParent: isLightingParentName,
    isChild: isLightingChildName,
    parentName: CANONICAL_LIGHTING_PARENT,
    parentFeedId: LIGHTING_PARENT_FEED_ID,
  },
  {
    isParent: isSecurityParentName,
    isChild: isSecurityChildName,
    parentName: CANONICAL_SECURITY_PARENT,
    parentFeedId: SECURITY_PARENT_FEED_ID,
  },
  {
    isParent: isMultimediaParentName,
    isChild: isMultimediaChildName,
    parentName: CANONICAL_MULTIMEDIA_PARENT,
    parentFeedId: MULTIMEDIA_PARENT_FEED_ID,
  },
  {
    isParent: isHeadUnitParentName,
    isChild: isHeadUnitChildName,
    parentName: CANONICAL_HEAD_UNIT_PARENT,
    parentFeedId: HEAD_UNIT_PARENT_FEED_ID,
  },
  {
    isParent: isCarAudioParentName,
    isChild: isCarAudioChildName,
    parentName: CANONICAL_CAR_AUDIO_PARENT,
    parentFeedId: CAR_AUDIO_PARENT_FEED_ID,
  },
  {
    isParent: isCarCareParentName,
    isChild: (name) => isCarCareChildName(name) || isExtraCarCareChildName(name),
    parentName: CANONICAL_CAR_CARE_CATEGORY,
    parentFeedId: CAR_CARE_PARENT_FEED_ID,
  },
  {
    isParent: isInstallParentName,
    isChild: isInstallChildName,
    parentName: CANONICAL_INSTALL_PARENT,
    parentFeedId: INSTALL_PARENT_FEED_ID,
  },
]

function ensureParent(
  byId: Map<string, YmlCategory>,
  opts: {
    isParent: (name: string) => boolean
    isChild: (name: string) => boolean
    parentName: string
    parentFeedId: string
  }
): void {
  let needsParent = false
  for (const cat of byId.values()) {
    if (opts.isChild(cat.name)) needsParent = true
  }
  if (!needsParent) return

  const existingParent = [...byId.values()].find(c => opts.isParent(c.name))
  const parentId = existingParent?.id ?? opts.parentFeedId

  if (!existingParent) {
    byId.set(parentId, {
      id: parentId,
      name: opts.parentName,
      parentId: null,
      url: null,
    })
  } else {
    existingParent.name = opts.parentName
    existingParent.parentId = null
  }

  for (const cat of byId.values()) {
    if (cat.id === parentId) continue
    if (!opts.isChild(cat.name)) continue
    if (cat.parentId && byId.has(cat.parentId)) {
      const parent = byId.get(cat.parentId)
      if (parent && (opts.isParent(parent.name) || opts.isChild(parent.name))) continue
    }
    cat.parentId = parentId
  }
}

/**
 * Attach domain leaves under shop parents.
 */
export function applyShopCategoryTaxonomy(categories: YmlCategory[]): YmlCategory[] {
  const byId = new Map(categories.map(c => [c.id, { ...c }]))

  for (const cat of byId.values()) {
    cat.name = canonicalizeImportCategoryName(cat.name)
    const key = normalizeCategoryKey(cat.name)
    // Normalize legacy parking parent labels into the merged root
    if (
      key === 'камери паркувальні' ||
      key === 'паркувальні камери' ||
      key === 'паркувальні радари та системи відеопаркування'
    ) {
      cat.name = CANONICAL_PARKING_CAM_PARENT
    }
    // Sensor-count categories → Парктроніки (count is a product filter)
    if (
      key === '4 датчики' ||
      key === '8 датчиків' ||
      key === 'паркувальні радари'
    ) {
      cat.name = 'Парктроніки'
    }
  }

  for (const rule of SHOP_TAXONOMY_RULES) {
    ensureParent(byId, rule)
  }

  return [...byId.values()]
}
