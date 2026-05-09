import { NormalizedSerpResult } from '@/types/providers'
import { SerpFeatures } from '@/types/analysis'
import {
  WEAK_DOMAIN_PATTERNS,
  FORUM_PATTERNS,
  CURRENT_YEAR,
  OUTDATED_YEAR_THRESHOLD,
} from '@/lib/constants'

export function analyzeSerpFeatures(results: NormalizedSerpResult[]): SerpFeatures {
  const top10 = results.slice(0, 10)

  const hasReddit = top10.some((r) => r.domain.includes('reddit.com'))
  const hasQuora = top10.some((r) => r.domain.includes('quora.com'))
  const hasForums = top10.some(
    (r) =>
      r.type === 'forum' ||
      FORUM_PATTERNS.some((p) => r.url.toLowerCase().includes(p))
  )
  const hasWeakDomains = top10.some((r) =>
    WEAK_DOMAIN_PATTERNS.some((p) => r.domain.toLowerCase().includes(p))
  )
  const hasOutdatedResults = top10.some((r) => {
    const titleYear = r.title.match(/\b(20\d{2})\b/)?.[1]
    if (!titleYear) return false
    return CURRENT_YEAR - parseInt(titleYear) >= OUTDATED_YEAR_THRESHOLD
  })
  const hasExactTitleMatches = false // Requires comparison logic with user keyword
  const hasVideoResults = top10.some((r) => r.type === 'video')
  const hasPAA = false // Set from SERP response separately

  return {
    hasReddit,
    hasQuora,
    hasForums,
    hasWeakDomains,
    hasOutdatedResults,
    hasExactTitleMatches,
    hasVideoResults,
    hasPAA,
  }
}

export function calculateSerpWeaknessScore(
  results: NormalizedSerpResult[],
  features: SerpFeatures
): number {
  let score = 0

  // Forum presence — signals opportunity (weak authority)
  if (features.hasReddit) score += 20
  if (features.hasQuora) score += 15
  if (features.hasForums) score += 10

  // Weak domains in top results
  if (features.hasWeakDomains) score += 15

  // Outdated results — easy to outrank with fresh content
  if (features.hasOutdatedResults) score += 20

  // Video results — mixed signals, slight opportunity for text
  if (features.hasVideoResults) score += 5

  // Average domain authority estimation via position gaps
  const positionGap = analyzePositionGap(results)
  if (positionGap > 2) score += 10
  if (positionGap > 4) score += 5

  // Diversity score — many different domains = competitive
  const domainDiversity = new Set(results.map((r) => r.domain)).size
  if (domainDiversity < 5) score += 5

  return Math.min(score, 100)
}

export function calculateOpportunityScore(
  serpWeaknessScore: number,
  volume: number | null,
  difficulty: number | null
): number {
  const weaknessWeight = serpWeaknessScore * 0.5
  const volumeScore = volume
    ? Math.min((Math.log10(Math.max(volume, 1)) / Math.log10(100000)) * 30, 30)
    : 15
  const difficultyPenalty = difficulty ? (difficulty / 100) * 20 : 10

  return Math.round(Math.min(weaknessWeight + volumeScore - difficultyPenalty + 10, 100))
}

export function estimateDifficulty(results: NormalizedSerpResult[]): number {
  const top5 = results.slice(0, 5)
  const strongDomains = ['wikipedia.org', 'youtube.com', 'amazon.com', 'forbes.com', 'nytimes.com']
  const strongCount = top5.filter((r) =>
    strongDomains.some((d) => r.domain.includes(d))
  ).length
  const forumCount = top5.filter((r) => r.type === 'forum').length
  const weakCount = top5.filter((r) =>
    WEAK_DOMAIN_PATTERNS.some((p) => r.domain.includes(p))
  ).length

  let difficulty = 40
  difficulty += strongCount * 15
  difficulty -= forumCount * 10
  difficulty -= weakCount * 8

  return Math.max(5, Math.min(95, difficulty))
}

function analyzePositionGap(results: NormalizedSerpResult[]): number {
  if (results.length < 2) return 0
  const positions = results.map((r) => r.position).filter(Boolean)
  if (positions.length < 2) return 0
  const gaps = positions.slice(1).map((p, i) => p - positions[i])
  return Math.max(...gaps)
}

export function detectIntent(
  keyword: string
): 'informational' | 'navigational' | 'commercial' | 'transactional' {
  const kw = keyword.toLowerCase()

  const transactionalPatterns = ['buy', 'purchase', 'order', 'price', 'discount', 'coupon', 'deal', 'shop']
  const commercialPatterns = ['best', 'top', 'review', 'vs', 'versus', 'compare', 'alternatives', 'cheapest']
  const navigationalPatterns = ['login', 'sign in', 'sign up', 'download', 'official', '.com', '.org']
  const informationalPatterns = ['how', 'what', 'why', 'when', 'where', 'guide', 'tutorial', 'tips', 'examples', 'learn']

  if (transactionalPatterns.some((p) => kw.includes(p))) return 'transactional'
  if (commercialPatterns.some((p) => kw.includes(p))) return 'commercial'
  if (navigationalPatterns.some((p) => kw.includes(p))) return 'navigational'
  if (informationalPatterns.some((p) => kw.includes(p))) return 'informational'

  return 'informational'
}
