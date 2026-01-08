"use strict";
/**
 * Command Suggestions Service
 * Provides intelligent command suggestions based on context
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
exports.CommandSuggestionsService = void 0;
const vscode = __importStar(require("vscode"));
class CommandSuggestionsService {
    commands = [
        {
            command: 'Create function',
            description: 'Create a new function with specified name and parameters',
            category: 'Code Generation',
            example: 'Create function calculateTotal with parameters price and quantity',
            keywords: ['function', 'create', 'new'],
        },
        {
            command: 'Refactor',
            description: 'Refactor selected code',
            category: 'Refactoring',
            example: 'Refactor this to use async/await',
            keywords: ['refactor', 'improve', 'optimize'],
        },
        {
            command: 'Explain code',
            description: 'Explain what the selected code does',
            category: 'Documentation',
            example: 'Explain this code',
            keywords: ['explain', 'what', 'describe'],
        },
        {
            command: 'Add comments',
            description: 'Add JSDoc/TSDoc comments to code',
            category: 'Documentation',
            example: 'Add comments to this function',
            keywords: ['comment', 'document', 'doc'],
        },
        {
            command: 'Generate tests',
            description: 'Generate unit tests for selected code',
            category: 'Testing',
            example: 'Generate tests for this function',
            keywords: ['test', 'unit test', 'generate'],
        },
    ];
    /**
     * Get all available command suggestions
     */
    getAllSuggestions() {
        return this.commands;
    }
    /**
     * Get suggestions filtered by category
     */
    getSuggestionsByCategory(category) {
        return this.commands.filter((cmd) => cmd.category === category);
    }
    /**
     * Search suggestions by keyword
     */
    searchSuggestions(query) {
        const lowerQuery = query.toLowerCase();
        return this.commands.filter((cmd) => cmd.command.toLowerCase().includes(lowerQuery) ||
            cmd.description.toLowerCase().includes(lowerQuery) ||
            cmd.keywords?.some((kw) => kw.includes(lowerQuery)));
    }
    /**
     * Show command palette with suggestions
     */
    async showCommandPalette() {
        const items = this.commands.map((cmd) => ({
            label: cmd.command,
            description: cmd.category,
            detail: cmd.description,
            example: cmd.example,
        }));
        const selected = await vscode.window.showQuickPick(items, {
            placeHolder: 'Select a voice command...',
            matchOnDescription: true,
            matchOnDetail: true,
        });
        return selected?.label;
    }
    /**
     * Get contextual suggestions based on current editor state
     */
    async getContextualSuggestions() {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            return this.commands;
        }
        const selection = editor.selection;
        const hasSelection = !selection.isEmpty;
        // Filter suggestions based on context
        if (hasSelection) {
            return this.commands.filter((cmd) => ['Refactoring', 'Documentation', 'Testing'].includes(cmd.category));
        }
        return this.commands;
    }
}
exports.CommandSuggestionsService = CommandSuggestionsService;
//# sourceMappingURL=CommandSuggestionsService.js.map