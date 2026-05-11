export type KeywordSource =
  | 'autocomplete'
  | 'autocomplete_modifier'
  | 'paa'
  | 'related'
  | 'claude'

export interface AutocompleteKeyword {
  keyword: string
  source: KeywordSource
  modifier?: string
  relevanceScore: number
  lang: string
}

export interface ExpansionOptions {
  seed: string
  language: string
  country: string
  miningDepth?: 1 | 2 | 3
  maxSuggestions?: number
  includeClaudeExpansion?: boolean
}

export interface ExpansionResult {
  keywords: AutocompleteKeyword[]
  stats: {
    totalFetched: number
    afterDedup: number
    afterFilter: number
    sources: Record<KeywordSource, number>
    durationMs: number
  }
  errors: string[]
}
