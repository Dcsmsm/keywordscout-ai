import { createAdminClient } from '@/lib/supabase/admin'
import { SearchProvider, SerpAnalysis } from '@/types/providers'

const CACHE_TTL_DAYS = 14
const FETCH_CONCURRENCY = 3

export async function enrichWithSerp(
  keywords: string[],
  preliminaryScores: Record<string, number>,
  country: string,
  language: string,
  provider: SearchProvider,
  topN = 5,
  prePopulated?: Map<string, SerpAnalysis>,
): Promise<Map<string, SerpAnalysis>> {
  const result = new Map<string, SerpAnalysis>()
  if (!keywords.length) return result

  const supabase = createAdminClient()
  const lang = language.slice(0, 2).toLowerCase()
  const cntry = country.slice(0, 2).toLowerCase()
  const cutoff = new Date(Date.now() - CACHE_TTL_DAYS * 24 * 60 * 60 * 1000).toISOString()

  // 1. Select top-N keywords by preliminary score
  const sorted = [...keywords].sort(
    (a, b) => (preliminaryScores[b] ?? 0) - (preliminaryScores[a] ?? 0),
  )
  const topKeywords = sorted.slice(0, topN)

  // 2. Seed pre-populated entries into the result and write them to cache
  if (prePopulated?.size) {
    for (const [kw, serpAnalysis] of prePopulated) {
      result.set(kw, serpAnalysis)
    }

    // Write pre-populated SERP data to cache so future analyses can reuse it
    const preRows = [...prePopulated.entries()].map(([kw, serpAnalysis]) => ({
      keyword: kw,
      country: cntry,
      language: lang,
      serp_data: serpAnalysis as unknown as Record<string, unknown>,
      cached_at: new Date().toISOString(),
    }))
    try {
      await (supabase.from('keyword_serp_cache' as any) as any)
        .upsert(preRows, { onConflict: 'keyword,country,language' })
    } catch { /* non-critical */ }
  }

  // 3. Check cache for top-N that aren't already populated
  const needsLookup = topKeywords.filter((kw) => !result.has(kw))
  if (!needsLookup.length) return result

  try {
    const { data: cached } = await (supabase.from('keyword_serp_cache' as any) as any)
      .select('keyword, serp_data')
      .in('keyword', needsLookup)
      .eq('country', cntry)
      .eq('language', lang)
      .gte('cached_at', cutoff)

    const cachedKeys = new Set<string>()
    for (const row of (cached as Array<{ keyword: string; serp_data: unknown }> | null) ?? []) {
      result.set(row.keyword, row.serp_data as SerpAnalysis)
      cachedKeys.add(row.keyword)
    }

    // 4. Fetch SERP for cache misses with limited concurrency
    const misses = needsLookup.filter((kw) => !cachedKeys.has(kw))
    if (!misses.length) return result

    const rowsToCache: Array<{ keyword: string; country: string; language: string; serp_data: unknown; cached_at: string }> = []

    for (let i = 0; i < misses.length; i += FETCH_CONCURRENCY) {
      const batch = misses.slice(i, i + FETCH_CONCURRENCY)
      const batchResults = await Promise.allSettled(
        batch.map((kw) => provider.getSerpAnalysis(kw, { country, language })),
      )

      for (let j = 0; j < batch.length; j++) {
        const kw = batch[j]
        const res = batchResults[j]
        if (res.status === 'fulfilled') {
          result.set(kw, res.value)
          rowsToCache.push({
            keyword: kw,
            country: cntry,
            language: lang,
            serp_data: res.value as unknown as Record<string, unknown>,
            cached_at: new Date().toISOString(),
          })
        }
      }
    }

    // 5. Upsert fetched results into cache
    if (rowsToCache.length) {
      await (supabase.from('keyword_serp_cache' as any) as any)
        .upsert(rowsToCache, { onConflict: 'keyword,country,language' })
    }
  } catch { /* Non-critical — analysis continues with empty SERP for these keywords */ }

  return result
}
