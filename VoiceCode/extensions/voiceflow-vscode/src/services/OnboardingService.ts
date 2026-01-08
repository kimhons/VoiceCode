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
  estimatedTime: number; // minutes
  category: string;
}

export interface TutorialStep {
  id: string;
  title: string;
  content: string;
  action?: string; // VS Code command to execute
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
export class OnboardingService {
  private config: vscode.WorkspaceConfiguration;
  private context: vscode.ExtensionContext;
  private progress: OnboardingProgress;
  private steps: Map<string, OnboardingStep> = new Map();
  private tutorials: Map<string, Tutorial> = new Map();
  private commands: Map<string, DiscoverableCommand> = new Map();
  
  // Event emitters
  private readonly _onStepCompleted = new vscode.EventEmitter<OnboardingStep>();
  private readonly _onOnboardingCompleted = new vscode.EventEmitter<void>();
  private readonly _onTutorialStarted = new vscode.EventEmitter<Tutorial>();
  
  public readonly onStepCompleted = this._onStepCompleted.event;
  public readonly onOnboardingCompleted = this._onOnboardingCompleted.event;
  public readonly onTutorialStarted = this._onTutorialStarted.event;

  constructor(config: vscode.WorkspaceConfiguration, context: vscode.ExtensionContext) {
    this.config = config;
    this.context = context;
    this.progress = this.loadProgress();
    this.initializeSteps();
    this.initializeTutorials();
    this.initializeCommands();
  }

  /**
   * Load onboarding progress from storage
   */
  private loadProgress(): OnboardingProgress {
    const stored = this.context.globalState.get<OnboardingProgress>('onboardingProgress');
    return stored || {
      started: false,
      completed: false,
      currentStep: null,
      completedSteps: [],
      skippedSteps: [],
    };
  }

  /**
   * Save onboarding progress
   */
  private async saveProgress(): Promise<void> {
    await this.context.globalState.update('onboardingProgress', this.progress);
  }

  /**
   * Initialize onboarding steps
   */
  private initializeSteps(): void {
    const steps: OnboardingStep[] = [
      {
        id: 'welcome',
        title: 'Welcome to VoiceFlow PRO',
        description: 'Learn how to control your IDE with voice commands',
        order: 1,
        completed: false,
        action: async () => {
          await this.showWelcomeMessage();
        },
      },
      {
        id: 'configure_microphone',
        title: 'Configure Microphone',
        description: 'Set up your microphone for voice recognition',
        order: 2,
        completed: false,
        action: async () => {
          await vscode.commands.executeCommand('voiceflow.configureMicrophone');
        },
      },
      {
        id: 'test_voice',
        title: 'Test Voice Recognition',
        description: 'Try your first voice command',
        order: 3,
        completed: false,
        action: async () => {
          await vscode.commands.executeCommand('voiceflow.startListening');
        },
      },
      {
        id: 'configure_ai',
        title: 'Configure AI Provider',
        description: 'Set up your preferred AI coding assistant',
        order: 4,
        completed: false,
        optional: true,
        action: async () => {
          await vscode.commands.executeCommand('voiceflow.configureAI');
        },
      },
      {
        id: 'explore_commands',
        title: 'Explore Commands',
        description: 'Discover available voice commands',
        order: 5,
        completed: false,
        action: async () => {
          await this.showCommandPalette();
        },
      },
    ];

    for (const step of steps) {
      step.completed = this.progress.completedSteps.includes(step.id);
      this.steps.set(step.id, step);
    }
  }

  /**
   * Initialize tutorials
   */
  private initializeTutorials(): void {
    const tutorials: Tutorial[] = [
      {
        id: 'basic_voice_commands',
        title: 'Basic Voice Commands',
        description: 'Learn the essential voice commands for coding',
        difficulty: 'beginner',
        estimatedTime: 5,
        category: 'Getting Started',
        steps: [
          {
            id: 'start_listening',
            title: 'Start Listening',
            content: 'Say "Hey VoiceFlow" or press the hotkey to start listening',
            action: 'voiceflow.startListening',
            hint: 'Make sure your microphone is enabled',
          },
          {
            id: 'navigate_file',
            title: 'Navigate to a File',
            content: 'Say "Open file [filename]" to open a file',
            hint: 'Try saying "Open file package.json"',
          },
          {
            id: 'go_to_line',
            title: 'Go to Line',
            content: 'Say "Go to line [number]" to jump to a specific line',
            hint: 'Try saying "Go to line 10"',
          },
          {
            id: 'search_code',
            title: 'Search Code',
            content: 'Say "Search for [term]" to find code in your project',
            hint: 'Try saying "Search for function"',
          },
        ],
      },
      {
        id: 'ai_assisted_coding',
        title: 'AI-Assisted Coding',
        description: 'Use AI to help write and refactor code',
        difficulty: 'intermediate',
        estimatedTime: 10,
        category: 'AI Features',
        steps: [
          {
            id: 'explain_code',
            title: 'Explain Code',
            content: 'Select code and say "Explain this code" for an explanation',
            hint: 'Select a function first',
          },
          {
            id: 'refactor_code',
            title: 'Refactor Code',
            content: 'Say "Refactor this to [description]" to improve code',
            hint: 'Try "Refactor this to use async/await"',
          },
          {
            id: 'generate_tests',
            title: 'Generate Tests',
            content: 'Say "Generate tests for this" to create unit tests',
            hint: 'Select a function to test',
          },
          {
            id: 'fix_errors',
            title: 'Fix Errors',
            content: 'Say "Fix this error" when you have a diagnostic',
            hint: 'Works best with TypeScript/JavaScript',
          },
        ],
      },
      {
        id: 'advanced_workflows',
        title: 'Advanced Workflows',
        description: 'Master complex voice-driven workflows',
        difficulty: 'advanced',
        estimatedTime: 15,
        category: 'Advanced',
        steps: [
          {
            id: 'multi_file_edit',
            title: 'Multi-File Editing',
            content: 'Say "Refactor [component] across all files" for multi-file changes',
            hint: 'Preview changes before applying',
          },
          {
            id: 'git_operations',
            title: 'Git Operations',
            content: 'Say "Commit changes with message [message]" for Git operations',
            hint: 'Also supports "Push to remote" and "Create branch"',
          },
          {
            id: 'terminal_commands',
            title: 'Terminal Commands',
            content: 'Say "Run [command] in terminal" to execute commands',
            hint: 'Try "Run npm test in terminal"',
          },
        ],
      },
    ];

    for (const tutorial of tutorials) {
      this.tutorials.set(tutorial.id, tutorial);
    }
  }

  /**
   * Initialize discoverable commands
   */
  private initializeCommands(): void {
    const commands: DiscoverableCommand[] = [
      // Navigation Commands
      {
        command: 'voiceflow.openFile',
        title: 'Open File',
        description: 'Open a file by name',
        voicePhrase: 'Open file [filename]',
        category: 'Navigation',
        examples: ['Open file index.ts', 'Open file package.json', 'Open file README'],
      },
      {
        command: 'voiceflow.goToLine',
        title: 'Go to Line',
        description: 'Jump to a specific line number',
        voicePhrase: 'Go to line [number]',
        category: 'Navigation',
        examples: ['Go to line 42', 'Go to line 100', 'Jump to line 1'],
      },
      {
        command: 'voiceflow.goToSymbol',
        title: 'Go to Symbol',
        description: 'Navigate to a function or class',
        voicePhrase: 'Go to [symbol name]',
        category: 'Navigation',
        examples: ['Go to function handleClick', 'Go to class UserService'],
      },
      // Editing Commands
      {
        command: 'voiceflow.insertCode',
        title: 'Insert Code',
        description: 'Insert code at cursor position',
        voicePhrase: 'Insert [code description]',
        category: 'Editing',
        examples: ['Insert console log', 'Insert try catch block', 'Insert import statement'],
      },
      {
        command: 'voiceflow.deleteLines',
        title: 'Delete Lines',
        description: 'Delete one or more lines',
        voicePhrase: 'Delete [number] lines',
        category: 'Editing',
        examples: ['Delete this line', 'Delete 5 lines', 'Delete selection'],
      },
      {
        command: 'voiceflow.commentCode',
        title: 'Comment Code',
        description: 'Toggle comments on selected code',
        voicePhrase: 'Comment this',
        category: 'Editing',
        examples: ['Comment this', 'Uncomment selection', 'Toggle comment'],
      },
      // AI Commands
      {
        command: 'voiceflow.explainCode',
        title: 'Explain Code',
        description: 'Get AI explanation of selected code',
        voicePhrase: 'Explain this code',
        category: 'AI',
        examples: ['Explain this', 'What does this do', 'Explain function'],
      },
      {
        command: 'voiceflow.refactorCode',
        title: 'Refactor Code',
        description: 'AI-powered code refactoring',
        voicePhrase: 'Refactor this to [description]',
        category: 'AI',
        examples: ['Refactor to async', 'Simplify this', 'Extract to function'],
      },
      {
        command: 'voiceflow.generateTests',
        title: 'Generate Tests',
        description: 'Generate unit tests for code',
        voicePhrase: 'Generate tests for this',
        category: 'AI',
        examples: ['Generate tests', 'Write unit tests', 'Create test cases'],
      },
      {
        command: 'voiceflow.fixError',
        title: 'Fix Error',
        description: 'AI-powered error fixing',
        voicePhrase: 'Fix this error',
        category: 'AI',
        examples: ['Fix this', 'Fix error', 'Resolve issue'],
      },
      // Git Commands
      {
        command: 'voiceflow.gitCommit',
        title: 'Git Commit',
        description: 'Commit changes with a message',
        voicePhrase: 'Commit with message [message]',
        category: 'Git',
        examples: ['Commit changes', 'Commit with message fix bug', 'Save changes'],
      },
      {
        command: 'voiceflow.gitPush',
        title: 'Git Push',
        description: 'Push commits to remote',
        voicePhrase: 'Push to remote',
        category: 'Git',
        examples: ['Push changes', 'Push to origin', 'Upload commits'],
      },
      // Terminal Commands
      {
        command: 'voiceflow.runTerminal',
        title: 'Run in Terminal',
        description: 'Execute a command in terminal',
        voicePhrase: 'Run [command] in terminal',
        category: 'Terminal',
        examples: ['Run npm test', 'Run build', 'Execute npm install'],
      },
    ];

    for (const cmd of commands) {
      this.commands.set(cmd.command, cmd);
    }
  }

  /**
   * Check if onboarding is needed
   */
  public needsOnboarding(): boolean {
    return !this.progress.completed && !this.config.get<boolean>('skipOnboarding', false);
  }

  /**
   * Start onboarding
   */
  public async startOnboarding(): Promise<void> {
    this.progress.started = true;
    this.progress.startedAt = new Date();
    await this.saveProgress();

    const firstStep = this.getNextStep();
    if (firstStep) {
      await this.executeStep(firstStep.id);
    }
  }

  /**
   * Get next incomplete step
   */
  public getNextStep(): OnboardingStep | null {
    const sortedSteps = Array.from(this.steps.values())
      .sort((a, b) => a.order - b.order);

    for (const step of sortedSteps) {
      if (!step.completed && !this.progress.skippedSteps.includes(step.id)) {
        return step;
      }
    }

    return null;
  }

  /**
   * Execute an onboarding step
   */
  public async executeStep(stepId: string): Promise<void> {
    const step = this.steps.get(stepId);
    if (!step) {
      return;
    }

    this.progress.currentStep = stepId;
    await this.saveProgress();

    if (step.action) {
      await step.action();
    }
  }

  /**
   * Complete a step
   */
  public async completeStep(stepId: string): Promise<void> {
    const step = this.steps.get(stepId);
    if (!step) {
      return;
    }

    step.completed = true;
    this.progress.completedSteps.push(stepId);
    await this.saveProgress();

    this._onStepCompleted.fire(step);

    // Check if all required steps are complete
    const allRequired = Array.from(this.steps.values())
      .filter(s => !s.optional)
      .every(s => s.completed);

    if (allRequired) {
      this.progress.completed = true;
      this.progress.completedAt = new Date();
      await this.saveProgress();
      this._onOnboardingCompleted.fire();
    }
  }

  /**
   * Skip a step
   */
  public async skipStep(stepId: string): Promise<void> {
    this.progress.skippedSteps.push(stepId);
    await this.saveProgress();

    const nextStep = this.getNextStep();
    if (nextStep) {
      await this.executeStep(nextStep.id);
    }
  }

  /**
   * Show welcome message
   */
  private async showWelcomeMessage(): Promise<void> {
    const result = await vscode.window.showInformationMessage(
      'Welcome to VoiceFlow PRO! Control your IDE with voice commands.',
      'Get Started',
      'Skip Tutorial',
      'Learn More'
    );

    if (result === 'Get Started') {
      await this.completeStep('welcome');
    } else if (result === 'Skip Tutorial') {
      this.progress.completed = true;
      await this.saveProgress();
    } else if (result === 'Learn More') {
      await vscode.env.openExternal(vscode.Uri.parse('https://voiceflow-pro.dev/docs'));
    }
  }

  /**
   * Show command palette with VoiceFlow commands
   */
  private async showCommandPalette(): Promise<void> {
    const categories = [...new Set(Array.from(this.commands.values()).map(c => c.category))];

    const items: vscode.QuickPickItem[] = [];
    for (const category of categories) {
      items.push({
        label: category,
        kind: vscode.QuickPickItemKind.Separator,
      });

      const categoryCommands = Array.from(this.commands.values())
        .filter(c => c.category === category);

      for (const cmd of categoryCommands) {
        items.push({
          label: cmd.title,
          description: cmd.voicePhrase,
          detail: cmd.description,
        });
      }
    }

    const selected = await vscode.window.showQuickPick(items, {
      placeHolder: 'Explore VoiceFlow commands',
      matchOnDescription: true,
      matchOnDetail: true,
    });

    if (selected && selected.kind !== vscode.QuickPickItemKind.Separator) {
      const cmd = Array.from(this.commands.values())
        .find(c => c.title === selected.label);

      if (cmd) {
        await this.showCommandDetails(cmd);
      }
    }
  }

  /**
   * Show command details
   */
  private async showCommandDetails(cmd: DiscoverableCommand): Promise<void> {
    const examples = cmd.examples.map(e => `• "${e}"`).join('\n');

    const result = await vscode.window.showInformationMessage(
      `${cmd.title}\n\nVoice: "${cmd.voicePhrase}"\n\nExamples:\n${examples}`,
      'Try It',
      'Copy Voice Phrase'
    );

    if (result === 'Try It') {
      await vscode.commands.executeCommand(cmd.command);
    } else if (result === 'Copy Voice Phrase') {
      await vscode.env.clipboard.writeText(cmd.voicePhrase);
      vscode.window.showInformationMessage('Voice phrase copied to clipboard');
    }
  }

  /**
   * Get all tutorials
   */
  public getTutorials(): Tutorial[] {
    return Array.from(this.tutorials.values());
  }

  /**
   * Get tutorials by category
   */
  public getTutorialsByCategory(category: string): Tutorial[] {
    return Array.from(this.tutorials.values())
      .filter(t => t.category === category);
  }

  /**
   * Start a tutorial
   */
  public async startTutorial(tutorialId: string): Promise<void> {
    const tutorial = this.tutorials.get(tutorialId);
    if (!tutorial) {
      return;
    }

    this._onTutorialStarted.fire(tutorial);
    await this.showTutorialStep(tutorial, 0);
  }

  /**
   * Show tutorial step
   */
  private async showTutorialStep(tutorial: Tutorial, stepIndex: number): Promise<void> {
    if (stepIndex >= tutorial.steps.length) {
      vscode.window.showInformationMessage(`Tutorial "${tutorial.title}" completed!`);
      return;
    }

    const step = tutorial.steps[stepIndex];
    const result = await vscode.window.showInformationMessage(
      `${step.title}\n\n${step.content}${step.hint ? `\n\nHint: ${step.hint}` : ''}`,
      'Next',
      'Try It',
      'Skip'
    );

    if (result === 'Next' || result === 'Skip') {
      await this.showTutorialStep(tutorial, stepIndex + 1);
    } else if (result === 'Try It' && step.action) {
      await vscode.commands.executeCommand(step.action);
      await this.showTutorialStep(tutorial, stepIndex + 1);
    }
  }

  /**
   * Get all discoverable commands
   */
  public getCommands(): DiscoverableCommand[] {
    return Array.from(this.commands.values());
  }

  /**
   * Get commands by category
   */
  public getCommandsByCategory(category: string): DiscoverableCommand[] {
    return Array.from(this.commands.values())
      .filter(c => c.category === category);
  }

  /**
   * Search commands
   */
  public searchCommands(query: string): DiscoverableCommand[] {
    const lowerQuery = query.toLowerCase();
    return Array.from(this.commands.values())
      .filter(c =>
        c.title.toLowerCase().includes(lowerQuery) ||
        c.description.toLowerCase().includes(lowerQuery) ||
        c.voicePhrase.toLowerCase().includes(lowerQuery) ||
        c.examples.some(e => e.toLowerCase().includes(lowerQuery))
      );
  }

  /**
   * Get onboarding progress
   */
  public getProgress(): OnboardingProgress {
    return { ...this.progress };
  }

  /**
   * Reset onboarding
   */
  public async resetOnboarding(): Promise<void> {
    this.progress = {
      started: false,
      completed: false,
      currentStep: null,
      completedSteps: [],
      skippedSteps: [],
    };

    for (const step of this.steps.values()) {
      step.completed = false;
    }

    await this.saveProgress();
  }

  /**
   * Dispose resources
   */
  public dispose(): void {
    this._onStepCompleted.dispose();
    this._onOnboardingCompleted.dispose();
    this._onTutorialStarted.dispose();
  }
}

export default OnboardingService;
