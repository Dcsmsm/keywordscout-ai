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

export const COUNTRY_LOCATION_CODES: Record<string, number> = {
  us: 2840, gb: 2826, it: 2380, es: 2724,
  fr: 2250, de: 2276, br: 2076, au: 2036,
  ca: 2124, mx: 2484,
}

export class DataForSEOProvider implements SearchProvider {
  name = 'dataforseo'
  private login: string
  private password: string
  private baseUrl = 'https://api.dataforseo.com/v3'

  constructor(login: string, password: string) {
    this.login = login
    this.password = password
  }

  async getKeywordIdeas(seed: string, options?: KeywordOptions): Promise<KeywordIdea[]> {
    const data = await this.fetchApi('/keywords_data/google_ads/search_volume/live', [
      { keywords: [seed], location_code: 2840, language_code: options?.language ?? 'en' },
    ])

    const tasks = (data.tasks as Array<{ result?: Array<{ keyword: string; search_volume: number; cpc: number; competition: number }> }>) ?? []
    const results: KeywordIdea[] = []

    for (const task of tasks) {
      for (const item of task.result ?? []) {
        results.push({
          keyword: item.keyword,
          volume: item.search_volume,
          cpc: item.cpc,
          competition: item.competition,
          intent: 'informational',
        })
      }
    }

    return results.slice(0, options?.limit ?? 10)
  }

  async getSerpAnalysis(keyword: string, options?: SerpOptions): Promise<SerpAnalysis> {
    const data = await this.fetchApi('/serp/google/organic/live/regular', [
      { keyword, location_code: 2840, language_code: options?.language ?? 'en', device: options?.device ?? 'desktop', depth: 10 },
    ])

    const tasks = (data.tasks as Array<{ result?: Array<{ items?: Array<Record<string, unknown>>; se_results_count?: number }> }>) ?? []
    const taskResult = tasks[0]?.result?.[0]
    const items = taskResult?.items ?? []

    const results = items
      .filter((item) => item['type'] === 'organic')
      .map((item) =>
        normalizeSerpResult({
          position: item['rank_absolute'] as number,
          title: item['title'] as string,
          link: item['url'] as string,
          snippet: item['description'] as string | undefined,
        })
      )

    const paa: string[] = items
      .filter((item) => item['type'] === 'people_also_ask')
      .map((item) => item['title'] as string)

    const related: string[] = items
      .filter((item) => item['type'] === 'related_searches')
      .flatMap((item) => ((item['items'] as Array<{ title: string }>) ?? []).map((r) => r.title))

    return {
      keyword,
      results,
      peopleAlsoAsk: paa,
      relatedSearches: related,
      totalResults: taskResult?.se_results_count,
    }
  }

  async getKeywordVolumes(
    keywords: string[],
    country: string,
    language: string,
  ): Promise<Record<string, number>> {
    if (!keywords.length) return {}
    const locationCode = COUNTRY_LOCATION_CODES[country.toLowerCase()] ?? 2840
    const data = await this.fetchApi('/keywords_data/google_ads/search_volume/live', [
      { keywords, location_code: locationCode, language_code: language },
    ])
    const tasks = (data.tasks as Array<{ result?: Array<{ keyword: string; search_volume: number }> }>) ?? []
    const map: Record<string, number> = {}
    for (const task of tasks) {
      for (const item of task.result ?? []) {
        if (item.keyword && item.search_volume != null) {
          map[item.keyword] = item.search_volume
        }
      }
    }
    return map
  }

  async getAutocomplete(seed: string): Promise<string[]> {
    const data = await this.fetchApi('/serp/google/autocomplete/live/advanced', [{ keyword: seed }])
    const tasks = (data.tasks as Array<{ result?: Array<{ items?: Array<{ suggestion: string }> }> }>) ?? []
    return tasks[0]?.result?.[0]?.items?.map((i) => i.suggestion) ?? []
  }

  async getRelatedSearches(keyword: string): Promise<string[]> {
    const analysis = await this.getSerpAnalysis(keyword)
    return analysis.relatedSearches ?? []
  }

  async getPeopleAlsoAsk(keyword: string): Promise<Question[]> {
    const analysis = await this.getSerpAnalysis(keyword)
    return (analysis.peopleAlsoAsk ?? []).map((q) => ({ question: q }))
  }

  private async fetchApi(path: string, body: unknown[]): Promise<Record<string, unknown>> {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), API_TIMEOUT_MS)
    const credentials = Buffer.from(`${this.login}:${this.password}`).toString('base64')

    try {
      const response = await globalThis.fetch(`${this.baseUrl}${path}`, {
        method: 'POST',
        headers: { Authorization: `Basic ${credentials}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: controller.signal,
      })
      if (!response.ok) throw new Error(`DataForSEO error: ${response.status}`)
      return response.json()
    } finally {
      clearTimeout(timeout)
    }
  }
}
