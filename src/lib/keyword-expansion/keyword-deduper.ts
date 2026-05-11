import { AutocompleteKeyword } from './expansion-types'
import { normalizeKeyword } from './keyword-normalizer'
import { LanguageMiningConfig } from '@/lib/i18n/keyword-mining'

export function deduplicateKeywords(
  keywords: AutocompleteKeyword[],
  config: LanguageMiningConfig,
): AutocompleteKeyword[] {
  const seen = new Map<string, AutocompleteKeyword>()

  for (const kw of keywords) {
    const key = normalizeKeyword(kw.keyword, config)
    const existing = seen.get(key)
    // Keep the variant with the highest relevance score
    if (!existing || kw.relevanceScore > existing.relevanceScore) {
      seen.set(key, { ...kw, keyword: kw.keyword.trim().toLowerCase() })
    }
  }

  return [...seen.values()]
}
