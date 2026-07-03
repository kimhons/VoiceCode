/**
 * Voice Settings Service
 * Enables full VS Code settings management via voice commands
 * Allows users to change themes, fonts, extensions, workspace settings, etc. using natural language
 */
import * as vscode from 'vscode';
import { TelemetryService } from './TelemetryService';
/**
 * Setting change request
 */
export interface SettingChangeRequest {
    key: string;
    value: any;
    scope: vscode.ConfigurationTarget;
    description: string;
}
/**
 * Setting change result
 */
export interface SettingChangeResult {
    success: boolean;
    key: string;
    oldValue: any;
    newValue: any;
    error?: string;
}
/**
 * Voice command interpretation result
 */
export interface VoiceCommandInterpretation {
    intent: 'change_setting' | 'get_setting' | 'reset_setting' | 'list_settings' | 'unknown';
    settingKey?: string;
    settingValue?: any;
    scope?: vscode.ConfigurationTarget;
    confidence: number;
}
/**
 * Voice Settings Service
 * Manages VS Code settings via voice commands
 */
export declare class VoiceSettingsService implements vscode.Disposable {
    private config;
    private telemetry;
    private disposables;
    private settingMappings;
    private valueMappings;
    private readonly allowedSettings;
    private readonly _onSettingChanged;
    private readonly _onVoiceCommandProcessed;
    readonly onSettingChanged: vscode.Event<SettingChangeResult>;
    readonly onVoiceCommandProcessed: vscode.Event<VoiceCommandInterpretation>;
    constructor(config: vscode.WorkspaceConfiguration, telemetry: TelemetryService);
    /**
     * Handle voice command for settings
     */
    handleVoiceCommand(command: string): Promise<SettingChangeResult | string>;
    /**
     * Interpret voice command into structured data
     */
    private interpretVoiceCommand;
    /**
     * Resolve setting key from natural language
     */
    private resolveSettingKey;
    /**
     * Resolve setting value from natural language
     */
    private resolveSettingValue;
    /**
     * Determine scope from command
     */
    private determineScope;
    /**
     * Get setting value
     */
    getSetting(key: string): Promise<any>;
    /**
     * Validate setting key is allowed
     */
    private validateSettingKey;
    /**
     * Validate setting value
     */
    private validateSettingValue;
    /**
     * Update a setting
     */
    updateSetting(key: string, value: any, scope: vscode.ConfigurationTarget): Promise<SettingChangeResult>;
    /**
     * Update multiple settings
     */
    updateSettings(settings: Record<string, any>, scope?: vscode.ConfigurationTarget): Promise<SettingChangeResult[]>;
    /**
     * Reset setting to default
     */
    resetSetting(key: string): Promise<SettingChangeResult>;
    /**
     * List common settings
     */
    private listCommonSettings;
    /**
     * Get all settings in a category
     */
    getSettingsByCategory(category: string): Promise<Record<string, any>>;
    /**
     * Search settings by keyword
     */
    searchSettings(keyword: string): Array<{
        name: string;
        key: string;
    }>;
    /**
     * Dispose resources
     */
    dispose(): void;
}
export default VoiceSettingsService;
//# sourceMappingURL=VoiceSettingsService.d.ts.map