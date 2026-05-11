import { LanguageMiningConfig } from './types'
import { en } from './en'
import { it } from './it'
import { es } from './es'
import { fr } from './fr'
import { de } from './de'
import { pt } from './pt'

const configs: Record<string, LanguageMiningConfig> = { en, it, es, fr, de, pt }

export function getMiningConfig(language: string): LanguageMiningConfig {
  const lang = language.slice(0, 2).toLowerCase()
  return configs[lang] ?? en
}

export type { LanguageMiningConfig }
