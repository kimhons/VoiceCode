"use strict";
/**
 * Voice Settings Service
 * Enables full VS Code settings management via voice commands
 * Allows users to change themes, fonts, extensions, workspace settings, etc. using natural language
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
exports.VoiceSettingsService = void 0;
const vscode = __importStar(require("vscode"));
/**
 * Voice Settings Service
 * Manages VS Code settings via voice commands
 */
class VoiceSettingsService {
    config;
    telemetry;
    disposables = [];
    // Common setting mappings for voice commands
    settingMappings = new Map([
        // Theme settings
        ['theme', 'workbench.colorTheme'],
        ['color theme', 'workbench.colorTheme'],
        ['icon theme', 'workbench.iconTheme'],
        // Editor settings
        ['font size', 'editor.fontSize'],
        ['font family', 'editor.fontFamily'],
        ['tab size', 'editor.tabSize'],
        ['word wrap', 'editor.wordWrap'],
        ['line numbers', 'editor.lineNumbers'],
        ['minimap', 'editor.minimap.enabled'],
        ['auto save', 'files.autoSave'],
        ['format on save', 'editor.formatOnSave'],
        ['format on paste', 'editor.formatOnPaste'],
        // Window settings
        ['zoom level', 'window.zoomLevel'],
        ['title bar style', 'window.titleBarStyle'],
        // Terminal settings
        ['terminal font size', 'terminal.integrated.fontSize'],
        ['terminal font family', 'terminal.integrated.fontFamily'],
        // Git settings
        ['git enabled', 'git.enabled'],
        ['git auto fetch', 'git.autofetch'],
        // Telemetry
        ['telemetry', 'telemetry.telemetryLevel'],
    ]);
    // Value mappings for common voice inputs
    valueMappings = new Map([
        // Boolean values
        ['on', true],
        ['off', false],
        ['enabled', true],
        ['disabled', false],
        ['yes', true],
        ['no', false],
        ['true', true],
        ['false', false],
        // Theme values
        ['dark', 'Default Dark+'],
        ['light', 'Default Light+'],
        ['high contrast', 'Default High Contrast'],
        // Word wrap values
        ['wrap', 'on'],
        ['no wrap', 'off'],
        ['word wrap on', 'on'],
        ['word wrap off', 'off'],
        // Auto save values
        ['after delay', 'afterDelay'],
        ['on focus change', 'onFocusChange'],
        ['on window change', 'onWindowChange'],
    ]);
    // Whitelist of allowed settings for voice control (security)
    allowedSettings = new Set([
        // Theme and appearance
        'workbench.colorTheme',
        'workbench.iconTheme',
        'window.zoomLevel',
        'window.titleBarStyle',
        // Editor settings
        'editor.fontSize',
        'editor.fontFamily',
        'editor.tabSize',
        'editor.wordWrap',
        'editor.lineNumbers',
        'editor.minimap.enabled',
        'editor.formatOnSave',
        'editor.formatOnPaste',
        'editor.renderWhitespace',
        'editor.cursorStyle',
        'editor.cursorBlinking',
        // File settings
        'files.autoSave',
        'files.trimTrailingWhitespace',
        'files.insertFinalNewline',
        // Terminal settings
        'terminal.integrated.fontSize',
        'terminal.integrated.fontFamily',
        'terminal.integrated.cursorStyle',
        // Git settings
        'git.enabled',
        'git.autofetch',
        'git.confirmSync',
        // VoiceCode specific
        'voicecode.enabled',
        'voicecode.sttEngine',
        'voicecode.wakeWordEnabled',
    ]);
    // Event emitters
    _onSettingChanged = new vscode.EventEmitter();
    _onVoiceCommandProcessed = new vscode.EventEmitter();
    onSettingChanged = this._onSettingChanged.event;
    onVoiceCommandProcessed = this._onVoiceCommandProcessed.event;
    constructor(config, telemetry) {
        this.config = config;
        this.telemetry = telemetry;
        // Listen for configuration changes
        this.disposables.push(vscode.workspace.onDidChangeConfiguration(e => {
            console.log('[VoiceSettings] Configuration changed');
        }));
    }
    /**
     * Handle voice command for settings
     */
    async handleVoiceCommand(command) {
        const interpretation = this.interpretVoiceCommand(command);
        this._onVoiceCommandProcessed.fire(interpretation);
        if (interpretation.confidence < 0.5) {
            return `I'm not sure how to interpret that command. Try something like "change theme to dark" or "set font size to 14"`;
        }
        switch (interpretation.intent) {
            case 'change_setting':
                if (interpretation.settingKey && interpretation.settingValue !== undefined) {
                    return await this.updateSetting(interpretation.settingKey, interpretation.settingValue, interpretation.scope || vscode.ConfigurationTarget.Global);
                }
                break;
            case 'get_setting':
                if (interpretation.settingKey) {
                    const value = await this.getSetting(interpretation.settingKey);
                    return `${interpretation.settingKey} is set to: ${JSON.stringify(value)}`;
                }
                break;
            case 'reset_setting':
                if (interpretation.settingKey) {
                    return await this.resetSetting(interpretation.settingKey);
                }
                break;
            case 'list_settings':
                return this.listCommonSettings();
        }
        return `Could not process command: ${command}`;
    }
    /**
     * Interpret voice command into structured data
     */
    interpretVoiceCommand(command) {
        const lowerCommand = command.toLowerCase().trim();
        // Pattern: "change/set X to Y"
        const changePatterns = [
            /(?:change|set|update|make)\s+(.+?)\s+(?:to|=)\s+(.+)/i,
            /(?:enable|disable)\s+(.+)/i,
            /(?:turn|switch)\s+(on|off)\s+(.+)/i,
        ];
        for (const pattern of changePatterns) {
            const match = lowerCommand.match(pattern);
            if (match) {
                let settingName;
                let settingValue;
                if (pattern.source.includes('enable|disable')) {
                    settingName = match[1];
                    settingValue = lowerCommand.startsWith('enable') ? 'true' : 'false';
                }
                else if (pattern.source.includes('turn|switch')) {
                    settingName = match[2];
                    settingValue = match[1]; // 'on' or 'off'
                }
                else {
                    settingName = match[1];
                    settingValue = match[2];
                }
                const settingKey = this.resolveSettingKey(settingName);
                const resolvedValue = this.resolveSettingValue(settingValue, settingKey);
                if (settingKey) {
                    return {
                        intent: 'change_setting',
                        settingKey,
                        settingValue: resolvedValue,
                        scope: this.determineScope(lowerCommand),
                        confidence: 0.9,
                    };
                }
            }
        }
        // Pattern: "what is X" or "get X"
        if (lowerCommand.match(/(?:what is|get|show)\s+(.+)/i)) {
            const match = lowerCommand.match(/(?:what is|get|show)\s+(.+)/i);
            if (match) {
                const settingKey = this.resolveSettingKey(match[1]);
                if (settingKey) {
                    return {
                        intent: 'get_setting',
                        settingKey,
                        confidence: 0.85,
                    };
                }
            }
        }
        // Pattern: "reset X"
        if (lowerCommand.match(/reset\s+(.+)/i)) {
            const match = lowerCommand.match(/reset\s+(.+)/i);
            if (match) {
                const settingKey = this.resolveSettingKey(match[1]);
                if (settingKey) {
                    return {
                        intent: 'reset_setting',
                        settingKey,
                        confidence: 0.85,
                    };
                }
            }
        }
        // Pattern: "list settings"
        if (lowerCommand.match(/list|show\s+(?:all\s+)?settings/i)) {
            return {
                intent: 'list_settings',
                confidence: 0.9,
            };
        }
        return {
            intent: 'unknown',
            confidence: 0,
        };
    }
    /**
     * Resolve setting key from natural language
     */
    resolveSettingKey(settingName) {
        const normalized = settingName.toLowerCase().trim();
        // Direct mapping
        if (this.settingMappings.has(normalized)) {
            return this.settingMappings.get(normalized);
        }
        // Fuzzy matching
        for (const [key, value] of this.settingMappings) {
            if (normalized.includes(key) || key.includes(normalized)) {
                return value;
            }
        }
        // Try as-is (might be actual setting key)
        if (normalized.includes('.')) {
            return normalized;
        }
        return undefined;
    }
    /**
     * Resolve setting value from natural language
     */
    resolveSettingValue(value, settingKey) {
        const normalized = value.toLowerCase().trim();
        // Check value mappings
        if (this.valueMappings.has(normalized)) {
            return this.valueMappings.get(normalized);
        }
        // Try to parse as number
        const num = Number(value);
        if (!isNaN(num)) {
            return num;
        }
        // Try to parse as boolean
        if (normalized === 'true' || normalized === 'yes' || normalized === 'on') {
            return true;
        }
        if (normalized === 'false' || normalized === 'no' || normalized === 'off') {
            return false;
        }
        // Return as string
        return value;
    }
    /**
     * Determine scope from command
     */
    determineScope(command) {
        if (command.includes('workspace')) {
            return vscode.ConfigurationTarget.Workspace;
        }
        if (command.includes('folder')) {
            return vscode.ConfigurationTarget.WorkspaceFolder;
        }
        return vscode.ConfigurationTarget.Global;
    }
    /**
     * Get setting value
     */
    async getSetting(key) {
        const config = vscode.workspace.getConfiguration();
        return config.get(key);
    }
    /**
     * Validate setting key is allowed
     */
    validateSettingKey(key) {
        if (!this.allowedSettings.has(key)) {
            return {
                valid: false,
                error: `Setting '${key}' is not allowed to be changed via voice for security reasons.`,
            };
        }
        return { valid: true };
    }
    /**
     * Validate setting value
     */
    validateSettingValue(key, value) {
        // Type validation based on setting
        if (key.includes('fontSize') || key.includes('tabSize') || key.includes('zoomLevel')) {
            const num = typeof value === 'number' ? value : parseFloat(value);
            if (isNaN(num)) {
                return { valid: false, error: `Invalid number value for ${key}` };
            }
            if (key.includes('fontSize') && (num < 6 || num > 72)) {
                return { valid: false, error: 'Font size must be between 6 and 72' };
            }
            if (key.includes('tabSize') && (num < 1 || num > 8)) {
                return { valid: false, error: 'Tab size must be between 1 and 8' };
            }
            if (key.includes('zoomLevel') && (num < -5 || num > 5)) {
                return { valid: false, error: 'Zoom level must be between -5 and 5' };
            }
        }
        // Boolean validation
        if (key.includes('enabled') || key.includes('.minimap.')) {
            if (typeof value !== 'boolean' && value !== 'true' && value !== 'false') {
                return { valid: false, error: `${key} requires a boolean value (true/false)` };
            }
        }
        return { valid: true };
    }
    /**
     * Update a setting
     */
    async updateSetting(key, value, scope) {
        // Validate setting key
        const keyValidation = this.validateSettingKey(key);
        if (!keyValidation.valid) {
            return {
                success: false,
                key,
                oldValue: undefined,
                newValue: value,
                error: keyValidation.error,
            };
        }
        // Validate setting value
        const valueValidation = this.validateSettingValue(key, value);
        if (!valueValidation.valid) {
            return {
                success: false,
                key,
                oldValue: undefined,
                newValue: value,
                error: valueValidation.error,
            };
        }
        try {
            const config = vscode.workspace.getConfiguration();
            const oldValue = config.get(key);
            await config.update(key, value, scope);
            const result = {
                success: true,
                key,
                oldValue,
                newValue: value,
            };
            this._onSettingChanged.fire(result);
            this.telemetry.recordEvent('setting_changed_via_voice', {
                key,
                scope: vscode.ConfigurationTarget[scope],
            });
            console.log(`[VoiceSettings] Updated ${key}: ${oldValue} → ${value}`);
            // Show confirmation
            vscode.window.showInformationMessage(`✓ Updated ${key} to ${JSON.stringify(value)}`);
            return result;
        }
        catch (error) {
            const result = {
                success: false,
                key,
                oldValue: undefined,
                newValue: value,
                error: error instanceof Error ? error.message : 'Unknown error',
            };
            console.error(`[VoiceSettings] Failed to update ${key}:`, error);
            vscode.window.showErrorMessage(`Failed to update ${key}: ${result.error}`);
            return result;
        }
    }
    /**
     * Update multiple settings
     */
    async updateSettings(settings, scope = vscode.ConfigurationTarget.Global) {
        const results = [];
        for (const [key, value] of Object.entries(settings)) {
            const result = await this.updateSetting(key, value, scope);
            results.push(result);
        }
        return results;
    }
    /**
     * Reset setting to default
     */
    async resetSetting(key) {
        return await this.updateSetting(key, undefined, vscode.ConfigurationTarget.Global);
    }
    /**
     * List common settings
     */
    listCommonSettings() {
        const categories = [
            '**Theme Settings:**',
            '- theme, icon theme',
            '',
            '**Editor Settings:**',
            '- font size, tab size, word wrap, line numbers, minimap',
            '- auto save, format on save, format on paste',
            '',
            '**Window Settings:**',
            '- zoom level, title bar style',
            '',
            '**Terminal Settings:**',
            '- terminal font size, terminal font family',
        ];
        return categories.join('\n');
    }
    /**
     * Get all settings in a category
     */
    async getSettingsByCategory(category) {
        const config = vscode.workspace.getConfiguration();
        const settings = {};
        for (const [name, key] of this.settingMappings) {
            if (key.startsWith(category)) {
                settings[name] = config.get(key);
            }
        }
        return settings;
    }
    /**
     * Search settings by keyword
     */
    searchSettings(keyword) {
        const results = [];
        const lowerKeyword = keyword.toLowerCase();
        for (const [name, key] of this.settingMappings) {
            if (name.includes(lowerKeyword) || key.includes(lowerKeyword)) {
                results.push({ name, key });
            }
        }
        return results;
    }
    /**
     * Dispose resources
     */
    dispose() {
        this.disposables.forEach(d => d.dispose());
        this._onSettingChanged.dispose();
        this._onVoiceCommandProcessed.dispose();
    }
}
exports.VoiceSettingsService = VoiceSettingsService;
exports.default = VoiceSettingsService;
//# sourceMappingURL=VoiceSettingsService.js.map