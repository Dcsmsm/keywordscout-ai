import { DataForSEOProvider } from './dataforseo'
import { createAdminClient } from '@/lib/supabase/admin'

const CACHE_TTL_DAYS = 30

let dfsClient: DataForSEOProvider | null = null

function getDataForSEOClient(): DataForSEOProvider | null {
  if (dfsClient) return dfsClient
  const login = process.env.DATAFORSEO_LOGIN
  const password = process.env.DATAFORSEO_PASSWORD
  if (!login || !password) return null
  dfsClient = new DataForSEOProvider(login, password)
  return dfsClient
}

export async function enrichWithDifficulty(
  keywords: string[],
  country: string,
  language: string,
): Promise<Record<string, number>> {
  if (!keywords.length) return {}

  const supabase = createAdminClient()
  const lang = language.slice(0, 2).toLowerCase()
  const cntry = country.slice(0, 2).toLowerCase()
  const cutoff = new Date(Date.now() - CACHE_TTL_DAYS * 24 * 60 * 60 * 1000).toISOString()

  // 1. Check cache
  const { data: cached } = await (supabase.from('keyword_difficulty_cache' as any) as any)
    .select('keyword, difficulty')
    .in('keyword', keywords)
    .eq('country', cntry)
    .eq('language', lang)
    .gte('cached_at', cutoff)

  const result: Record<string, number> = {}
  const cachedKeys = new Set<string>()

  for (const row of (cached as Array<{ keyword: string; difficulty: number | null }> | null) ?? []) {
    if (row.difficulty != null) result[row.keyword] = row.difficulty
    cachedKeys.add(row.keyword)
  }

  // 2. Identify misses
  const misses = keywords.filter((k) => !cachedKeys.has(k))
  if (!misses.length) return result

  // 3. Fetch misses from DataForSEO Labs in one bulk call
  const dfs = getDataForSEOClient()
  if (!dfs) return result

  try {
    const fresh = await dfs.getKeywordDifficulty(misses, cntry, lang)

    for (const [kw, diff] of Object.entries(fresh)) {
      result[kw] = diff
    }

    // 4. Upsert misses into cache (including nulls to avoid re-fetching unknown keywords)
    const rows = misses.map((kw) => ({
      keyword: kw,
      country: cntry,
      language: lang,
      difficulty: fresh[kw] ?? null,
      cached_at: new Date().toISOString(),
    }))

    await (supabase.from('keyword_difficulty_cache' as any) as any)
      .upsert(rows, { onConflict: 'keyword,country,language' })
  } catch {
    // Non-critical — analysis continues with competition-derived or estimated difficulty
  }

  return result
}
