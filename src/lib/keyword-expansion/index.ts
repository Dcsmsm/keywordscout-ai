import { getMiningConfig } from '@/lib/i18n/keyword-mining'
import { mineAutocomplete } from './autocomplete-miner'
import { deduplicateKeywords } from './keyword-deduper'
import { filterKeywords } from './keyword-filters'
import { detectIntent } from './intent-detector'
import { AutocompleteKeyword, ExpansionOptions, ExpansionResult, KeywordSource } from './expansion-types'

export type { AutocompleteKeyword, ExpansionOptions, ExpansionResult, KeywordSource }
export { detectIntent }

export async function expandKeywordsPipeline(options: ExpansionOptions): Promise<ExpansionResult> {
  const start = Date.now()
  const config = getMiningConfig(options.language)
  const errors: string[] = []

  // 1. Mine autocomplete suggestions (with optional Claude expansion handled upstream)
  let raw: AutocompleteKeyword[] = []
  try {
    raw = await mineAutocomplete(options)
  } catch (err) {
    errors.push(`autocomplete mining failed: ${String(err)}`)
  }

  const totalFetched = raw.length

  // 2. Deduplicate
  const deduped = deduplicateKeywords(raw, config)
  const afterDedup = deduped.length

  // 3. Filter by length, seed overlap, stopwords
  const filtered = filterKeywords(deduped, options.seed, config)
  const afterFilter = filtered.length

  // 4. Sort by relevance score descending
  const sorted = filtered.sort((a, b) => b.relevanceScore - a.relevanceScore)

  // 5. Limit to maxSuggestions
  const final = sorted.slice(0, options.maxSuggestions ?? 50)

  // Tally source counts
  const sources: Record<KeywordSource, number> = {
    autocomplete: 0,
    autocomplete_modifier: 0,
    paa: 0,
    related: 0,
    claude: 0,
  }
  for (const kw of final) {
    sources[kw.source] = (sources[kw.source] ?? 0) + 1
  }

  return {
    keywords: final,
    stats: {
      totalFetched,
      afterDedup,
      afterFilter,
      sources,
      durationMs: Date.now() - start,
    },
    errors,
  }
}
