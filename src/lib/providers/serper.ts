import {
  SearchProvider,
  KeywordIdea,
  SerpAnalysis,
  KeywordOptions,
  SerpOptions,
  Question,
} from '@/types/providers'
import { normalizeSerpResult } from './normalizer'
import { API_TIMEOUT_MS } from '@/lib/constants'

export class SerperProvider implements SearchProvider {
  name = 'serper'
  private apiKey: string
  private baseUrl = 'https://google.serper.dev'

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  async getKeywordIdeas(seed: string, options?: KeywordOptions): Promise<KeywordIdea[]> {
    const data = await this.fetchApi('/search', {
      q: seed,
      gl: options?.country ?? 'us',
      hl: options?.language ?? 'en',
      num: options?.limit ?? 10,
    })

    const suggestions: KeywordIdea[] = []
    const relatedSearches = (data.relatedSearches as Array<{ query: string }> | undefined) ?? []
    const autocomplete = (data.autocomplete as Array<{ value: string }> | undefined) ?? []

    for (const r of relatedSearches) {
      suggestions.push({ keyword: r.query, intent: 'informational' as const })
    }
    for (const a of autocomplete) {
      if (!suggestions.find((s) => s.keyword === a.value)) {
        suggestions.push({ keyword: a.value, intent: 'informational' as const })
      }
    }

    return suggestions.slice(0, options?.limit ?? 10)
  }

  async getSerpAnalysis(keyword: string, options?: SerpOptions): Promise<SerpAnalysis> {
    const data = await this.fetchApi('/search', {
      q: keyword,
      gl: options?.country ?? 'us',
      hl: options?.language ?? 'en',
      device: options?.device ?? 'desktop',
      num: 10,
    })

    const organic = (data.organic as Array<{ position?: number; title: string; link: string; snippet?: string }> | undefined) ?? []
    const results = organic.map((r, i) =>
      normalizeSerpResult({ ...r, position: r.position ?? i + 1 })
    )

    const paa: string[] = ((data.peopleAlsoAsk as Array<{ question: string }> | undefined) ?? []).map((q) => q.question)
    const related: string[] = ((data.relatedSearches as Array<{ query: string }> | undefined) ?? []).map((r) => r.query)

    return { keyword, results, peopleAlsoAsk: paa, relatedSearches: related }
  }

  async getAutocomplete(seed: string): Promise<string[]> {
    const data = await this.fetchApi('/autocomplete', { q: seed })
    return ((data.suggestions as Array<{ value: string }> | undefined) ?? []).map((s) => s.value)
  }

  async getRelatedSearches(keyword: string): Promise<string[]> {
    const analysis = await this.getSerpAnalysis(keyword)
    return analysis.relatedSearches ?? []
  }

  async getPeopleAlsoAsk(keyword: string): Promise<Question[]> {
    const analysis = await this.getSerpAnalysis(keyword)
    return (analysis.peopleAlsoAsk ?? []).map((q) => ({ question: q }))
  }

  private async fetchApi(path: string, body: Record<string, unknown>): Promise<Record<string, unknown>> {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), API_TIMEOUT_MS)
    try {
      const response = await globalThis.fetch(`${this.baseUrl}${path}`, {
        method: 'POST',
        headers: { 'X-API-KEY': this.apiKey, 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: controller.signal,
      })
      if (!response.ok) throw new Error(`Serper error: ${response.status}`)
      return response.json()
    } finally {
      clearTimeout(timeout)
    }
  }
}
