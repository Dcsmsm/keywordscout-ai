/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { analyzeKeywordSchema } from '@/lib/validations'
import {
  getActiveProvider,
  getFallbackProvider,
  withFallback,
  logProviderCall,
} from '@/lib/providers/factory'
import {
  analyzeSerpFeatures,
  calculateSerpWeaknessScore,
  calculateOpportunityScore,
  estimateDifficulty,
} from '@/lib/ai/scoring'
import { generateIdeationBatch, generateTopicCluster, expandKeywords } from '@/lib/ai/ideation'
import { enrichWithVolume } from '@/lib/providers/volume'
import { enrichWithDifficulty } from '@/lib/providers/difficulty'
import { enrichWithSerp } from '@/lib/providers/serp-cache'
import { expandKeywordsPipeline } from '@/lib/keyword-expansion'
import { scoreRelevance } from '@/lib/keyword-expansion/semantic-relevance'
import { PLAN_LIMITS } from '@/types/analysis'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const parsed = analyzeKeywordSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid input', details: parsed.error.flatten() },
      { status: 400 }
    )
  }

  const { keyword, country, language, miningDepth, maxSuggestions } = parsed.data
  const adminSupabase = createAdminClient()
  const currentMonth = new Date().toISOString().slice(0, 7)

  const [subRes, usageRes] = await Promise.all([
    adminSupabase.from('subscriptions').select('plan').eq('user_id', user.id).single(),
    adminSupabase.from('usage').select('analyses_count').eq('user_id', user.id).eq('month', currentMonth).single(),
  ])

  const subData = subRes.data as any
  const usageData = usageRes.data as any

  const plan: string = subData?.plan ?? 'free'
  const used: number = usageData?.analyses_count ?? 0
  const limit = PLAN_LIMITS[plan as keyof typeof PLAN_LIMITS] ?? PLAN_LIMITS.free

  if (used >= limit) {
    return NextResponse.json(
      { error: `Monthly limit reached (${limit} analyses). Upgrade your plan.` },
      { status: 429 }
    )
  }

  const { data: analysisData, error: analysisError } = await (adminSupabase
    .from('keyword_analyses') as any)
    .insert({ user_id: user.id, seed_keyword: keyword, status: 'processing', language, country, mining_depth: miningDepth })
    .select('id')
    .single()

  if (analysisError || !analysisData) {
    return NextResponse.json({ error: 'Failed to create analysis' }, { status: 500 })
  }

  const analysisId = (analysisData as any).id

  try {
    const provider = await getActiveProvider()
    const fallback = await getFallbackProvider()
    const options = { country, language }

    const [ideas, serpData] = await Promise.all([
      withFallback(
        () => provider.getKeywordIdeas(keyword, { ...options, limit: 8 }),
        fallback
          ? () => fallback.getKeywordIdeas(keyword, { ...options, limit: 8 })
          : () => provider.getKeywordIdeas(keyword, { ...options, limit: 8 })
      ),
      withFallback(
        async () => {
          const start = Date.now()
          try {
            const result = await provider.getSerpAnalysis(keyword, options)
            await logProviderCall(provider.name, keyword, 'success', Date.now() - start, undefined, result)
            return result
          } catch (err) {
            await logProviderCall(provider.name, keyword, 'error', Date.now() - start, String(err))
            throw err
          }
        },
        fallback
          ? async () => {
              const start = Date.now()
              try {
                const result = await fallback.getSerpAnalysis(keyword, options)
                await logProviderCall(fallback.name, keyword, 'success', Date.now() - start, undefined, result)
                return result
              } catch (err) {
                await logProviderCall(fallback.name, keyword, 'error', Date.now() - start, String(err))
                throw err
              }
            }
          : async () => provider.getSerpAnalysis(keyword, options)
      ),
    ])

    const serpKeywords = [keyword, ...ideas
      .map((k) => k.keyword)
      .filter((k) => k !== keyword && scoreRelevance(k, keyword) > 0)]

    // Run autocomplete mining + Claude keyword expansion in parallel
    const [expansion, claudeKeywords] = await Promise.all([
      expandKeywordsPipeline({ seed: keyword, language, country, miningDepth, maxSuggestions }),
      expandKeywords(keyword, language, serpData, serpKeywords, 15),
    ])

    // Merge: seed → SERP ideas → autocomplete mined → Claude-generated, deduplicated
    const minedKeywords = expansion.keywords.map((k) => k.keyword)
    const filteredClaudeKeywords = claudeKeywords.filter((k) => scoreRelevance(k, keyword) > 0)
    const allKeywordsSet = [keyword, ...serpKeywords.filter((k) => k !== keyword), ...minedKeywords, ...filteredClaudeKeywords]
    const allKeywords = [...new Set(allKeywordsSet)].slice(0, maxSuggestions)

    // Build source maps for provenance tracking
    const autocompleteSourceMap = new Map(expansion.keywords.map((k) => [k.keyword, k]))
    const claudeSet = new Set(filteredClaudeKeywords)

    // ── [A] Volume + competition — 1 bulk call, already paid ──────────────────
    const volumeMap = await enrichWithVolume(allKeywords, country, language)

    // ── [B] Real SEO difficulty — 1 bulk DataForSEO Labs call, ~$0.025/100kw ─
    const difficultyMap = await enrichWithDifficulty(allKeywords, country, language)

    // ── Preliminary scores (vol + difficulty, no weakness yet) ────────────────
    // Used to select which keywords get a real SERP call in step C
    const preliminaryScores: Record<string, number> = {}
    for (const kw of allKeywords) {
      const vol = volumeMap[kw]?.volume ?? null
      const competitionDerived = volumeMap[kw]?.competition != null
        ? Math.round(volumeMap[kw]!.competition! * 100) : null
      const diff = difficultyMap[kw] ?? competitionDerived
      const volScore = vol
        ? Math.min((Math.log10(Math.max(vol, 1)) / Math.log10(100_000)) * 50, 50) : 25
      const diffPenalty = diff != null ? (diff / 100) * 20 : 10
      preliminaryScores[kw] = volScore - diffPenalty
    }
    // Seed keyword always gets real SERP (it was already fetched)
    preliminaryScores[keyword] = (preliminaryScores[keyword] ?? 0) + 999

    // ── [C] Selective SERP for top-5 by preliminary score, ~5 × $0.05 ────────
    const TOP_N_SERP = parseInt(process.env.SERP_ENRICHMENT_TOP_N ?? '5', 10)
    const seedMap = new Map([[keyword, serpData]])
    const serpCacheMap = await enrichWithSerp(
      allKeywords, preliminaryScores, country, language, provider, TOP_N_SERP, seedMap,
    )

    // ── Build final serpDataMap: real SERP where available, empty stub elsewhere
    const serpDataMap = new Map(
      allKeywords.map((kw) => {
        const results = serpCacheMap.has(kw) ? serpCacheMap.get(kw)!.results : []
        return [kw, { results, features: analyzeSerpFeatures(results) }]
      }),
    )

    // Single batched Claude call for all ideation (titles + content angles in target language)
    const ideationMap = await generateIdeationBatch(allKeywords, language, serpDataMap)

    const rawResults = allKeywords.map((kw) => {
      const idea = ideas.find((i) => i.keyword === kw)
      const serpEntry = serpDataMap.get(kw)!
      const weakness = calculateSerpWeaknessScore(serpEntry.results, serpEntry.features)

      // Difficulty priority: Labs real score > Google Ads competition × 100 > SERP-derived
      const competitionDerived = volumeMap[kw]?.competition != null
        ? Math.round(volumeMap[kw]!.competition! * 100) : null
      const difficulty = difficultyMap[kw] ?? competitionDerived ?? estimateDifficulty(serpEntry.results)

      const volume = idea?.volume ?? volumeMap[kw]?.volume ?? null
      const opportunity = calculateOpportunityScore(weakness, volume, difficulty)
      const ideation = ideationMap.get(kw)!
      const kwMeta = autocompleteSourceMap.get(kw)
      const source = kw === keyword ? 'seed' : claudeSet.has(kw) ? 'claude' : (kwMeta?.source ?? 'autocomplete')
      return {
        analysis_id: analysisId,
        keyword: kw,
        estimated_volume: volume,
        intent: ideation.intent,
        difficulty_estimate: difficulty,
        serp_weakness_score: weakness,
        opportunity_score: opportunity,
        suggested_title: ideation.suggested_title,
        content_angle: ideation.content_angle,
        topic_cluster: generateTopicCluster(kw),
        serp_features: serpEntry.features as unknown as Record<string, unknown>,
        raw_serp_data: serpCacheMap.has(kw) ? (serpCacheMap.get(kw) as unknown as Record<string, unknown>) : null,
        keyword_source: source,
        relevance_score: kw === keyword ? 1 : (kwMeta?.relevanceScore ?? null),
        source_modifier: kwMeta?.modifier ?? null,
        has_real_difficulty: difficultyMap[kw] != null || volumeMap[kw]?.competition != null,
        has_real_serp: serpCacheMap.has(kw),
      }
    })

    // Sort: seed keyword first, then by opportunity score descending
    const resultsToInsert = [
      rawResults.find((r) => r.keyword === keyword)!,
      ...rawResults
        .filter((r) => r.keyword !== keyword)
        .sort((a, b) => (b.opportunity_score ?? 0) - (a.opportunity_score ?? 0)),
    ].filter(Boolean)

    await (adminSupabase.from('keyword_results') as any).insert(resultsToInsert)

    await Promise.all([
      (adminSupabase.from('keyword_analyses') as any)
        .update({ status: 'completed', provider_used: provider.name })
        .eq('id', analysisId),
      (adminSupabase as any).rpc('increment_usage', { p_user_id: user.id, p_month: currentMonth }),
    ])

    return NextResponse.json({ analysisId, resultsCount: resultsToInsert.length })
  } catch (err) {
    await (adminSupabase.from('keyword_analyses') as any)
      .update({ status: 'failed', error_message: String(err) })
      .eq('id', analysisId)

    console.error('[analyze]', err)
    return NextResponse.json({ error: 'Analysis failed. Please try again.' }, { status: 500 })
  }
}
