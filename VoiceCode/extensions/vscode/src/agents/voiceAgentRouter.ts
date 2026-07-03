/**
 * Voice Agent Router
 * Routes voice input to the appropriate internal or external agent based on trigger phrases
 */

import * as vscode from 'vscode';
import { InternalAgentBridge } from './internalAgentBridge';
import {
    SubagentType,
    OrchestrationStrategy,
    ExternalAgentType,
    AgentResult,
    CodeContext
} from '../types/agents';

/**
 * Route match result
 */
interface RouteMatch {
    type: 'internal' | 'external' | 'pipeline' | 'strategy' | 'unknown';
    agent?: SubagentType;
    externalAgent?: ExternalAgentType;
    pipeline?: string;
    strategy?: OrchestrationStrategy;
    confidence: number;
    extractedTask: string;
    originalInput: string;
}

/**
 * Routing rule definition
 */
interface RoutingRule {
    patterns: RegExp[];
    agent?: SubagentType;
    externalAgent?: ExternalAgentType;
    pipeline?: string;
    strategy?: OrchestrationStrategy;
    priority: number;
    description: string;
}

/**
 * External agent configuration
 */
interface ExternalAgentConfig {
    type: ExternalAgentType;
    name: string;
    triggers: string[];
    command?: string;
    available: boolean;
}

/**
 * Voice Agent Router
 * Intelligently routes voice commands to the most appropriate agent
 */
export class VoiceAgentRouter {
    private bridge: InternalAgentBridge;
    private internalRules: RoutingRule[] = [];
    private externalRules: RoutingRule[] = [];
    private pipelineRules: RoutingRule[] = [];
    private strategyRules: RoutingRule[] = [];
    private externalAgents: Map<ExternalAgentType, ExternalAgentConfig> = new Map();
    private routingHistory: RouteMatch[] = [];
    private maxHistorySize = 100;

    constructor(bridge: InternalAgentBridge) {
        this.bridge = bridge;
        this.initializeRules();
        this.initializeExternalAgents();
    }

    /**
     * Initialize internal agent routing rules
     */
    private initializeRules(): void {
        // Planner agent rules
        this.internalRules.push({
            patterns: [
                /^plan\s+(?:how\s+to\s+)?(.+)/i,
                /^create\s+(?:a\s+)?plan\s+(?:for\s+)?(.+)/i,
                /^design\s+(?:a\s+)?(?:solution|approach)\s+(?:for\s+)?(.+)/i,
                /^architect\s+(.+)/i,
                /^how\s+should\s+(?:i|we)\s+implement\s+(.+)/i,
                /^break\s+down\s+(.+)/i,
                /^outline\s+(?:the\s+)?(?:steps|approach)\s+(?:for\s+)?(.+)/i,
                /^strategize\s+(.+)/i
            ],
            agent: SubagentType.PLANNER,
            priority: 10,
            description: 'Routes planning and architecture tasks to Planner agent'
        });

        // Explorer agent rules
        this.internalRules.push({
            patterns: [
                /^(?:find|search|look\s+for)\s+(.+)/i,
                /^explore\s+(.+)/i,
                /^where\s+(?:is|are)\s+(.+)/i,
                /^locate\s+(.+)/i,
                /^show\s+me\s+(?:all\s+)?(.+)/i,
                /^list\s+(?:all\s+)?(.+)/i,
                /^what\s+(?:files?|code)\s+(?:contains?|has|have)\s+(.+)/i,
                /^scan\s+(?:for\s+)?(.+)/i,
                /^discover\s+(.+)/i
            ],
            agent: SubagentType.EXPLORER,
            priority: 10,
            description: 'Routes code exploration and search tasks to Explorer agent'
        });

        // Coder agent rules
        this.internalRules.push({
            patterns: [
                /^(?:write|create|generate|implement|code)\s+(?:a\s+)?(.+)/i,
                /^add\s+(?:a\s+)?(?:new\s+)?(.+)/i,
                /^build\s+(.+)/i,
                /^make\s+(?:a\s+)?(.+)/i,
                /^develop\s+(.+)/i,
                /^scaffold\s+(.+)/i,
                /^create\s+(?:a\s+)?(?:new\s+)?(?:function|class|component|module)\s+(.+)/i
            ],
            agent: SubagentType.CODER,
            priority: 10,
            description: 'Routes code generation tasks to Coder agent'
        });

        // Reviewer agent rules
        this.internalRules.push({
            patterns: [
                /^review\s+(.+)/i,
                /^check\s+(?:the\s+)?(?:code|quality)\s+(?:of\s+)?(.+)/i,
                /^analyze\s+(?:the\s+)?(?:code|quality)\s+(?:of\s+)?(.+)/i,
                /^critique\s+(.+)/i,
                /^evaluate\s+(.+)/i,
                /^inspect\s+(.+)/i,
                /^assess\s+(?:the\s+)?(?:code|quality)\s+(?:of\s+)?(.+)/i,
                /^what(?:'s|\s+is)\s+wrong\s+with\s+(.+)/i
            ],
            agent: SubagentType.REVIEWER,
            priority: 10,
            description: 'Routes code review tasks to Reviewer agent'
        });

        // Tester agent rules
        this.internalRules.push({
            patterns: [
                /^(?:write|create|generate|add)\s+(?:unit\s+)?tests?\s+(?:for\s+)?(.+)/i,
                /^test\s+(.+)/i,
                /^create\s+(?:test\s+)?(?:cases?|suite)\s+(?:for\s+)?(.+)/i,
                /^how\s+(?:should\s+)?(?:i|we)\s+test\s+(.+)/i,
                /^verify\s+(.+)/i,
                /^validate\s+(.+)/i,
                /^ensure\s+(.+)\s+works/i
            ],
            agent: SubagentType.TESTER,
            priority: 10,
            description: 'Routes test generation tasks to Tester agent'
        });

        // Debugger agent rules
        this.internalRules.push({
            patterns: [
                /^debug\s+(.+)/i,
                /^fix\s+(?:the\s+)?(?:bug|issue|error|problem)\s+(?:in\s+|with\s+)?(.+)/i,
                /^why\s+(?:is|does)\s+(.+)\s+(?:not\s+working|failing|broken)/i,
                /^troubleshoot\s+(.+)/i,
                /^diagnose\s+(.+)/i,
                /^investigate\s+(?:the\s+)?(?:issue|error|bug)\s+(?:in\s+|with\s+)?(.+)/i,
                /^what(?:'s|\s+is)\s+causing\s+(.+)/i,
                /^trace\s+(.+)/i
            ],
            agent: SubagentType.DEBUGGER,
            priority: 10,
            description: 'Routes debugging tasks to Debugger agent'
        });

        // Documenter agent rules
        this.internalRules.push({
            patterns: [
                /^document\s+(.+)/i,
                /^(?:write|create|generate|add)\s+(?:documentation|docs?|comments?)\s+(?:for\s+)?(.+)/i,
                /^explain\s+(?:the\s+)?(?:code|function|class|module)\s+(.+)/i,
                /^add\s+(?:jsdoc|docstrings?|comments?)\s+(?:to\s+)?(.+)/i,
                /^describe\s+(.+)/i,
                /^annotate\s+(.+)/i
            ],
            agent: SubagentType.DOCUMENTER,
            priority: 10,
            description: 'Routes documentation tasks to Documenter agent'
        });

        // Refactorer agent rules
        this.internalRules.push({
            patterns: [
                /^refactor\s+(.+)/i,
                /^improve\s+(?:the\s+)?(?:code|quality|structure)\s+(?:of\s+)?(.+)/i,
                /^clean\s+up\s+(.+)/i,
                /^optimize\s+(.+)/i,
                /^simplify\s+(.+)/i,
                /^restructure\s+(.+)/i,
                /^modernize\s+(.+)/i,
                /^make\s+(.+)\s+(?:cleaner|better|more\s+readable)/i,
                /^extract\s+(.+)/i,
                /^rename\s+(.+)/i
            ],
            agent: SubagentType.REFACTORER,
            priority: 10,
            description: 'Routes refactoring tasks to Refactorer agent'
        });

        // Security agent rules
        this.internalRules.push({
            patterns: [
                /^(?:security\s+)?audit\s+(.+)/i,
                /^check\s+(?:for\s+)?(?:security\s+)?(?:vulnerabilities|issues)\s+(?:in\s+)?(.+)/i,
                /^scan\s+(?:for\s+)?(?:security\s+)?(?:vulnerabilities|issues)\s+(?:in\s+)?(.+)/i,
                /^find\s+(?:security\s+)?(?:vulnerabilities|issues)\s+(?:in\s+)?(.+)/i,
                /^is\s+(.+)\s+secure/i,
                /^(?:security\s+)?review\s+(.+)/i,
                /^analyze\s+(?:security\s+)?(?:of\s+)?(.+)/i,
                /^pentest\s+(.+)/i,
                /^vulnerability\s+(?:scan|check|assessment)\s+(?:of\s+)?(.+)/i
            ],
            agent: SubagentType.SECURITY,
            priority: 15, // Higher priority for security-specific phrases
            description: 'Routes security audit tasks to Security agent'
        });

        // Pipeline rules
        this.pipelineRules.push({
            patterns: [
                /^(?:full\s+)?development\s+(?:cycle|workflow)\s+(?:for\s+)?(.+)/i,
                /^plan\s+(?:and\s+)?implement\s+(?:and\s+)?review\s+(.+)/i,
                /^complete\s+(?:development\s+)?(?:of\s+)?(.+)/i
            ],
            pipeline: 'plan_implement_review',
            priority: 20,
            description: 'Routes to Plan → Implement → Review pipeline'
        });

        this.pipelineRules.push({
            patterns: [
                /^explore\s+(?:and\s+)?(?:then\s+)?plan\s+(?:and\s+)?implement\s+(.+)/i,
                /^discover\s+(?:and\s+)?(?:then\s+)?(?:build|implement)\s+(.+)/i,
                /^understand\s+(?:and\s+)?(?:then\s+)?(?:build|implement)\s+(.+)/i
            ],
            pipeline: 'explore_plan_implement',
            priority: 20,
            description: 'Routes to Explore → Plan → Implement pipeline'
        });

        this.pipelineRules.push({
            patterns: [
                /^debug\s+(?:and\s+)?fix\s+(?:and\s+)?test\s+(.+)/i,
                /^fix\s+(?:and\s+)?(?:then\s+)?test\s+(.+)/i,
                /^troubleshoot\s+(?:and\s+)?(?:resolve|fix)\s+(.+)/i
            ],
            pipeline: 'debug_fix_test',
            priority: 20,
            description: 'Routes to Debug → Fix → Test pipeline'
        });

        this.pipelineRules.push({
            patterns: [
                /^security\s+(?:audit\s+)?(?:and\s+)?fix\s+(.+)/i,
                /^find\s+(?:and\s+)?fix\s+(?:security\s+)?vulnerabilities\s+(?:in\s+)?(.+)/i,
                /^secure\s+(.+)/i
            ],
            pipeline: 'security_audit_fix',
            priority: 20,
            description: 'Routes to Security Audit → Fix pipeline'
        });

        this.pipelineRules.push({
            patterns: [
                /^refactor\s+(?:and\s+)?review\s+(?:and\s+)?test\s+(.+)/i,
                /^improve\s+(?:and\s+)?validate\s+(.+)/i,
                /^safe(?:ly)?\s+refactor\s+(.+)/i
            ],
            pipeline: 'refactor_review_test',
            priority: 20,
            description: 'Routes to Refactor → Review → Test pipeline'
        });

        // Strategy rules
        this.strategyRules.push({
            patterns: [
                /^(?:run\s+)?parallel\s+(.+)/i,
                /^race\s+(?:agents?\s+)?(?:on\s+)?(.+)/i,
                /^fast(?:est)?\s+(?:way\s+to\s+)?(.+)/i
            ],
            strategy: OrchestrationStrategy.RACE_EXECUTION,
            priority: 15,
            description: 'Routes to race execution strategy'
        });

        this.strategyRules.push({
            patterns: [
                /^consensus\s+(?:on\s+)?(.+)/i,
                /^(?:get\s+)?multiple\s+opinions?\s+(?:on\s+)?(.+)/i,
                /^aggregate\s+(?:results?\s+)?(?:for\s+)?(.+)/i
            ],
            strategy: OrchestrationStrategy.CONSENSUS,
            priority: 15,
            description: 'Routes to consensus strategy'
        });

        this.strategyRules.push({
            patterns: [
                /^decompose\s+(.+)/i,
                /^split\s+(?:up\s+)?(.+)/i,
                /^distribute\s+(.+)/i
            ],
            strategy: OrchestrationStrategy.DECOMPOSITION,
            priority: 15,
            description: 'Routes to decomposition strategy'
        });
    }

    /**
     * Initialize external agent configurations
     */
    private initializeExternalAgents(): void {
        // Claude Code
        this.externalAgents.set(ExternalAgentType.CLAUDE_CODE, {
            type: ExternalAgentType.CLAUDE_CODE,
            name: 'Claude Code',
            triggers: ['hey claude', 'ask claude', 'claude'],
            command: 'claude-code.chat',
            available: false // Will be detected
        });

        // GitHub Copilot
        this.externalAgents.set(ExternalAgentType.COPILOT, {
            type: ExternalAgentType.COPILOT,
            name: 'GitHub Copilot',
            triggers: ['hey copilot', 'ask copilot', 'copilot'],
            command: 'github.copilot.chat.open',
            available: false
        });

        // Codex CLI
        this.externalAgents.set(ExternalAgentType.CODEX, {
            type: ExternalAgentType.CODEX,
            name: 'OpenAI Codex',
            triggers: ['hey codex', 'ask codex', 'codex'],
            command: undefined, // CLI-based
            available: false
        });

        // Gemini
        this.externalAgents.set(ExternalAgentType.GEMINI, {
            type: ExternalAgentType.GEMINI,
            name: 'Google Gemini',
            triggers: ['hey gemini', 'ask gemini', 'gemini'],
            command: undefined,
            available: false
        });

        // Cursor
        this.externalAgents.set(ExternalAgentType.CURSOR, {
            type: ExternalAgentType.CURSOR,
            name: 'Cursor AI',
            triggers: ['hey cursor', 'ask cursor', 'cursor'],
            command: undefined,
            available: false
        });

        // Augment
        this.externalAgents.set(ExternalAgentType.AUGMENT, {
            type: ExternalAgentType.AUGMENT,
            name: 'Augment Code',
            triggers: ['hey augment', 'ask augment', 'augment'],
            command: 'augment.chat',
            available: false
        });

        // Build external rules from configurations
        this.buildExternalRules();
    }

    /**
     * Build routing rules for external agents
     */
    private buildExternalRules(): void {
        for (const [agentType, config] of this.externalAgents) {
            const patterns = config.triggers.map(trigger => {
                // Escape special regex characters in trigger
                const escaped = trigger.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                return new RegExp(`^${escaped}[,:]?\\s*(.+)`, 'i');
            });

            this.externalRules.push({
                patterns,
                externalAgent: agentType,
                priority: 25, // External agents have highest priority when explicitly triggered
                description: `Routes to ${config.name}`
            });
        }
    }

    /**
     * Detect available external agents
     */
    async detectExternalAgents(): Promise<Map<ExternalAgentType, boolean>> {
        const results = new Map<ExternalAgentType, boolean>();

        for (const [agentType, config] of this.externalAgents) {
            let available = false;

            if (config.command) {
                // Check if VS Code command is available
                const commands = await vscode.commands.getCommands();
                available = commands.includes(config.command);
            } else {
                // Check if extension is installed
                const extensions = vscode.extensions.all;
                switch (agentType) {
                    case ExternalAgentType.CLAUDE_CODE:
                        available = extensions.some(e =>
                            e.id.toLowerCase().includes('claude') ||
                            e.id.toLowerCase().includes('anthropic')
                        );
                        break;
                    case ExternalAgentType.COPILOT:
                        available = extensions.some(e =>
                            e.id.toLowerCase() === 'github.copilot' ||
                            e.id.toLowerCase() === 'github.copilot-chat'
                        );
                        break;
                    case ExternalAgentType.CURSOR:
                        // Cursor is a separate IDE, not an extension
                        available = process.env.CURSOR_VERSION !== undefined;
                        break;
                    case ExternalAgentType.AUGMENT:
                        available = extensions.some(e =>
                            e.id.toLowerCase().includes('augment')
                        );
                        break;
                    default:
                        available = false;
                }
            }

            config.available = available;
            results.set(agentType, available);
        }

        return results;
    }

    /**
     * Route voice input to the appropriate agent
     */
    async route(input: string): Promise<RouteMatch> {
        const trimmedInput = input.trim();

        // Check external agents first (highest priority when explicitly triggered)
        for (const rule of this.externalRules) {
            for (const pattern of rule.patterns) {
                const match = trimmedInput.match(pattern);
                if (match && rule.externalAgent) {
                    const config = this.externalAgents.get(rule.externalAgent);
                    const routeMatch: RouteMatch = {
                        type: 'external',
                        externalAgent: rule.externalAgent,
                        confidence: config?.available ? 0.95 : 0.7,
                        extractedTask: match[1] || trimmedInput,
                        originalInput: trimmedInput
                    };
                    this.addToHistory(routeMatch);
                    return routeMatch;
                }
            }
        }

        // Check pipeline rules
        for (const rule of this.pipelineRules) {
            for (const pattern of rule.patterns) {
                const match = trimmedInput.match(pattern);
                if (match && rule.pipeline) {
                    const routeMatch: RouteMatch = {
                        type: 'pipeline',
                        pipeline: rule.pipeline,
                        confidence: 0.9,
                        extractedTask: match[1] || trimmedInput,
                        originalInput: trimmedInput
                    };
                    this.addToHistory(routeMatch);
                    return routeMatch;
                }
            }
        }

        // Check strategy rules
        for (const rule of this.strategyRules) {
            for (const pattern of rule.patterns) {
                const match = trimmedInput.match(pattern);
                if (match && rule.strategy) {
                    const routeMatch: RouteMatch = {
                        type: 'strategy',
                        strategy: rule.strategy,
                        confidence: 0.85,
                        extractedTask: match[1] || trimmedInput,
                        originalInput: trimmedInput
                    };
                    this.addToHistory(routeMatch);
                    return routeMatch;
                }
            }
        }

        // Check internal agent rules
        let bestMatch: RouteMatch | null = null;
        let bestPriority = -1;

        for (const rule of this.internalRules) {
            for (const pattern of rule.patterns) {
                const match = trimmedInput.match(pattern);
                if (match && rule.agent && rule.priority > bestPriority) {
                    bestMatch = {
                        type: 'internal',
                        agent: rule.agent,
                        confidence: 0.85,
                        extractedTask: match[1] || trimmedInput,
                        originalInput: trimmedInput
                    };
                    bestPriority = rule.priority;
                }
            }
        }

        if (bestMatch) {
            this.addToHistory(bestMatch);
            return bestMatch;
        }

        // No match found - use auto-classification
        const autoRoute = await this.autoClassify(trimmedInput);
        this.addToHistory(autoRoute);
        return autoRoute;
    }

    /**
     * Auto-classify input when no explicit pattern matches
     */
    private async autoClassify(input: string): Promise<RouteMatch> {
        const lowerInput = input.toLowerCase();

        // Keyword-based classification with confidence scores
        const scores: Map<SubagentType, number> = new Map();

        // Initialize all scores
        Object.values(SubagentType).forEach(agent => {
            if (typeof agent === 'string') {
                scores.set(agent as SubagentType, 0);
            }
        });

        // Planner keywords
        const plannerKeywords = ['plan', 'design', 'architect', 'strategy', 'approach', 'steps', 'how to', 'break down'];
        plannerKeywords.forEach(kw => {
            if (lowerInput.includes(kw)) {
                scores.set(SubagentType.PLANNER, (scores.get(SubagentType.PLANNER) || 0) + 1);
            }
        });

        // Explorer keywords
        const explorerKeywords = ['find', 'search', 'locate', 'where', 'look', 'show', 'list', 'discover'];
        explorerKeywords.forEach(kw => {
            if (lowerInput.includes(kw)) {
                scores.set(SubagentType.EXPLORER, (scores.get(SubagentType.EXPLORER) || 0) + 1);
            }
        });

        // Coder keywords
        const coderKeywords = ['write', 'create', 'implement', 'code', 'generate', 'build', 'make', 'add'];
        coderKeywords.forEach(kw => {
            if (lowerInput.includes(kw)) {
                scores.set(SubagentType.CODER, (scores.get(SubagentType.CODER) || 0) + 1);
            }
        });

        // Reviewer keywords
        const reviewerKeywords = ['review', 'check', 'analyze', 'evaluate', 'assess', 'critique', 'inspect'];
        reviewerKeywords.forEach(kw => {
            if (lowerInput.includes(kw)) {
                scores.set(SubagentType.REVIEWER, (scores.get(SubagentType.REVIEWER) || 0) + 1);
            }
        });

        // Tester keywords
        const testerKeywords = ['test', 'verify', 'validate', 'unit test', 'spec', 'coverage'];
        testerKeywords.forEach(kw => {
            if (lowerInput.includes(kw)) {
                scores.set(SubagentType.TESTER, (scores.get(SubagentType.TESTER) || 0) + 1);
            }
        });

        // Debugger keywords
        const debuggerKeywords = ['debug', 'fix', 'error', 'bug', 'issue', 'problem', 'broken', 'not working', 'failing'];
        debuggerKeywords.forEach(kw => {
            if (lowerInput.includes(kw)) {
                scores.set(SubagentType.DEBUGGER, (scores.get(SubagentType.DEBUGGER) || 0) + 1);
            }
        });

        // Documenter keywords
        const documenterKeywords = ['document', 'explain', 'describe', 'comment', 'jsdoc', 'docstring', 'readme'];
        documenterKeywords.forEach(kw => {
            if (lowerInput.includes(kw)) {
                scores.set(SubagentType.DOCUMENTER, (scores.get(SubagentType.DOCUMENTER) || 0) + 1);
            }
        });

        // Refactorer keywords
        const refactorerKeywords = ['refactor', 'improve', 'clean', 'optimize', 'simplify', 'restructure', 'modernize'];
        refactorerKeywords.forEach(kw => {
            if (lowerInput.includes(kw)) {
                scores.set(SubagentType.REFACTORER, (scores.get(SubagentType.REFACTORER) || 0) + 1);
            }
        });

        // Security keywords
        const securityKeywords = ['security', 'vulnerability', 'secure', 'audit', 'penetration', 'exploit', 'xss', 'sql injection', 'owasp'];
        securityKeywords.forEach(kw => {
            if (lowerInput.includes(kw)) {
                scores.set(SubagentType.SECURITY, (scores.get(SubagentType.SECURITY) || 0) + 2); // Double weight for security
            }
        });

        // Find best match
        let bestAgent: SubagentType = SubagentType.CODER; // Default to coder
        let bestScore = 0;

        for (const [agent, score] of scores) {
            if (score > bestScore) {
                bestScore = score;
                bestAgent = agent;
            }
        }

        // Calculate confidence based on score
        const totalKeywords = plannerKeywords.length + explorerKeywords.length + coderKeywords.length +
            reviewerKeywords.length + testerKeywords.length + debuggerKeywords.length +
            documenterKeywords.length + refactorerKeywords.length + securityKeywords.length;

        const confidence = bestScore > 0 ? Math.min(0.5 + (bestScore * 0.15), 0.8) : 0.3;

        return {
            type: bestScore > 0 ? 'internal' : 'unknown',
            agent: bestAgent,
            confidence,
            extractedTask: input,
            originalInput: input
        };
    }

    /**
     * Execute the routed action
     */
    async execute(routeMatch: RouteMatch, context?: CodeContext): Promise<AgentResult | null> {
        switch (routeMatch.type) {
            case 'internal':
                if (routeMatch.agent) {
                    return this.bridge.executeWithAgent(
                        routeMatch.agent,
                        routeMatch.extractedTask,
                        context
                    );
                }
                break;

            case 'external':
                if (routeMatch.externalAgent) {
                    await this.executeExternalAgent(routeMatch.externalAgent, routeMatch.extractedTask);
                }
                break;

            case 'pipeline':
                if (routeMatch.pipeline) {
                    await vscode.commands.executeCommand('voicecode.runPipeline', routeMatch.pipeline);
                }
                break;

            case 'strategy':
                if (routeMatch.strategy) {
                    return this.bridge.executeWithStrategy(
                        routeMatch.strategy,
                        routeMatch.extractedTask,
                        context
                    );
                }
                break;

            case 'unknown':
                // Show agent selection for unknown input
                await vscode.commands.executeCommand('voicecode.selectInternalAgent');
                break;
        }

        return null;
    }

    /**
     * Execute external agent command
     */
    private async executeExternalAgent(agentType: ExternalAgentType, task: string): Promise<void> {
        const config = this.externalAgents.get(agentType);
        if (!config) {
            vscode.window.showErrorMessage(`External agent ${agentType} not configured`);
            return;
        }

        if (!config.available) {
            const installPrompt = await vscode.window.showWarningMessage(
                `${config.name} is not available. Would you like to learn how to install it?`,
                'Learn More',
                'Cancel'
            );

            if (installPrompt === 'Learn More') {
                await this.showExternalAgentInstallInstructions(agentType);
            }
            return;
        }

        if (config.command) {
            try {
                await vscode.commands.executeCommand(config.command, task);
            } catch (error) {
                vscode.window.showErrorMessage(
                    `Failed to execute ${config.name}: ${error instanceof Error ? error.message : 'Unknown error'}`
                );
            }
        } else {
            vscode.window.showInformationMessage(
                `${config.name} requires external setup. The task "${task}" has been copied to clipboard.`
            );
            await vscode.env.clipboard.writeText(task);
        }
    }

    /**
     * Show installation instructions for external agents
     */
    private async showExternalAgentInstallInstructions(agentType: ExternalAgentType): Promise<void> {
        const instructions: Record<ExternalAgentType, string> = {
            [ExternalAgentType.CLAUDE_CODE]: 'https://www.anthropic.com/claude-code',
            [ExternalAgentType.COPILOT]: 'https://github.com/features/copilot',
            [ExternalAgentType.CODEX]: 'https://platform.openai.com/docs/guides/code',
            [ExternalAgentType.GEMINI]: 'https://ai.google.dev/',
            [ExternalAgentType.CURSOR]: 'https://cursor.so',
            [ExternalAgentType.AUGMENT]: 'https://www.augmentcode.com',
            [ExternalAgentType.CUSTOM]: ''
        };

        const url = instructions[agentType];
        if (url) {
            await vscode.env.openExternal(vscode.Uri.parse(url));
        }
    }

    /**
     * Add route match to history
     */
    private addToHistory(match: RouteMatch): void {
        this.routingHistory.unshift(match);
        if (this.routingHistory.length > this.maxHistorySize) {
            this.routingHistory.pop();
        }
    }

    /**
     * Get routing history
     */
    getHistory(): RouteMatch[] {
        return [...this.routingHistory];
    }

    /**
     * Get routing statistics
     */
    getStatistics(): Record<string, number> {
        const stats: Record<string, number> = {
            total: this.routingHistory.length,
            internal: 0,
            external: 0,
            pipeline: 0,
            strategy: 0,
            unknown: 0
        };

        for (const match of this.routingHistory) {
            stats[match.type]++;
        }

        return stats;
    }

    /**
     * Get available agents (internal + external)
     */
    async getAvailableAgents(): Promise<{
        internal: SubagentType[];
        external: ExternalAgentType[];
    }> {
        await this.detectExternalAgents();

        const internal = Object.values(SubagentType).filter(v => typeof v === 'string') as SubagentType[];
        const external: ExternalAgentType[] = [];

        for (const [agentType, config] of this.externalAgents) {
            if (config.available) {
                external.push(agentType);
            }
        }

        return { internal, external };
    }

    /**
     * Register a custom external agent
     */
    registerExternalAgent(config: ExternalAgentConfig): void {
        this.externalAgents.set(config.type, config);
        this.buildExternalRules();
    }

    /**
     * Suggest agents based on input without executing
     */
    async suggestAgents(input: string): Promise<Array<{
        agent: SubagentType | ExternalAgentType;
        type: 'internal' | 'external';
        confidence: number;
        reason: string;
    }>> {
        const suggestions: Array<{
            agent: SubagentType | ExternalAgentType;
            type: 'internal' | 'external';
            confidence: number;
            reason: string;
        }> = [];

        const route = await this.route(input);

        // Add primary suggestion
        if (route.type === 'internal' && route.agent) {
            suggestions.push({
                agent: route.agent,
                type: 'internal',
                confidence: route.confidence,
                reason: `Best match for "${input.substring(0, 30)}..."`
            });
        } else if (route.type === 'external' && route.externalAgent) {
            suggestions.push({
                agent: route.externalAgent,
                type: 'external',
                confidence: route.confidence,
                reason: `Explicitly requested ${route.externalAgent}`
            });
        }

        // Add alternative suggestions based on keywords
        const lowerInput = input.toLowerCase();

        // Always suggest Coder for implementation tasks
        if (lowerInput.includes('implement') || lowerInput.includes('create') || lowerInput.includes('build')) {
            if (route.agent !== SubagentType.CODER) {
                suggestions.push({
                    agent: SubagentType.CODER,
                    type: 'internal',
                    confidence: 0.7,
                    reason: 'Good for code generation tasks'
                });
            }
        }

        // Suggest Reviewer for quality-related tasks
        if (lowerInput.includes('quality') || lowerInput.includes('check') || lowerInput.includes('verify')) {
            if (route.agent !== SubagentType.REVIEWER) {
                suggestions.push({
                    agent: SubagentType.REVIEWER,
                    type: 'internal',
                    confidence: 0.6,
                    reason: 'Can review code quality'
                });
            }
        }

        // Suggest available external agents
        await this.detectExternalAgents();
        for (const [agentType, config] of this.externalAgents) {
            if (config.available && !suggestions.some(s => s.agent === agentType)) {
                suggestions.push({
                    agent: agentType,
                    type: 'external',
                    confidence: 0.4,
                    reason: `${config.name} is available`
                });
            }
        }

        // Sort by confidence
        suggestions.sort((a, b) => b.confidence - a.confidence);

        return suggestions.slice(0, 5); // Return top 5 suggestions
    }
}

/**
 * Register voice agent router commands
 */
export function registerVoiceAgentRouterCommands(
    context: vscode.ExtensionContext,
    router: VoiceAgentRouter
): void {
    // Route voice command
    context.subscriptions.push(
        vscode.commands.registerCommand('voicecode.routeVoiceCommand', async (input?: string) => {
            if (!input) {
                input = await vscode.window.showInputBox({
                    prompt: 'Enter voice command to route',
                    placeHolder: 'e.g., "plan how to implement authentication"'
                });
            }

            if (!input) {
                return;
            }

            const route = await router.route(input);

            // Show routing result
            const agentName = route.agent || route.externalAgent || route.pipeline || route.strategy || 'Unknown';
            const message = `Routed to: ${agentName} (${(route.confidence * 100).toFixed(0)}% confidence)`;

            const action = await vscode.window.showInformationMessage(
                message,
                'Execute',
                'Change Agent',
                'Cancel'
            );

            if (action === 'Execute') {
                await router.execute(route);
            } else if (action === 'Change Agent') {
                await vscode.commands.executeCommand('voicecode.selectInternalAgent');
            }
        })
    );

    // Get agent suggestions
    context.subscriptions.push(
        vscode.commands.registerCommand('voicecode.suggestAgents', async (input?: string) => {
            if (!input) {
                input = await vscode.window.showInputBox({
                    prompt: 'Enter task to get agent suggestions',
                    placeHolder: 'e.g., "find all authentication-related code"'
                });
            }

            if (!input) {
                return;
            }

            const suggestions = await router.suggestAgents(input);

            if (suggestions.length === 0) {
                vscode.window.showInformationMessage('No agent suggestions available');
                return;
            }

            const items = suggestions.map(s => ({
                label: `$(${s.type === 'internal' ? 'robot' : 'cloud'}) ${s.agent}`,
                description: `${(s.confidence * 100).toFixed(0)}% confidence`,
                detail: s.reason,
                suggestion: s
            }));

            const selected = await vscode.window.showQuickPick(items, {
                placeHolder: 'Select an agent to execute the task',
                title: 'Agent Suggestions'
            });

            if (selected) {
                if (selected.suggestion.type === 'internal') {
                    await vscode.commands.executeCommand('voicecode.useInternalAgent', {
                        id: selected.suggestion.agent
                    });
                } else {
                    const route: RouteMatch = {
                        type: 'external',
                        externalAgent: selected.suggestion.agent as ExternalAgentType,
                        confidence: selected.suggestion.confidence,
                        extractedTask: input,
                        originalInput: input
                    };
                    await router.execute(route);
                }
            }
        })
    );

    // Detect external agents
    context.subscriptions.push(
        vscode.commands.registerCommand('voicecode.detectExternalAgents', async () => {
            const results = await router.detectExternalAgents();

            const available: string[] = [];
            const unavailable: string[] = [];

            for (const [agent, isAvailable] of results) {
                if (isAvailable) {
                    available.push(agent);
                } else {
                    unavailable.push(agent);
                }
            }

            let message = '';
            if (available.length > 0) {
                message += `Available: ${available.join(', ')}`;
            }
            if (unavailable.length > 0) {
                if (message) message += ' | ';
                message += `Not installed: ${unavailable.join(', ')}`;
            }

            vscode.window.showInformationMessage(`External Agents: ${message}`);
        })
    );

    // Show routing history
    context.subscriptions.push(
        vscode.commands.registerCommand('voicecode.showRoutingHistory', async () => {
            const history = router.getHistory();

            if (history.length === 0) {
                vscode.window.showInformationMessage('No routing history available');
                return;
            }

            const items = history.slice(0, 20).map((match, index) => ({
                label: `${match.type}: ${match.agent || match.externalAgent || match.pipeline || match.strategy}`,
                description: `${(match.confidence * 100).toFixed(0)}% confidence`,
                detail: match.extractedTask.substring(0, 80) + (match.extractedTask.length > 80 ? '...' : ''),
                match
            }));

            const selected = await vscode.window.showQuickPick(items, {
                placeHolder: 'Select to re-execute a previous routing',
                title: 'Routing History'
            });

            if (selected) {
                await router.execute(selected.match);
            }
        })
    );

    // Show routing statistics
    context.subscriptions.push(
        vscode.commands.registerCommand('voicecode.showRoutingStats', async () => {
            const stats = router.getStatistics();

            const message = `Routing Statistics:
• Total: ${stats.total}
• Internal: ${stats.internal}
• External: ${stats.external}
• Pipeline: ${stats.pipeline}
• Strategy: ${stats.strategy}
• Unknown: ${stats.unknown}`;

            vscode.window.showInformationMessage(message);
        })
    );
}
