/**
 * Onboarding Service
 * Provides first-run experience, tutorials, and command discovery
 * Critical for user adoption and reducing abandonment
 */
import * as vscode from 'vscode';
/**
 * Onboarding Step
 */
export interface OnboardingStep {
    id: string;
    title: string;
    description: string;
    action?: () => Promise<void>;
    completed: boolean;
    optional?: boolean;
    order: number;
}
/**
 * Tutorial
 */
export interface Tutorial {
    id: string;
    title: string;
    description: string;
    steps: TutorialStep[];
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    estimatedTime: number;
    category: string;
}
export interface TutorialStep {
    id: string;
    title: string;
    content: string;
    action?: string;
    validation?: () => Promise<boolean>;
    hint?: string;
}
/**
 * Command Discovery
 */
export interface DiscoverableCommand {
    command: string;
    title: string;
    description: string;
    voicePhrase: string;
    category: string;
    examples: string[];
    relatedCommands?: string[];
}
/**
 * Onboarding Progress
 */
export interface OnboardingProgress {
    started: boolean;
    completed: boolean;
    currentStep: string | null;
    completedSteps: string[];
    skippedSteps: string[];
    startedAt?: Date;
    completedAt?: Date;
}
/**
 * Onboarding Service
 */
export declare class OnboardingService {
    private config;
    private context;
    private progress;
    private steps;
    private tutorials;
    private commands;
    private readonly _onStepCompleted;
    private readonly _onOnboardingCompleted;
    private readonly _onTutorialStarted;
    readonly onStepCompleted: vscode.Event<OnboardingStep>;
    readonly onOnboardingCompleted: vscode.Event<void>;
    readonly onTutorialStarted: vscode.Event<Tutorial>;
    constructor(config: vscode.WorkspaceConfiguration, context: vscode.ExtensionContext);
    /**
     * Load onboarding progress from storage
     */
    private loadProgress;
    /**
     * Save onboarding progress
     */
    private saveProgress;
    /**
     * Initialize onboarding steps
     */
    private initializeSteps;
    /**
     * Initialize tutorials
     */
    private initializeTutorials;
    /**
     * Initialize discoverable commands
     */
    private initializeCommands;
    /**
     * Check if onboarding is needed
     */
    needsOnboarding(): boolean;
    /**
     * Start onboarding
     */
    startOnboarding(): Promise<void>;
    /**
     * Get next incomplete step
     */
    getNextStep(): OnboardingStep | null;
    /**
     * Execute an onboarding step
     */
    executeStep(stepId: string): Promise<void>;
    /**
     * Complete a step
     */
    completeStep(stepId: string): Promise<void>;
    /**
     * Skip a step
     */
    skipStep(stepId: string): Promise<void>;
    /**
     * Show welcome message
     */
    private showWelcomeMessage;
    /**
     * Show command palette with VoiceFlow commands
     */
    private showCommandPalette;
    /**
     * Show command details
     */
    private showCommandDetails;
    /**
     * Get all tutorials
     */
    getTutorials(): Tutorial[];
    /**
     * Get tutorials by category
     */
    getTutorialsByCategory(category: string): Tutorial[];
    /**
     * Start a tutorial
     */
    startTutorial(tutorialId: string): Promise<void>;
    /**
     * Show tutorial step
     */
    private showTutorialStep;
    /**
     * Get all discoverable commands
     */
    getCommands(): DiscoverableCommand[];
    /**
     * Get commands by category
     */
    getCommandsByCategory(category: string): DiscoverableCommand[];
    /**
     * Search commands
     */
    searchCommands(query: string): DiscoverableCommand[];
    /**
     * Get onboarding progress
     */
    getProgress(): OnboardingProgress;
    /**
     * Reset onboarding
     */
    resetOnboarding(): Promise<void>;
    /**
     * Dispose resources
     */
    dispose(): void;
}
export default OnboardingService;
//# sourceMappingURL=OnboardingService.d.ts.map