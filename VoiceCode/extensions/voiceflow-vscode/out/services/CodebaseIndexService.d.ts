/**
 * Codebase Index Service
 * Provides semantic code search using LlamaIndex
 * Enables intelligent context retrieval for AI agents
 */
import * as vscode from 'vscode';
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
export declare class CodebaseIndexService implements vscode.Disposable {
    private index;
    private documents;
    private isIndexing;
    private config;
    private telemetry;
    private context;
    private fileWatcher;
    private disposables;
    private readonly _onIndexingStarted;
    private readonly _onIndexingCompleted;
    private readonly _onIndexingProgress;
    private readonly _onIndexingError;
    readonly onIndexingStarted: vscode.Event<void>;
    readonly onIndexingCompleted: vscode.Event<IndexStats>;
    readonly onIndexingProgress: vscode.Event<{
        current: number;
        total: number;
    }>;
    readonly onIndexingError: vscode.Event<Error>;
    constructor(context: vscode.ExtensionContext, config: vscode.WorkspaceConfiguration, telemetry: TelemetryService);
    /**
     * Initialize LlamaIndex settings
     */
    private initializeSettings;
    /**
     * Setup file watcher for incremental updates
     */
    private setupFileWatcher;
    /**
     * Handle file changes for incremental indexing
     */
    private handleFileChange;
    /**
     * Index a single file
     */
    private indexFile;
    /**
     * Index the entire workspace
     */
    indexWorkspace(): Promise<void>;
    /**
     * Semantic search across the codebase
     */
    semanticSearch(query: string, topK?: number): Promise<SearchResult[]>;
    /**
     * Get relevant context for a task
     */
    getRelevantContext(task: string, maxTokens?: number): Promise<string>;
    /**
     * Extract a relevant snippet from text
     */
    private extractSnippet;
    /**
     * Calculate relevance score for a line
     */
    private calculateRelevanceScore;
    /**
     * Estimate token count (rough approximation)
     */
    private estimateTokens;
    /**
     * Get index statistics
     */
    getStats(): IndexStats;
    /**
     * Save index to disk
     */
    private saveIndex;
    /**
     * Load index from disk
     */
    private loadIndex;
    /**
     * Clear the index
     */
    clearIndex(): Promise<void>;
    /**
     * Check if index is ready
     */
    isReady(): boolean;
    /**
     * Dispose resources
     */
    dispose(): void;
}
export default CodebaseIndexService;
//# sourceMappingURL=CodebaseIndexService.d.ts.map