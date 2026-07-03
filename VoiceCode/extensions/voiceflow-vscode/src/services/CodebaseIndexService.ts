/**
 * Codebase Index Service
 * Provides semantic code search using LlamaIndex
 * Enables intelligent context retrieval for AI agents
 */

import * as vscode from 'vscode';
import { VectorStoreIndex, Document, SimpleDirectoryReader, OpenAIEmbedding, Settings } from 'llamaindex';
import * as path from 'path';
import { TelemetryService } from './TelemetryService';

/**
 * Indexed document with metadata
 */
export interface IndexedDocument {
  id: string;
  filePath: string;
  content: string;
  language: string;
  lastModified: Date;
  embedding?: number[];
}

/**
 * Search result with relevance score
 */
export interface SearchResult {
  document: IndexedDocument;
  score: number;
  snippet: string;
}

/**
 * Index statistics
 */
export interface IndexStats {
  totalDocuments: number;
  totalTokens: number;
  languages: Record<string, number>;
  lastIndexed: Date;
  indexSize: number;
}

/**
 * Codebase Index Service
 * Manages semantic indexing and search of workspace code
 */
export class CodebaseIndexService implements vscode.Disposable {
  private index: VectorStoreIndex | null = null;
  private documents: Map<string, IndexedDocument> = new Map();
  private isIndexing: boolean = false;
  private config: vscode.WorkspaceConfiguration;
  private telemetry: TelemetryService;
  private context: vscode.ExtensionContext;
  private fileWatcher: vscode.FileSystemWatcher | null = null;
  private disposables: vscode.Disposable[] = [];

  // Event emitters
  private readonly _onIndexingStarted = new vscode.EventEmitter<void>();
  private readonly _onIndexingCompleted = new vscode.EventEmitter<IndexStats>();
  private readonly _onIndexingProgress = new vscode.EventEmitter<{ current: number; total: number }>();
  private readonly _onIndexingError = new vscode.EventEmitter<Error>();

  public readonly onIndexingStarted = this._onIndexingStarted.event;
  public readonly onIndexingCompleted = this._onIndexingCompleted.event;
  public readonly onIndexingProgress = this._onIndexingProgress.event;
  public readonly onIndexingError = this._onIndexingError.event;

  constructor(
    context: vscode.ExtensionContext,
    config: vscode.WorkspaceConfiguration,
    telemetry: TelemetryService
  ) {
    this.context = context;
    this.config = config;
    this.telemetry = telemetry;
    this.initializeSettings();
    this.setupFileWatcher();
  }

  /**
   * Initialize LlamaIndex settings
   */
  private initializeSettings(): void {
    // Configure embedding model
    const apiKey = this.config.get<string>('openaiApiKey') || process.env.OPENAI_API_KEY;
    if (apiKey) {
      Settings.embedModel = new OpenAIEmbedding({
        apiKey,
        model: this.config.get<string>('embeddingModel', 'text-embedding-3-small'),
      });
    }

    // Configure chunk size for better context
    Settings.chunkSize = this.config.get<number>('chunkSize', 512);
    Settings.chunkOverlap = this.config.get<number>('chunkOverlap', 50);
  }

  /**
   * Setup file watcher for incremental updates
   */
  private setupFileWatcher(): void {
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    if (!workspaceFolder) {
      return;
    }

    // Watch for file changes
    this.fileWatcher = vscode.workspace.createFileSystemWatcher(
      new vscode.RelativePattern(workspaceFolder, '**/*.{ts,js,tsx,jsx,py,java,cpp,c,go,rs,rb,php}')
    );

    this.fileWatcher.onDidCreate((uri) => this.handleFileChange(uri, 'created'));
    this.fileWatcher.onDidChange((uri) => this.handleFileChange(uri, 'modified'));
    this.fileWatcher.onDidDelete((uri) => this.handleFileChange(uri, 'deleted'));

    this.disposables.push(this.fileWatcher);
  }

  /**
   * Handle file changes for incremental indexing
   */
  private async handleFileChange(uri: vscode.Uri, changeType: 'created' | 'modified' | 'deleted'): Promise<void> {
    const filePath = uri.fsPath;

    try {
      if (changeType === 'deleted') {
        this.documents.delete(filePath);
        this.telemetry.recordEvent('codebase_index_file_removed', { filePath });
      } else {
        // Re-index the file
        await this.indexFile(uri);
        this.telemetry.recordEvent('codebase_index_file_updated', { filePath, changeType });
      }
    } catch (error) {
      console.error(`Failed to handle file change for ${filePath}:`, error);
    }
  }

  /**
   * Index a single file
   */
  private async indexFile(uri: vscode.Uri): Promise<void> {
    try {
      const content = await vscode.workspace.fs.readFile(uri);
      const text = Buffer.from(content).toString('utf-8');
      const language = path.extname(uri.fsPath).slice(1);

      const doc: IndexedDocument = {
        id: uri.fsPath,
        filePath: uri.fsPath,
        content: text,
        language,
        lastModified: new Date(),
      };

      this.documents.set(uri.fsPath, doc);
    } catch (error) {
      console.error(`Failed to index file ${uri.fsPath}:`, error);
    }
  }

  /**
   * Index the entire workspace
   */
  public async indexWorkspace(): Promise<void> {
    if (this.isIndexing) {
      console.log('[CodebaseIndex] Indexing already in progress');
      return;
    }

    const startTime = Date.now();
    this.isIndexing = true;
    this._onIndexingStarted.fire();

    try {
      const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
      if (!workspaceFolder) {
        throw new Error('No workspace folder open');
      }

      console.log('[CodebaseIndex] Starting workspace indexing...');

      // Find all code files
      const files = await vscode.workspace.findFiles(
        '**/*.{ts,js,tsx,jsx,py,java,cpp,c,go,rs,rb,php}',
        '**/node_modules/**'
      );

      console.log(`[CodebaseIndex] Found ${files.length} files to index`);

      // Index files in batches
      const batchSize = 10;
      for (let i = 0; i < files.length; i += batchSize) {
        const batch = files.slice(i, i + batchSize);
        await Promise.all(batch.map(uri => this.indexFile(uri)));
        
        this._onIndexingProgress.fire({
          current: Math.min(i + batchSize, files.length),
          total: files.length
        });
      }

      // Create LlamaIndex documents
      const llamaDocuments = Array.from(this.documents.values()).map(doc => 
        new Document({
          text: doc.content,
          metadata: {
            filePath: doc.filePath,
            language: doc.language,
            lastModified: doc.lastModified.toISOString(),
          },
        })
      );

      // Build the index
      console.log('[CodebaseIndex] Building vector index...');
      this.index = await VectorStoreIndex.fromDocuments(llamaDocuments);

      // Save index to disk
      await this.saveIndex();

      const duration = Date.now() - startTime;
      const stats = this.getStats();

      console.log(`[CodebaseIndex] Indexing completed in ${duration}ms`);
      this._onIndexingCompleted.fire(stats);

      this.telemetry.recordEvent('codebase_indexed', {
        documentCount: this.documents.size,
        duration,
      });

    } catch (error) {
      console.error('[CodebaseIndex] Indexing failed:', error);
      this._onIndexingError.fire(error as Error);
      this.telemetry.recordError(error as Error, { context: 'codebase_indexing' });
      throw error;
    } finally {
      this.isIndexing = false;
    }
  }

  /**
   * Semantic search across the codebase
   */
  public async semanticSearch(query: string, topK: number = 5): Promise<SearchResult[]> {
    if (!this.index) {
      console.log('[CodebaseIndex] Index not ready, attempting to load from disk...');
      await this.loadIndex();
      
      if (!this.index) {
        throw new Error('Index not available. Please run indexWorkspace() first.');
      }
    }

    const startTime = Date.now();

    try {
      const retriever = this.index.asRetriever({ similarityTopK: topK });
      const nodes = await retriever.retrieve(query);

      const results: SearchResult[] = nodes.map((node: any) => {
        const metadata = node.node.metadata;
        const filePath = metadata.filePath as string;
        const doc = this.documents.get(filePath);

        return {
          document: doc || {
            id: filePath,
            filePath,
            content: node.node.text,
            language: metadata.language as string,
            lastModified: new Date(metadata.lastModified as string),
          },
          score: node.score || 0,
          snippet: this.extractSnippet(node.node.text, query),
        };
      });

      const duration = Date.now() - startTime;
      this.telemetry.recordEvent('semantic_search', {
        query,
        resultCount: results.length,
        duration,
      });

      return results;
    } catch (error) {
      console.error('[CodebaseIndex] Semantic search failed:', error);
      this.telemetry.recordError(error as Error, { context: 'semantic_search', query });
      throw error;
    }
  }

  /**
   * Get relevant context for a task
   */
  public async getRelevantContext(task: string, maxTokens: number = 2000): Promise<string> {
    const results = await this.semanticSearch(task, 10);
    
    let context = '';
    let tokenCount = 0;

    for (const result of results) {
      const snippet = `// File: ${result.document.filePath}\n${result.snippet}\n\n`;
      const snippetTokens = this.estimateTokens(snippet);

      if (tokenCount + snippetTokens > maxTokens) {
        break;
      }

      context += snippet;
      tokenCount += snippetTokens;
    }

    return context;
  }

  /**
   * Extract a relevant snippet from text
   */
  private extractSnippet(text: string, query: string, contextLines: number = 5): string {
    const lines = text.split('\n');
    const queryLower = query.toLowerCase();
    
    // Find the most relevant line
    let bestLineIndex = 0;
    let bestScore = 0;

    for (let i = 0; i < lines.length; i++) {
      const lineLower = lines[i].toLowerCase();
      const score = this.calculateRelevanceScore(lineLower, queryLower);
      
      if (score > bestScore) {
        bestScore = score;
        bestLineIndex = i;
      }
    }

    // Extract context around the best line
    const startLine = Math.max(0, bestLineIndex - contextLines);
    const endLine = Math.min(lines.length, bestLineIndex + contextLines + 1);
    
    return lines.slice(startLine, endLine).join('\n');
  }

  /**
   * Calculate relevance score for a line
   */
  private calculateRelevanceScore(line: string, query: string): number {
    let score = 0;
    const queryWords = query.split(/\s+/);

    for (const word of queryWords) {
      if (line.includes(word)) {
        score += 1;
      }
    }

    return score;
  }

  /**
   * Estimate token count (rough approximation)
   */
  private estimateTokens(text: string): number {
    return Math.ceil(text.length / 4);
  }

  /**
   * Get index statistics
   */
  public getStats(): IndexStats {
    const languages: Record<string, number> = {};
    let totalTokens = 0;

    for (const doc of this.documents.values()) {
      languages[doc.language] = (languages[doc.language] || 0) + 1;
      totalTokens += this.estimateTokens(doc.content);
    }

    return {
      totalDocuments: this.documents.size,
      totalTokens,
      languages,
      lastIndexed: new Date(),
      indexSize: this.documents.size * 1024, // Rough estimate
    };
  }

  /**
   * Save index to disk
   */
  private async saveIndex(): Promise<void> {
    if (!this.index) {
      return;
    }

    try {
      const indexData = {
        documents: Array.from(this.documents.entries()),
        timestamp: new Date().toISOString(),
      };

      await this.context.globalState.update('codebaseIndex', indexData);
      console.log('[CodebaseIndex] Index saved to disk');
    } catch (error) {
      console.error('[CodebaseIndex] Failed to save index:', error);
    }
  }

  /**
   * Load index from disk
   */
  private async loadIndex(): Promise<void> {
    try {
      const indexData = this.context.globalState.get<{
        documents: Array<[string, IndexedDocument]>;
        timestamp: string;
      }>('codebaseIndex');

      if (!indexData) {
        console.log('[CodebaseIndex] No saved index found');
        return;
      }

      // Restore documents
      this.documents = new Map(indexData.documents);

      // Rebuild LlamaIndex
      const llamaDocuments = Array.from(this.documents.values()).map(doc => 
        new Document({
          text: doc.content,
          metadata: {
            filePath: doc.filePath,
            language: doc.language,
            lastModified: doc.lastModified,
          },
        })
      );

      this.index = await VectorStoreIndex.fromDocuments(llamaDocuments);
      console.log('[CodebaseIndex] Index loaded from disk');
    } catch (error) {
      console.error('[CodebaseIndex] Failed to load index:', error);
    }
  }

  /**
   * Clear the index
   */
  public async clearIndex(): Promise<void> {
    this.index = null;
    this.documents.clear();
    await this.context.globalState.update('codebaseIndex', undefined);
    console.log('[CodebaseIndex] Index cleared');
  }

  /**
   * Check if index is ready
   */
  public isReady(): boolean {
    return this.index !== null && this.documents.size > 0;
  }

  /**
   * Dispose resources
   */
  public dispose(): void {
    this.disposables.forEach(d => d.dispose());
    this._onIndexingStarted.dispose();
    this._onIndexingCompleted.dispose();
    this._onIndexingProgress.dispose();
    this._onIndexingError.dispose();
  }
}

export default CodebaseIndexService;
