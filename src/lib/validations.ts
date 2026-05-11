import { z } from 'zod'

export const analyzeKeywordSchema = z.object({
  keyword: z
    .string()
    .min(1, 'Keyword is required')
    .max(200, 'Keyword too long')
    .trim(),
  country: z.string().length(2).optional().default('us'),
  language: z.string().min(2).max(5).optional().default('en'),
  miningDepth: z.union([z.literal(1), z.literal(2), z.literal(3)]).optional().default(2),
  maxSuggestions: z.number().int().min(10).max(100).optional().default(50),
})

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

export const signupSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  fullName: z.string().min(2, 'Name must be at least 2 characters').optional(),
})

export const providerTestSchema = z.object({
  providerKey: z.enum(['serpapi', 'serper', 'dataforseo', 'mock']),
  query: z.string().min(1).max(200),
})

export const providerSwitchSchema = z.object({
  providerId: z.string().uuid(),
  setAsFallback: z.boolean().optional().default(false),
})

export type AnalyzeKeywordInput = z.infer<typeof analyzeKeywordSchema>
export type LoginInput = z.infer<typeof loginSchema>
export type SignupInput = z.infer<typeof signupSchema>
export type ProviderTestInput = z.infer<typeof providerTestSchema>
export type ProviderSwitchInput = z.infer<typeof providerSwitchSchema>
