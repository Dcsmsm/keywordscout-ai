export const APP_NAME = 'KeywordScout'
export const APP_TAGLINE = 'Find keywords you can actually rank.'
export const APP_DESCRIPTION =
  'AI-native SEO tool for bloggers and creators. Discover low-competition keywords with real ranking potential.'

export const WEAK_DOMAIN_PATTERNS = [
  'reddit.com',
  'quora.com',
  'answers.yahoo.com',
  'ehow.com',
  'livestrong.com',
  'hubpages.com',
  'wikiHow.com',
  'wikihow.com',
  'answers.com',
  'reference.com',
]

export const FORUM_PATTERNS = [
  'reddit.com',
  'quora.com',
  'forum.',
  'forums.',
  '/forum',
  '/forums',
  'community.',
  'stackexchange.com',
  'stackoverflow.com',
]

export const CURRENT_YEAR = new Date().getFullYear()
export const OUTDATED_YEAR_THRESHOLD = 3

export const API_TIMEOUT_MS = 15000
export const API_RETRY_ATTEMPTS = 2
export const API_RETRY_DELAY_MS = 1000

export const ROUTES = {
  home: '/',
  login: '/login',
  signup: '/signup',
  dashboard: '/dashboard',
  analyses: '/dashboard/analyses',
  analysis: (id: string) => `/dashboard/analyses/${id}`,
  billing: '/dashboard/billing',
  settings: '/dashboard/settings',
  admin: '/admin',
  adminUsers: '/admin/users',
  adminSubscriptions: '/admin/subscriptions',
  adminProviders: '/admin/providers',
} as const
