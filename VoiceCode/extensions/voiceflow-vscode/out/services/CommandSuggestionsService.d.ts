/**
 * Command Suggestions Service
 * Provides intelligent command suggestions based on context
 */
export interface CommandSuggestion {
    command: string;
    description: string;
    category: string;
    example?: string;
    keywords?: string[];
}
export declare class CommandSuggestionsService {
    private readonly commands;
    /**
     * Get all available command suggestions
     */
    getAllSuggestions(): CommandSuggestion[];
    /**
     * Get suggestions filtered by category
     */
    getSuggestionsByCategory(category: string): CommandSuggestion[];
    /**
     * Search suggestions by keyword
     */
    searchSuggestions(query: string): CommandSuggestion[];
    /**
     * Show command palette with suggestions
     */
    showCommandPalette(): Promise<string | undefined>;
    /**
     * Get contextual suggestions based on current editor state
     */
    getContextualSuggestions(): Promise<CommandSuggestion[]>;
}
//# sourceMappingURL=CommandSuggestionsService.d.ts.map