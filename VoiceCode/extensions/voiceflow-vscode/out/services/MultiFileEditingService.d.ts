/**
 * Multi-File Editing Service
 * Enables coordinated editing across multiple files
 * Critical feature for competing with Cursor and Cline
 */
import * as vscode from 'vscode';
/**
 * File Edit Operation
 */
export interface FileEdit {
    filePath: string;
    edits: TextEdit[];
    createIfMissing?: boolean;
    deleteFile?: boolean;
}
export interface TextEdit {
    range?: {
        startLine: number;
        startColumn: number;
        endLine: number;
        endColumn: number;
    };
    newText: string;
    insertAt?: 'start' | 'end' | 'cursor';
    replaceAll?: boolean;
}
/**
 * Multi-File Edit Session
 */
export interface EditSession {
    id: string;
    name: string;
    description: string;
    files: FileEdit[];
    status: 'pending' | 'previewing' | 'applied' | 'reverted';
    createdAt: Date;
    appliedAt?: Date;
    revertedAt?: Date;
}
/**
 * Diff Preview
 */
export interface DiffPreview {
    filePath: string;
    originalContent: string;
    modifiedContent: string;
    hunks: DiffHunk[];
}
export interface DiffHunk {
    startLine: number;
    endLine: number;
    originalLines: string[];
    modifiedLines: string[];
    type: 'add' | 'remove' | 'modify';
}
/**
 * Edit Result
 */
export interface EditResult {
    success: boolean;
    filesModified: number;
    filesCreated: number;
    filesDeleted: number;
    errors: Array<{
        file: string;
        error: string;
    }>;
}
/**
 * Multi-File Editing Service
 */
export declare class MultiFileEditingService {
    private config;
    private sessions;
    private undoStack;
    private readonly _onSessionCreated;
    private readonly _onSessionApplied;
    private readonly _onSessionReverted;
    private readonly _onPreviewGenerated;
    readonly onSessionCreated: vscode.Event<EditSession>;
    readonly onSessionApplied: vscode.Event<EditSession>;
    readonly onSessionReverted: vscode.Event<EditSession>;
    readonly onPreviewGenerated: vscode.Event<DiffPreview[]>;
    constructor(config: vscode.WorkspaceConfiguration);
    /**
     * Create a new edit session
     */
    createSession(name: string, description: string, files: FileEdit[]): EditSession;
    /**
     * Generate diff previews for a session
     */
    generatePreviews(sessionId: string): Promise<DiffPreview[]>;
    /**
     * Apply edits from a session
     */
    applySession(sessionId: string): Promise<EditResult>;
    /**
     * Revert a session's changes
     */
    revertSession(sessionId: string): Promise<EditResult>;
    /**
     * Apply edits to content string
     */
    private applyEditsToContent;
    /**
     * Compute diff hunks between original and modified content
     */
    private computeDiffHunks;
    /**
     * Show diff preview in VS Code
     */
    showDiffPreview(preview: DiffPreview): Promise<void>;
    /**
     * Get session by ID
     */
    getSession(sessionId: string): EditSession | undefined;
    /**
     * Get all sessions
     */
    getAllSessions(): EditSession[];
    /**
     * Delete a session
     */
    deleteSession(sessionId: string): boolean;
    /**
     * Generate unique session ID
     */
    private generateSessionId;
    /**
     * Create edit session from AI response
     */
    createSessionFromAIResponse(name: string, description: string, aiEdits: Array<{
        file: string;
        action: 'create' | 'modify' | 'delete';
        content?: string;
        changes?: Array<{
            search: string;
            replace: string;
        }>;
    }>): EditSession;
    /**
     * Dispose resources
     */
    dispose(): void;
}
export default MultiFileEditingService;
//# sourceMappingURL=MultiFileEditingService.d.ts.map