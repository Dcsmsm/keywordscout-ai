/**
 * Score how semantically relevant a candidate keyword is to the seed.
 * Pure text heuristics — no external calls. Returns 0–1.
 */
export function scoreRelevance(candidate: string, seed: string): number {
  const seedLower = seed.toLowerCase()
  const candidateLower = candidate.toLowerCase()
  const seedTokens = seedLower.split(/\s+/)
  const candidateTokens = candidateLower.split(/\s+/)

  if (!candidateTokens.length) return 0

  // For short seeds (≤4 chars, likely acronyms like "PAC", "SEO") require whole-word match.
  // Without this, "pac" would match "pacchetto", "pace", "pacchi" etc.
  if (seed.length <= 4) {
    const escaped = seedLower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const wordBoundary = new RegExp(`\\b${escaped}\\b`, 'i')
    if (!wordBoundary.test(candidateLower)) return 0
  }

  // Exact seed containment (whole-word already verified for short seeds above)
  if (candidateLower.includes(seedLower)) {
    const extraTokens = candidateTokens.length - seedTokens.length
    return Math.max(0.7, 1 - extraTokens * 0.05)
  }

  // Token overlap ratio
  const seedSet = new Set(seedTokens)
  const overlap = candidateTokens.filter((t) => seedSet.has(t)).length
  const overlapRatio = overlap / Math.max(seedTokens.length, candidateTokens.length)

  // Penalty for very long candidates
  const lengthPenalty = Math.max(0, 1 - (candidateTokens.length - seedTokens.length - 2) * 0.1)

  return Math.min(1, overlapRatio * lengthPenalty)
}
