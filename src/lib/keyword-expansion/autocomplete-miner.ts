import { getMiningConfig } from '@/lib/i18n/keyword-mining'
import { createAdminClient } from '@/lib/supabase/admin'
import { getActiveProvider } from '@/lib/providers/factory'
import { AutocompleteKeyword, ExpansionOptions, KeywordSource } from './expansion-types'
import { scoreRelevance } from './semantic-relevance'

const CACHE_TTL_DAYS = 7

async function getCachedSuggestions(
  query: string,
  language: string,
  country: string,
): Promise<string[] | null> {
  try {
    const supabase = createAdminClient()
    const cutoff = new Date(Date.now() - CACHE_TTL_DAYS * 24 * 60 * 60 * 1000).toISOString()
    const { data } = await (supabase.from('autocomplete_cache' as any) as any)
      .select('suggestions')
      .eq('query', query.toLowerCase())
      .eq('language', language)
      .eq('country', country)
      .gte('cached_at', cutoff)
      .single()
    return (data as { suggestions: string[] } | null)?.suggestions ?? null
  } catch {
    return null
  }
}

async function cacheSuggestions(
  query: string,
  language: string,
  country: string,
  suggestions: string[],
): Promise<void> {
  try {
    const supabase = createAdminClient()
    await (supabase.from('autocomplete_cache' as any) as any).upsert(
      { query: query.toLowerCase(), language, country, suggestions, cached_at: new Date().toISOString() },
      { onConflict: 'query,language,country' },
    )
  } catch {
    // non-critical
  }
}

async function fetchAutocompleteSuggestions(
  query: string,
  language: string,
  country: string,
): Promise<string[]> {
  const cached = await getCachedSuggestions(query, language, country)
  if (cached) return cached

  try {
    const provider = await getActiveProvider()
    if (!provider.getAutocomplete) return []
    const suggestions = await provider.getAutocomplete(query, { language, country })
    if (suggestions.length) {
      await cacheSuggestions(query, language, country, suggestions)
    }
    return suggestions
  } catch {
    return []
  }
}

export async function mineAutocomplete(options: ExpansionOptions): Promise<AutocompleteKeyword[]> {
  const { seed, language, country, miningDepth = 2, maxSuggestions = 50 } = options
  const config = getMiningConfig(language)
  const lang = language.slice(0, 2).toLowerCase()
  const cntry = country.slice(0, 2).toLowerCase()

  const collected: AutocompleteKeyword[] = []
  const errors: string[] = []

  // ── Layer 0: bare seed autocomplete ────────────────────────────────────────
  const baseSuggestions = await fetchAutocompleteSuggestions(seed, lang, cntry)
  for (const s of baseSuggestions) {
    collected.push({
      keyword: s,
      source: 'autocomplete' as KeywordSource,
      relevanceScore: scoreRelevance(s, seed),
      lang,
    })
  }

  if (miningDepth < 2) return collected.slice(0, maxSuggestions)

  // ── Layer 1: modifier-prefixed / suffixed seeds ─────────────────────────────
  const modifiers = [
    ...config.questionModifiers.slice(0, 3).map((m) => ({ m, type: 'pre' as const })),
    ...config.commercialModifiers.slice(0, 3).map((m) => ({ m, type: 'post' as const })),
    ...config.comparisonModifiers.slice(0, 2).map((m) => ({ m, type: 'post' as const })),
    ...config.temporalModifiers.slice(0, 2).map((m) => ({ m, type: 'post' as const })),
  ]

  const modifierBatches = await Promise.allSettled(
    modifiers.map(async ({ m, type }) => {
      const query = type === 'pre' ? `${m} ${seed}` : `${seed} ${m}`
      const suggestions = await fetchAutocompleteSuggestions(query, lang, cntry)
      return { query, modifier: m, suggestions }
    }),
  )

  for (const result of modifierBatches) {
    if (result.status === 'rejected') {
      errors.push(String(result.reason))
      continue
    }
    for (const s of result.value.suggestions) {
      collected.push({
        keyword: s,
        source: 'autocomplete_modifier' as KeywordSource,
        modifier: result.value.modifier,
        relevanceScore: scoreRelevance(s, seed),
        lang,
      })
    }
  }

  if (miningDepth < 3) return collected.slice(0, maxSuggestions)

  // ── Layer 2: audience modifiers ─────────────────────────────────────────────
  const audienceBatches = await Promise.allSettled(
    config.audienceModifiers.slice(0, 3).map(async (m) => {
      const query = `${seed} ${m}`
      const suggestions = await fetchAutocompleteSuggestions(query, lang, cntry)
      return { modifier: m, suggestions }
    }),
  )

  for (const result of audienceBatches) {
    if (result.status === 'rejected') continue
    for (const s of result.value.suggestions) {
      collected.push({
        keyword: s,
        source: 'autocomplete_modifier' as KeywordSource,
        modifier: result.value.modifier,
        relevanceScore: scoreRelevance(s, seed) * 0.9,
        lang,
      })
    }
  }

  void errors // used for debug; suppressed in prod
  return collected.slice(0, maxSuggestions)
}
