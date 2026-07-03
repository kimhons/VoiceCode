/**
 * Agent Capabilities Service
 * Provides OCR, Computer Vision, and Advanced Web Search capabilities
 * for the VoiceCode AI Agent
 */

// Types
export interface OCRResult {
  text: string;
  confidence: number;
  blocks: TextBlock[];
  language: string;
  processingTime: number;
}

export interface TextBlock {
  text: string;
  boundingBox: BoundingBox;
  confidence: number;
  type: 'paragraph' | 'line' | 'word' | 'heading' | 'table' | 'list';
}

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface VisionAnalysisResult {
  description: string;
  tags: string[];
  objects: DetectedObject[];
  faces: DetectedFace[];
  text: OCRResult | null;
  colors: ColorInfo;
  imageType: string;
  medicalAnalysis?: MedicalImageAnalysis;
  confidence: number;
}

export interface DetectedObject {
  name: string;
  confidence: number;
  boundingBox: BoundingBox;
  attributes?: Record<string, string>;
}

export interface DetectedFace {
  boundingBox: BoundingBox;
  age?: number;
  emotion?: string;
  attributes?: Record<string, string>;
}

export interface ColorInfo {
  dominantColors: string[];
  accentColor: string;
  isBW: boolean;
}

export interface MedicalImageAnalysis {
  type:
    | 'xray'
    | 'mri'
    | 'ct'
    | 'ultrasound'
    | 'dermoscopy'
    | 'pathology'
    | 'other';
  findings: string[];
  regions: AnnotatedRegion[];
  urgency: 'routine' | 'priority' | 'urgent';
  disclaimer: string;
}

export interface AnnotatedRegion {
  name: string;
  description: string;
  boundingBox: BoundingBox;
  severity?: 'normal' | 'mild' | 'moderate' | 'severe';
}

export interface WebSearchResult {
  query: string;
  results: SearchResultItem[];
  totalResults: number;
  searchTime: number;
  suggestions: string[];
  sources: SourceInfo[];
}

export interface SearchResultItem {
  title: string;
  url: string;
  snippet: string;
  publishedDate?: string;
  source: string;
  relevanceScore: number;
  type: 'web' | 'news' | 'academic' | 'medical' | 'video' | 'image';
  metadata?: Record<string, unknown>;
}

export interface SourceInfo {
  name: string;
  domain: string;
  reliability: 'high' | 'medium' | 'low' | 'unknown';
  type: 'official' | 'academic' | 'news' | 'blog' | 'forum' | 'other';
}

export interface AgentCapability {
  id: string;
  name: string;
  description: string;
  icon: string;
  enabled: boolean;
  requiresApiKey: boolean;
  apiKeyConfigured: boolean;
}

// Configuration
const API_CONFIG = {
  OCR_ENDPOINT: import.meta.env.VITE_OCR_API_ENDPOINT || '/api/ocr',
  VISION_ENDPOINT: import.meta.env.VITE_VISION_API_ENDPOINT || '/api/vision',
  SEARCH_ENDPOINT: import.meta.env.VITE_SEARCH_API_ENDPOINT || '/api/search',
  OPENAI_API_KEY: import.meta.env.VITE_OPENAI_API_KEY || '',
  GOOGLE_VISION_KEY: import.meta.env.VITE_GOOGLE_VISION_KEY || '',
  SERPER_API_KEY: import.meta.env.VITE_SERPER_API_KEY || '',
};

class AgentCapabilitiesService {
  private initialized = false;

  // ============================================
  // OCR CAPABILITIES
  // ============================================

  /**
   * Extract text from an image using OCR
   */
  async extractTextFromImage(
    imageSource: File | Blob | string,
    options: {
      language?: string;
      enhanceQuality?: boolean;
      detectTables?: boolean;
      detectHandwriting?: boolean;
    } = {}
  ): Promise<OCRResult> {
    const startTime = Date.now();

    try {
      // Convert image to base64 if needed
      const base64Image = await this.imageToBase64(imageSource);

      // In demo mode, return simulated OCR result
      if (!API_CONFIG.GOOGLE_VISION_KEY && !API_CONFIG.OPENAI_API_KEY) {
        return this.simulateOCR(base64Image, startTime);
      }

      // Use OpenAI Vision API for OCR
      if (API_CONFIG.OPENAI_API_KEY) {
        return await this.performOpenAIOCR(base64Image, options, startTime);
      }

      // Fallback to Google Vision
      return await this.performGoogleVisionOCR(base64Image, options, startTime);
    } catch (error) {
      console.error('OCR Error:', error);
      throw new Error(
        `OCR failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  private async performOpenAIOCR(
    base64Image: string,
    options: { language?: string; detectTables?: boolean },
    startTime: number
  ): Promise<OCRResult> {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${API_CONFIG.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `Extract ALL text from this image. ${options.detectTables ? 'Preserve table structure using markdown format.' : ''} Return the extracted text exactly as it appears, maintaining formatting where possible. If there are multiple languages, identify them.`,
              },
              {
                type: 'image_url',
                image_url: { url: `data:image/jpeg;base64,${base64Image}` },
              },
            ],
          },
        ],
        max_tokens: 4096,
      }),
    });

    const data = await response.json();
    const extractedText = data.choices?.[0]?.message?.content || '';

    return {
      text: extractedText,
      confidence: 0.95,
      blocks: this.parseTextBlocks(extractedText),
      language: options.language || 'en',
      processingTime: Date.now() - startTime,
    };
  }

  private async performGoogleVisionOCR(
    base64Image: string,
    options: { language?: string },
    startTime: number
  ): Promise<OCRResult> {
    const response = await fetch(
      `https://vision.googleapis.com/v1/images:annotate?key=${API_CONFIG.GOOGLE_VISION_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requests: [
            {
              image: { content: base64Image },
              features: [
                { type: 'TEXT_DETECTION' },
                { type: 'DOCUMENT_TEXT_DETECTION' },
              ],
              imageContext: {
                languageHints: options.language ? [options.language] : [],
              },
            },
          ],
        }),
      }
    );

    const data = await response.json();
    const textAnnotations = data.responses?.[0]?.textAnnotations || [];
    const fullText = textAnnotations[0]?.description || '';

    return {
      text: fullText,
      confidence: 0.92,
      blocks: this.parseTextBlocks(fullText),
      language: textAnnotations[0]?.locale || 'en',
      processingTime: Date.now() - startTime,
    };
  }

  private simulateOCR(base64Image: string, startTime: number): OCRResult {
    // Simulated OCR for demo mode
    const sampleText = `[Demo OCR Result]
    
Patient Name: John Smith
DOB: 03/15/1985
MRN: 123456789

Chief Complaint: Chest pain and shortness of breath

Vital Signs:
- BP: 142/88 mmHg
- HR: 92 bpm
- Temp: 98.6°F
- SpO2: 96%

Notes: Patient presents with intermittent chest discomfort 
for the past 3 days. Pain is described as pressure-like, 
non-radiating, and worsens with exertion.

[End of OCR Demo - Connect API keys for real OCR]`;

    return {
      text: sampleText,
      confidence: 0.88,
      blocks: this.parseTextBlocks(sampleText),
      language: 'en',
      processingTime: Date.now() - startTime,
    };
  }

  // ============================================
  // COMPUTER VISION CAPABILITIES
  // ============================================

  /**
   * Analyze an image using computer vision
   */
  async analyzeImage(
    imageSource: File | Blob | string,
    options: {
      detectObjects?: boolean;
      detectFaces?: boolean;
      extractText?: boolean;
      analyzeMedical?: boolean;
      detectColors?: boolean;
    } = { detectObjects: true, detectColors: true }
  ): Promise<VisionAnalysisResult> {
    try {
      const base64Image = await this.imageToBase64(imageSource);

      // Demo mode
      if (!API_CONFIG.OPENAI_API_KEY && !API_CONFIG.GOOGLE_VISION_KEY) {
        return this.simulateVisionAnalysis(options);
      }

      // Use OpenAI Vision for comprehensive analysis
      if (API_CONFIG.OPENAI_API_KEY) {
        return await this.performOpenAIVisionAnalysis(base64Image, options);
      }

      // Fallback to Google Vision
      return await this.performGoogleVisionAnalysis(base64Image, options);
    } catch (error) {
      console.error('Vision Analysis Error:', error);
      throw new Error(
        `Vision analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  private async performOpenAIVisionAnalysis(
    base64Image: string,
    options: {
      detectObjects?: boolean;
      detectFaces?: boolean;
      extractText?: boolean;
      analyzeMedical?: boolean;
    }
  ): Promise<VisionAnalysisResult> {
    const prompt = this.buildVisionPrompt(options);

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${API_CONFIG.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content:
              'You are an expert image analyst. Provide detailed, structured analysis in JSON format.',
          },
          {
            role: 'user',
            content: [
              { type: 'text', text: prompt },
              {
                type: 'image_url',
                image_url: { url: `data:image/jpeg;base64,${base64Image}` },
              },
            ],
          },
        ],
        max_tokens: 4096,
        response_format: { type: 'json_object' },
      }),
    });

    const data = await response.json();
    const analysis = JSON.parse(data.choices?.[0]?.message?.content || '{}');

    return this.parseVisionResponse(analysis, options);
  }

  private buildVisionPrompt(options: {
    detectObjects?: boolean;
    detectFaces?: boolean;
    extractText?: boolean;
    analyzeMedical?: boolean;
  }): string {
    let prompt = 'Analyze this image and provide a JSON response with:\n';
    prompt += '- "description": A detailed description of the image\n';
    prompt += '- "tags": Array of relevant tags/keywords\n';

    if (options.detectObjects) {
      prompt +=
        '- "objects": Array of detected objects with {name, confidence}\n';
    }
    if (options.detectFaces) {
      prompt +=
        '- "faces": Array of detected faces with estimated {age, emotion}\n';
    }
    if (options.extractText) {
      prompt += '- "text": Any visible text in the image\n';
    }
    if (options.analyzeMedical) {
      prompt += `- "medicalAnalysis": If this is a medical image, provide:
        - "type": Type of medical image (xray/mri/ct/ultrasound/dermoscopy/pathology/other)
        - "findings": Array of medical observations
        - "regions": Areas of interest
        - "urgency": Assessment priority (routine/priority/urgent)
        - "disclaimer": Always include that this is AI-assisted and requires professional review\n`;
    }

    prompt +=
      '- "colors": {dominantColors: [], accentColor: "", isBW: boolean}\n';
    prompt +=
      '- "imageType": Type of image (photo/document/diagram/medical/screenshot/etc)\n';
    prompt += '- "confidence": Overall confidence score 0-1\n';

    return prompt;
  }

  private parseVisionResponse(
    analysis: Record<string, unknown>,
    options: { analyzeMedical?: boolean }
  ): VisionAnalysisResult {
    return {
      description:
        (analysis.description as string) || 'Unable to analyze image',
      tags: (analysis.tags as string[]) || [],
      objects: ((analysis.objects as DetectedObject[]) || []).map((obj) => ({
        name: obj.name,
        confidence: obj.confidence || 0.8,
        boundingBox: obj.boundingBox || { x: 0, y: 0, width: 0, height: 0 },
      })),
      faces: (analysis.faces as DetectedFace[]) || [],
      text: analysis.text
        ? {
            text: analysis.text as string,
            confidence: 0.9,
            blocks: [],
            language: 'en',
            processingTime: 0,
          }
        : null,
      colors: (analysis.colors as ColorInfo) || {
        dominantColors: [],
        accentColor: '#000',
        isBW: false,
      },
      imageType: (analysis.imageType as string) || 'unknown',
      medicalAnalysis: options.analyzeMedical
        ? (analysis.medicalAnalysis as MedicalImageAnalysis)
        : undefined,
      confidence: (analysis.confidence as number) || 0.85,
    };
  }

  private async performGoogleVisionAnalysis(
    base64Image: string,
    options: { detectObjects?: boolean; detectFaces?: boolean }
  ): Promise<VisionAnalysisResult> {
    const features = [
      { type: 'LABEL_DETECTION', maxResults: 10 },
      { type: 'IMAGE_PROPERTIES' },
    ];

    if (options.detectObjects)
      features.push({ type: 'OBJECT_LOCALIZATION', maxResults: 10 });
    if (options.detectFaces)
      features.push({ type: 'FACE_DETECTION', maxResults: 5 });

    const response = await fetch(
      `https://vision.googleapis.com/v1/images:annotate?key=${API_CONFIG.GOOGLE_VISION_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requests: [{ image: { content: base64Image }, features }],
        }),
      }
    );

    const data = await response.json();
    const result = data.responses?.[0] || {};

    return {
      description:
        result.labelAnnotations
          ?.map((l: { description: string }) => l.description)
          .join(', ') || '',
      tags:
        result.labelAnnotations?.map(
          (l: { description: string }) => l.description
        ) || [],
      objects: (result.localizedObjectAnnotations || []).map(
        (obj: { name: string; score: number }) => ({
          name: obj.name,
          confidence: obj.score,
          boundingBox: { x: 0, y: 0, width: 0, height: 0 },
        })
      ),
      faces: [],
      text: null,
      colors: {
        dominantColors:
          result.imagePropertiesAnnotation?.dominantColors?.colors
            ?.slice(0, 5)
            .map(
              (c: { color: { red: number; green: number; blue: number } }) =>
                `rgb(${c.color.red || 0},${c.color.green || 0},${c.color.blue || 0})`
            ) || [],
        accentColor: '#6366f1',
        isBW: false,
      },
      imageType: 'photo',
      confidence: 0.85,
    };
  }

  private simulateVisionAnalysis(options: {
    analyzeMedical?: boolean;
  }): VisionAnalysisResult {
    const baseResult: VisionAnalysisResult = {
      description:
        '[Demo] This appears to be a document or medical record containing patient information and clinical notes.',
      tags: ['document', 'medical', 'text', 'healthcare', 'clinical'],
      objects: [
        {
          name: 'document',
          confidence: 0.95,
          boundingBox: { x: 0, y: 0, width: 100, height: 100 },
        },
        {
          name: 'text',
          confidence: 0.92,
          boundingBox: { x: 10, y: 10, width: 80, height: 80 },
        },
      ],
      faces: [],
      text: null,
      colors: {
        dominantColors: ['#ffffff', '#000000', '#f5f5f5'],
        accentColor: '#6366f1',
        isBW: false,
      },
      imageType: 'document',
      confidence: 0.88,
    };

    if (options.analyzeMedical) {
      baseResult.medicalAnalysis = {
        type: 'other',
        findings: [
          'Document appears to contain patient demographic information',
          'Clinical notes section detected',
          'Vital signs data present',
        ],
        regions: [],
        urgency: 'routine',
        disclaimer:
          '⚠️ This is AI-assisted analysis for reference only. All findings must be reviewed and confirmed by a qualified healthcare professional.',
      };
    }

    return baseResult;
  }

  // ============================================
  // ADVANCED WEB SEARCH CAPABILITIES
  // ============================================

  /**
   * Perform advanced web search with multiple sources
   */
  async webSearch(
    query: string,
    options: {
      type?: 'web' | 'news' | 'academic' | 'medical' | 'images' | 'videos';
      maxResults?: number;
      dateRange?: 'day' | 'week' | 'month' | 'year' | 'all';
      language?: string;
      region?: string;
      safeSearch?: boolean;
    } = {}
  ): Promise<WebSearchResult> {
    const startTime = Date.now();
    const { type = 'web', maxResults = 10, dateRange = 'all' } = options;

    try {
      // Demo mode
      if (!API_CONFIG.SERPER_API_KEY) {
        return this.simulateWebSearch(query, type, startTime);
      }

      // Use Serper API for Google Search
      return await this.performSerperSearch(
        query,
        { ...options, maxResults, dateRange },
        startTime
      );
    } catch (error) {
      console.error('Web Search Error:', error);
      throw new Error(
        `Search failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  private async performSerperSearch(
    query: string,
    options: {
      type?: string;
      maxResults?: number;
      dateRange?: string;
    },
    startTime: number
  ): Promise<WebSearchResult> {
    const endpoint =
      options.type === 'news'
        ? 'news'
        : options.type === 'images'
          ? 'images'
          : 'search';

    const response = await fetch(`https://google.serper.dev/${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-KEY': API_CONFIG.SERPER_API_KEY,
      },
      body: JSON.stringify({
        q: query,
        num: options.maxResults || 10,
        tbs: this.getDateRangeParam(options.dateRange),
      }),
    });

    const data = await response.json();

    return {
      query,
      results: (data.organic || data.news || data.images || []).map(
        (item: {
          title: string;
          link: string;
          snippet?: string;
          date?: string;
          source?: string;
        }) => ({
          title: item.title,
          url: item.link,
          snippet: item.snippet || '',
          publishedDate: item.date,
          source: item.source || new URL(item.link).hostname,
          relevanceScore: 0.9,
          type: options.type || 'web',
        })
      ),
      totalResults: data.searchInformation?.totalResults || 0,
      searchTime: Date.now() - startTime,
      suggestions:
        data.relatedSearches?.map((s: { query: string }) => s.query) || [],
      sources: [],
    };
  }

  private getDateRangeParam(dateRange?: string): string | undefined {
    switch (dateRange) {
      case 'day':
        return 'qdr:d';
      case 'week':
        return 'qdr:w';
      case 'month':
        return 'qdr:m';
      case 'year':
        return 'qdr:y';
      default:
        return undefined;
    }
  }

  /**
   * Search medical/academic sources specifically
   */
  async searchMedicalLiterature(
    query: string,
    options: {
      sources?: ('pubmed' | 'clinicaltrials' | 'cochrane' | 'uptodate')[];
      maxResults?: number;
      yearFrom?: number;
    } = {}
  ): Promise<WebSearchResult> {
    const startTime = Date.now();
    const { maxResults = 10 } = options;

    // Enhance query for medical search
    const medicalQuery = `${query} site:pubmed.ncbi.nlm.nih.gov OR site:clinicaltrials.gov OR site:cochranelibrary.com`;

    if (!API_CONFIG.SERPER_API_KEY) {
      return this.simulateMedicalSearch(query, startTime);
    }

    const results = await this.performSerperSearch(
      medicalQuery,
      { maxResults },
      startTime
    );
    results.results = results.results.map((r) => ({
      ...r,
      type: 'medical' as const,
    }));

    return results;
  }

  /**
   * Get real-time information (news, events, etc.)
   */
  async getRealTimeInfo(
    topic: string,
    options: { includeNews?: boolean; includeSocial?: boolean } = {}
  ): Promise<WebSearchResult> {
    return this.webSearch(topic, {
      type: options.includeNews ? 'news' : 'web',
      dateRange: 'day',
      maxResults: 10,
    });
  }

  private simulateWebSearch(
    query: string,
    type: string,
    startTime: number
  ): WebSearchResult {
    const sampleResults: SearchResultItem[] = [
      {
        title: `Understanding ${query} - Comprehensive Guide`,
        url: 'https://example.com/guide',
        snippet: `A detailed exploration of ${query} including latest research, best practices, and expert recommendations...`,
        publishedDate: new Date().toISOString(),
        source: 'Medical Reference',
        relevanceScore: 0.95,
        type: type as SearchResultItem['type'],
      },
      {
        title: `${query}: Latest Research and Findings`,
        url: 'https://pubmed.example.com/research',
        snippet: `Recent studies on ${query} show promising results. This systematic review covers...`,
        publishedDate: new Date(Date.now() - 86400000).toISOString(),
        source: 'PubMed',
        relevanceScore: 0.92,
        type: 'academic',
      },
      {
        title: `Clinical Guidelines for ${query}`,
        url: 'https://guidelines.example.com',
        snippet: `Evidence-based clinical guidelines for the management and treatment of ${query}...`,
        publishedDate: new Date(Date.now() - 172800000).toISOString(),
        source: 'Clinical Guidelines',
        relevanceScore: 0.89,
        type: 'medical',
      },
      {
        title: `${query} - News and Updates`,
        url: 'https://news.example.com/health',
        snippet: `Breaking news and updates about ${query}. Stay informed about the latest developments...`,
        publishedDate: new Date().toISOString(),
        source: 'Health News',
        relevanceScore: 0.85,
        type: 'news',
      },
    ];

    return {
      query,
      results: sampleResults,
      totalResults: 4,
      searchTime: Date.now() - startTime,
      suggestions: [
        `${query} treatment options`,
        `${query} symptoms`,
        `${query} prevention`,
        `latest research on ${query}`,
      ],
      sources: [
        {
          name: 'Medical Reference',
          domain: 'example.com',
          reliability: 'high',
          type: 'official',
        },
        {
          name: 'PubMed',
          domain: 'pubmed.example.com',
          reliability: 'high',
          type: 'academic',
        },
      ],
    };
  }

  private simulateMedicalSearch(
    query: string,
    startTime: number
  ): WebSearchResult {
    return {
      query,
      results: [
        {
          title: `PubMed: ${query} - Systematic Review`,
          url: 'https://pubmed.ncbi.nlm.nih.gov/example',
          snippet: `Background: This systematic review examines ${query}... Methods: We searched multiple databases... Results: 45 studies met inclusion criteria...`,
          publishedDate: '2024-01-15',
          source: 'PubMed',
          relevanceScore: 0.96,
          type: 'academic',
        },
        {
          title: `Clinical Trial: ${query} Treatment Study`,
          url: 'https://clinicaltrials.gov/example',
          snippet: `A randomized controlled trial investigating ${query}. Status: Recruiting. Estimated enrollment: 500 participants.`,
          publishedDate: '2024-02-01',
          source: 'ClinicalTrials.gov',
          relevanceScore: 0.91,
          type: 'medical',
        },
      ],
      totalResults: 2,
      searchTime: Date.now() - startTime,
      suggestions: [`${query} clinical trials`, `${query} meta-analysis`],
      sources: [
        {
          name: 'PubMed',
          domain: 'pubmed.ncbi.nlm.nih.gov',
          reliability: 'high',
          type: 'academic',
        },
        {
          name: 'ClinicalTrials.gov',
          domain: 'clinicaltrials.gov',
          reliability: 'high',
          type: 'official',
        },
      ],
    };
  }

  // ============================================
  // UTILITY METHODS
  // ============================================

  private async imageToBase64(
    imageSource: File | Blob | string
  ): Promise<string> {
    if (typeof imageSource === 'string') {
      // Already base64 or URL
      if (imageSource.startsWith('data:')) {
        return imageSource.split(',')[1];
      }
      // Fetch URL and convert
      const response = await fetch(imageSource);
      const blob = await response.blob();
      return this.blobToBase64(blob);
    }

    return this.blobToBase64(imageSource);
  }

  private blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        resolve(result.split(',')[1]);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  private parseTextBlocks(text: string): TextBlock[] {
    const lines = text.split('\n').filter((line) => line.trim());
    return lines.map((line, index) => ({
      text: line,
      boundingBox: { x: 0, y: index * 20, width: 100, height: 20 },
      confidence: 0.9,
      type:
        line.startsWith('#') || line.startsWith('-') ? 'heading' : 'paragraph',
    }));
  }

  /**
   * Get available capabilities and their status
   */
  getCapabilities(): AgentCapability[] {
    return [
      {
        id: 'ocr',
        name: 'OCR (Text Extraction)',
        description:
          'Extract text from images, documents, and handwritten notes',
        icon: 'scan',
        enabled: true,
        requiresApiKey: true,
        apiKeyConfigured: !!(
          API_CONFIG.OPENAI_API_KEY || API_CONFIG.GOOGLE_VISION_KEY
        ),
      },
      {
        id: 'vision',
        name: 'Computer Vision',
        description:
          'Analyze images, detect objects, faces, and understand visual content',
        icon: 'eye',
        enabled: true,
        requiresApiKey: true,
        apiKeyConfigured: !!(
          API_CONFIG.OPENAI_API_KEY || API_CONFIG.GOOGLE_VISION_KEY
        ),
      },
      {
        id: 'medical-vision',
        name: 'Medical Image Analysis',
        description:
          'AI-assisted analysis of medical images (X-rays, MRIs, etc.)',
        icon: 'activity',
        enabled: true,
        requiresApiKey: true,
        apiKeyConfigured: !!API_CONFIG.OPENAI_API_KEY,
      },
      {
        id: 'web-search',
        name: 'Web Search',
        description: 'Search the web for real-time information and research',
        icon: 'globe',
        enabled: true,
        requiresApiKey: true,
        apiKeyConfigured: !!API_CONFIG.SERPER_API_KEY,
      },
      {
        id: 'medical-search',
        name: 'Medical Literature Search',
        description: 'Search PubMed, clinical trials, and medical databases',
        icon: 'book-medical',
        enabled: true,
        requiresApiKey: true,
        apiKeyConfigured: !!API_CONFIG.SERPER_API_KEY,
      },
    ];
  }
}

// Export singleton instance
export const agentCapabilities = new AgentCapabilitiesService();
export default agentCapabilities;
