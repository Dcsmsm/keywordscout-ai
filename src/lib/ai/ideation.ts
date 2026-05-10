import Anthropic from '@anthropic-ai/sdk'
import { KeywordIdea, NormalizedSerpResult } from '@/types/providers'
import { SerpFeatures } from '@/types/analysis'
import { CURRENT_YEAR } from '@/lib/constants'

export type IdeationIntent = 'informational' | 'commercial' | 'transactional' | 'navigational'

export interface IdeationResult {
  intent: IdeationIntent
  suggested_title: string
  content_angle: string
}

const LANGUAGE_NAMES: Record<string, string> = {
  en: 'English', it: 'Italian', es: 'Spanish',
  fr: 'French', de: 'German', pt: 'Portuguese',
}

function buildPrompt(
  keyword: string,
  languageName: string,
  serpResults: NormalizedSerpResult[],
  features: SerpFeatures,
): string {
  const top5 = serpResults.slice(0, 5).map(
    (r, i) => `${i + 1}. [${r.type}] "${r.title}" — ${r.snippet ?? 'no snippet'}`
  ).join('\n')

  const flags = [
    features.hasReddit && 'Reddit present in SERP',
    features.hasQuora && 'Quora present in SERP',
    features.hasForums && 'Forum results present',
    features.hasWeakDomains && 'Weak/thin domains present',
    features.hasOutdatedResults && 'Outdated results (2+ years old)',
    features.hasVideoResults && 'Video results present',
  ].filter(Boolean).join(', ') || 'no special features'

  return `You are an SEO expert. Analyze this keyword and return ONLY a JSON object.

Keyword: "${keyword}"
Target language: ${languageName}
SERP signals: ${flags}

Top SERP results:
${top5 || 'No SERP data available'}

Return JSON with exactly these fields:
{
  "intent": one of "informational" | "commercial" | "transactional" | "navigational",
  "suggested_title": SEO title tag (50-60 chars) in ${languageName}, optimized to rank,
  "content_angle": 1-2 sentences in ${languageName} describing the unique editorial angle to beat these results
}

Rules:
- Write suggested_title and content_angle in ${languageName}
- suggested_title must be compelling, include the keyword, and hint at value
- content_angle must explain WHY a new article can outrank current results
- Return ONLY the JSON, no markdown, no explanation`
}

export async function expandKeywords(
  seed: string,
  language: string,
  serpData: { peopleAlsoAsk?: string[]; relatedSearches?: string[] },
  existingKeywords: string[],
  count = 15,
): Promise<string[]> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return []

  const languageName = LANGUAGE_NAMES[language.slice(0, 2).toLowerCase()] ?? 'English'
  const paa = (serpData.peopleAlsoAsk ?? []).slice(0, 5).join(' | ')
  const related = (serpData.relatedSearches ?? []).slice(0, 5).join(' | ')
  const existing = existingKeywords.join(', ')

  const prompt = `You are an SEO keyword research expert.

Seed keyword: "${seed}"
Language: ${languageName}

Already found keywords (do NOT repeat these): ${existing}

SERP context — People Also Ask: ${paa || 'none'}
SERP context — Related Searches: ${related || 'none'}

Generate exactly ${count} long-tail keyword variations that real users search for.
Mix these types:
- Question searches (how, what, why, best way to…)
- "Best X for Y" comparisons
- Problem-oriented searches
- Modifier + keyword (cheap, easy, fast, professional…)
- Local or context variants

Rules:
- Write ALL keywords in ${languageName}
- Do NOT repeat any already-found keyword
- Return ONLY a JSON array of ${count} strings, no explanation, no markdown`

  try {
    const client = new Anthropic({ apiKey })
    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      system: 'You are an SEO keyword research expert. Always respond with valid JSON only.',
      messages: [{ role: 'user', content: prompt }],
    })

    const text = message.content[0]?.type === 'text' ? message.content[0].text.trim() : '[]'
    const parsed = JSON.parse(text) as unknown[]
    return parsed
      .filter((k): k is string => typeof k === 'string' && k.trim().length > 0)
      .map((k) => k.trim().toLowerCase())
      .filter((k) => !existingKeywords.map((e) => e.toLowerCase()).includes(k))
      .slice(0, count)
  } catch {
    return []
  }
}

export async function generateIdeation(
  keyword: string,
  language: string,
  serpResults: NormalizedSerpResult[],
  features: SerpFeatures,
): Promise<IdeationResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return fallbackIdeation(keyword, language, serpResults)

  const languageName = LANGUAGE_NAMES[language.slice(0, 2).toLowerCase()] ?? 'English'

  try {
    const client = new Anthropic({ apiKey })
    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 512,
      system: 'You are an SEO expert. Always respond with valid JSON only, no markdown fences.',
      messages: [{ role: 'user', content: buildPrompt(keyword, languageName, serpResults, features) }],
    })

    const text = message.content[0]?.type === 'text' ? message.content[0].text.trim() : ''
    const parsed = JSON.parse(text) as Partial<IdeationResult>

    const VALID_INTENTS: IdeationIntent[] = ['informational', 'commercial', 'transactional', 'navigational']
    const intent = VALID_INTENTS.includes(parsed.intent as IdeationIntent)
      ? (parsed.intent as IdeationIntent)
      : 'informational'

    return {
      intent,
      suggested_title: parsed.suggested_title || generateTitle(keyword, intent),
      content_angle: parsed.content_angle || generateContentAngle(keyword, serpResults),
    }
  } catch {
    return fallbackIdeation(keyword, language, serpResults)
  }
}

function fallbackIdeation(
  keyword: string,
  language: string,
  serpResults: NormalizedSerpResult[],
): IdeationResult {
  const intent = detectIntent(keyword)
  return {
    intent,
    suggested_title: generateTitle(keyword, intent),
    content_angle: generateContentAngle(keyword, serpResults),
  }
}

// ── Fallback template functions (English) ────────────────────────────────────

export function detectIntent(keyword: string): IdeationIntent {
  const kw = keyword.toLowerCase()
  if (/\b(buy|purchase|order|price|discount|coupon|deal|shop|cheap)\b/.test(kw)) return 'transactional'
  if (/\b(best|top|review|vs|compare|alternatives|cheapest|recommend)\b/.test(kw)) return 'commercial'
  if (/\b(login|sign in|download|official|account)\b/.test(kw)) return 'navigational'
  if (/\b(how|what|why|guide|tutorial|tips|learn|explain)\b/.test(kw)) return 'informational'
  return 'informational'
}

export function generateTitle(keyword: string, intent: string): string {
  const kw = keyword.split(' ').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
  const templates: Record<string, string[]> = {
    informational: [
      `${kw}: The Complete Guide (${CURRENT_YEAR})`,
      `Everything You Need to Know About ${kw}`,
      `${kw} Explained: A Beginner's Guide`,
    ],
    commercial: [
      `Best ${kw} in ${CURRENT_YEAR} (Honest Review)`,
      `${kw}: Top Options Compared`,
    ],
    transactional: [
      `Where to Get ${kw} (Best Deals)`,
      `${kw}: Pricing & Plans`,
    ],
    navigational: [
      `${kw}: Official Guide & Resources`,
      `Getting Started with ${kw}`,
    ],
  }
  const options = templates[intent] ?? templates.informational
  return options[Math.floor(Math.random() * options.length)]
}

export function generateContentAngle(keyword: string, serpResults: NormalizedSerpResult[]): string {
  const hasForums = serpResults.some((r) => r.type === 'forum')
  const hasOutdated = serpResults.some((r) => {
    const match = r.title.match(/\b(20\d{2})\b/)
    return match && CURRENT_YEAR - parseInt(match[1]) >= 2
  })
  const hasVideo = serpResults.some((r) => r.type === 'video')
  const weakCount = serpResults.filter((r) => r.type === 'forum').length

  if (hasForums && weakCount >= 2)
    return `Comprehensive, well-structured guide targeting people asking "${keyword}" in forums. Cover the topic with practical examples they haven't seen before.`
  if (hasOutdated)
    return `Fresh ${CURRENT_YEAR} update on "${keyword}". The current top results are outdated — lead with what's changed and provide current, accurate information.`
  if (hasVideo)
    return `Text-first deep dive on "${keyword}" that video content can't match. Include step-by-step breakdowns and searchable indexed content.`
  return `Authoritative, experience-based content on "${keyword}" that goes beyond surface-level explanations. Include real examples, data, and unique insights.`
}

export function clusterKeywords(keywords: KeywordIdea[]): Record<string, KeywordIdea[]> {
  const clusters: Record<string, KeywordIdea[]> = {}
  for (const kw of keywords) {
    const words = kw.keyword.toLowerCase().split(' ')
    const clusterKey = findBestCluster(words, Object.keys(clusters)) ?? words[0] ?? 'other'
    if (!clusters[clusterKey]) clusters[clusterKey] = []
    clusters[clusterKey].push(kw)
  }
  return clusters
}

function findBestCluster(words: string[], existingClusters: string[]): string | null {
  for (const cluster of existingClusters) {
    const clusterWords = cluster.split(' ')
    const overlap = words.filter((w) => clusterWords.includes(w)).length
    if (overlap >= 1 && words.length <= 4) return cluster
  }
  return null
}

export function generateTopicCluster(seed: string): string {
  const cleanSeed = seed.toLowerCase().trim()
  const modifier = cleanSeed.split(' ').find((w) =>
    ['guide', 'tips', 'how', 'best', 'tools', 'tutorial'].includes(w)
  )
  if (modifier) return cleanSeed.replace(modifier, '').trim().split(' ').slice(0, 3).join(' ')
  return cleanSeed.split(' ').slice(0, 2).join(' ')
}
