import { LanguageMiningConfig } from '@/lib/i18n/keyword-mining'

export function normalizeKeyword(kw: string, config: LanguageMiningConfig): string {
  let s = kw.trim().toLowerCase()

  if (config.normalization.collapseSpaces) {
    s = s.replace(/\s+/g, ' ')
  }

  if (config.normalization.removeAccents) {
    s = s.normalize('NFD').replace(/[̀-ͯ]/g, '')
  }

  return s
}

export function tokenCount(kw: string): number {
  return kw.trim().split(/\s+/).length
}
