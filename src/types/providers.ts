export type ProviderKey = 'serpapi' | 'serper' | 'dataforseo' | 'mock'

export interface KeywordOptions {
  country?: string
  language?: string
  limit?: number
}

export interface SerpOptions {
  country?: string
  language?: string
  device?: 'desktop' | 'mobile'
}

export interface KeywordIdea {
  keyword: string
  volume?: number
  cpc?: number
  competition?: number
  intent?: 'informational' | 'navigational' | 'commercial' | 'transactional'
}

export type NormalizedResultType =
  | 'organic'
  | 'paa'
  | 'related'
  | 'forum'
  | 'video'
  | 'news'

export interface NormalizedSerpResult {
  position: number
  title: string
  url: string
  domain: string
  snippet?: string
  type: NormalizedResultType
}

export interface SerpAnalysis {
  keyword: string
  results: NormalizedSerpResult[]
  peopleAlsoAsk?: string[]
  relatedSearches?: string[]
  totalResults?: number
}

export interface Question {
  question: string
  answer?: string
}

export interface SearchProvider {
  name: string
  getKeywordIdeas(seed: string, options?: KeywordOptions): Promise<KeywordIdea[]>
  getSerpAnalysis(keyword: string, options?: SerpOptions): Promise<SerpAnalysis>
  getAutocomplete?(seed: string): Promise<string[]>
  getRelatedSearches?(keyword: string): Promise<string[]>
  getPeopleAlsoAsk?(keyword: string): Promise<Question[]>
}

export interface ProviderStats {
  totalQueries: number
  successRate: number
  avgLatencyMs: number
  lastUsed: string | null
  errorCount: number
}

export interface ProviderConfig {
  id: string
  name: string
  providerKey: ProviderKey
  isActive: boolean
  isFallback: boolean
  apiKey?: string
  stats?: ProviderStats
}
