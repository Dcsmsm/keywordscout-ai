export interface LanguageMiningConfig {
  language: string

  /** Placed before the seed: "come {seed}", "how {seed}" */
  questionModifiers: string[]
  /** Appended after the seed: "{seed} costo", "{seed} reviews" */
  commercialModifiers: string[]
  comparisonModifiers: string[]
  temporalModifiers: string[]
  audienceModifiers: string[]

  stopwords: Set<string>

  intentPatterns: {
    informational: RegExp[]
    commercial: RegExp[]
    transactional: RegExp[]
    navigational: RegExp[]
    comparison: RegExp[]
  }

  normalization: {
    removeAccents: boolean
    collapseSpaces: boolean
  }

  /** Min/max token count for a valid long-tail */
  minTokens: number
  maxTokens: number
}
