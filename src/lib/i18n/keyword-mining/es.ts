import { LanguageMiningConfig } from './types'

export const es: LanguageMiningConfig = {
  language: 'es',

  questionModifiers: ['cómo', 'como', 'cuándo', 'cuál', 'cuáles', 'cuánto', 'por qué', 'dónde', 'qué es', 'quién'],
  commercialModifiers: ['mejor', 'mejores', 'precio', 'precios', 'barato', 'barata', 'reseñas', 'opiniones', 'comprar', 'oferta', 'descuento', 'económico'],
  comparisonModifiers: ['vs', 'versus', 'comparativa', 'alternativas', 'diferencia entre', 'mejor o'],
  temporalModifiers: ['2025', '2026', 'hoy', 'actualizado', 'guía', 'nuevo', 'última versión'],
  audienceModifiers: ['para principiantes', 'para familias', 'para empresas', 'para niños', 'para mayores', 'hazlo tú mismo', 'profesional'],

  stopwords: new Set([
    'el', 'la', 'los', 'las', 'un', 'una', 'unos', 'unas',
    'de', 'del', 'al', 'en', 'con', 'para', 'por', 'sin',
    'sobre', 'entre', 'a', 'e', 'o', 'u', 'pero', 'mas',
    'que', 'quien', 'cual', 'cuyo', 'cuya', 'no', 'ni',
    'y', 'si', 'como', 'tanto', 'muy', 'más', 'menos',
    'se', 'me', 'te', 'nos', 'os', 'le', 'lo', 'les',
  ]),

  intentPatterns: {
    informational: [
      /^cómo?\s/i, /^qué\s/i, /^cuándo\s/i, /^por qué\s/i, /^dónde\s/i,
      /\bguía\b/i, /\btutorial\b/i, /\bexplicac/i, /\bsignifica\b/i,
      /\bdefinic/i, /\baprender\b/i, /\bconsejos\b/i,
    ],
    commercial: [
      /\bmejor(es)?\b/i, /\breseñ/i, /\bopinion/i, /\bvalorac/i,
      /\bprecio\b/i, /\bbarato/i, /\boferta\b/i, /\beconom/i,
      /\bdescuento\b/i,
    ],
    transactional: [
      /\bcompr/i, /\bpedir\b/i, /\bpedido\b/i, /\btienda\b/i,
      /\bcupón\b/i, /\bsuscrib/i,
    ],
    navigational: [
      /\bweb\b/i, /\boficial\b/i, /\bacceso\b/i, /\bdescargar\b/i,
      /\bapp\b/i, /\binstalar\b/i, /\biniciar sesión\b/i,
    ],
    comparison: [
      /\bvs\b/i, /\bversus\b/i, /\bcomparativ/i, /\balternativ/i,
      /\bdiferencia\b/i, /\bmejor\b.+\bo\b/i,
    ],
  },

  normalization: { removeAccents: false, collapseSpaces: true },

  minTokens: 2,
  maxTokens: 7,
}
