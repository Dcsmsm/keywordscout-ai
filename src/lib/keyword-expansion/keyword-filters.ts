import { AutocompleteKeyword } from './expansion-types'
import { LanguageMiningConfig } from '@/lib/i18n/keyword-mining'
import { tokenCount } from './keyword-normalizer'

export function filterKeywords(
  keywords: AutocompleteKeyword[],
  seed: string,
  config: LanguageMiningConfig,
): AutocompleteKeyword[] {
  const seedTokens = new Set(seed.toLowerCase().split(/\s+/))

  return keywords.filter((kw) => {
    const text = kw.keyword.toLowerCase()
    const tokens = text.split(/\s+/)
    const tc = tokenCount(text)

    // Length guard
    if (tc < config.minTokens || tc > config.maxTokens) return false

    // Must contain at least one seed token (relevance anchor)
    const hasSeedToken = tokens.some((t) => seedTokens.has(t))
    if (!hasSeedToken) return false

    // Reject if all tokens are stopwords
    const contentTokens = tokens.filter((t) => !config.stopwords.has(t))
    if (contentTokens.length === 0) return false

    // Reject very short keywords that are only stopwords + seed
    if (tc === 2 && contentTokens.length === 1 && seedTokens.has(contentTokens[0])) return false

    return true
  })
}
