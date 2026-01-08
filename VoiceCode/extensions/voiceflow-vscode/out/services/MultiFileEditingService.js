"use strict";
/**
 * Multi-File Editing Service
 * Enables coordinated editing across multiple files
 * Critical feature for competing with Cursor and Cline
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MultiFileEditingService = void 0;
const vscode = __importStar(require("vscode"));
// Utility functions for text encoding/decoding
const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder('utf-8');
function encodeText(text) {
    return textEncoder.encode(text);
}
function decodeText(data) {
    return textDecoder.decode(data);
}
/**
 * Multi-File Editing Service
 */
class MultiFileEditingService {
    config;
    sessions = new Map();
    undoStack = new Map(); // sessionId -> filePath -> originalContent
    // Event emitters
    _onSessionCreated = new vscode.EventEmitter();
    _onSessionApplied = new vscode.EventEmitter();
    _onSessionReverted = new vscode.EventEmitter();
    _onPreviewGenerated = new vscode.EventEmitter();
    onSessionCreated = this._onSessionCreated.event;
    onSessionApplied = this._onSessionApplied.event;
    onSessionReverted = this._onSessionReverted.event;
    onPreviewGenerated = this._onPreviewGenerated.event;
    constructor(config) {
        this.config = config;
    }
    /**
     * Create a new edit session
     */
    createSession(name, description, files) {
        const session = {
            id: this.generateSessionId(),
            name,
            description,
            files,
            status: 'pending',
            createdAt: new Date(),
        };
        this.sessions.set(session.id, session);
        this._onSessionCreated.fire(session);
        return session;
    }
    /**
     * Generate diff previews for a session
     */
    async generatePreviews(sessionId) {
        const session = this.sessions.get(sessionId);
        if (!session) {
            throw new Error(`Session not found: ${sessionId}`);
        }
        const previews = [];
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        if (!workspaceFolder) {
            throw new Error('No workspace folder open');
        }
        for (const fileEdit of session.files) {
            const uri = vscode.Uri.joinPath(workspaceFolder.uri, fileEdit.filePath);
            let originalContent = '';
            try {
                const content = await vscode.workspace.fs.readFile(uri);
                originalContent = decodeText(content);
            }
            catch {
                // File doesn't exist, will be created
                if (!fileEdit.createIfMissing) {
                    continue;
                }
            }
            const modifiedContent = this.applyEditsToContent(originalContent, fileEdit.edits);
            const hunks = this.computeDiffHunks(originalContent, modifiedContent);
            previews.push({
                filePath: fileEdit.filePath,
                originalContent,
                modifiedContent,
                hunks,
            });
        }
        session.status = 'previewing';
        this._onPreviewGenerated.fire(previews);
        return previews;
    }
    /**
     * Apply edits from a session
     */
    async applySession(sessionId) {
        const session = this.sessions.get(sessionId);
        if (!session) {
            throw new Error(`Session not found: ${sessionId}`);
        }
        const result = {
            success: true,
            filesModified: 0,
            filesCreated: 0,
            filesDeleted: 0,
            errors: [],
        };
        // Store original contents for undo
        const originalContents = new Map();
        this.undoStack.set(sessionId, originalContents);
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        if (!workspaceFolder) {
            return { ...result, success: false, errors: [{ file: '', error: 'No workspace folder' }] };
        }
        // Apply edits to each file
        for (const fileEdit of session.files) {
            try {
                const uri = vscode.Uri.joinPath(workspaceFolder.uri, fileEdit.filePath);
                if (fileEdit.deleteFile) {
                    // Store original content before deletion
                    try {
                        const content = await vscode.workspace.fs.readFile(uri);
                        originalContents.set(fileEdit.filePath, decodeText(content));
                    }
                    catch {
                        // File doesn't exist, nothing to delete
                        continue;
                    }
                    await vscode.workspace.fs.delete(uri);
                    result.filesDeleted++;
                    continue;
                }
                let originalContent = '';
                let isNewFile = false;
                try {
                    const content = await vscode.workspace.fs.readFile(uri);
                    originalContent = decodeText(content);
                }
                catch {
                    if (fileEdit.createIfMissing) {
                        isNewFile = true;
                    }
                    else {
                        result.errors.push({ file: fileEdit.filePath, error: 'File not found' });
                        continue;
                    }
                }
                // Store original content for undo
                originalContents.set(fileEdit.filePath, originalContent);
                // Apply edits
                const modifiedContent = this.applyEditsToContent(originalContent, fileEdit.edits);
                await vscode.workspace.fs.writeFile(uri, encodeText(modifiedContent));
                if (isNewFile) {
                    result.filesCreated++;
                }
                else {
                    result.filesModified++;
                }
            }
            catch (error) {
                result.errors.push({
                    file: fileEdit.filePath,
                    error: error instanceof Error ? error.message : String(error),
                });
                result.success = false;
            }
        }
        session.status = 'applied';
        session.appliedAt = new Date();
        this._onSessionApplied.fire(session);
        return result;
    }
    /**
     * Revert a session's changes
     */
    async revertSession(sessionId) {
        const session = this.sessions.get(sessionId);
        if (!session) {
            throw new Error(`Session not found: ${sessionId}`);
        }
        if (session.status !== 'applied') {
            throw new Error('Session has not been applied');
        }
        const originalContents = this.undoStack.get(sessionId);
        if (!originalContents) {
            throw new Error('No undo data available for session');
        }
        const result = {
            success: true,
            filesModified: 0,
            filesCreated: 0,
            filesDeleted: 0,
            errors: [],
        };
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        if (!workspaceFolder) {
            return { ...result, success: false, errors: [{ file: '', error: 'No workspace folder' }] };
        }
        for (const [filePath, originalContent] of originalContents) {
            try {
                const uri = vscode.Uri.joinPath(workspaceFolder.uri, filePath);
                if (originalContent === '') {
                    // File was created, delete it
                    await vscode.workspace.fs.delete(uri);
                    result.filesDeleted++;
                }
                else {
                    // Restore original content
                    await vscode.workspace.fs.writeFile(uri, encodeText(originalContent));
                    result.filesModified++;
                }
            }
            catch (error) {
                result.errors.push({
                    file: filePath,
                    error: error instanceof Error ? error.message : String(error),
                });
                result.success = false;
            }
        }
        session.status = 'reverted';
        session.revertedAt = new Date();
        this._onSessionReverted.fire(session);
        return result;
    }
    /**
     * Apply edits to content string
     */
    applyEditsToContent(content, edits) {
        let result = content;
        const lines = result.split('\n');
        // Sort edits by position (reverse order to apply from end to start)
        const sortedEdits = [...edits].sort((a, b) => {
            if (a.range && b.range) {
                return b.range.startLine - a.range.startLine;
            }
            return 0;
        });
        for (const edit of sortedEdits) {
            if (edit.replaceAll) {
                result = edit.newText;
                continue;
            }
            if (edit.insertAt === 'start') {
                result = edit.newText + result;
                continue;
            }
            if (edit.insertAt === 'end') {
                result = result + edit.newText;
                continue;
            }
            if (edit.range) {
                const { startLine, startColumn, endLine, endColumn } = edit.range;
                const beforeLines = lines.slice(0, startLine);
                const afterLines = lines.slice(endLine + 1);
                const startLineContent = lines[startLine] || '';
                const endLineContent = lines[endLine] || '';
                const beforeEdit = startLineContent.substring(0, startColumn);
                const afterEdit = endLineContent.substring(endColumn);
                const editedLine = beforeEdit + edit.newText + afterEdit;
                result = [
                    ...beforeLines,
                    editedLine,
                    ...afterLines,
                ].join('\n');
            }
        }
        return result;
    }
    /**
     * Compute diff hunks between original and modified content
     */
    computeDiffHunks(original, modified) {
        const originalLines = original.split('\n');
        const modifiedLines = modified.split('\n');
        const hunks = [];
        let i = 0;
        let j = 0;
        while (i < originalLines.length || j < modifiedLines.length) {
            // Find matching lines
            if (i < originalLines.length && j < modifiedLines.length && originalLines[i] === modifiedLines[j]) {
                i++;
                j++;
                continue;
            }
            // Found a difference
            const hunkStart = i;
            const originalHunkLines = [];
            const modifiedHunkLines = [];
            // Collect differing lines
            while (i < originalLines.length && (j >= modifiedLines.length || originalLines[i] !== modifiedLines[j])) {
                originalHunkLines.push(originalLines[i]);
                i++;
            }
            while (j < modifiedLines.length && (i >= originalLines.length || originalLines[i] !== modifiedLines[j])) {
                modifiedHunkLines.push(modifiedLines[j]);
                j++;
            }
            if (originalHunkLines.length > 0 || modifiedHunkLines.length > 0) {
                let type;
                if (originalHunkLines.length === 0) {
                    type = 'add';
                }
                else if (modifiedHunkLines.length === 0) {
                    type = 'remove';
                }
                else {
                    type = 'modify';
                }
                hunks.push({
                    startLine: hunkStart,
                    endLine: hunkStart + Math.max(originalHunkLines.length, modifiedHunkLines.length) - 1,
                    originalLines: originalHunkLines,
                    modifiedLines: modifiedHunkLines,
                    type,
                });
            }
        }
        return hunks;
    }
    /**
     * Show diff preview in VS Code
     */
    async showDiffPreview(preview) {
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        if (!workspaceFolder) {
            return;
        }
        // Create temporary URIs for diff view
        const originalUri = vscode.Uri.parse(`voiceflow-original:${preview.filePath}`);
        const modifiedUri = vscode.Uri.parse(`voiceflow-modified:${preview.filePath}`);
        // Register content providers
        const originalProvider = new (class {
            provideTextDocumentContent() {
                return preview.originalContent;
            }
        })();
        const modifiedProvider = new (class {
            provideTextDocumentContent() {
                return preview.modifiedContent;
            }
        })();
        const disposables = [
            vscode.workspace.registerTextDocumentContentProvider('voiceflow-original', originalProvider),
            vscode.workspace.registerTextDocumentContentProvider('voiceflow-modified', modifiedProvider),
        ];
        try {
            await vscode.commands.executeCommand('vscode.diff', originalUri, modifiedUri, `${preview.filePath} (Preview Changes)`);
        }
        finally {
            // Clean up providers after a delay
            setTimeout(() => {
                disposables.forEach(d => d.dispose());
            }, 60000);
        }
    }
    /**
     * Get session by ID
     */
    getSession(sessionId) {
        return this.sessions.get(sessionId);
    }
    /**
     * Get all sessions
     */
    getAllSessions() {
        return Array.from(this.sessions.values());
    }
    /**
     * Delete a session
     */
    deleteSession(sessionId) {
        this.undoStack.delete(sessionId);
        return this.sessions.delete(sessionId);
    }
    /**
     * Generate unique session ID
     */
    generateSessionId() {
        return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    /**
     * Create edit session from AI response
     */
    createSessionFromAIResponse(name, description, aiEdits) {
        const files = aiEdits.map(edit => {
            if (edit.action === 'delete') {
                return {
                    filePath: edit.file,
                    edits: [],
                    deleteFile: true,
                };
            }
            if (edit.action === 'create') {
                return {
                    filePath: edit.file,
                    edits: [{ newText: edit.content || '', replaceAll: true }],
                    createIfMissing: true,
                };
            }
            // Modify action
            const textEdits = [];
            if (edit.content) {
                textEdits.push({ newText: edit.content, replaceAll: true });
            }
            else if (edit.changes) {
                // Convert search/replace to text edits
                // This is a simplified version - real implementation would need line/column info
                for (const change of edit.changes) {
                    textEdits.push({
                        newText: change.replace,
                        // Note: In real implementation, we'd compute the range from search string
                    });
                }
            }
            return {
                filePath: edit.file,
                edits: textEdits,
            };
        });
        return this.createSession(name, description, files);
    }
    /**
     * Dispose resources
     */
    dispose() {
        this.sessions.clear();
        this.undoStack.clear();
        this._onSessionCreated.dispose();
        this._onSessionApplied.dispose();
        this._onSessionReverted.dispose();
        this._onPreviewGenerated.dispose();
    }
}
exports.MultiFileEditingService = MultiFileEditingService;
exports.default = MultiFileEditingService;
//# sourceMappingURL=MultiFileEditingService.js.map