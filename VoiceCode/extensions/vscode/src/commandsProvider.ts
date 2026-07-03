/**
 * VoiceCode Commands Provider
 * Provides available voice commands in the sidebar tree view
 */

import * as vscode from 'vscode';

interface CommandCategory {
    name: string;
    icon: string;
    commands: CommandInfo[];
}

interface CommandInfo {
    phrase: string;
    description: string;
    example?: string;
}

const VOICE_COMMANDS: CommandCategory[] = [
    {
        name: 'Dictation',
        icon: 'mic',
        commands: [
            { phrase: 'start dictation', description: 'Start voice dictation' },
            { phrase: 'stop dictation', description: 'Stop voice dictation' },
            { phrase: 'pause', description: 'Pause dictation temporarily' },
            { phrase: 'resume', description: 'Resume dictation' }
        ]
    },
    {
        name: 'Text Editing',
        icon: 'edit',
        commands: [
            { phrase: 'change X to Y', description: 'Replace text', example: 'change hello to world' },
            { phrase: 'delete X', description: 'Delete specified text', example: 'delete last word' },
            { phrase: 'select X', description: 'Select text', example: 'select all' },
            { phrase: 'undo', description: 'Undo last action' },
            { phrase: 'redo', description: 'Redo last undone action' },
            { phrase: 'copy', description: 'Copy selected text' },
            { phrase: 'cut', description: 'Cut selected text' },
            { phrase: 'paste', description: 'Paste from clipboard' }
        ]
    },
    {
        name: 'Code Generation',
        icon: 'code',
        commands: [
            { phrase: 'generate function...', description: 'Generate a new function', example: 'generate function to validate email' },
            { phrase: 'create class...', description: 'Create a new class', example: 'create class User with name and email' },
            { phrase: 'add method...', description: 'Add a method to current class', example: 'add method to calculate total' },
            { phrase: 'write test for...', description: 'Generate test code', example: 'write test for login function' }
        ]
    },
    {
        name: 'Code Understanding',
        icon: 'book',
        commands: [
            { phrase: 'explain this', description: 'Explain selected code' },
            { phrase: 'what does this do', description: 'Describe the selected code functionality' },
            { phrase: 'find bugs', description: 'Analyze code for potential bugs' },
            { phrase: 'suggest improvements', description: 'Get improvement suggestions' }
        ]
    },
    {
        name: 'Refactoring',
        icon: 'wrench',
        commands: [
            { phrase: 'refactor...', description: 'Refactor selected code', example: 'refactor to use async/await' },
            { phrase: 'extract function', description: 'Extract selection to a function' },
            { phrase: 'rename to...', description: 'Rename symbol', example: 'rename to calculateTotal' },
            { phrase: 'add error handling', description: 'Add try/catch or error handling' },
            { phrase: 'add types', description: 'Add TypeScript types to code' }
        ]
    },
    {
        name: 'Navigation',
        icon: 'compass',
        commands: [
            { phrase: 'go to line X', description: 'Navigate to line number', example: 'go to line 42' },
            { phrase: 'go to definition', description: 'Go to symbol definition' },
            { phrase: 'find function X', description: 'Find and navigate to function', example: 'find function handleSubmit' },
            { phrase: 'open file X', description: 'Open a file', example: 'open file package.json' },
            { phrase: 'go to start', description: 'Go to beginning of file' },
            { phrase: 'go to end', description: 'Go to end of file' }
        ]
    },
    {
        name: 'VS Code Actions',
        icon: 'window',
        commands: [
            { phrase: 'save', description: 'Save current file' },
            { phrase: 'save all', description: 'Save all open files' },
            { phrase: 'format', description: 'Format document' },
            { phrase: 'comment', description: 'Toggle line comment' },
            { phrase: 'fold', description: 'Fold code block' },
            { phrase: 'unfold', description: 'Unfold code block' },
            { phrase: 'terminal', description: 'Toggle terminal' },
            { phrase: 'command palette', description: 'Open command palette' }
        ]
    },
    {
        name: 'Git',
        icon: 'git-commit',
        commands: [
            { phrase: 'git status', description: 'Show git status' },
            { phrase: 'git commit...', description: 'Create a commit', example: 'git commit fix login bug' },
            { phrase: 'git push', description: 'Push to remote' },
            { phrase: 'git pull', description: 'Pull from remote' },
            { phrase: 'show diff', description: 'Show git diff' }
        ]
    }
];

export class CommandsProvider implements vscode.TreeDataProvider<CommandItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<CommandItem | undefined | null | void> = new vscode.EventEmitter<CommandItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<CommandItem | undefined | null | void> = this._onDidChangeTreeData.event;

    getTreeItem(element: CommandItem): vscode.TreeItem {
        return element;
    }

    getChildren(element?: CommandItem): Thenable<CommandItem[]> {
        if (!element) {
            // Return categories
            return Promise.resolve(
                VOICE_COMMANDS.map(category => new CommandItem(
                    category.name,
                    category.icon,
                    vscode.TreeItemCollapsibleState.Collapsed,
                    undefined,
                    true
                ))
            );
        }

        // Return commands in category
        const category = VOICE_COMMANDS.find(c => c.name === element.label);
        if (category) {
            return Promise.resolve(
                category.commands.map(cmd => new CommandItem(
                    cmd.phrase,
                    'chevron-right',
                    vscode.TreeItemCollapsibleState.None,
                    cmd.description,
                    false,
                    cmd.example
                ))
            );
        }

        return Promise.resolve([]);
    }
}

class CommandItem extends vscode.TreeItem {
    constructor(
        public readonly label: string,
        public readonly iconId: string,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState,
        public readonly description?: string,
        public readonly isCategory: boolean = false,
        public readonly example?: string
    ) {
        super(label, collapsibleState);

        this.iconPath = new vscode.ThemeIcon(iconId);

        if (!isCategory && example) {
            this.tooltip = `${description}\n\nExample: "${example}"`;
        } else {
            this.tooltip = description || label;
        }

        if (!isCategory) {
            this.command = {
                command: 'voicecode.executeVoiceCommand',
                title: 'Execute',
                arguments: [label]
            };
        }
    }
}
