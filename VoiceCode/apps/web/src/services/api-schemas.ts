/**
 * Zod Validation Schemas for API Boundaries
 * Validates external API responses at runtime to catch malformed data early.
 */

import { z } from 'zod';

// --- AIML API Response Schemas ---

export const STTWordSchema = z.object({
  word: z.string(),
  start: z.number(),
  end: z.number(),
  confidence: z.number().min(0).max(1),
});

export const STTSpeakerSchema = z.object({
  speaker: z.number(),
  text: z.string(),
  start: z.number(),
  end: z.number(),
});

export const STTEntitySchema = z.object({
  type: z.string(),
  text: z.string(),
  confidence: z.number().min(0).max(1),
});

export const STTResultSchema = z.object({
  transcript: z.string(),
  confidence: z.number().min(0).max(1),
  words: z.array(STTWordSchema).optional(),
  speakers: z.array(STTSpeakerSchema).optional(),
  entities: z.array(STTEntitySchema).optional(),
  sentiment: z
    .object({
      overall: z.string(),
      score: z.number(),
    })
    .optional(),
  summary: z.string().optional(),
});

export const STTCreateResponseSchema = z.object({
  generation_id: z.string(),
});

export const ChatChoiceSchema = z.object({
  message: z.object({
    role: z.enum(['system', 'user', 'assistant']),
    content: z.string(),
  }),
  finish_reason: z.string().optional(),
});

export const ChatResponseSchema = z.object({
  choices: z.array(ChatChoiceSchema).min(1),
  usage: z
    .object({
      prompt_tokens: z.number(),
      completion_tokens: z.number(),
      total_tokens: z.number(),
    })
    .optional(),
});

// --- Supabase Response Schemas ---

export const TranscriptSchema = z.object({
  id: z.string(),
  user_id: z.string(),
  title: z.string(),
  content: z.string(),
  language: z.string(),
  professional_mode: z.string(),
  duration: z.number(),
  word_count: z.number(),
  confidence: z.number(),
  speakers: z.array(z.unknown()).optional(),
  metadata: z.record(z.unknown()),
  created_at: z.string(),
  updated_at: z.string(),
  synced_at: z.string().nullable().optional(),
  is_deleted: z.boolean(),
});

export const UserProfileSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  full_name: z.string().optional(),
  avatar_url: z.string().url().optional().nullable(),
});

// --- Streaming Event Schemas ---

export const StreamingTranscriptEventSchema = z.object({
  text: z.string(),
  isFinal: z.boolean(),
});

export const StreamingErrorEventSchema = z.object({
  error: z.string().optional(),
});

// --- Auth Schemas ---

export const LoginInputSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export const SignupInputSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Must contain at least one number'),
  fullName: z.string().min(1, 'Name is required').max(100),
});

// --- Helper ---

/**
 * Safely parse an API response with a Zod schema.
 * Returns the parsed data on success, or throws a descriptive error.
 */
export function parseApiResponse<T>(schema: z.ZodSchema<T>, data: unknown, context: string): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    const issues = result.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ');
    throw new Error(`API validation failed (${context}): ${issues}`);
  }
  return result.data;
}
