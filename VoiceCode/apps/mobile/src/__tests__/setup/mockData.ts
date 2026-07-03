// VoiceCode Mobile - Mock Data for Testing
// Comprehensive mock data for all test scenarios

// Using inline types since the types module may not have all exports yet

/**
 * Mock Users
 */
export const mockUsers = {
  standard: {
    id: 'user-1',
    email: 'user@example.com',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    subscription_tier: 'free',
    subscription_status: 'active',
  },
  pro: {
    id: 'user-2',
    email: 'pro@example.com',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    subscription_tier: 'pro',
    subscription_status: 'active',
  },
  enterprise: {
    id: 'user-3',
    email: 'enterprise@example.com',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    subscription_tier: 'enterprise',
    subscription_status: 'active',
  },
};

/**
 * Mock Transcripts
 */
export const mockTranscripts = [
  {
    id: 'transcript-1',
    user_id: 'user-1',
    title: 'Team Meeting Notes',
    content: 'This is the transcript of our team meeting discussing project updates.',
    duration: 1800,
    audio_url: 'https://example.com/audio1.m4a',
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-15T10:30:00Z',
    tags: ['meeting', 'team'],
    folder_id: 'folder-1',
  },
  {
    id: 'transcript-2',
    user_id: 'user-1',
    title: 'Interview with John',
    content: 'Interview transcript with candidate John Smith for the developer position.',
    duration: 2400,
    audio_url: 'https://example.com/audio2.m4a',
    created_at: '2024-01-16T14:00:00Z',
    updated_at: '2024-01-16T14:40:00Z',
    tags: ['interview', 'hiring'],
    folder_id: 'folder-2',
  },
  {
    id: 'transcript-3',
    user_id: 'user-1',
    title: 'Brainstorming Session',
    content: 'Creative brainstorming session for new product features.',
    duration: 3600,
    audio_url: 'https://example.com/audio3.m4a',
    created_at: '2024-01-17T09:00:00Z',
    updated_at: '2024-01-17T10:00:00Z',
    tags: ['brainstorming', 'product'],
    folder_id: 'folder-1',
  },
];

/**
 * Mock Tags
 */
export const mockTags = [
  {
    id: 'tag-1',
    user_id: 'user-1',
    name: 'meeting',
    color: '#3b82f6',
    usage_count: 15,
    created_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 'tag-2',
    user_id: 'user-1',
    name: 'interview',
    color: '#10b981',
    usage_count: 8,
    created_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 'tag-3',
    user_id: 'user-1',
    name: 'brainstorming',
    color: '#f59e0b',
    usage_count: 12,
    created_at: '2024-01-01T00:00:00Z',
  },
];

/**
 * Mock Folders
 */
export const mockFolders = [
  {
    id: 'folder-1',
    user_id: 'user-1',
    name: 'Work',
    color: '#3b82f6',
    transcript_count: 25,
    created_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 'folder-2',
    user_id: 'user-1',
    name: 'Personal',
    color: '#10b981',
    transcript_count: 10,
    created_at: '2024-01-01T00:00:00Z',
  },
];

/**
 * Mock Speaker Profiles
 */
export const mockSpeakers = [
  {
    id: 'speaker-1',
    name: 'John Smith',
    role: 'CEO',
    email: 'john@company.com',
    organization: 'Tech Corp',
    color: '#667eea',
    voiceSignature: {
      pitch: 120,
      pitchRange: { min: 100, max: 140 },
      tempo: 145,
      volume: 65,
      timbre: [0.8, 0.6, 0.4, 0.3, 0.2],
      confidence: 92,
    },
    statistics: {
      totalSpeakingTime: 3600,
      totalWords: 8700,
      averageWordsPerMinute: 145,
      totalSegments: 45,
      totalRecordings: 12,
      interruptions: 3,
      longestSegment: 180,
      averageSegmentLength: 80,
      lastActive: new Date(),
    },
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date(),
    lastSeenAt: new Date(),
    tags: ['executive', 'frequent'],
  },
];

/**
 * Mock AI Models
 */
export const mockAIModels = [
  {
    id: 'model-1',
    name: 'Whisper Large V3',
    provider: 'OpenAI',
    type: 'speech-to-text',
    accuracy: 95,
    speed: 'fast',
    cost: 'low',
    languages: ['en', 'es', 'fr', 'de'],
  },
  {
    id: 'model-2',
    name: 'GPT-4',
    provider: 'OpenAI',
    type: 'language-model',
    accuracy: 98,
    speed: 'medium',
    cost: 'high',
    languages: ['en'],
  },
];

/**
 * Mock Analytics Data
 */
export const mockAnalytics = {
  productivity: {
    score: 85,
    trend: 'up',
    focusTime: 240,
    transcriptionsCompleted: 15,
    averageAccuracy: 94,
  },
  usage: {
    totalRecordings: 120,
    totalDuration: 86400,
    averageDuration: 720,
    mostUsedTags: ['meeting', 'interview', 'notes'],
  },
};

/**
 * Mock Search Results
 */
export const mockSearchResults = [
  {
    id: 'transcript-1',
    title: 'Team Meeting Notes',
    snippet: '...discussing project updates and timeline...',
    relevance: 0.95,
    created_at: '2024-01-15T10:00:00Z',
  },
  {
    id: 'transcript-2',
    title: 'Interview with John',
    snippet: '...candidate John Smith for the developer position...',
    relevance: 0.88,
    created_at: '2024-01-16T14:00:00Z',
  },
];

/**
 * Mock Error Responses
 */
export const mockErrors = {
  network: {
    message: 'Network request failed',
    code: 'NETWORK_ERROR',
  },
  auth: {
    message: 'Authentication failed',
    code: 'AUTH_ERROR',
  },
  validation: {
    message: 'Validation error',
    code: 'VALIDATION_ERROR',
    details: {
      email: 'Invalid email format',
    },
  },
  server: {
    message: 'Internal server error',
    code: 'SERVER_ERROR',
    statusCode: 500,
  },
};

/**
 * Mock API Responses
 */
export const mockAPIResponses = {
  transcription: {
    id: 'transcription-1',
    status: 'completed',
    text: 'This is the transcribed text.',
    confidence: 0.95,
    duration: 120,
  },
  upload: {
    id: 'upload-1',
    url: 'https://example.com/file.m4a',
    size: 1024000,
    type: 'audio/m4a',
  },
};
