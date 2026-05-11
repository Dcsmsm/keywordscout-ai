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

// ── Multilingual fallback templates ─────────────────────────────────────────

type LangTemplates = {
  informational: string[]
  commercial: string[]
  transactional: string[]
  navigational: string[]
  angle: string
}

const LANG_TEMPLATES: Record<string, LangTemplates> = {
  it: {
    informational: [
      '{kw}: Guida Completa {yr}', 'Tutto su {kw}: Guida Pratica', '{kw}: Come Funziona e Come Usarlo',
    ],
    commercial: [
      'Migliori {kw} del {yr}: Confronto e Recensioni', '{kw}: Quale Scegliere? Guida {yr}',
    ],
    transactional: [
      'Dove Acquistare {kw}: Prezzi e Offerte', '{kw}: Prezzi, Sconti e Dove Comprare',
    ],
    navigational: [
      '{kw}: Guida Ufficiale e Risorse', 'Guida a {kw}: Tutto Quello che Serve',
    ],
    angle: 'Guida aggiornata al {yr} su "{kw}" con esempi pratici e consigli concreti per chi inizia.',
  },
  es: {
    informational: [
      '{kw}: Guía Completa {yr}', 'Todo sobre {kw}: Guía Práctica', '{kw}: Cómo Funciona',
    ],
    commercial: [
      'Mejores {kw} {yr}: Comparativa y Opiniones', '{kw}: ¿Cuál Elegir? Guía {yr}',
    ],
    transactional: [
      'Dónde Comprar {kw}: Precios y Ofertas', '{kw}: Precios, Descuentos y Dónde Comprar',
    ],
    navigational: [
      '{kw}: Guía Oficial y Recursos', 'Guía de {kw}: Todo lo que Necesitas',
    ],
    angle: 'Guía actualizada {yr} sobre "{kw}" con ejemplos prácticos y consejos para principiantes.',
  },
  fr: {
    informational: [
      '{kw} : Guide Complet {yr}', 'Tout sur {kw} : Guide Pratique', '{kw} : Comment Ça Marche',
    ],
    commercial: [
      'Meilleurs {kw} {yr} : Comparatif et Avis', '{kw} : Lequel Choisir ? Guide {yr}',
    ],
    transactional: [
      'Où Acheter {kw} : Prix et Offres', '{kw} : Prix, Promos et Où Acheter',
    ],
    navigational: [
      '{kw} : Guide Officiel et Ressources', 'Guide {kw} : Tout ce qu\'il Faut Savoir',
    ],
    angle: 'Guide mis à jour {yr} sur "{kw}" avec exemples pratiques et conseils pour débutants.',
  },
  de: {
    informational: [
      '{kw}: Vollständiger Leitfaden {yr}', 'Alles über {kw}: Praxisguide', '{kw}: Wie es Funktioniert',
    ],
    commercial: [
      'Beste {kw} {yr}: Vergleich und Bewertungen', '{kw}: Welches Wählen? Leitfaden {yr}',
    ],
    transactional: [
      'Wo {kw} Kaufen: Preise und Angebote', '{kw}: Preise, Rabatte und Kauftipps',
    ],
    navigational: [
      '{kw}: Offizieller Leitfaden und Ressourcen', 'Leitfaden für {kw}: Alles Wichtige',
    ],
    angle: 'Aktualisierter Leitfaden {yr} zu "{kw}" mit praktischen Beispielen und Tipps für Einsteiger.',
  },
  pt: {
    informational: [
      '{kw}: Guia Completo {yr}', 'Tudo sobre {kw}: Guia Prático', '{kw}: Como Funciona',
    ],
    commercial: [
      'Melhores {kw} {yr}: Comparativo e Avaliações', '{kw}: Qual Escolher? Guia {yr}',
    ],
    transactional: [
      'Onde Comprar {kw}: Preços e Ofertas', '{kw}: Preços, Descontos e Onde Comprar',
    ],
    navigational: [
      '{kw}: Guia Oficial e Recursos', 'Guia de {kw}: Tudo o que Você Precisa',
    ],
    angle: 'Guia atualizado {yr} sobre "{kw}" com exemplos práticos e dicas para iniciantes.',
  },
  en: {
    informational: [
      '{kw}: The Complete Guide ({yr})', 'Everything About {kw}: Practical Guide', '{kw} Explained: How It Works',
    ],
    commercial: [
      'Best {kw} in {yr}: Reviews & Comparison', '{kw}: Which to Choose? {yr} Guide',
    ],
    transactional: [
      'Where to Buy {kw}: Best Prices & Deals', '{kw}: Pricing, Discounts & Where to Buy',
    ],
    navigational: [
      '{kw}: Official Guide & Resources', 'Getting Started with {kw}: Full Guide',
    ],
    angle: 'Updated {yr} guide on "{kw}" with practical examples and actionable advice for beginners.',
  },
}

function getLangTemplates(language: string): LangTemplates {
  return LANG_TEMPLATES[language.slice(0, 2).toLowerCase()] ?? LANG_TEMPLATES.en
}

function applyTemplate(tpl: string, keyword: string): string {
  const kw = keyword.split(' ').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
  return tpl.replace(/{kw}/g, kw).replace(/{yr}/g, String(CURRENT_YEAR))
}

// ── Claude prompts ────────────────────────────────────────────────────────────

function buildSinglePrompt(
  keyword: string,
  lang: string,
  languageName: string,
  serpResults: NormalizedSerpResult[],
  features: SerpFeatures,
): string {
  const top5 = serpResults.slice(0, 5)
    .map((r, i) => `${i + 1}. [${r.type}] "${r.title}"${r.snippet ? ` — ${r.snippet}` : ''}`)
    .join('\n')

  const flags = [
    features.hasReddit && 'Reddit in SERP',
    features.hasQuora && 'Quora in SERP',
    features.hasForums && 'forum results',
    features.hasWeakDomains && 'weak domains',
    features.hasOutdatedResults && 'outdated results',
    features.hasVideoResults && 'video results',
  ].filter(Boolean).join(', ') || 'none'

  return `Analyze this SEO keyword and return ONLY a JSON object.

Keyword: "${keyword}"
Current year: ${CURRENT_YEAR}
Output language: ${languageName} (code: ${lang})
SERP signals: ${flags}
Top SERP results:
${top5 || '(no SERP data available)'}

Return JSON with exactly these fields:
{
  "intent": "informational"|"commercial"|"transactional"|"navigational",
  "suggested_title": "<50-60 char SEO title in ${languageName}>",
  "content_angle": "<1-2 sentences in ${languageName} explaining how to outrank these results>"
}

MANDATORY: Both "suggested_title" and "content_angle" must be written ENTIRELY in ${languageName}. Zero English words unless they are part of the keyword itself.
- If the keyword contains a past year (e.g. "2023", "2024", "2025"), update it to ${CURRENT_YEAR} in suggested_title.
Return ONLY the JSON, no markdown.`
}

function buildBatchPrompt(
  items: Array<{ keyword: string; serpSignals: string }>,
  lang: string,
  languageName: string,
): string {
  const keywordList = items
    .map((item, i) => `${i + 1}. "${item.keyword}" [SERP: ${item.serpSignals}]`)
    .join('\n')

  return `You are an SEO expert. Analyze these ${items.length} keywords and return a JSON array.

Output language for ALL text: ${languageName} (${lang})
Year: ${CURRENT_YEAR}

Keywords:
${keywordList}

Return a JSON array with exactly ${items.length} objects in the same order:
[
  {
    "keyword": "<exact keyword from input>",
    "intent": "informational"|"commercial"|"transactional"|"navigational",
    "suggested_title": "<50-60 char SEO title — ENTIRELY in ${languageName}>",
    "content_angle": "<1-2 sentences — ENTIRELY in ${languageName} — unique angle to rank>"
  },
  ...
]

MANDATORY RULES:
- Every word of suggested_title and content_angle must be in ${languageName}
- Include the keyword naturally in suggested_title
- content_angle explains why a new article can outrank current results
- If a keyword contains a past year (e.g. "2023", "2024", "2025"), update it to ${CURRENT_YEAR} in suggested_title
- Return ONLY the JSON array, no markdown, no extra text`
}

// ── Public API ────────────────────────────────────────────────────────────────

export async function generateIdeationBatch(
  keywords: string[],
  language: string,
  serpDataMap: Map<string, { results: NormalizedSerpResult[]; features: SerpFeatures }>,
): Promise<Map<string, IdeationResult>> {
  const results = new Map<string, IdeationResult>()
  const lang = language.slice(0, 2).toLowerCase()
  const languageName = LANGUAGE_NAMES[lang] ?? 'English'

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    for (const kw of keywords) {
      results.set(kw, fallbackIdeation(kw, language))
    }
    return results
  }

  // Seed keyword (has SERP data) — call individually for best quality
  for (const kw of keywords) {
    const serpEntry = serpDataMap.get(kw)
    if (serpEntry && serpEntry.results.length > 0) {
      try {
        const result = await callClaudeSingle(kw, lang, languageName, serpEntry.results, serpEntry.features)
        results.set(kw, result)
      } catch {
        results.set(kw, fallbackIdeation(kw, language))
      }
    }
  }

  // All non-seed keywords — batch in one call
  const nonSeedKeywords = keywords.filter((kw) => !results.has(kw))
  if (nonSeedKeywords.length === 0) return results

  // Process in chunks of 20 to stay within token limits
  const CHUNK_SIZE = 20
  for (let i = 0; i < nonSeedKeywords.length; i += CHUNK_SIZE) {
    const chunk = nonSeedKeywords.slice(i, i + CHUNK_SIZE)
    try {
      const batchResults = await callClaudeBatch(chunk, lang, languageName, serpDataMap)
      for (const [kw, res] of batchResults) {
        results.set(kw, res)
      }
    } catch {
      for (const kw of chunk) {
        results.set(kw, fallbackIdeation(kw, language))
      }
    }
  }

  return results
}

async function callClaudeSingle(
  keyword: string,
  lang: string,
  languageName: string,
  serpResults: NormalizedSerpResult[],
  features: SerpFeatures,
): Promise<IdeationResult> {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })
  const message = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 512,
    system: `You are an SEO expert. Respond with valid JSON only. All text values must be written in ${languageName} (${lang}).`,
    messages: [{ role: 'user', content: buildSinglePrompt(keyword, lang, languageName, serpResults, features) }],
  })

  const text = message.content[0]?.type === 'text' ? message.content[0].text.trim() : ''
  const clean = text.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim()
  const parsed = JSON.parse(clean) as Partial<IdeationResult>

  const VALID_INTENTS: IdeationIntent[] = ['informational', 'commercial', 'transactional', 'navigational']
  return {
    intent: VALID_INTENTS.includes(parsed.intent as IdeationIntent)
      ? (parsed.intent as IdeationIntent)
      : 'informational',
    suggested_title: parsed.suggested_title || applyTemplate(getLangTemplates(lang).informational[0], keyword),
    content_angle: parsed.content_angle || applyTemplate(getLangTemplates(lang).angle, keyword),
  }
}

async function callClaudeBatch(
  keywords: string[],
  lang: string,
  languageName: string,
  serpDataMap: Map<string, { results: NormalizedSerpResult[]; features: SerpFeatures }>,
): Promise<Map<string, IdeationResult>> {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })
  const t = getLangTemplates(lang)

  const items = keywords.map((kw) => {
    const entry = serpDataMap.get(kw)
    const flags = entry && entry.results.length > 0
      ? [
          entry.features.hasReddit && 'reddit',
          entry.features.hasForums && 'forums',
          entry.features.hasWeakDomains && 'weak-domains',
          entry.features.hasOutdatedResults && 'outdated',
        ].filter(Boolean).join(',') || 'standard'
      : 'no-serp-data'
    return { keyword: kw, serpSignals: flags }
  })

  const message = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 4096,
    system: `You are an SEO expert. Respond with valid JSON only. All text values must be written in ${languageName} (${lang}). No English unless the keyword itself is English.`,
    messages: [{ role: 'user', content: buildBatchPrompt(items, lang, languageName) }],
  })

  const text = message.content[0]?.type === 'text' ? message.content[0].text.trim() : '[]'
  const clean = text.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim()
  const parsed = JSON.parse(clean) as Array<{
    keyword?: string
    intent?: string
    suggested_title?: string
    content_angle?: string
  }>

  const VALID_INTENTS: IdeationIntent[] = ['informational', 'commercial', 'transactional', 'navigational']
  const resultMap = new Map<string, IdeationResult>()

  for (let i = 0; i < keywords.length; i++) {
    const kw = keywords[i]
    const item = parsed[i] ?? {}
    resultMap.set(kw, {
      intent: VALID_INTENTS.includes(item.intent as IdeationIntent)
        ? (item.intent as IdeationIntent)
        : 'informational',
      suggested_title: item.suggested_title || applyTemplate(t.informational[0], kw),
      content_angle: item.content_angle || applyTemplate(t.angle, kw),
    })
  }

  return resultMap
}

// Kept for backwards compatibility — used by expandKeywords and old call sites
export async function generateIdeation(
  keyword: string,
  language: string,
  serpResults: NormalizedSerpResult[],
  features: SerpFeatures,
): Promise<IdeationResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return fallbackIdeation(keyword, language)

  const lang = language.slice(0, 2).toLowerCase()
  const languageName = LANGUAGE_NAMES[lang] ?? 'English'

  try {
    return await callClaudeSingle(keyword, lang, languageName, serpResults, features)
  } catch {
    return fallbackIdeation(keyword, language)
  }
}

function fallbackIdeation(keyword: string, language: string): IdeationResult {
  const intent = detectIntent(keyword)
  const lang = language.slice(0, 2).toLowerCase()
  const t = getLangTemplates(lang)
  const intentKey = intent as keyof Pick<LangTemplates, 'informational' | 'commercial' | 'transactional' | 'navigational'>
  const templates = t[intentKey] ?? t.informational
  return {
    intent,
    suggested_title: applyTemplate(templates[0], keyword),
    content_angle: applyTemplate(t.angle, keyword),
  }
}

// ── Claude keyword expansion ──────────────────────────────────────────────────

export async function expandKeywords(
  seed: string,
  language: string,
  serpData: { peopleAlsoAsk?: string[]; relatedSearches?: string[] },
  existingKeywords: string[],
  count = 15,
): Promise<string[]> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return []

  const lang = language.slice(0, 2).toLowerCase()
  const languageName = LANGUAGE_NAMES[lang] ?? 'English'
  const paa = (serpData.peopleAlsoAsk ?? []).slice(0, 5).join(' | ')
  const related = (serpData.relatedSearches ?? []).slice(0, 5).join(' | ')
  const existing = existingKeywords.join(', ')

  const prompt = `You are an SEO keyword research expert.

Seed keyword: "${seed}"
Output language: ${languageName} (${lang})
Already found (do NOT repeat): ${existing}
People Also Ask: ${paa || 'none'}
Related Searches: ${related || 'none'}

Generate exactly ${count} long-tail keyword variations that real users search for in ${languageName}.
Mix types: questions (how, what, why), comparisons (best X for Y), problem-oriented, modifier + keyword, context variants.

Rules:
- ALL ${count} keywords must be written in ${languageName}
- Do NOT repeat any already-found keyword
- Return ONLY a JSON array of ${count} strings, no explanation, no markdown`

  try {
    const client = new Anthropic({ apiKey })
    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      system: `You are an SEO keyword research expert. Respond with valid JSON only. All keywords must be in ${languageName}.`,
      messages: [{ role: 'user', content: prompt }],
    })

    const text = message.content[0]?.type === 'text' ? message.content[0].text.trim() : '[]'
    const clean = text.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim()
    const parsed = JSON.parse(clean) as unknown[]
    const existingLower = existingKeywords.map((e) => e.toLowerCase())
    return parsed
      .filter((k): k is string => typeof k === 'string' && k.trim().length > 0)
      .map((k) => k.trim().toLowerCase())
      .filter((k) => !existingLower.includes(k))
      .slice(0, count)
  } catch {
    return []
  }
}

// ── Fallback helpers (kept for generateTopicCluster) ─────────────────────────

export function detectIntent(keyword: string): IdeationIntent {
  const kw = keyword.toLowerCase()
  if (/\b(buy|purchase|order|price|discount|coupon|deal|shop|cheap|acquist|compr|kauf|acheter|comprar)\b/.test(kw)) return 'transactional'
  if (/\b(best|top|review|vs|compare|alternatives|miglio|mejor|meilleur|beste|melhor|recensi|opinioni)\b/.test(kw)) return 'commercial'
  if (/\b(login|sign in|download|official|account|ufficiale|acceso|connexion)\b/.test(kw)) return 'navigational'
  return 'informational'
}

export function generateTitle(keyword: string, intent: string, language = 'en'): string {
  const t = getLangTemplates(language)
  const intentKey = intent as keyof Pick<LangTemplates, 'informational' | 'commercial' | 'transactional' | 'navigational'>
  const templates = t[intentKey] ?? t.informational
  return applyTemplate(templates[Math.floor(Math.random() * templates.length)], keyword)
}

export function generateContentAngle(keyword: string, _serpResults: NormalizedSerpResult[], language = 'en'): string {
  return applyTemplate(getLangTemplates(language).angle, keyword)
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
    ['guide', 'tips', 'how', 'best', 'tools', 'tutorial', 'guida', 'migliore', 'come'].includes(w)
  )
  if (modifier) return cleanSeed.replace(modifier, '').trim().split(' ').slice(0, 3).join(' ')
  return cleanSeed.split(' ').slice(0, 2).join(' ')
}
