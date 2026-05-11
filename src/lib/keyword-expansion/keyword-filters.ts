import { AutocompleteKeyword } from './expansion-types'
import { LanguageMiningConfig } from '@/lib/i18n/keyword-mining'
import { tokenCount } from './keyword-normalizer'

export function filterKeywords(
  keywords: AutocompleteKeyword[],
  seed: string,
  config: LanguageMiningConfig,
): AutocompleteKeyword[] {
  return keywords.filter((kw) => {
    const text = kw.keyword.toLowerCase()
    const tokens = text.split(/\s+/)
    const tc = tokenCount(text)

    // Length guard
    if (tc < config.minTokens || tc > config.maxTokens) return false

    // Reject if all tokens are stopwords
    const contentTokens = tokens.filter((t) => !config.stopwords.has(t))
    if (contentTokens.length === 0) return false

    // Reject pure stopword + single seed-token combos (noise)
    const seedTokens = new Set(seed.toLowerCase().split(/\s+/))
    if (tc === 2 && contentTokens.length === 1 && seedTokens.has(contentTokens[0])) return false

    // Require minimum relevance score (replaces hard seed-token check)
    if (kw.relevanceScore < 0.1) return false

    return true
  })
}
