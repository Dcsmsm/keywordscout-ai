import { KeywordIdea, NormalizedSerpResult } from '@/types/providers'
import { CURRENT_YEAR } from '@/lib/constants'

export function generateTitle(keyword: string, intent: string): string {
  const kw = keyword
    .split(' ')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')

  const templates: Record<string, string[]> = {
    informational: [
      `${kw}: The Complete Guide (${CURRENT_YEAR})`,
      `Everything You Need to Know About ${kw}`,
      `${kw} Explained: A Beginner's Guide`,
      `How ${kw} Works (And Why It Matters)`,
    ],
    commercial: [
      `Best ${kw} Tools in ${CURRENT_YEAR} (Honest Review)`,
      `${kw}: Top 10 Options Compared`,
      `The ${kw} Guide: Find the Right Solution`,
    ],
    transactional: [
      `Where to Get ${kw} (Best Deals)`,
      `${kw}: Pricing, Plans & What to Know`,
    ],
    navigational: [
      `${kw}: Official Guide & Resources`,
      `Getting Started with ${kw}`,
    ],
  }

  const options = templates[intent] ?? templates.informational
  return options[Math.floor(Math.random() * options.length)]
}

export function generateContentAngle(
  keyword: string,
  serpResults: NormalizedSerpResult[]
): string {
  const hasForums = serpResults.some((r) => r.type === 'forum')
  const hasOutdated = serpResults.some((r) => {
    const match = r.title.match(/\b(20\d{2})\b/)
    return match && CURRENT_YEAR - parseInt(match[1]) >= 2
  })
  const hasVideo = serpResults.some((r) => r.type === 'video')
  const hasWeak = serpResults.filter((r) => r.type === 'forum').length >= 2

  if (hasForums && hasWeak) {
    return `Comprehensive, well-structured guide targeting people asking "${keyword}" in forums. Cover the topic thoroughly with practical examples they haven't seen before.`
  }
  if (hasOutdated) {
    return `Fresh ${CURRENT_YEAR} update on "${keyword}". The current top results are outdated — lead with what's changed and provide current, accurate information.`
  }
  if (hasVideo) {
    return `Text-first deep dive on "${keyword}" that video content can't match. Include screenshots, step-by-step breakdowns, and searchable indexed content.`
  }

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

  if (modifier) {
    return cleanSeed.replace(modifier, '').trim().split(' ').slice(0, 3).join(' ')
  }

  return cleanSeed.split(' ').slice(0, 2).join(' ')
}
