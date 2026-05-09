import { NormalizedSerpResult, NormalizedResultType } from '@/types/providers'
import { FORUM_PATTERNS } from '@/lib/constants'

export function classifyUrl(url: string): NormalizedResultType {
  const lower = url.toLowerCase()

  if (lower.includes('reddit.com') || lower.includes('quora.com')) return 'forum'
  if (FORUM_PATTERNS.some((p) => lower.includes(p))) return 'forum'
  if (
    lower.includes('youtube.com') ||
    lower.includes('vimeo.com') ||
    lower.includes('/video/')
  )
    return 'video'
  if (
    lower.includes('news.') ||
    lower.includes('/news/') ||
    lower.includes('cnn.com') ||
    lower.includes('bbc.com') ||
    lower.includes('reuters.com')
  )
    return 'news'

  return 'organic'
}

export function extractDomain(url: string): string {
  try {
    const { hostname } = new URL(url)
    return hostname.replace(/^www\./, '')
  } catch {
    return url
  }
}

export function normalizeSerpResult(raw: {
  position: number
  title: string
  link: string
  snippet?: string
}): NormalizedSerpResult {
  return {
    position: raw.position,
    title: raw.title,
    url: raw.link,
    domain: extractDomain(raw.link),
    snippet: raw.snippet,
    type: classifyUrl(raw.link),
  }
}
