import { getMiningConfig } from '@/lib/i18n/keyword-mining'
import { createAdminClient } from '@/lib/supabase/admin'
import { getActiveProvider } from '@/lib/providers/factory'
import { AutocompleteKeyword, ExpansionOptions, KeywordSource } from './expansion-types'
import { scoreRelevance } from './semantic-relevance'

const CACHE_TTL_DAYS = 7

// Alphabet soup: letters most likely to yield suggestions (frequency-ordered for Italian/European)
const ALPHABET = 'abcdefghilmnoprstuvz'.split('')

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

function addSuggestions(
  collected: AutocompleteKeyword[],
  suggestions: string[],
  source: KeywordSource,
  seed: string,
  lang: string,
  modifier?: string,
  relevanceMultiplier = 1,
) {
  for (const s of suggestions) {
    collected.push({
      keyword: s,
      source,
      modifier,
      relevanceScore: scoreRelevance(s, seed) * relevanceMultiplier,
      lang,
    })
  }
}

export async function mineAutocomplete(options: ExpansionOptions): Promise<AutocompleteKeyword[]> {
  const { seed, language, country, miningDepth = 2 } = options
  const config = getMiningConfig(language)
  const lang = language.slice(0, 2).toLowerCase()
  const cntry = country.slice(0, 2).toLowerCase()

  const collected: AutocompleteKeyword[] = []

  // ── Layer 0: bare seed ─────────────────────────────────────────────────────
  const base = await fetchAutocompleteSuggestions(seed, lang, cntry)
  addSuggestions(collected, base, 'autocomplete', seed, lang)

  if (miningDepth < 2) return collected

  // ── Layer 1: modifier queries ──────────────────────────────────────────────
  const modifiers = [
    ...config.questionModifiers.slice(0, 4).map((m) => ({ m, type: 'pre' as const })),
    ...config.commercialModifiers.slice(0, 4).map((m) => ({ m, type: 'post' as const })),
    ...config.comparisonModifiers.slice(0, 2).map((m) => ({ m, type: 'post' as const })),
    ...config.temporalModifiers.slice(0, 2).map((m) => ({ m, type: 'post' as const })),
    ...config.audienceModifiers.slice(0, 3).map((m) => ({ m, type: 'post' as const })),
  ]

  const modResults = await Promise.allSettled(
    modifiers.map(async ({ m, type }) => {
      const query = type === 'pre' ? `${m} ${seed}` : `${seed} ${m}`
      return { modifier: m, suggestions: await fetchAutocompleteSuggestions(query, lang, cntry) }
    }),
  )

  for (const r of modResults) {
    if (r.status === 'fulfilled') {
      addSuggestions(collected, r.value.suggestions, 'autocomplete_modifier', seed, lang, r.value.modifier)
    }
  }

  if (miningDepth < 3) return collected

  // ── Layer 2: alphabet soup — "{seed} a" … "{seed} z" ──────────────────────
  // Batched in groups of 5 to avoid hammering the API
  const BATCH = 5
  for (let i = 0; i < ALPHABET.length; i += BATCH) {
    const letters = ALPHABET.slice(i, i + BATCH)
    const alphabetResults = await Promise.allSettled(
      letters.map(async (letter) => {
        const query = `${seed} ${letter}`
        return { letter, suggestions: await fetchAutocompleteSuggestions(query, lang, cntry) }
      }),
    )
    for (const r of alphabetResults) {
      if (r.status === 'fulfilled') {
        addSuggestions(collected, r.value.suggestions, 'autocomplete_modifier', seed, lang, r.value.letter, 0.85)
      }
    }
  }

  return collected
}
