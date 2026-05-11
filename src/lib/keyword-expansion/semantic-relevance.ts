/**
 * Score how semantically relevant a candidate keyword is to the seed.
 * Pure text heuristics — no external calls. Returns 0–1.
 */
export function scoreRelevance(candidate: string, seed: string): number {
  const seedTokens = seed.toLowerCase().split(/\s+/)
  const candidateTokens = candidate.toLowerCase().split(/\s+/)

  if (!candidateTokens.length) return 0

  // Exact seed containment
  if (candidate.toLowerCase().includes(seed.toLowerCase())) {
    // Bonus for exact match, scaled by how much extra content there is
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
