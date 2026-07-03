/**
 * VS Code Voice Control System
 * Provides comprehensive voice control over VS Code functionality
 * Enables hands-free development through natural language commands
 */

import * as vscode from 'vscode';
import { VoiceAgentRouter } from './voiceAgentRouter';
import { InternalAgentBridge } from './internalAgentBridge';
import { SubagentType } from '../types/agents';

/**
 * Voice command categories
 */
export enum VoiceCommandCategory {
    NAVIGATION = 'navigation',
    EDITING = 'editing',
    FILE_OPERATIONS = 'file_operations',
    WORKSPACE = 'workspace',
    DEBUGGING = 'debugging',
    GIT = 'git',
    TERMINAL = 'terminal',
    SEARCH = 'search',
    VIEW = 'view',
    WINDOW = 'window',
    AGENT = 'agent',
    CUSTOM = 'custom'
}

/**
 * Voice command definition
 */
interface VoiceCommand {
    patterns: RegExp[];
    category: VoiceCommandCategory;
    description: string;
    action: (match: RegExpMatchArray, context: VoiceCommandContext) => Promise<void>;
    examples: string[];
    requiresSelection?: boolean;
    requiresEditor?: boolean;
}

/**
 * Voice command context
 */
interface VoiceCommandContext {
    editor?: vscode.TextEditor;
    selection?: vscode.Selection;
    document?: vscode.TextDocument;
    workspaceFolder?: vscode.WorkspaceFolder;
    bridge: InternalAgentBridge;
    router: VoiceAgentRouter;
}

/**
 * Voice command execution result
 */
interface VoiceCommandResult {
    success: boolean;
    command: string;
    category: VoiceCommandCategory;
    message?: string;
    error?: string;
}

/**
 * VS Code Voice Control System
 */
export class VSCodeVoiceControl implements vscode.Disposable {
    private commands: VoiceCommand[] = [];
    private bridge: InternalAgentBridge;
    private router: VoiceAgentRouter;
    private outputChannel: vscode.OutputChannel;
    private statusBarItem: vscode.StatusBarItem;
    private isListening = false;
    private commandHistory: VoiceCommandResult[] = [];
    private maxHistorySize = 100;
    private customCommands: Map<string, VoiceCommand> = new Map();

    constructor(bridge: InternalAgentBridge, router: VoiceAgentRouter) {
        this.bridge = bridge;
        this.router = router;
        this.outputChannel = vscode.window.createOutputChannel('VoiceCode Voice Control');
        this.statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 98);

        this.initializeCommands();
        this.updateStatusBar();
    }

    /**
     * Initialize all voice commands
     */
    private initializeCommands(): void {
        // Navigation Commands
        this.addNavigationCommands();

        // Editing Commands
        this.addEditingCommands();

        // File Operations Commands
        this.addFileOperationsCommands();

        // Workspace Commands
        this.addWorkspaceCommands();

        // Debugging Commands
        this.addDebuggingCommands();

        // Git Commands
        this.addGitCommands();

        // Terminal Commands
        this.addTerminalCommands();

        // Search Commands
        this.addSearchCommands();

        // View Commands
        this.addViewCommands();

        // Window Commands
        this.addWindowCommands();
    }

    /**
     * Add navigation commands
     */
    private addNavigationCommands(): void {
        this.commands.push({
            patterns: [
                /^go\s+to\s+line\s+(\d+)$/i,
                /^jump\s+to\s+line\s+(\d+)$/i,
                /^line\s+(\d+)$/i
            ],
            category: VoiceCommandCategory.NAVIGATION,
            description: 'Go to specific line number',
            examples: ['go to line 42', 'jump to line 100', 'line 50'],
            requiresEditor: true,
            action: async (match, ctx) => {
                const lineNumber = parseInt(match[1], 10) - 1;
                if (ctx.editor) {
                    const position = new vscode.Position(lineNumber, 0);
                    ctx.editor.selection = new vscode.Selection(position, position);
                    ctx.editor.revealRange(new vscode.Range(position, position), vscode.TextEditorRevealType.InCenter);
                }
            }
        });

        this.commands.push({
            patterns: [
                /^go\s+to\s+(?:the\s+)?(?:definition|def)$/i,
                /^show\s+definition$/i
            ],
            category: VoiceCommandCategory.NAVIGATION,
            description: 'Go to definition of symbol under cursor',
            examples: ['go to definition', 'show definition'],
            requiresEditor: true,
            action: async () => {
                await vscode.commands.executeCommand('editor.action.revealDefinition');
            }
        });

        this.commands.push({
            patterns: [
                /^go\s+to\s+(?:symbol|function|class)\s+(.+)$/i,
                /^find\s+(?:symbol|function|class)\s+(.+)$/i
            ],
            category: VoiceCommandCategory.NAVIGATION,
            description: 'Go to symbol by name',
            examples: ['go to symbol handleClick', 'find function processData'],
            action: async (match) => {
                const symbolName = match[1];
                await vscode.commands.executeCommand('workbench.action.gotoSymbol');
                // Type the symbol name
                await vscode.commands.executeCommand('type', { text: symbolName });
            }
        });

        this.commands.push({
            patterns: [
                /^go\s+(?:to\s+)?(?:the\s+)?(?:top|beginning|start)$/i,
                /^(?:top|beginning|start)\s+of\s+file$/i
            ],
            category: VoiceCommandCategory.NAVIGATION,
            description: 'Go to top of file',
            examples: ['go to top', 'beginning of file'],
            requiresEditor: true,
            action: async (match, ctx) => {
                if (ctx.editor) {
                    const position = new vscode.Position(0, 0);
                    ctx.editor.selection = new vscode.Selection(position, position);
                    ctx.editor.revealRange(new vscode.Range(position, position));
                }
            }
        });

        this.commands.push({
            patterns: [
                /^go\s+(?:to\s+)?(?:the\s+)?(?:bottom|end)$/i,
                /^(?:bottom|end)\s+of\s+file$/i
            ],
            category: VoiceCommandCategory.NAVIGATION,
            description: 'Go to end of file',
            examples: ['go to bottom', 'end of file'],
            requiresEditor: true,
            action: async (match, ctx) => {
                if (ctx.editor && ctx.document) {
                    const lastLine = ctx.document.lineCount - 1;
                    const lastChar = ctx.document.lineAt(lastLine).text.length;
                    const position = new vscode.Position(lastLine, lastChar);
                    ctx.editor.selection = new vscode.Selection(position, position);
                    ctx.editor.revealRange(new vscode.Range(position, position));
                }
            }
        });

        this.commands.push({
            patterns: [
                /^go\s+back$/i,
                /^navigate\s+back$/i,
                /^previous\s+location$/i
            ],
            category: VoiceCommandCategory.NAVIGATION,
            description: 'Go back to previous location',
            examples: ['go back', 'navigate back', 'previous location'],
            action: async () => {
                await vscode.commands.executeCommand('workbench.action.navigateBack');
            }
        });

        this.commands.push({
            patterns: [
                /^go\s+forward$/i,
                /^navigate\s+forward$/i,
                /^next\s+location$/i
            ],
            category: VoiceCommandCategory.NAVIGATION,
            description: 'Go forward to next location',
            examples: ['go forward', 'navigate forward'],
            action: async () => {
                await vscode.commands.executeCommand('workbench.action.navigateForward');
            }
        });

        this.commands.push({
            patterns: [
                /^go\s+to\s+(?:matching\s+)?bracket$/i,
                /^jump\s+to\s+(?:matching\s+)?bracket$/i
            ],
            category: VoiceCommandCategory.NAVIGATION,
            description: 'Go to matching bracket',
            examples: ['go to bracket', 'jump to matching bracket'],
            requiresEditor: true,
            action: async () => {
                await vscode.commands.executeCommand('editor.action.jumpToBracket');
            }
        });
    }

    /**
     * Add editing commands
     */
    private addEditingCommands(): void {
        this.commands.push({
            patterns: [
                /^(?:delete|remove)\s+(?:this\s+)?line$/i,
                /^(?:delete|remove)\s+current\s+line$/i
            ],
            category: VoiceCommandCategory.EDITING,
            description: 'Delete current line',
            examples: ['delete line', 'remove this line'],
            requiresEditor: true,
            action: async () => {
                await vscode.commands.executeCommand('editor.action.deleteLines');
            }
        });

        this.commands.push({
            patterns: [
                /^(?:delete|remove)\s+(?:lines?\s+)?(\d+)\s+(?:to|through)\s+(\d+)$/i
            ],
            category: VoiceCommandCategory.EDITING,
            description: 'Delete range of lines',
            examples: ['delete lines 10 to 20', 'remove 5 through 15'],
            requiresEditor: true,
            action: async (match, ctx) => {
                if (ctx.editor) {
                    const start = parseInt(match[1], 10) - 1;
                    const end = parseInt(match[2], 10);
                    const range = new vscode.Range(
                        new vscode.Position(start, 0),
                        new vscode.Position(end, 0)
                    );
                    await ctx.editor.edit(editBuilder => {
                        editBuilder.delete(range);
                    });
                }
            }
        });

        this.commands.push({
            patterns: [
                /^duplicate\s+(?:this\s+)?line$/i,
                /^copy\s+line\s+(?:down|below)$/i
            ],
            category: VoiceCommandCategory.EDITING,
            description: 'Duplicate current line',
            examples: ['duplicate line', 'copy line down'],
            requiresEditor: true,
            action: async () => {
                await vscode.commands.executeCommand('editor.action.copyLinesDownAction');
            }
        });

        this.commands.push({
            patterns: [
                /^move\s+line\s+up$/i,
                /^shift\s+line\s+up$/i
            ],
            category: VoiceCommandCategory.EDITING,
            description: 'Move line up',
            examples: ['move line up', 'shift line up'],
            requiresEditor: true,
            action: async () => {
                await vscode.commands.executeCommand('editor.action.moveLinesUpAction');
            }
        });

        this.commands.push({
            patterns: [
                /^move\s+line\s+down$/i,
                /^shift\s+line\s+down$/i
            ],
            category: VoiceCommandCategory.EDITING,
            description: 'Move line down',
            examples: ['move line down', 'shift line down'],
            requiresEditor: true,
            action: async () => {
                await vscode.commands.executeCommand('editor.action.moveLinesDownAction');
            }
        });

        this.commands.push({
            patterns: [
                /^(?:comment|toggle\s+comment)$/i,
                /^(?:comment|uncomment)\s+(?:this\s+)?line$/i
            ],
            category: VoiceCommandCategory.EDITING,
            description: 'Toggle line comment',
            examples: ['comment', 'comment this line', 'toggle comment'],
            requiresEditor: true,
            action: async () => {
                await vscode.commands.executeCommand('editor.action.commentLine');
            }
        });

        this.commands.push({
            patterns: [
                /^block\s+comment$/i,
                /^(?:comment|uncomment)\s+block$/i
            ],
            category: VoiceCommandCategory.EDITING,
            description: 'Toggle block comment',
            examples: ['block comment', 'comment block'],
            requiresEditor: true,
            action: async () => {
                await vscode.commands.executeCommand('editor.action.blockComment');
            }
        });

        this.commands.push({
            patterns: [
                /^format\s+(?:document|file)$/i,
                /^prettify$/i,
                /^beautify$/i
            ],
            category: VoiceCommandCategory.EDITING,
            description: 'Format document',
            examples: ['format document', 'prettify', 'beautify'],
            requiresEditor: true,
            action: async () => {
                await vscode.commands.executeCommand('editor.action.formatDocument');
            }
        });

        this.commands.push({
            patterns: [
                /^format\s+selection$/i,
                /^format\s+selected$/i
            ],
            category: VoiceCommandCategory.EDITING,
            description: 'Format selection',
            examples: ['format selection', 'format selected'],
            requiresEditor: true,
            requiresSelection: true,
            action: async () => {
                await vscode.commands.executeCommand('editor.action.formatSelection');
            }
        });

        this.commands.push({
            patterns: [
                /^undo$/i,
                /^undo\s+(?:that|last)$/i
            ],
            category: VoiceCommandCategory.EDITING,
            description: 'Undo last action',
            examples: ['undo', 'undo that'],
            action: async () => {
                await vscode.commands.executeCommand('undo');
            }
        });

        this.commands.push({
            patterns: [
                /^redo$/i,
                /^redo\s+(?:that|last)$/i
            ],
            category: VoiceCommandCategory.EDITING,
            description: 'Redo last action',
            examples: ['redo', 'redo that'],
            action: async () => {
                await vscode.commands.executeCommand('redo');
            }
        });

        this.commands.push({
            patterns: [
                /^select\s+all$/i,
                /^highlight\s+all$/i
            ],
            category: VoiceCommandCategory.EDITING,
            description: 'Select all text',
            examples: ['select all', 'highlight all'],
            requiresEditor: true,
            action: async () => {
                await vscode.commands.executeCommand('editor.action.selectAll');
            }
        });

        this.commands.push({
            patterns: [
                /^select\s+line$/i,
                /^select\s+(?:this|current)\s+line$/i
            ],
            category: VoiceCommandCategory.EDITING,
            description: 'Select current line',
            examples: ['select line', 'select this line'],
            requiresEditor: true,
            action: async () => {
                await vscode.commands.executeCommand('expandLineSelection');
            }
        });

        this.commands.push({
            patterns: [
                /^select\s+word$/i,
                /^select\s+(?:this|current)\s+word$/i
            ],
            category: VoiceCommandCategory.EDITING,
            description: 'Select word under cursor',
            examples: ['select word', 'select this word'],
            requiresEditor: true,
            action: async () => {
                await vscode.commands.executeCommand('editor.action.addSelectionToNextFindMatch');
            }
        });

        this.commands.push({
            patterns: [
                /^(?:insert|add)\s+line\s+(?:above|before)$/i,
                /^new\s+line\s+above$/i
            ],
            category: VoiceCommandCategory.EDITING,
            description: 'Insert line above',
            examples: ['insert line above', 'new line above'],
            requiresEditor: true,
            action: async () => {
                await vscode.commands.executeCommand('editor.action.insertLineBefore');
            }
        });

        this.commands.push({
            patterns: [
                /^(?:insert|add)\s+line\s+(?:below|after)$/i,
                /^new\s+line\s+below$/i
            ],
            category: VoiceCommandCategory.EDITING,
            description: 'Insert line below',
            examples: ['insert line below', 'new line below'],
            requiresEditor: true,
            action: async () => {
                await vscode.commands.executeCommand('editor.action.insertLineAfter');
            }
        });

        this.commands.push({
            patterns: [
                /^(?:change|replace)\s+(.+)\s+(?:to|with)\s+(.+)$/i,
                /^substitute\s+(.+)\s+(?:for|with)\s+(.+)$/i
            ],
            category: VoiceCommandCategory.EDITING,
            description: 'Replace text',
            examples: ['change foo to bar', 'replace old with new'],
            requiresEditor: true,
            action: async (match, ctx) => {
                if (ctx.editor && ctx.document) {
                    const searchText = match[1].trim();
                    const replaceText = match[2].trim();
                    const text = ctx.document.getText();
                    const newText = text.replace(new RegExp(searchText, 'g'), replaceText);

                    const fullRange = new vscode.Range(
                        ctx.document.positionAt(0),
                        ctx.document.positionAt(text.length)
                    );

                    await ctx.editor.edit(editBuilder => {
                        editBuilder.replace(fullRange, newText);
                    });
                }
            }
        });

        this.commands.push({
            patterns: [
                /^indent$/i,
                /^tab$/i
            ],
            category: VoiceCommandCategory.EDITING,
            description: 'Indent selection',
            examples: ['indent', 'tab'],
            requiresEditor: true,
            action: async () => {
                await vscode.commands.executeCommand('editor.action.indentLines');
            }
        });

        this.commands.push({
            patterns: [
                /^(?:outdent|unindent)$/i,
                /^shift\s+tab$/i
            ],
            category: VoiceCommandCategory.EDITING,
            description: 'Outdent selection',
            examples: ['outdent', 'unindent', 'shift tab'],
            requiresEditor: true,
            action: async () => {
                await vscode.commands.executeCommand('editor.action.outdentLines');
            }
        });
    }

    /**
     * Add file operations commands
     */
    private addFileOperationsCommands(): void {
        this.commands.push({
            patterns: [
                /^save$/i,
                /^save\s+file$/i
            ],
            category: VoiceCommandCategory.FILE_OPERATIONS,
            description: 'Save current file',
            examples: ['save', 'save file'],
            action: async () => {
                await vscode.commands.executeCommand('workbench.action.files.save');
            }
        });

        this.commands.push({
            patterns: [
                /^save\s+all$/i,
                /^save\s+all\s+files$/i
            ],
            category: VoiceCommandCategory.FILE_OPERATIONS,
            description: 'Save all files',
            examples: ['save all', 'save all files'],
            action: async () => {
                await vscode.commands.executeCommand('workbench.action.files.saveAll');
            }
        });

        this.commands.push({
            patterns: [
                /^new\s+file$/i,
                /^create\s+(?:new\s+)?file$/i
            ],
            category: VoiceCommandCategory.FILE_OPERATIONS,
            description: 'Create new file',
            examples: ['new file', 'create file'],
            action: async () => {
                await vscode.commands.executeCommand('workbench.action.files.newUntitledFile');
            }
        });

        this.commands.push({
            patterns: [
                /^open\s+file$/i,
                /^open$/i
            ],
            category: VoiceCommandCategory.FILE_OPERATIONS,
            description: 'Open file dialog',
            examples: ['open file', 'open'],
            action: async () => {
                await vscode.commands.executeCommand('workbench.action.files.openFile');
            }
        });

        this.commands.push({
            patterns: [
                /^open\s+(?:file\s+)?(.+)$/i
            ],
            category: VoiceCommandCategory.FILE_OPERATIONS,
            description: 'Open specific file',
            examples: ['open index.js', 'open file package.json'],
            action: async (match) => {
                const fileName = match[1].trim();
                await vscode.commands.executeCommand('workbench.action.quickOpen', fileName);
            }
        });

        this.commands.push({
            patterns: [
                /^close$/i,
                /^close\s+(?:this\s+)?(?:file|editor|tab)$/i
            ],
            category: VoiceCommandCategory.FILE_OPERATIONS,
            description: 'Close current file',
            examples: ['close', 'close file', 'close tab'],
            action: async () => {
                await vscode.commands.executeCommand('workbench.action.closeActiveEditor');
            }
        });

        this.commands.push({
            patterns: [
                /^close\s+all$/i,
                /^close\s+all\s+(?:files|editors|tabs)$/i
            ],
            category: VoiceCommandCategory.FILE_OPERATIONS,
            description: 'Close all files',
            examples: ['close all', 'close all files'],
            action: async () => {
                await vscode.commands.executeCommand('workbench.action.closeAllEditors');
            }
        });

        this.commands.push({
            patterns: [
                /^rename\s+file$/i,
                /^rename\s+(?:this\s+)?file\s+(?:to\s+)?(.+)$/i
            ],
            category: VoiceCommandCategory.FILE_OPERATIONS,
            description: 'Rename current file',
            examples: ['rename file', 'rename file to newname.js'],
            action: async () => {
                await vscode.commands.executeCommand('workbench.files.action.showActiveFileInExplorer');
                await vscode.commands.executeCommand('renameFile');
            }
        });

        this.commands.push({
            patterns: [
                /^delete\s+(?:this\s+)?file$/i,
                /^remove\s+(?:this\s+)?file$/i
            ],
            category: VoiceCommandCategory.FILE_OPERATIONS,
            description: 'Delete current file',
            examples: ['delete file', 'remove file'],
            action: async () => {
                await vscode.commands.executeCommand('workbench.files.action.showActiveFileInExplorer');
                await vscode.commands.executeCommand('deleteFile');
            }
        });

        this.commands.push({
            patterns: [
                /^reveal\s+(?:in\s+)?(?:file\s+)?explorer$/i,
                /^show\s+in\s+explorer$/i
            ],
            category: VoiceCommandCategory.FILE_OPERATIONS,
            description: 'Reveal file in explorer',
            examples: ['reveal in explorer', 'show in explorer'],
            action: async () => {
                await vscode.commands.executeCommand('workbench.files.action.showActiveFileInExplorer');
            }
        });
    }

    /**
     * Add workspace commands
     */
    private addWorkspaceCommands(): void {
        this.commands.push({
            patterns: [
                /^open\s+(?:folder|workspace)$/i
            ],
            category: VoiceCommandCategory.WORKSPACE,
            description: 'Open folder',
            examples: ['open folder', 'open workspace'],
            action: async () => {
                await vscode.commands.executeCommand('workbench.action.files.openFolder');
            }
        });

        this.commands.push({
            patterns: [
                /^add\s+(?:folder|workspace)\s+(?:to\s+)?(?:workspace)?$/i
            ],
            category: VoiceCommandCategory.WORKSPACE,
            description: 'Add folder to workspace',
            examples: ['add folder to workspace', 'add folder'],
            action: async () => {
                await vscode.commands.executeCommand('workbench.action.addRootFolder');
            }
        });

        this.commands.push({
            patterns: [
                /^reload\s+window$/i,
                /^refresh\s+window$/i
            ],
            category: VoiceCommandCategory.WORKSPACE,
            description: 'Reload window',
            examples: ['reload window', 'refresh window'],
            action: async () => {
                await vscode.commands.executeCommand('workbench.action.reloadWindow');
            }
        });
    }

    /**
     * Add debugging commands
     */
    private addDebuggingCommands(): void {
        this.commands.push({
            patterns: [
                /^start\s+debug(?:ging)?$/i,
                /^debug$/i,
                /^run\s+debug(?:ger)?$/i
            ],
            category: VoiceCommandCategory.DEBUGGING,
            description: 'Start debugging',
            examples: ['start debugging', 'debug', 'run debugger'],
            action: async () => {
                await vscode.commands.executeCommand('workbench.action.debug.start');
            }
        });

        this.commands.push({
            patterns: [
                /^stop\s+debug(?:ging)?$/i,
                /^end\s+debug(?:ging)?$/i
            ],
            category: VoiceCommandCategory.DEBUGGING,
            description: 'Stop debugging',
            examples: ['stop debugging', 'end debugging'],
            action: async () => {
                await vscode.commands.executeCommand('workbench.action.debug.stop');
            }
        });

        this.commands.push({
            patterns: [
                /^restart\s+debug(?:ging)?$/i
            ],
            category: VoiceCommandCategory.DEBUGGING,
            description: 'Restart debugging',
            examples: ['restart debugging'],
            action: async () => {
                await vscode.commands.executeCommand('workbench.action.debug.restart');
            }
        });

        this.commands.push({
            patterns: [
                /^(?:toggle\s+)?breakpoint$/i,
                /^add\s+breakpoint$/i,
                /^remove\s+breakpoint$/i
            ],
            category: VoiceCommandCategory.DEBUGGING,
            description: 'Toggle breakpoint',
            examples: ['toggle breakpoint', 'add breakpoint'],
            requiresEditor: true,
            action: async () => {
                await vscode.commands.executeCommand('editor.debug.action.toggleBreakpoint');
            }
        });

        this.commands.push({
            patterns: [
                /^step\s+over$/i,
                /^next\s+line$/i
            ],
            category: VoiceCommandCategory.DEBUGGING,
            description: 'Step over',
            examples: ['step over', 'next line'],
            action: async () => {
                await vscode.commands.executeCommand('workbench.action.debug.stepOver');
            }
        });

        this.commands.push({
            patterns: [
                /^step\s+into$/i,
                /^enter\s+function$/i
            ],
            category: VoiceCommandCategory.DEBUGGING,
            description: 'Step into',
            examples: ['step into', 'enter function'],
            action: async () => {
                await vscode.commands.executeCommand('workbench.action.debug.stepInto');
            }
        });

        this.commands.push({
            patterns: [
                /^step\s+out$/i,
                /^exit\s+function$/i
            ],
            category: VoiceCommandCategory.DEBUGGING,
            description: 'Step out',
            examples: ['step out', 'exit function'],
            action: async () => {
                await vscode.commands.executeCommand('workbench.action.debug.stepOut');
            }
        });

        this.commands.push({
            patterns: [
                /^continue$/i,
                /^resume$/i
            ],
            category: VoiceCommandCategory.DEBUGGING,
            description: 'Continue debugging',
            examples: ['continue', 'resume'],
            action: async () => {
                await vscode.commands.executeCommand('workbench.action.debug.continue');
            }
        });
    }

    /**
     * Add git commands
     */
    private addGitCommands(): void {
        this.commands.push({
            patterns: [
                /^git\s+status$/i,
                /^show\s+git\s+status$/i
            ],
            category: VoiceCommandCategory.GIT,
            description: 'Show git status',
            examples: ['git status', 'show git status'],
            action: async () => {
                await vscode.commands.executeCommand('git.viewChanges');
            }
        });

        this.commands.push({
            patterns: [
                /^git\s+commit$/i,
                /^commit\s+changes$/i
            ],
            category: VoiceCommandCategory.GIT,
            description: 'Commit changes',
            examples: ['git commit', 'commit changes'],
            action: async () => {
                await vscode.commands.executeCommand('git.commit');
            }
        });

        this.commands.push({
            patterns: [
                /^git\s+push$/i,
                /^push\s+(?:changes|commits)$/i
            ],
            category: VoiceCommandCategory.GIT,
            description: 'Push commits',
            examples: ['git push', 'push changes'],
            action: async () => {
                await vscode.commands.executeCommand('git.push');
            }
        });

        this.commands.push({
            patterns: [
                /^git\s+pull$/i,
                /^pull\s+(?:changes|latest)$/i
            ],
            category: VoiceCommandCategory.GIT,
            description: 'Pull latest',
            examples: ['git pull', 'pull latest'],
            action: async () => {
                await vscode.commands.executeCommand('git.pull');
            }
        });

        this.commands.push({
            patterns: [
                /^stage\s+(?:all\s+)?(?:changes|files)$/i,
                /^git\s+add\s+all$/i
            ],
            category: VoiceCommandCategory.GIT,
            description: 'Stage all changes',
            examples: ['stage all changes', 'git add all'],
            action: async () => {
                await vscode.commands.executeCommand('git.stageAll');
            }
        });

        this.commands.push({
            patterns: [
                /^unstage\s+(?:all\s+)?(?:changes|files)$/i
            ],
            category: VoiceCommandCategory.GIT,
            description: 'Unstage all changes',
            examples: ['unstage all changes'],
            action: async () => {
                await vscode.commands.executeCommand('git.unstageAll');
            }
        });

        this.commands.push({
            patterns: [
                /^create\s+branch\s+(.+)$/i,
                /^new\s+branch\s+(.+)$/i
            ],
            category: VoiceCommandCategory.GIT,
            description: 'Create new branch',
            examples: ['create branch feature/new', 'new branch bugfix'],
            action: async (match) => {
                const branchName = match[1].trim();
                await vscode.commands.executeCommand('git.branch', branchName);
            }
        });

        this.commands.push({
            patterns: [
                /^switch\s+(?:to\s+)?branch\s+(.+)$/i,
                /^checkout\s+(.+)$/i
            ],
            category: VoiceCommandCategory.GIT,
            description: 'Switch branch',
            examples: ['switch to branch main', 'checkout develop'],
            action: async (match) => {
                const branchName = match[1].trim();
                await vscode.commands.executeCommand('git.checkout', branchName);
            }
        });
    }

    /**
     * Add terminal commands
     */
    private addTerminalCommands(): void {
        this.commands.push({
            patterns: [
                /^(?:open|show|toggle)\s+terminal$/i,
                /^new\s+terminal$/i
            ],
            category: VoiceCommandCategory.TERMINAL,
            description: 'Open terminal',
            examples: ['open terminal', 'new terminal', 'show terminal'],
            action: async () => {
                await vscode.commands.executeCommand('workbench.action.terminal.toggleTerminal');
            }
        });

        this.commands.push({
            patterns: [
                /^create\s+(?:new\s+)?terminal$/i
            ],
            category: VoiceCommandCategory.TERMINAL,
            description: 'Create new terminal',
            examples: ['create terminal', 'create new terminal'],
            action: async () => {
                await vscode.commands.executeCommand('workbench.action.terminal.new');
            }
        });

        this.commands.push({
            patterns: [
                /^run\s+(?:command\s+)?(.+)$/i,
                /^execute\s+(.+)$/i
            ],
            category: VoiceCommandCategory.TERMINAL,
            description: 'Run terminal command',
            examples: ['run npm install', 'execute git status'],
            action: async (match) => {
                const command = match[1].trim();
                const terminal = vscode.window.activeTerminal || vscode.window.createTerminal();
                terminal.show();
                terminal.sendText(command);
            }
        });

        this.commands.push({
            patterns: [
                /^clear\s+terminal$/i
            ],
            category: VoiceCommandCategory.TERMINAL,
            description: 'Clear terminal',
            examples: ['clear terminal'],
            action: async () => {
                await vscode.commands.executeCommand('workbench.action.terminal.clear');
            }
        });

        this.commands.push({
            patterns: [
                /^(?:kill|close)\s+terminal$/i
            ],
            category: VoiceCommandCategory.TERMINAL,
            description: 'Kill terminal',
            examples: ['kill terminal', 'close terminal'],
            action: async () => {
                await vscode.commands.executeCommand('workbench.action.terminal.kill');
            }
        });
    }

    /**
     * Add search commands
     */
    private addSearchCommands(): void {
        this.commands.push({
            patterns: [
                /^find$/i,
                /^search$/i,
                /^find\s+in\s+file$/i
            ],
            category: VoiceCommandCategory.SEARCH,
            description: 'Open find dialog',
            examples: ['find', 'search', 'find in file'],
            action: async () => {
                await vscode.commands.executeCommand('actions.find');
            }
        });

        this.commands.push({
            patterns: [
                /^find\s+and\s+replace$/i,
                /^search\s+and\s+replace$/i,
                /^replace$/i
            ],
            category: VoiceCommandCategory.SEARCH,
            description: 'Open find and replace',
            examples: ['find and replace', 'replace'],
            action: async () => {
                await vscode.commands.executeCommand('editor.action.startFindReplaceAction');
            }
        });

        this.commands.push({
            patterns: [
                /^find\s+(.+)$/i,
                /^search\s+(?:for\s+)?(.+)$/i
            ],
            category: VoiceCommandCategory.SEARCH,
            description: 'Find specific text',
            examples: ['find function', 'search for error'],
            action: async (match) => {
                const searchText = match[1].trim();
                await vscode.commands.executeCommand('actions.find');
                await vscode.commands.executeCommand('type', { text: searchText });
            }
        });

        this.commands.push({
            patterns: [
                /^(?:search|find)\s+(?:in\s+)?(?:all\s+)?files$/i,
                /^global\s+search$/i
            ],
            category: VoiceCommandCategory.SEARCH,
            description: 'Search in all files',
            examples: ['search in files', 'global search'],
            action: async () => {
                await vscode.commands.executeCommand('workbench.action.findInFiles');
            }
        });

        this.commands.push({
            patterns: [
                /^find\s+next$/i,
                /^next\s+match$/i
            ],
            category: VoiceCommandCategory.SEARCH,
            description: 'Find next match',
            examples: ['find next', 'next match'],
            action: async () => {
                await vscode.commands.executeCommand('editor.action.nextMatchFindAction');
            }
        });

        this.commands.push({
            patterns: [
                /^find\s+previous$/i,
                /^previous\s+match$/i
            ],
            category: VoiceCommandCategory.SEARCH,
            description: 'Find previous match',
            examples: ['find previous', 'previous match'],
            action: async () => {
                await vscode.commands.executeCommand('editor.action.previousMatchFindAction');
            }
        });
    }

    /**
     * Add view commands
     */
    private addViewCommands(): void {
        this.commands.push({
            patterns: [
                /^(?:show|toggle|open)\s+(?:file\s+)?explorer$/i,
                /^explorer$/i
            ],
            category: VoiceCommandCategory.VIEW,
            description: 'Show explorer',
            examples: ['show explorer', 'open explorer'],
            action: async () => {
                await vscode.commands.executeCommand('workbench.view.explorer');
            }
        });

        this.commands.push({
            patterns: [
                /^(?:show|toggle|open)\s+(?:source\s+)?control$/i,
                /^(?:show|toggle|open)\s+git$/i
            ],
            category: VoiceCommandCategory.VIEW,
            description: 'Show source control',
            examples: ['show source control', 'open git'],
            action: async () => {
                await vscode.commands.executeCommand('workbench.view.scm');
            }
        });

        this.commands.push({
            patterns: [
                /^(?:show|toggle|open)\s+extensions$/i
            ],
            category: VoiceCommandCategory.VIEW,
            description: 'Show extensions',
            examples: ['show extensions', 'open extensions'],
            action: async () => {
                await vscode.commands.executeCommand('workbench.view.extensions');
            }
        });

        this.commands.push({
            patterns: [
                /^(?:show|toggle|open)\s+(?:problems|errors)$/i
            ],
            category: VoiceCommandCategory.VIEW,
            description: 'Show problems panel',
            examples: ['show problems', 'open errors'],
            action: async () => {
                await vscode.commands.executeCommand('workbench.actions.view.problems');
            }
        });

        this.commands.push({
            patterns: [
                /^(?:show|toggle|open)\s+output$/i
            ],
            category: VoiceCommandCategory.VIEW,
            description: 'Show output panel',
            examples: ['show output', 'open output'],
            action: async () => {
                await vscode.commands.executeCommand('workbench.action.output.toggleOutput');
            }
        });

        this.commands.push({
            patterns: [
                /^(?:show|toggle|open)\s+debug\s+console$/i
            ],
            category: VoiceCommandCategory.VIEW,
            description: 'Show debug console',
            examples: ['show debug console'],
            action: async () => {
                await vscode.commands.executeCommand('workbench.debug.action.toggleRepl');
            }
        });

        this.commands.push({
            patterns: [
                /^(?:toggle\s+)?sidebar$/i,
                /^(?:show|hide)\s+sidebar$/i
            ],
            category: VoiceCommandCategory.VIEW,
            description: 'Toggle sidebar',
            examples: ['toggle sidebar', 'show sidebar', 'hide sidebar'],
            action: async () => {
                await vscode.commands.executeCommand('workbench.action.toggleSidebarVisibility');
            }
        });

        this.commands.push({
            patterns: [
                /^(?:toggle\s+)?panel$/i,
                /^(?:show|hide)\s+panel$/i
            ],
            category: VoiceCommandCategory.VIEW,
            description: 'Toggle panel',
            examples: ['toggle panel', 'show panel', 'hide panel'],
            action: async () => {
                await vscode.commands.executeCommand('workbench.action.togglePanel');
            }
        });

        this.commands.push({
            patterns: [
                /^zen\s+mode$/i,
                /^focus\s+mode$/i
            ],
            category: VoiceCommandCategory.VIEW,
            description: 'Toggle zen mode',
            examples: ['zen mode', 'focus mode'],
            action: async () => {
                await vscode.commands.executeCommand('workbench.action.toggleZenMode');
            }
        });

        this.commands.push({
            patterns: [
                /^zoom\s+in$/i,
                /^increase\s+(?:font\s+)?size$/i
            ],
            category: VoiceCommandCategory.VIEW,
            description: 'Zoom in',
            examples: ['zoom in', 'increase font size'],
            action: async () => {
                await vscode.commands.executeCommand('workbench.action.zoomIn');
            }
        });

        this.commands.push({
            patterns: [
                /^zoom\s+out$/i,
                /^decrease\s+(?:font\s+)?size$/i
            ],
            category: VoiceCommandCategory.VIEW,
            description: 'Zoom out',
            examples: ['zoom out', 'decrease font size'],
            action: async () => {
                await vscode.commands.executeCommand('workbench.action.zoomOut');
            }
        });

        this.commands.push({
            patterns: [
                /^reset\s+zoom$/i
            ],
            category: VoiceCommandCategory.VIEW,
            description: 'Reset zoom',
            examples: ['reset zoom'],
            action: async () => {
                await vscode.commands.executeCommand('workbench.action.zoomReset');
            }
        });
    }

    /**
     * Add window commands
     */
    private addWindowCommands(): void {
        this.commands.push({
            patterns: [
                /^new\s+window$/i,
                /^open\s+new\s+window$/i
            ],
            category: VoiceCommandCategory.WINDOW,
            description: 'Open new window',
            examples: ['new window', 'open new window'],
            action: async () => {
                await vscode.commands.executeCommand('workbench.action.newWindow');
            }
        });

        this.commands.push({
            patterns: [
                /^split\s+(?:editor\s+)?(?:right|horizontally?)$/i
            ],
            category: VoiceCommandCategory.WINDOW,
            description: 'Split editor right',
            examples: ['split right', 'split editor right'],
            action: async () => {
                await vscode.commands.executeCommand('workbench.action.splitEditor');
            }
        });

        this.commands.push({
            patterns: [
                /^split\s+(?:editor\s+)?(?:down|vertically)$/i
            ],
            category: VoiceCommandCategory.WINDOW,
            description: 'Split editor down',
            examples: ['split down', 'split vertically'],
            action: async () => {
                await vscode.commands.executeCommand('workbench.action.splitEditorDown');
            }
        });

        this.commands.push({
            patterns: [
                /^(?:go\s+to\s+)?next\s+(?:editor|tab)$/i,
                /^next\s+file$/i
            ],
            category: VoiceCommandCategory.WINDOW,
            description: 'Next editor',
            examples: ['next tab', 'next editor', 'next file'],
            action: async () => {
                await vscode.commands.executeCommand('workbench.action.nextEditor');
            }
        });

        this.commands.push({
            patterns: [
                /^(?:go\s+to\s+)?previous\s+(?:editor|tab)$/i,
                /^previous\s+file$/i
            ],
            category: VoiceCommandCategory.WINDOW,
            description: 'Previous editor',
            examples: ['previous tab', 'previous editor', 'previous file'],
            action: async () => {
                await vscode.commands.executeCommand('workbench.action.previousEditor');
            }
        });

        this.commands.push({
            patterns: [
                /^(?:toggle\s+)?full\s*screen$/i,
                /^maximize$/i
            ],
            category: VoiceCommandCategory.WINDOW,
            description: 'Toggle fullscreen',
            examples: ['fullscreen', 'toggle fullscreen', 'maximize'],
            action: async () => {
                await vscode.commands.executeCommand('workbench.action.toggleFullScreen');
            }
        });
    }

    /**
     * Execute a voice command
     */
    async execute(input: string): Promise<VoiceCommandResult> {
        const trimmedInput = input.trim().toLowerCase();
        const context = await this.buildContext();

        // Try to match against registered commands
        for (const command of this.commands) {
            for (const pattern of command.patterns) {
                const match = trimmedInput.match(pattern);
                if (match) {
                    // Check requirements
                    if (command.requiresEditor && !context.editor) {
                        return this.createResult(false, input, command.category, undefined, 'No active editor');
                    }
                    if (command.requiresSelection && context.selection?.isEmpty) {
                        return this.createResult(false, input, command.category, undefined, 'No selection');
                    }

                    try {
                        await command.action(match, context);
                        const result = this.createResult(true, input, command.category, command.description);
                        this.addToHistory(result);
                        return result;
                    } catch (error) {
                        const result = this.createResult(
                            false,
                            input,
                            command.category,
                            undefined,
                            error instanceof Error ? error.message : 'Unknown error'
                        );
                        this.addToHistory(result);
                        return result;
                    }
                }
            }
        }

        // Check custom commands
        for (const [name, command] of this.customCommands) {
            for (const pattern of command.patterns) {
                const match = trimmedInput.match(pattern);
                if (match) {
                    try {
                        await command.action(match, context);
                        const result = this.createResult(true, input, VoiceCommandCategory.CUSTOM, command.description);
                        this.addToHistory(result);
                        return result;
                    } catch (error) {
                        const result = this.createResult(
                            false,
                            input,
                            VoiceCommandCategory.CUSTOM,
                            undefined,
                            error instanceof Error ? error.message : 'Unknown error'
                        );
                        this.addToHistory(result);
                        return result;
                    }
                }
            }
        }

        // No match found
        const result = this.createResult(false, input, VoiceCommandCategory.CUSTOM, undefined, 'Command not recognized');
        this.addToHistory(result);
        return result;
    }

    /**
     * Build command context
     */
    private async buildContext(): Promise<VoiceCommandContext> {
        const editor = vscode.window.activeTextEditor;
        return {
            editor,
            selection: editor?.selection,
            document: editor?.document,
            workspaceFolder: vscode.workspace.workspaceFolders?.[0],
            bridge: this.bridge,
            router: this.router
        };
    }

    /**
     * Create result object
     */
    private createResult(
        success: boolean,
        command: string,
        category: VoiceCommandCategory,
        message?: string,
        error?: string
    ): VoiceCommandResult {
        return { success, command, category, message, error };
    }

    /**
     * Add result to history
     */
    private addToHistory(result: VoiceCommandResult): void {
        this.commandHistory.unshift(result);
        if (this.commandHistory.length > this.maxHistorySize) {
            this.commandHistory.pop();
        }
    }

    /**
     * Register custom voice command
     */
    registerCustomCommand(name: string, command: VoiceCommand): void {
        this.customCommands.set(name, command);
    }

    /**
     * Unregister custom command
     */
    unregisterCustomCommand(name: string): void {
        this.customCommands.delete(name);
    }

    /**
     * Get all available commands
     */
    getAvailableCommands(): { category: VoiceCommandCategory; description: string; examples: string[] }[] {
        const result: { category: VoiceCommandCategory; description: string; examples: string[] }[] = [];

        for (const command of this.commands) {
            result.push({
                category: command.category,
                description: command.description,
                examples: command.examples
            });
        }

        return result;
    }

    /**
     * Get command history
     */
    getHistory(): VoiceCommandResult[] {
        return [...this.commandHistory];
    }

    /**
     * Update status bar
     */
    private updateStatusBar(): void {
        this.statusBarItem.text = this.isListening ? '$(mic-filled) Voice' : '$(mic) Voice';
        this.statusBarItem.tooltip = this.isListening ? 'Voice control active' : 'Voice control inactive';
        this.statusBarItem.command = 'voicecode.toggleVoiceControl';
        this.statusBarItem.show();
    }

    /**
     * Toggle listening
     */
    setListening(listening: boolean): void {
        this.isListening = listening;
        this.updateStatusBar();
    }

    /**
     * Dispose
     */
    dispose(): void {
        this.outputChannel.dispose();
        this.statusBarItem.dispose();
    }
}

/**
 * Register voice control commands
 */
export function registerVoiceControlCommands(
    context: vscode.ExtensionContext,
    bridge: InternalAgentBridge,
    router: VoiceAgentRouter
): VSCodeVoiceControl {
    const voiceControl = new VSCodeVoiceControl(bridge, router);
    context.subscriptions.push(voiceControl);

    // Execute voice command
    context.subscriptions.push(
        vscode.commands.registerCommand('voicecode.executeVoiceControl', async (input?: string) => {
            if (!input) {
                input = await vscode.window.showInputBox({
                    prompt: 'Enter voice command',
                    placeHolder: 'e.g., "go to line 42", "save file", "open terminal"'
                });
            }

            if (!input) return;

            const result = await voiceControl.execute(input);

            if (result.success) {
                vscode.window.showInformationMessage(`Executed: ${result.message || result.command}`);
            } else {
                vscode.window.showWarningMessage(`Failed: ${result.error || 'Unknown error'}`);
            }
        })
    );

    // Show available commands
    context.subscriptions.push(
        vscode.commands.registerCommand('voicecode.showVoiceCommands', async () => {
            const commands = voiceControl.getAvailableCommands();
            const categories = [...new Set(commands.map(c => c.category))];

            const category = await vscode.window.showQuickPick(categories, {
                placeHolder: 'Select command category'
            });

            if (!category) return;

            const categoryCommands = commands.filter(c => c.category === category);
            const items = categoryCommands.map(c => ({
                label: c.description,
                detail: c.examples.join(', ')
            }));

            const selected = await vscode.window.showQuickPick(items, {
                placeHolder: 'Select command to learn examples'
            });

            if (selected) {
                vscode.window.showInformationMessage(`Examples: ${selected.detail}`);
            }
        })
    );

    // Show voice control history
    context.subscriptions.push(
        vscode.commands.registerCommand('voicecode.showVoiceHistory', async () => {
            const history = voiceControl.getHistory();

            if (history.length === 0) {
                vscode.window.showInformationMessage('No voice command history');
                return;
            }

            const items = history.slice(0, 20).map(h => ({
                label: `${h.success ? '$(check)' : '$(x)'} ${h.command}`,
                description: h.category,
                detail: h.message || h.error
            }));

            await vscode.window.showQuickPick(items, {
                placeHolder: 'Voice command history'
            });
        })
    );

    return voiceControl;
}
