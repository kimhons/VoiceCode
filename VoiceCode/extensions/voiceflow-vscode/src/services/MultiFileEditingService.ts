/**
 * Multi-File Editing Service
 * Enables coordinated editing across multiple files
 * Critical feature for competing with Cursor and Cline
 */

import * as vscode from 'vscode';

// Utility functions for text encoding/decoding
const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder('utf-8');

function encodeText(text: string): Uint8Array {
  return textEncoder.encode(text);
}

function decodeText(data: Uint8Array): string {
  return textDecoder.decode(data);
}

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
  errors: Array<{ file: string; error: string }>;
}

/**
 * Multi-File Editing Service
 */
export class MultiFileEditingService {
  private config: vscode.WorkspaceConfiguration;
  private sessions: Map<string, EditSession> = new Map();
  private undoStack: Map<string, Map<string, string>> = new Map(); // sessionId -> filePath -> originalContent
  
  // Event emitters
  private readonly _onSessionCreated = new vscode.EventEmitter<EditSession>();
  private readonly _onSessionApplied = new vscode.EventEmitter<EditSession>();
  private readonly _onSessionReverted = new vscode.EventEmitter<EditSession>();
  private readonly _onPreviewGenerated = new vscode.EventEmitter<DiffPreview[]>();
  
  public readonly onSessionCreated = this._onSessionCreated.event;
  public readonly onSessionApplied = this._onSessionApplied.event;
  public readonly onSessionReverted = this._onSessionReverted.event;
  public readonly onPreviewGenerated = this._onPreviewGenerated.event;

  constructor(config: vscode.WorkspaceConfiguration) {
    this.config = config;
  }

  /**
   * Create a new edit session
   */
  public createSession(name: string, description: string, files: FileEdit[]): EditSession {
    const session: EditSession = {
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
  public async generatePreviews(sessionId: string): Promise<DiffPreview[]> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }

    const previews: DiffPreview[] = [];
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
      } catch {
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
  public async applySession(sessionId: string): Promise<EditResult> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }

    const result: EditResult = {
      success: true,
      filesModified: 0,
      filesCreated: 0,
      filesDeleted: 0,
      errors: [],
    };

    // Store original contents for undo
    const originalContents = new Map<string, string>();
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
          } catch {
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
        } catch {
          if (fileEdit.createIfMissing) {
            isNewFile = true;
          } else {
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
        } else {
          result.filesModified++;
        }
      } catch (error) {
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
  public async revertSession(sessionId: string): Promise<EditResult> {
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

    const result: EditResult = {
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
        } else {
          // Restore original content
          await vscode.workspace.fs.writeFile(uri, encodeText(originalContent));
          result.filesModified++;
        }
      } catch (error) {
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
  private applyEditsToContent(content: string, edits: TextEdit[]): string {
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
  private computeDiffHunks(original: string, modified: string): DiffHunk[] {
    const originalLines = original.split('\n');
    const modifiedLines = modified.split('\n');
    const hunks: DiffHunk[] = [];

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
      const originalHunkLines: string[] = [];
      const modifiedHunkLines: string[] = [];

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
        let type: 'add' | 'remove' | 'modify';
        if (originalHunkLines.length === 0) {
          type = 'add';
        } else if (modifiedHunkLines.length === 0) {
          type = 'remove';
        } else {
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
  public async showDiffPreview(preview: DiffPreview): Promise<void> {
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    if (!workspaceFolder) {
      return;
    }

    // Create temporary URIs for diff view
    const originalUri = vscode.Uri.parse(`voiceflow-original:${preview.filePath}`);
    const modifiedUri = vscode.Uri.parse(`voiceflow-modified:${preview.filePath}`);

    // Register content providers
    const originalProvider = new (class implements vscode.TextDocumentContentProvider {
      provideTextDocumentContent(): string {
        return preview.originalContent;
      }
    })();

    const modifiedProvider = new (class implements vscode.TextDocumentContentProvider {
      provideTextDocumentContent(): string {
        return preview.modifiedContent;
      }
    })();

    const disposables = [
      vscode.workspace.registerTextDocumentContentProvider('voiceflow-original', originalProvider),
      vscode.workspace.registerTextDocumentContentProvider('voiceflow-modified', modifiedProvider),
    ];

    try {
      await vscode.commands.executeCommand(
        'vscode.diff',
        originalUri,
        modifiedUri,
        `${preview.filePath} (Preview Changes)`
      );
    } finally {
      // Clean up providers after a delay
      setTimeout(() => {
        disposables.forEach(d => d.dispose());
      }, 60000);
    }
  }

  /**
   * Get session by ID
   */
  public getSession(sessionId: string): EditSession | undefined {
    return this.sessions.get(sessionId);
  }

  /**
   * Get all sessions
   */
  public getAllSessions(): EditSession[] {
    return Array.from(this.sessions.values());
  }

  /**
   * Delete a session
   */
  public deleteSession(sessionId: string): boolean {
    this.undoStack.delete(sessionId);
    return this.sessions.delete(sessionId);
  }

  /**
   * Generate unique session ID
   */
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Create edit session from AI response
   */
  public createSessionFromAIResponse(
    name: string,
    description: string,
    aiEdits: Array<{
      file: string;
      action: 'create' | 'modify' | 'delete';
      content?: string;
      changes?: Array<{
        search: string;
        replace: string;
      }>;
    }>
  ): EditSession {
    const files: FileEdit[] = aiEdits.map(edit => {
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
      const textEdits: TextEdit[] = [];

      if (edit.content) {
        textEdits.push({ newText: edit.content, replaceAll: true });
      } else if (edit.changes) {
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
  public dispose(): void {
    this.sessions.clear();
    this.undoStack.clear();
    this._onSessionCreated.dispose();
    this._onSessionApplied.dispose();
    this._onSessionReverted.dispose();
    this._onPreviewGenerated.dispose();
  }
}

export default MultiFileEditingService;
