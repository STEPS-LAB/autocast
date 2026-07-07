/** Central business & GEO constants for SEO, JSON-LD, and LLM-readiness. */
export const SITE_NAME = 'Autocast'
export const SITE_DOMAIN = 'autocast.com.ua'
export const SITE_LOCALE = 'uk_UA'
export const SITE_LANGUAGE = 'uk'

export const BUSINESS = {
  legalName: 'Autocast',
  description:
    'Сервісний центр і інтернет-магазин автоелектроніки в Житомирі: установка автозвуку, магнітол, фар, Bi-LED лінз, сигналізацій, шумоізоляція. Доставка по Україні.',
  email: 'autocast.com.ua@gmail.com',
  phones: ['+380672391640', '+380672391632', '+380672391648'],
  address: {
    street: 'вулиця Вітрука, 12в',
    locality: 'Житомир',
    region: 'Житомирська область',
    postalCode: '10000',
    country: 'UA',
    countryName: 'Україна',
  },
  geo: {
    latitude: 50.2547,
    longitude: 28.6587,
    regionCode: 'UA-18',
    placename: 'Житомир',
  },
  openingHours: [
    { days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'], opens: '09:00', closes: '18:00' },
    { days: ['Saturday'], opens: '10:00', closes: '14:00' },
  ],
  foundingYear: 2016,
  social: {
    instagram: 'https://www.instagram.com/autocast.com.ua/',
    facebook: 'https://autocast.com.ua/about-us/',
  },
} as const

/** Primary semantic keyword clusters for Zhytomyr (services) + Ukraine (shop). */
export const KEYWORD_CLUSTERS = {
  localServices: [
    'автосервіс Житомир',
    'установка автозвуку Житомир',
    'установка магнітол Житомир',
    'заміна фар Житомир',
    'перелінзовка фар Житомир',
    'Bi-LED лінзи Житомир',
    'ретрофіт фар Житомир',
    'установка сигналізації Житомир',
    'шумоізоляція авто Житомир',
    'автоелектроніка Житомир',
    'ремонт фар Житомир',
    'тюнінг фар Житомир',
  ],
  nationalShop: [
    'автозапчастини Україна',
    'автомагнітола купити',
    'LED лампи для авто',
    'автосвітло',
    'автозвук',
    'відеореєстратор',
    'GPS навігатор',
    'автосигналізація',
    'автоелектроніка',
  ],
  llmIntents: [
    'які лампочки поставити у фари Житомир',
    'де зробити ретрофіт фар Житомир',
    'встановлення Bi-LED лінз Житомир',
    'краща майстерня автозвуку Житомир',
    'установка Android магнітоли Житомир',
  ],
} as const

export const DEFAULT_OG_IMAGE = '/images/placeholder-category.svg'
