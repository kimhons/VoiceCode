/**
 * VoiceCode VS Code Extension
 * Phase 3: IDE Integration with AI Agent System
 *
 * Provides voice-controlled coding capabilities directly in VS Code,
 * including dictation, voice commands, code generation, and a comprehensive
 * AI agent system with 9 specialized internal agents plus external agent integration.
 *
 * Extended capabilities:
 * - Agent-to-Agent Communication Protocol
 * - VS Code Voice Control System
 * - Computer Vision Module
 * - Web Browsing Agent
 * - Developer Tools Integration
 * - Multi-Modal Context Provider
 */

import * as vscode from 'vscode';
import { VoiceCodeClient } from './voicecodeClient';
import { StatusBarManager } from './statusBar';
import { DictationManager } from './dictation';
import { CommandProcessor } from './commands';
import { HistoryProvider } from './historyProvider';
import { CommandsProvider } from './commandsProvider';

// Agent system imports
import { InternalAgentBridge } from './agents/internalAgentBridge';
import { registerInternalAgentCommands } from './agents/internalAgentCommands';
import { registerInternalAgentsTreeView, InternalAgentsProvider } from './agents/internalAgentsProvider';
import { VoiceAgentRouter, registerVoiceAgentRouterCommands } from './agents/voiceAgentRouter';
import { registerChatParticipant, VoiceCodeChatParticipant } from './agents/chatParticipant';
import { registerLanguageModelTools, LanguageModelToolsProvider } from './agents/languageModelTools';
import { registerMCPServerCommands, VoiceCodeMCPServer } from './agents/mcpServer';
import { registerExternalAgentOrchestratorCommands, ExternalAgentOrchestrator } from './agents/externalAgentOrchestrator';

// Extended capabilities imports
import { getAgentCommunicationHub, disposeAgentCommunicationHub, AgentCommunicationHub } from './agents/agentCommunication';
import { registerVoiceControlCommands, VSCodeVoiceControl } from './agents/vscodeVoiceControl';
import { registerComputerVisionCommands, ComputerVisionProvider } from './agents/computerVision';
import { registerWebBrowsingCommands, WebBrowsingAgent } from './agents/webBrowsingAgent';
import { registerDevToolsCommands, DevToolsIntegration } from './agents/devToolsIntegration';
import { registerMultiModalContextCommands, MultiModalContextProvider } from './agents/multiModalContext';

// Roadmap features imports (Human-in-the-Loop, Checkpoints, Browser)
import { getApprovalManager, registerApprovalCommands, ApprovalManager } from './agents/approvalManager';
import { getCheckpointManager, registerCheckpointCommands, CheckpointManager } from './agents/checkpointManager';
import { registerCheckpointTreeView, CheckpointTreeProvider } from './agents/checkpointProvider';
import { registerBrowserPreviewCommands, BrowserPreviewProvider } from './agents/browserPreview';

// Core components
let client: VoiceCodeClient;
let statusBar: StatusBarManager;
let dictation: DictationManager;
let commandProcessor: CommandProcessor;

// Agent system components
let agentBridge: InternalAgentBridge;
let agentRouter: VoiceAgentRouter;
let agentsProvider: InternalAgentsProvider;
let chatParticipant: VoiceCodeChatParticipant;
let lmToolsProvider: LanguageModelToolsProvider;
let mcpServer: VoiceCodeMCPServer;
let orchestrator: ExternalAgentOrchestrator;

// Extended capability components
let communicationHub: AgentCommunicationHub;
let voiceControl: VSCodeVoiceControl;
let computerVision: ComputerVisionProvider;
let webBrowser: WebBrowsingAgent;
let devTools: DevToolsIntegration;
let multiModalContext: MultiModalContextProvider;

// Roadmap feature components (Human-in-the-Loop, Checkpoints, Browser)
let approvalManager: ApprovalManager;
let checkpointManager: CheckpointManager;
let checkpointProvider: CheckpointTreeProvider;
let browserPreview: BrowserPreviewProvider;

export async function activate(context: vscode.ExtensionContext) {
    console.log('VoiceCode extension is now active');

    // Initialize components
    const config = vscode.workspace.getConfiguration('voicecode');
    const apiEndpoint = config.get<string>('apiEndpoint') || 'http://localhost:3847';

    // Initialize VoiceCode client
    client = new VoiceCodeClient(apiEndpoint);

    // Initialize status bar
    statusBar = new StatusBarManager();
    context.subscriptions.push(statusBar);

    // Initialize dictation manager
    dictation = new DictationManager(client, statusBar);

    // Initialize command processor
    commandProcessor = new CommandProcessor(client);

    // ========================================
    // Initialize Agent System
    // ========================================

    // Initialize internal agent bridge
    agentBridge = new InternalAgentBridge(client);
    context.subscriptions.push(agentBridge);

    // Initialize voice agent router
    agentRouter = new VoiceAgentRouter(agentBridge);

    // Register internal agent commands
    registerInternalAgentCommands(context, agentBridge);

    // Register internal agents tree view
    agentsProvider = registerInternalAgentsTreeView(context, agentBridge);

    // Register voice agent router commands
    registerVoiceAgentRouterCommands(context, agentRouter);

    // Register chat participant (@voicecode)
    chatParticipant = registerChatParticipant(context, agentBridge, agentRouter);

    // Register Language Model Tools
    lmToolsProvider = registerLanguageModelTools(context, agentBridge);

    // Register MCP Server
    mcpServer = registerMCPServerCommands(context, agentBridge);

    // Register External Agent Orchestrator
    orchestrator = registerExternalAgentOrchestratorCommands(context, agentBridge, agentRouter);

    // ========================================
    // Initialize Extended Capabilities
    // ========================================

    // Initialize Agent Communication Hub
    communicationHub = getAgentCommunicationHub();
    context.subscriptions.push(communicationHub);

    // Register internal agents with communication hub
    const internalAgentTypes = ['planner', 'explorer', 'coder', 'reviewer', 'tester', 'debugger', 'documenter', 'refactorer', 'security'];
    for (const agentType of internalAgentTypes) {
        communicationHub.registerAgent(agentType, async (message) => {
            console.log(`[${agentType}] Received message:`, message.type);
            // Handle inter-agent communication
        });
    }

    // Register VS Code Voice Control
    voiceControl = registerVoiceControlCommands(context, agentBridge);

    // Register Computer Vision
    computerVision = registerComputerVisionCommands(context, agentBridge);

    // Register Web Browsing Agent
    webBrowser = registerWebBrowsingCommands(context, agentBridge);

    // Register Developer Tools Integration
    devTools = registerDevToolsCommands(context, agentBridge);

    // Register Multi-Modal Context Provider
    multiModalContext = registerMultiModalContextCommands(context, agentBridge);

    // ========================================
    // Initialize Roadmap Features
    // (Human-in-the-Loop, Checkpoints, Browser)
    // ========================================

    // Initialize Approval Manager for human-in-the-loop workflow
    approvalManager = getApprovalManager(context);
    registerApprovalCommands(context, approvalManager);
    agentBridge.setApprovalManager(approvalManager);

    // Initialize Checkpoint Manager for file state snapshots
    checkpointManager = getCheckpointManager(context);
    registerCheckpointCommands(context, checkpointManager);
    agentBridge.setCheckpointManager(checkpointManager);

    // Register Checkpoint Tree View in sidebar
    checkpointProvider = registerCheckpointTreeView(context);

    // Register Browser Preview for in-editor web browsing
    browserPreview = registerBrowserPreviewCommands(context);

    // ========================================
    // Register Core Voice Commands
    // ========================================

    const commands = [
        vscode.commands.registerCommand('voicecode.startDictation', () => {
            dictation.start();
        }),

        vscode.commands.registerCommand('voicecode.stopDictation', () => {
            dictation.stop();
        }),

        vscode.commands.registerCommand('voicecode.toggleDictation', () => {
            dictation.toggle();
        }),

        vscode.commands.registerCommand('voicecode.executeVoiceCommand', async () => {
            const input = await vscode.window.showInputBox({
                prompt: 'Enter voice command',
                placeHolder: 'e.g., "change foo to bar", "delete last line", "generate function to calculate sum"'
            });

            if (input) {
                // Check if this should be routed to an agent
                const agentConfig = config.get<boolean>('agents.autoRoute', true);

                if (agentConfig) {
                    // Use the agent router for intelligent routing
                    const route = await agentRouter.route(input);

                    if (route.confidence >= 0.7) {
                        // High confidence - use agent
                        await agentRouter.execute(route);
                        return;
                    }
                }

                // Fall back to legacy command processor
                await commandProcessor.execute(input);
            }
        }),

        vscode.commands.registerCommand('voicecode.openSettings', () => {
            vscode.commands.executeCommand('workbench.action.openSettings', 'voicecode');
        }),

        vscode.commands.registerCommand('voicecode.showStatus', async () => {
            const status = await client.getStatus();
            const externalAgents = await agentRouter.getAvailableAgents();

            vscode.window.showInformationMessage(
                `VoiceCode Status: ${status.connected ? 'Connected' : 'Disconnected'} | ` +
                `Dictation: ${status.isDictating ? 'Active' : 'Inactive'} | ` +
                `Mode: ${status.streamingMode} | ` +
                `Internal Agents: 9 | ` +
                `External Agents: ${externalAgents.external.length}`
            );
        }),

        vscode.commands.registerCommand('voicecode.generateCode', async () => {
            const input = await vscode.window.showInputBox({
                prompt: 'Describe the code you want to generate',
                placeHolder: 'e.g., "create a function that validates email addresses"'
            });

            if (input) {
                // Use the Coder agent for code generation
                const context = await getCodeContext();
                const result = await agentBridge.code(input, context);

                if (result.success && result.content) {
                    // Show result in output channel
                    const outputChannel = vscode.window.createOutputChannel('VoiceCode Generated Code');
                    outputChannel.clear();
                    outputChannel.appendLine(result.content);

                    if (result.code_blocks) {
                        for (const block of result.code_blocks) {
                            outputChannel.appendLine(`\n--- ${block.language} ---\n`);
                            outputChannel.appendLine(block.code);
                        }
                    }

                    outputChannel.show();
                } else {
                    vscode.window.showErrorMessage(`Code generation failed: ${result.error || 'Unknown error'}`);
                }
            }
        }),

        vscode.commands.registerCommand('voicecode.explainCode', async () => {
            const editor = vscode.window.activeTextEditor;
            if (!editor || editor.selection.isEmpty) {
                vscode.window.showWarningMessage('Please select some code first');
                return;
            }

            const selectedText = editor.document.getText(editor.selection);

            // Use the Documenter agent for explanation
            const context = await getCodeContext();
            context.selected_text = selectedText;

            const result = await agentBridge.document(`explain this code: ${selectedText}`, context);

            if (result.success && result.content) {
                // Show in hover or output channel
                const outputChannel = vscode.window.createOutputChannel('VoiceCode Explanation');
                outputChannel.clear();
                outputChannel.appendLine('=== Code Explanation ===\n');
                outputChannel.appendLine(result.content);
                outputChannel.show();
            } else {
                // Fall back to legacy explanation
                await commandProcessor.explainCode(selectedText);
            }
        }),

        vscode.commands.registerCommand('voicecode.refactorCode', async () => {
            const editor = vscode.window.activeTextEditor;
            if (!editor || editor.selection.isEmpty) {
                vscode.window.showWarningMessage('Please select some code first');
                return;
            }

            const selectedText = editor.document.getText(editor.selection);
            const instructions = await vscode.window.showInputBox({
                prompt: 'How would you like to refactor this code?',
                placeHolder: 'e.g., "extract into a separate function", "add error handling"'
            });

            if (instructions) {
                // Use the Refactorer agent
                const context = await getCodeContext();
                context.selected_text = selectedText;

                const result = await agentBridge.refactor(`${instructions}: ${selectedText}`, context);

                if (result.success && result.code_blocks && result.code_blocks.length > 0) {
                    // Apply the refactored code
                    const refactoredCode = result.code_blocks[0].code;
                    await editor.edit(editBuilder => {
                        editBuilder.replace(editor.selection, refactoredCode);
                    });
                    vscode.window.showInformationMessage('Code refactored successfully');
                } else if (result.success && result.content) {
                    // Show suggestion if no code block
                    const outputChannel = vscode.window.createOutputChannel('VoiceCode Refactoring');
                    outputChannel.clear();
                    outputChannel.appendLine(result.content);
                    outputChannel.show();
                } else {
                    // Fall back to legacy refactoring
                    await commandProcessor.refactorCode(selectedText, instructions, editor);
                }
            }
        }),

        vscode.commands.registerCommand('voicecode.addToCustomDictionary', async () => {
            const editor = vscode.window.activeTextEditor;
            let word: string | undefined;

            if (editor && !editor.selection.isEmpty) {
                word = editor.document.getText(editor.selection);
            } else {
                word = await vscode.window.showInputBox({
                    prompt: 'Enter word to add to custom dictionary',
                    placeHolder: 'e.g., Kubernetes'
                });
            }

            if (word) {
                const aliases = await vscode.window.showInputBox({
                    prompt: 'Enter aliases (comma-separated)',
                    placeHolder: 'e.g., kubernetes, k8s, kube'
                });

                await client.addCustomTerm(word, aliases?.split(',').map(a => a.trim()) || []);
                vscode.window.showInformationMessage(`Added "${word}" to custom dictionary`);
            }
        })
    ];

    // Register tree view providers
    const historyProvider = new HistoryProvider(client);
    const commandsProvider = new CommandsProvider();

    vscode.window.registerTreeDataProvider('voicecode.history', historyProvider);
    vscode.window.registerTreeDataProvider('voicecode.commands', commandsProvider);

    // Add all commands to subscriptions
    context.subscriptions.push(...commands);

    // ========================================
    // Connect to VoiceCode Desktop App
    // ========================================

    try {
        await client.connect();
        statusBar.setConnected(true);

        // Initialize agent bridge with connected client
        await agentBridge.initialize();

        // Detect external agents
        await agentRouter.detectExternalAgents();

        const extendedCapabilities = [
            voiceControl ? 'Voice Control' : null,
            computerVision ? 'Vision' : null,
            webBrowser ? 'Web' : null,
            devTools ? 'DevTools' : null,
            multiModalContext ? 'Context' : null
        ].filter(Boolean);

        vscode.window.showInformationMessage(
            `VoiceCode connected - 9 AI agents ready + ${extendedCapabilities.length} extended capabilities`
        );
    } catch (error) {
        statusBar.setConnected(false);
        vscode.window.showWarningMessage(
            'Could not connect to VoiceCode desktop app. Please ensure it is running. ' +
            'Agent features will work in limited mode.'
        );
    }

    // ========================================
    // Auto-Start Features
    // ========================================

    // Auto-start dictation if configured
    if (config.get<boolean>('autoStart')) {
        dictation.start();
    }

    // Auto-start MCP server if configured
    if (config.get<boolean>('mcp.autoStart')) {
        await mcpServer.start();
    }

    // ========================================
    // Configuration Change Listener
    // ========================================

    context.subscriptions.push(
        vscode.workspace.onDidChangeConfiguration(e => {
            if (e.affectsConfiguration('voicecode')) {
                // Reload configuration
                const newConfig = vscode.workspace.getConfiguration('voicecode');

                // Update client config
                client.updateConfig({
                    streamingMode: newConfig.get('streamingMode'),
                    codeVocabulary: newConfig.get('codeVocabulary'),
                    naturalLanguageCommands: newConfig.get('naturalLanguageCommands'),
                    punctuationMode: newConfig.get('punctuationMode')
                });

                // Update agent collaboration mode
                if (e.affectsConfiguration('voicecode.agents.collaborationMode')) {
                    const mode = newConfig.get<string>('agents.collaborationMode', 'best_match');
                    orchestrator.setCollaborationMode(mode as 'internal_only' | 'external_only' | 'internal_first' | 'external_first' | 'parallel' | 'consensus' | 'best_match');
                }

                // Update model info display
                if (e.affectsConfiguration('voicecode.agents.showModelInfo')) {
                    agentsProvider.refresh();
                }

                // Restart MCP server if port changed
                if (e.affectsConfiguration('voicecode.mcp.port') || e.affectsConfiguration('voicecode.mcp.host')) {
                    mcpServer.restart();
                }
            }
        })
    );

    // ========================================
    // Show Welcome Message for New Users
    // ========================================

    const hasShownWelcome = context.globalState.get('voicecode.hasShownWelcome', false);
    if (!hasShownWelcome) {
        const action = await vscode.window.showInformationMessage(
            'Welcome to VoiceCode! You now have access to 9 specialized AI agents for coding tasks.',
            'Show Agents',
            'Learn More',
            'Dismiss'
        );

        if (action === 'Show Agents') {
            await vscode.commands.executeCommand('voicecode.selectInternalAgent');
        } else if (action === 'Learn More') {
            await vscode.commands.executeCommand('voicecode.showAvailableAgents');
        }

        await context.globalState.update('voicecode.hasShownWelcome', true);
    }
}

/**
 * Get current code context from the active editor
 */
async function getCodeContext() {
    const editor = vscode.window.activeTextEditor;

    if (!editor) {
        return {
            file_path: '',
            language: '',
            cursor_position: { line: 0, character: 0 },
            visible_range: { start: 0, end: 0 }
        };
    }

    const document = editor.document;
    const selection = editor.selection;

    return {
        file_path: document.uri.fsPath,
        language: document.languageId,
        selected_text: selection.isEmpty ? undefined : document.getText(selection),
        cursor_position: {
            line: selection.active.line,
            character: selection.active.character
        },
        visible_range: {
            start: editor.visibleRanges[0]?.start.line || 0,
            end: editor.visibleRanges[0]?.end.line || 0
        }
    };
}

export function deactivate() {
    // Stop dictation
    if (dictation) {
        dictation.stop();
    }

    // Stop MCP server
    if (mcpServer) {
        mcpServer.stop();
    }

    // Disconnect client
    if (client) {
        client.disconnect();
    }

    // Dispose agent bridge
    if (agentBridge) {
        agentBridge.dispose();
    }

    // Dispose extended capability components
    if (communicationHub) {
        disposeAgentCommunicationHub();
    }

    if (voiceControl) {
        voiceControl.dispose();
    }

    if (computerVision) {
        computerVision.dispose();
    }

    if (webBrowser) {
        webBrowser.dispose();
    }

    if (devTools) {
        devTools.dispose();
    }

    if (multiModalContext) {
        multiModalContext.dispose();
    }

    // Dispose roadmap feature components
    if (approvalManager) {
        approvalManager.dispose();
    }

    if (checkpointManager) {
        checkpointManager.dispose();
    }

    if (checkpointProvider) {
        checkpointProvider.dispose();
    }

    if (browserPreview) {
        browserPreview.dispose();
    }

    console.log('VoiceCode extension deactivated');
}
