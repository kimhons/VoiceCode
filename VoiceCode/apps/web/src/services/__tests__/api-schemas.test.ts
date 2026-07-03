import { describe, it, expect } from 'vitest';
import {
  STTWordSchema,
  STTSpeakerSchema,
  STTEntitySchema,
  STTResultSchema,
  STTCreateResponseSchema,
  ChatChoiceSchema,
  ChatResponseSchema,
  TranscriptSchema,
  UserProfileSchema,
  StreamingTranscriptEventSchema,
  StreamingErrorEventSchema,
  LoginInputSchema,
  SignupInputSchema,
  parseApiResponse,
} from '../api-schemas';

// ---------------------------------------------------------------------------
// STTWordSchema
// ---------------------------------------------------------------------------
describe('STTWordSchema', () => {
  it('accepts a valid word object', () => {
    const valid = { word: 'hello', start: 0.0, end: 0.5, confidence: 0.95 };
    expect(STTWordSchema.parse(valid)).toEqual(valid);
  });

  it('rejects confidence below 0', () => {
    const result = STTWordSchema.safeParse({ word: 'a', start: 0, end: 1, confidence: -0.1 });
    expect(result.success).toBe(false);
  });

  it('rejects confidence above 1', () => {
    const result = STTWordSchema.safeParse({ word: 'a', start: 0, end: 1, confidence: 1.01 });
    expect(result.success).toBe(false);
  });

  it('accepts boundary confidence values 0 and 1', () => {
    expect(STTWordSchema.parse({ word: 'a', start: 0, end: 1, confidence: 0 })).toBeDefined();
    expect(STTWordSchema.parse({ word: 'a', start: 0, end: 1, confidence: 1 })).toBeDefined();
  });

  it('rejects missing required fields', () => {
    expect(STTWordSchema.safeParse({ word: 'a', start: 0 }).success).toBe(false);
    expect(STTWordSchema.safeParse({}).success).toBe(false);
  });

  it('rejects wrong types', () => {
    expect(STTWordSchema.safeParse({ word: 123, start: 0, end: 1, confidence: 0.5 }).success).toBe(false);
    expect(STTWordSchema.safeParse({ word: 'a', start: 'zero', end: 1, confidence: 0.5 }).success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// STTSpeakerSchema
// ---------------------------------------------------------------------------
describe('STTSpeakerSchema', () => {
  it('accepts valid speaker data', () => {
    const valid = { speaker: 0, text: 'hello world', start: 0.0, end: 2.5 };
    expect(STTSpeakerSchema.parse(valid)).toEqual(valid);
  });

  it('rejects non-numeric speaker', () => {
    expect(STTSpeakerSchema.safeParse({ speaker: 'one', text: 'hi', start: 0, end: 1 }).success).toBe(false);
  });

  it('rejects missing text', () => {
    expect(STTSpeakerSchema.safeParse({ speaker: 0, start: 0, end: 1 }).success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// STTEntitySchema
// ---------------------------------------------------------------------------
describe('STTEntitySchema', () => {
  it('accepts valid entity', () => {
    const valid = { type: 'PERSON', text: 'Alice', confidence: 0.99 };
    expect(STTEntitySchema.parse(valid)).toEqual(valid);
  });

  it('rejects confidence out of range', () => {
    expect(STTEntitySchema.safeParse({ type: 'LOC', text: 'NYC', confidence: 1.5 }).success).toBe(false);
    expect(STTEntitySchema.safeParse({ type: 'LOC', text: 'NYC', confidence: -1 }).success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// STTResultSchema
// ---------------------------------------------------------------------------
describe('STTResultSchema', () => {
  it('accepts minimal valid result (transcript + confidence only)', () => {
    const minimal = { transcript: 'Hello world', confidence: 0.92 };
    const parsed = STTResultSchema.parse(minimal);
    expect(parsed.transcript).toBe('Hello world');
    expect(parsed.confidence).toBe(0.92);
    expect(parsed.words).toBeUndefined();
    expect(parsed.speakers).toBeUndefined();
    expect(parsed.entities).toBeUndefined();
    expect(parsed.sentiment).toBeUndefined();
    expect(parsed.summary).toBeUndefined();
  });

  it('accepts full result with all optional fields', () => {
    const full = {
      transcript: 'Hello world',
      confidence: 0.92,
      words: [{ word: 'Hello', start: 0, end: 0.3, confidence: 0.95 }],
      speakers: [{ speaker: 0, text: 'Hello world', start: 0, end: 1 }],
      entities: [{ type: 'GREETING', text: 'Hello', confidence: 0.8 }],
      sentiment: { overall: 'positive', score: 0.7 },
      summary: 'A greeting.',
    };
    const parsed = STTResultSchema.parse(full);
    expect(parsed.words).toHaveLength(1);
    expect(parsed.speakers).toHaveLength(1);
    expect(parsed.entities).toHaveLength(1);
    expect(parsed.sentiment?.overall).toBe('positive');
    expect(parsed.summary).toBe('A greeting.');
  });

  it('rejects missing transcript', () => {
    expect(STTResultSchema.safeParse({ confidence: 0.9 }).success).toBe(false);
  });

  it('rejects invalid nested word in words array', () => {
    const bad = {
      transcript: 'test',
      confidence: 0.5,
      words: [{ word: 'test', start: 0, end: 1 }], // missing confidence
    };
    expect(STTResultSchema.safeParse(bad).success).toBe(false);
  });

  it('accepts empty arrays for optional array fields', () => {
    const data = { transcript: 'hi', confidence: 0.5, words: [], speakers: [], entities: [] };
    const parsed = STTResultSchema.parse(data);
    expect(parsed.words).toEqual([]);
    expect(parsed.speakers).toEqual([]);
    expect(parsed.entities).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// STTCreateResponseSchema
// ---------------------------------------------------------------------------
describe('STTCreateResponseSchema', () => {
  it('accepts valid generation_id', () => {
    const data = { generation_id: 'gen_abc123' };
    expect(STTCreateResponseSchema.parse(data)).toEqual(data);
  });

  it('rejects missing generation_id', () => {
    expect(STTCreateResponseSchema.safeParse({}).success).toBe(false);
  });

  it('rejects non-string generation_id', () => {
    expect(STTCreateResponseSchema.safeParse({ generation_id: 42 }).success).toBe(false);
  });

  it('accepts empty string generation_id', () => {
    // Empty string is still a valid string per the schema
    expect(STTCreateResponseSchema.parse({ generation_id: '' })).toEqual({ generation_id: '' });
  });
});

// ---------------------------------------------------------------------------
// ChatChoiceSchema & ChatResponseSchema
// ---------------------------------------------------------------------------
describe('ChatChoiceSchema', () => {
  it('accepts valid choice with all roles', () => {
    for (const role of ['system', 'user', 'assistant'] as const) {
      const choice = { message: { role, content: 'hi' } };
      expect(ChatChoiceSchema.parse(choice).message.role).toBe(role);
    }
  });

  it('rejects invalid role', () => {
    const bad = { message: { role: 'tool', content: 'hi' } };
    expect(ChatChoiceSchema.safeParse(bad).success).toBe(false);
  });

  it('accepts optional finish_reason', () => {
    const withReason = { message: { role: 'assistant', content: 'hi' }, finish_reason: 'stop' };
    expect(ChatChoiceSchema.parse(withReason).finish_reason).toBe('stop');

    const withoutReason = { message: { role: 'assistant', content: 'hi' } };
    expect(ChatChoiceSchema.parse(withoutReason).finish_reason).toBeUndefined();
  });
});

describe('ChatResponseSchema', () => {
  it('accepts valid response with one choice', () => {
    const data = {
      choices: [{ message: { role: 'assistant', content: 'Hello!' } }],
    };
    const parsed = ChatResponseSchema.parse(data);
    expect(parsed.choices).toHaveLength(1);
    expect(parsed.usage).toBeUndefined();
  });

  it('accepts response with usage', () => {
    const data = {
      choices: [{ message: { role: 'assistant', content: 'Hi' } }],
      usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 },
    };
    const parsed = ChatResponseSchema.parse(data);
    expect(parsed.usage?.total_tokens).toBe(15);
  });

  it('rejects empty choices array (min 1)', () => {
    const data = { choices: [] };
    expect(ChatResponseSchema.safeParse(data).success).toBe(false);
  });

  it('rejects missing choices entirely', () => {
    expect(ChatResponseSchema.safeParse({}).success).toBe(false);
  });

  it('rejects usage with missing fields', () => {
    const data = {
      choices: [{ message: { role: 'assistant', content: 'Hi' } }],
      usage: { prompt_tokens: 10 }, // missing completion_tokens, total_tokens
    };
    expect(ChatResponseSchema.safeParse(data).success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// TranscriptSchema
// ---------------------------------------------------------------------------
describe('TranscriptSchema', () => {
  const validTranscript = {
    id: 'uuid-1234',
    user_id: 'user-5678',
    title: 'Meeting Notes',
    content: 'We discussed the roadmap.',
    language: 'en',
    professional_mode: 'general',
    duration: 120.5,
    word_count: 5,
    confidence: 0.88,
    metadata: {},
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T01:00:00Z',
    is_deleted: false,
  };

  it('accepts a valid transcript with required fields only', () => {
    const parsed = TranscriptSchema.parse(validTranscript);
    expect(parsed.id).toBe('uuid-1234');
    expect(parsed.speakers).toBeUndefined();
    expect(parsed.synced_at).toBeUndefined();
  });

  it('accepts transcript with optional speakers and synced_at', () => {
    const full = {
      ...validTranscript,
      speakers: [{ name: 'Alice' }, { name: 'Bob' }],
      synced_at: '2025-01-01T02:00:00Z',
    };
    const parsed = TranscriptSchema.parse(full);
    expect(parsed.speakers).toHaveLength(2);
    expect(parsed.synced_at).toBe('2025-01-01T02:00:00Z');
  });

  it('accepts null synced_at', () => {
    const data = { ...validTranscript, synced_at: null };
    const parsed = TranscriptSchema.parse(data);
    expect(parsed.synced_at).toBeNull();
  });

  it('accepts metadata with arbitrary keys', () => {
    const data = { ...validTranscript, metadata: { source: 'mic', format: 'wav', nested: { a: 1 } } };
    const parsed = TranscriptSchema.parse(data);
    expect(parsed.metadata).toEqual({ source: 'mic', format: 'wav', nested: { a: 1 } });
  });

  it('rejects missing required fields', () => {
    const { id: _id, ...noId } = validTranscript;
    expect(TranscriptSchema.safeParse(noId).success).toBe(false);

    const { content: _content, ...noContent } = validTranscript;
    expect(TranscriptSchema.safeParse(noContent).success).toBe(false);
  });

  it('rejects non-boolean is_deleted', () => {
    expect(TranscriptSchema.safeParse({ ...validTranscript, is_deleted: 'false' }).success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// UserProfileSchema
// ---------------------------------------------------------------------------
describe('UserProfileSchema', () => {
  it('accepts valid profile with required fields only', () => {
    const data = { id: 'user-1', email: 'test@example.com' };
    const parsed = UserProfileSchema.parse(data);
    expect(parsed.full_name).toBeUndefined();
    expect(parsed.avatar_url).toBeUndefined();
  });

  it('accepts full profile with all optional fields', () => {
    const data = {
      id: 'user-1',
      email: 'test@example.com',
      full_name: 'Alice Smith',
      avatar_url: 'https://example.com/avatar.png',
    };
    const parsed = UserProfileSchema.parse(data);
    expect(parsed.full_name).toBe('Alice Smith');
    expect(parsed.avatar_url).toBe('https://example.com/avatar.png');
  });

  it('accepts null avatar_url', () => {
    const data = { id: 'user-1', email: 'test@example.com', avatar_url: null };
    const parsed = UserProfileSchema.parse(data);
    expect(parsed.avatar_url).toBeNull();
  });

  it('rejects invalid email', () => {
    expect(UserProfileSchema.safeParse({ id: 'u1', email: 'not-an-email' }).success).toBe(false);
    expect(UserProfileSchema.safeParse({ id: 'u1', email: '' }).success).toBe(false);
  });

  it('rejects invalid avatar_url (not a URL)', () => {
    expect(
      UserProfileSchema.safeParse({ id: 'u1', email: 'a@b.com', avatar_url: 'not-a-url' }).success
    ).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// StreamingTranscriptEventSchema
// ---------------------------------------------------------------------------
describe('StreamingTranscriptEventSchema', () => {
  it('accepts valid streaming event', () => {
    const data = { text: 'hello', isFinal: false };
    expect(StreamingTranscriptEventSchema.parse(data)).toEqual(data);
  });

  it('accepts final event', () => {
    const data = { text: 'done', isFinal: true };
    expect(StreamingTranscriptEventSchema.parse(data).isFinal).toBe(true);
  });

  it('rejects missing isFinal', () => {
    expect(StreamingTranscriptEventSchema.safeParse({ text: 'hello' }).success).toBe(false);
  });

  it('accepts empty string text', () => {
    expect(StreamingTranscriptEventSchema.parse({ text: '', isFinal: false }).text).toBe('');
  });
});

// ---------------------------------------------------------------------------
// StreamingErrorEventSchema
// ---------------------------------------------------------------------------
describe('StreamingErrorEventSchema', () => {
  it('accepts event with error string', () => {
    const data = { error: 'Connection lost' };
    expect(StreamingErrorEventSchema.parse(data)).toEqual(data);
  });

  it('accepts event without error (error is optional)', () => {
    const parsed = StreamingErrorEventSchema.parse({});
    expect(parsed.error).toBeUndefined();
  });

  it('rejects non-string error', () => {
    expect(StreamingErrorEventSchema.safeParse({ error: 42 }).success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// LoginInputSchema
// ---------------------------------------------------------------------------
describe('LoginInputSchema', () => {
  it('accepts valid login credentials', () => {
    const data = { email: 'user@example.com', password: 'password123' };
    expect(LoginInputSchema.parse(data)).toEqual(data);
  });

  it('rejects invalid email', () => {
    const result = LoginInputSchema.safeParse({ email: 'bad-email', password: 'password123' });
    expect(result.success).toBe(false);
    if (!result.success) {
      const emailIssue = result.error.issues.find((i) => i.path.includes('email'));
      expect(emailIssue?.message).toBe('Invalid email address');
    }
  });

  it('rejects password shorter than 8 characters', () => {
    const result = LoginInputSchema.safeParse({ email: 'a@b.com', password: 'short' });
    expect(result.success).toBe(false);
    if (!result.success) {
      const pwIssue = result.error.issues.find((i) => i.path.includes('password'));
      expect(pwIssue?.message).toBe('Password must be at least 8 characters');
    }
  });

  it('accepts exactly 8 character password', () => {
    expect(LoginInputSchema.parse({ email: 'a@b.com', password: '12345678' })).toBeDefined();
  });

  it('rejects empty email', () => {
    expect(LoginInputSchema.safeParse({ email: '', password: '12345678' }).success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// SignupInputSchema
// ---------------------------------------------------------------------------
describe('SignupInputSchema', () => {
  it('accepts valid signup data', () => {
    const data = { email: 'user@example.com', password: 'Password1', fullName: 'Alice' };
    expect(SignupInputSchema.parse(data)).toEqual(data);
  });

  it('rejects password without uppercase letter', () => {
    const result = SignupInputSchema.safeParse({
      email: 'a@b.com',
      password: 'password1',
      fullName: 'Alice',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const msgs = result.error.issues.map((i) => i.message);
      expect(msgs).toContain('Must contain at least one uppercase letter');
    }
  });

  it('rejects password without a number', () => {
    const result = SignupInputSchema.safeParse({
      email: 'a@b.com',
      password: 'Passwordd',
      fullName: 'Alice',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const msgs = result.error.issues.map((i) => i.message);
      expect(msgs).toContain('Must contain at least one number');
    }
  });

  it('rejects empty fullName', () => {
    const result = SignupInputSchema.safeParse({
      email: 'a@b.com',
      password: 'Password1',
      fullName: '',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const nameIssue = result.error.issues.find((i) => i.path.includes('fullName'));
      expect(nameIssue?.message).toBe('Name is required');
    }
  });

  it('rejects fullName over 100 characters', () => {
    const result = SignupInputSchema.safeParse({
      email: 'a@b.com',
      password: 'Password1',
      fullName: 'A'.repeat(101),
    });
    expect(result.success).toBe(false);
  });

  it('accepts fullName of exactly 100 characters', () => {
    expect(
      SignupInputSchema.parse({
        email: 'a@b.com',
        password: 'Password1',
        fullName: 'A'.repeat(100),
      })
    ).toBeDefined();
  });

  it('rejects password that is too short even with uppercase and number', () => {
    const result = SignupInputSchema.safeParse({
      email: 'a@b.com',
      password: 'Ab1',
      fullName: 'Alice',
    });
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// parseApiResponse helper
// ---------------------------------------------------------------------------
describe('parseApiResponse', () => {
  it('returns parsed data on valid input', () => {
    const data = { generation_id: 'gen_123' };
    const result = parseApiResponse(STTCreateResponseSchema, data, 'stt-create');
    expect(result).toEqual(data);
  });

  it('throws descriptive error on invalid input', () => {
    expect(() => parseApiResponse(STTCreateResponseSchema, {}, 'stt-create')).toThrowError(
      /API validation failed \(stt-create\)/
    );
  });

  it('includes field path in error message', () => {
    try {
      parseApiResponse(STTCreateResponseSchema, {}, 'stt-create');
    } catch (e) {
      expect((e as Error).message).toContain('generation_id');
    }
  });

  it('includes context string in error message', () => {
    try {
      parseApiResponse(UserProfileSchema, { id: 'x', email: 'bad' }, 'user-profile');
    } catch (e) {
      expect((e as Error).message).toContain('user-profile');
    }
  });

  it('works with complex nested schemas', () => {
    const data = {
      choices: [{ message: { role: 'assistant', content: 'Hello' } }],
      usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 },
    };
    const result = parseApiResponse(ChatResponseSchema, data, 'chat');
    expect(result.choices[0].message.content).toBe('Hello');
  });

  it('throws on null input', () => {
    expect(() => parseApiResponse(STTCreateResponseSchema, null, 'null-test')).toThrowError(
      /API validation failed/
    );
  });

  it('throws on undefined input', () => {
    expect(() => parseApiResponse(STTCreateResponseSchema, undefined, 'undef-test')).toThrowError(
      /API validation failed/
    );
  });

  it('joins multiple validation issues with semicolons', () => {
    // LoginInputSchema requires valid email AND password >= 8 chars
    try {
      parseApiResponse(LoginInputSchema, { email: 'bad', password: 'x' }, 'login');
    } catch (e) {
      const msg = (e as Error).message;
      expect(msg).toContain(';'); // multiple issues joined
      expect(msg).toContain('email');
      expect(msg).toContain('password');
    }
  });
});
