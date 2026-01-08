/**
 * Command Suggestions Service
 * Provides intelligent command suggestions based on context
 */

import * as vscode from 'vscode';

export interface CommandSuggestion {
  command: string;
  description: string;
  category: string;
  example?: string;
  keywords?: string[];
}

export class CommandSuggestionsService {
  private readonly commands: CommandSuggestion[] = [
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
  getAllSuggestions(): CommandSuggestion[] {
    return this.commands;
  }

  /**
   * Get suggestions filtered by category
   */
  getSuggestionsByCategory(category: string): CommandSuggestion[] {
    return this.commands.filter((cmd) => cmd.category === category);
  }

  /**
   * Search suggestions by keyword
   */
  searchSuggestions(query: string): CommandSuggestion[] {
    const lowerQuery = query.toLowerCase();
    return this.commands.filter(
      (cmd) =>
        cmd.command.toLowerCase().includes(lowerQuery) ||
        cmd.description.toLowerCase().includes(lowerQuery) ||
        cmd.keywords?.some((kw) => kw.includes(lowerQuery))
    );
  }

  /**
   * Show command palette with suggestions
   */
  async showCommandPalette(): Promise<string | undefined> {
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
  async getContextualSuggestions(): Promise<CommandSuggestion[]> {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      return this.commands;
    }

    const selection = editor.selection;
    const hasSelection = !selection.isEmpty;

    // Filter suggestions based on context
    if (hasSelection) {
      return this.commands.filter((cmd) =>
        ['Refactoring', 'Documentation', 'Testing'].includes(cmd.category)
      );
    }

    return this.commands;
  }
}
