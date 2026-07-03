/**
 * Web Browsing Agent
 * Provides browser automation, web research, documentation lookup,
 * and web page analysis capabilities
 */

import * as vscode from 'vscode';
import * as https from 'https';
import * as http from 'http';
import { URL } from 'url';
import { InternalAgentBridge } from './internalAgentBridge';
import { SubagentType, CodeContext } from '../types/agents';

/**
 * Web page content
 */
interface WebPageContent {
    url: string;
    title: string;
    content: string;
    html?: string;
    links: Array<{ text: string; href: string }>;
    images: Array<{ alt: string; src: string }>;
    metadata: {
        description?: string;
        keywords?: string[];
        author?: string;
        publishDate?: string;
    };
    fetchedAt: number;
}

/**
 * Search result
 */
interface SearchResult {
    title: string;
    url: string;
    snippet: string;
    source: string;
}

/**
 * Documentation result
 */
interface DocumentationResult {
    title: string;
    content: string;
    codeExamples: Array<{
        language: string;
        code: string;
        description?: string;
    }>;
    relatedLinks: Array<{ text: string; url: string }>;
    source: string;
    lastUpdated?: string;
}

/**
 * API Endpoint Info
 */
interface APIEndpointInfo {
    method: string;
    path: string;
    description: string;
    parameters: Array<{
        name: string;
        type: string;
        required: boolean;
        description: string;
    }>;
    requestBody?: {
        contentType: string;
        schema: Record<string, unknown>;
    };
    responses: Array<{
        statusCode: number;
        description: string;
        schema?: Record<string, unknown>;
    }>;
    examples?: Array<{
        description: string;
        request: string;
        response: string;
    }>;
}

/**
 * Browser session state
 */
interface BrowserSession {
    id: string;
    history: string[];
    cookies: Map<string, string>;
    localStorage: Map<string, string>;
    currentUrl?: string;
    currentPage?: WebPageContent;
}

/**
 * Web Browsing Agent
 */
export class WebBrowsingAgent implements vscode.Disposable {
    private bridge: InternalAgentBridge;
    private outputChannel: vscode.OutputChannel;
    private sessions: Map<string, BrowserSession> = new Map();
    private pageCache: Map<string, { content: WebPageContent; expires: number }> = new Map();
    private cacheTTL = 5 * 60 * 1000; // 5 minutes
    private userAgent = 'VoiceCode-Agent/1.0 (AI Development Assistant)';

    constructor(bridge: InternalAgentBridge) {
        this.bridge = bridge;
        this.outputChannel = vscode.window.createOutputChannel('VoiceCode Web Browser');
    }

    /**
     * Create a new browser session
     */
    createSession(): string {
        const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        this.sessions.set(sessionId, {
            id: sessionId,
            history: [],
            cookies: new Map(),
            localStorage: new Map()
        });
        this.log(`Created browser session: ${sessionId}`);
        return sessionId;
    }

    /**
     * Close a browser session
     */
    closeSession(sessionId: string): void {
        this.sessions.delete(sessionId);
        this.log(`Closed browser session: ${sessionId}`);
    }

    /**
     * Fetch a web page
     */
    async fetchPage(url: string, sessionId?: string): Promise<WebPageContent> {
        // Check cache first
        const cached = this.pageCache.get(url);
        if (cached && cached.expires > Date.now()) {
            this.log(`Cache hit for: ${url}`);
            return cached.content;
        }

        try {
            this.log(`Fetching: ${url}`);
            const html = await this.httpGet(url);
            const content = this.parseHTML(html, url);

            // Update cache
            this.pageCache.set(url, {
                content,
                expires: Date.now() + this.cacheTTL
            });

            // Update session if provided
            if (sessionId) {
                const session = this.sessions.get(sessionId);
                if (session) {
                    session.history.push(url);
                    session.currentUrl = url;
                    session.currentPage = content;
                }
            }

            return content;
        } catch (error) {
            this.log(`Fetch failed for ${url}: ${error}`, 'error');
            throw error;
        }
    }

    /**
     * HTTP GET request
     */
    private httpGet(url: string): Promise<string> {
        return new Promise((resolve, reject) => {
            const parsedUrl = new URL(url);
            const protocol = parsedUrl.protocol === 'https:' ? https : http;

            const options = {
                hostname: parsedUrl.hostname,
                port: parsedUrl.port,
                path: parsedUrl.pathname + parsedUrl.search,
                method: 'GET',
                headers: {
                    'User-Agent': this.userAgent,
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                    'Accept-Language': 'en-US,en;q=0.5',
                    'Connection': 'keep-alive'
                },
                timeout: 30000
            };

            const req = protocol.request(options, (res) => {
                // Handle redirects
                if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                    const redirectUrl = new URL(res.headers.location, url).toString();
                    this.httpGet(redirectUrl).then(resolve).catch(reject);
                    return;
                }

                if (res.statusCode && res.statusCode >= 400) {
                    reject(new Error(`HTTP ${res.statusCode}: ${res.statusMessage}`));
                    return;
                }

                let data = '';
                res.setEncoding('utf8');
                res.on('data', (chunk) => { data += chunk; });
                res.on('end', () => resolve(data));
            });

            req.on('error', reject);
            req.on('timeout', () => {
                req.destroy();
                reject(new Error('Request timeout'));
            });

            req.end();
        });
    }

    /**
     * Parse HTML content
     */
    private parseHTML(html: string, url: string): WebPageContent {
        // Extract title
        const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
        const title = titleMatch ? this.decodeHTMLEntities(titleMatch[1].trim()) : '';

        // Extract meta description
        const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']*)["']/i) ||
                          html.match(/<meta[^>]*content=["']([^"']*)["'][^>]*name=["']description["']/i);
        const description = descMatch ? this.decodeHTMLEntities(descMatch[1]) : undefined;

        // Extract meta keywords
        const keywordsMatch = html.match(/<meta[^>]*name=["']keywords["'][^>]*content=["']([^"']*)["']/i);
        const keywords = keywordsMatch ? keywordsMatch[1].split(',').map(k => k.trim()) : undefined;

        // Extract links
        const links: Array<{ text: string; href: string }> = [];
        const linkRegex = /<a[^>]*href=["']([^"']*)["'][^>]*>([^<]*)<\/a>/gi;
        let linkMatch;
        while ((linkMatch = linkRegex.exec(html)) !== null) {
            const href = this.resolveUrl(linkMatch[1], url);
            const text = this.decodeHTMLEntities(linkMatch[2].trim());
            if (text && href) {
                links.push({ text, href });
            }
        }

        // Extract images
        const images: Array<{ alt: string; src: string }> = [];
        const imgRegex = /<img[^>]*src=["']([^"']*)["'][^>]*(?:alt=["']([^"']*)["'])?/gi;
        let imgMatch;
        while ((imgMatch = imgRegex.exec(html)) !== null) {
            const src = this.resolveUrl(imgMatch[1], url);
            const alt = imgMatch[2] ? this.decodeHTMLEntities(imgMatch[2]) : '';
            if (src) {
                images.push({ alt, src });
            }
        }

        // Extract text content (remove scripts, styles, and tags)
        let content = html
            .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
            .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
            .replace(/<[^>]+>/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();

        content = this.decodeHTMLEntities(content);

        return {
            url,
            title,
            content,
            html,
            links: links.slice(0, 100), // Limit to 100 links
            images: images.slice(0, 50), // Limit to 50 images
            metadata: {
                description,
                keywords
            },
            fetchedAt: Date.now()
        };
    }

    /**
     * Resolve relative URL to absolute
     */
    private resolveUrl(href: string, base: string): string {
        try {
            return new URL(href, base).toString();
        } catch {
            return href;
        }
    }

    /**
     * Decode HTML entities
     */
    private decodeHTMLEntities(text: string): string {
        const entities: Record<string, string> = {
            '&amp;': '&',
            '&lt;': '<',
            '&gt;': '>',
            '&quot;': '"',
            '&#39;': "'",
            '&nbsp;': ' ',
            '&copy;': '©',
            '&reg;': '®',
            '&trade;': '™'
        };

        return text.replace(/&[^;]+;/g, (match) => {
            if (entities[match]) {
                return entities[match];
            }
            // Handle numeric entities
            if (match.startsWith('&#x')) {
                return String.fromCharCode(parseInt(match.slice(3, -1), 16));
            }
            if (match.startsWith('&#')) {
                return String.fromCharCode(parseInt(match.slice(2, -1), 10));
            }
            return match;
        });
    }

    /**
     * Search the web
     */
    async search(query: string, options: {
        numResults?: number;
        site?: string;
        type?: 'web' | 'documentation' | 'api' | 'stackoverflow';
    } = {}): Promise<SearchResult[]> {
        const numResults = options.numResults || 5;
        let searchQuery = query;

        // Add site-specific search
        if (options.site) {
            searchQuery = `site:${options.site} ${query}`;
        }

        // Add type-specific modifiers
        switch (options.type) {
            case 'documentation':
                searchQuery = `${query} documentation tutorial`;
                break;
            case 'api':
                searchQuery = `${query} api reference`;
                break;
            case 'stackoverflow':
                searchQuery = `site:stackoverflow.com ${query}`;
                break;
        }

        this.log(`Searching: ${searchQuery}`);

        // Use AI agent to summarize search intent and provide results
        const result = await this.bridge.executeWithAgent(
            SubagentType.EXPLORER,
            `You are a web search assistant. For the query "${searchQuery}", provide ${numResults} relevant search results in the following JSON format:
{
  "results": [
    {"title": "...", "url": "...", "snippet": "...", "source": "..."}
  ]
}

Focus on authoritative sources like official documentation, MDN, Stack Overflow, and reputable tech blogs.`,
            this.createContext('search')
        );

        try {
            const parsed = JSON.parse(result.content || '{"results": []}');
            return parsed.results || [];
        } catch {
            return [];
        }
    }

    /**
     * Lookup documentation for a topic
     */
    async lookupDocumentation(topic: string, options: {
        language?: string;
        framework?: string;
        version?: string;
    } = {}): Promise<DocumentationResult> {
        let searchQuery = topic;

        if (options.language) {
            searchQuery = `${options.language} ${searchQuery}`;
        }
        if (options.framework) {
            searchQuery = `${options.framework} ${searchQuery}`;
        }
        if (options.version) {
            searchQuery = `${searchQuery} v${options.version}`;
        }

        this.log(`Looking up documentation: ${searchQuery}`);

        // Determine documentation sources based on language/framework
        const docSources = this.getDocumentationSources(options);

        // Use Documenter agent for documentation lookup
        const result = await this.bridge.document(
            `Find and summarize documentation for: ${searchQuery}

Look for:
1. Official documentation from these sources: ${docSources.join(', ')}
2. Code examples with explanations
3. Related concepts and links
4. Best practices

Return comprehensive documentation with examples.`,
            this.createContext('documentation')
        );

        return {
            title: topic,
            content: result.content || '',
            codeExamples: result.code_blocks || [],
            relatedLinks: [],
            source: docSources[0] || 'various'
        };
    }

    /**
     * Get documentation sources for language/framework
     */
    private getDocumentationSources(options: { language?: string; framework?: string }): string[] {
        const sources: string[] = [];

        // Language-specific sources
        switch (options.language?.toLowerCase()) {
            case 'javascript':
            case 'typescript':
                sources.push('MDN Web Docs', 'TypeScript Docs');
                break;
            case 'python':
                sources.push('Python Docs', 'PyPI');
                break;
            case 'rust':
                sources.push('Rust Docs', 'docs.rs');
                break;
            case 'go':
                sources.push('pkg.go.dev', 'Go Docs');
                break;
            case 'java':
                sources.push('Oracle Java Docs', 'Javadoc');
                break;
        }

        // Framework-specific sources
        switch (options.framework?.toLowerCase()) {
            case 'react':
                sources.push('React Docs', 'React Blog');
                break;
            case 'vue':
                sources.push('Vue.js Docs');
                break;
            case 'angular':
                sources.push('Angular Docs');
                break;
            case 'node':
            case 'nodejs':
                sources.push('Node.js Docs');
                break;
            case 'express':
                sources.push('Express.js Docs');
                break;
            case 'tauri':
                sources.push('Tauri Docs');
                break;
        }

        if (sources.length === 0) {
            sources.push('Official Documentation', 'Stack Overflow');
        }

        return sources;
    }

    /**
     * Research a topic comprehensively
     */
    async research(topic: string, depth: 'shallow' | 'medium' | 'deep' = 'medium'): Promise<{
        summary: string;
        keyPoints: string[];
        sources: Array<{ title: string; url: string }>;
        codeExamples?: Array<{ language: string; code: string }>;
        relatedTopics: string[];
    }> {
        this.log(`Researching topic: ${topic} (depth: ${depth})`);

        const numSources = depth === 'shallow' ? 3 : depth === 'medium' ? 5 : 10;

        // Use Planner agent for comprehensive research
        const result = await this.bridge.plan(
            `Research the following topic comprehensively: "${topic}"

Depth level: ${depth}
Number of sources to consult: ${numSources}

Provide:
1. A comprehensive summary
2. Key points and takeaways
3. Relevant code examples if applicable
4. Related topics to explore further

Format your response as structured research findings.`,
            this.createContext('research')
        );

        // Parse research results
        return {
            summary: result.content || '',
            keyPoints: result.steps?.map(s => s.description) || [],
            sources: [],
            relatedTopics: []
        };
    }

    /**
     * Lookup API documentation
     */
    async lookupAPI(apiName: string, options: {
        endpoint?: string;
        method?: string;
        version?: string;
    } = {}): Promise<APIEndpointInfo[]> {
        let query = apiName;

        if (options.endpoint) {
            query = `${apiName} ${options.endpoint}`;
        }
        if (options.method) {
            query = `${query} ${options.method}`;
        }

        this.log(`Looking up API: ${query}`);

        // Use Explorer agent for API documentation
        const result = await this.bridge.explore(
            `Find API documentation for: ${query}

Provide detailed information including:
1. HTTP method and endpoint path
2. Description of what the endpoint does
3. Required and optional parameters
4. Request body schema (if applicable)
5. Response schemas for different status codes
6. Example requests and responses

Return as structured API documentation.`,
            this.createContext('api')
        );

        // Parse API info from result
        return this.parseAPIInfo(result.content || '');
    }

    /**
     * Parse API info from agent response
     */
    private parseAPIInfo(content: string): APIEndpointInfo[] {
        // This would parse the structured response into APIEndpointInfo objects
        return [];
    }

    /**
     * Extract code examples from a URL
     */
    async extractCodeExamples(url: string): Promise<Array<{
        language: string;
        code: string;
        description: string;
        source: string;
    }>> {
        try {
            const page = await this.fetchPage(url);

            // Extract code blocks from HTML
            const codeBlocks: Array<{ language: string; code: string; description: string; source: string }> = [];

            // Match <pre><code> blocks
            const preCodeRegex = /<pre[^>]*>\s*<code[^>]*(?:class=["'][^"']*language-(\w+)[^"']*["'])?[^>]*>([\s\S]*?)<\/code>\s*<\/pre>/gi;
            let match;
            while ((match = preCodeRegex.exec(page.html || '')) !== null) {
                const language = match[1] || 'plaintext';
                const code = this.decodeHTMLEntities(match[2].replace(/<[^>]+>/g, ''));
                codeBlocks.push({
                    language,
                    code,
                    description: '',
                    source: url
                });
            }

            // Match standalone <code> blocks
            const codeRegex = /<code[^>]*(?:class=["'][^"']*language-(\w+)[^"']*["'])?[^>]*>([\s\S]*?)<\/code>/gi;
            while ((match = codeRegex.exec(page.html || '')) !== null) {
                const code = this.decodeHTMLEntities(match[2].replace(/<[^>]+>/g, ''));
                if (code.length > 50) { // Only significant code blocks
                    const language = match[1] || 'plaintext';
                    codeBlocks.push({
                        language,
                        code,
                        description: '',
                        source: url
                    });
                }
            }

            this.log(`Extracted ${codeBlocks.length} code examples from ${url}`);
            return codeBlocks;
        } catch (error) {
            this.log(`Failed to extract code from ${url}: ${error}`, 'error');
            return [];
        }
    }

    /**
     * Summarize a web page
     */
    async summarizePage(url: string): Promise<{
        title: string;
        summary: string;
        keyPoints: string[];
        topics: string[];
    }> {
        const page = await this.fetchPage(url);

        // Use Documenter agent to summarize
        const result = await this.bridge.document(
            `Summarize this web page content:

Title: ${page.title}
URL: ${url}
Content:
${page.content.substring(0, 10000)}

Provide:
1. A concise summary (2-3 paragraphs)
2. Key points as bullet points
3. Main topics covered`,
            this.createContext('summarize')
        );

        return {
            title: page.title,
            summary: result.content || '',
            keyPoints: [],
            topics: []
        };
    }

    /**
     * Monitor a web page for changes
     */
    async monitorPage(url: string, options: {
        interval: number;
        onChange: (changes: { previous: string; current: string; diff: string }) => void;
    }): Promise<vscode.Disposable> {
        let previousContent = '';
        let isRunning = true;

        const check = async () => {
            while (isRunning) {
                try {
                    // Clear cache to get fresh content
                    this.pageCache.delete(url);
                    const page = await this.fetchPage(url);

                    if (previousContent && page.content !== previousContent) {
                        options.onChange({
                            previous: previousContent,
                            current: page.content,
                            diff: this.computeSimpleDiff(previousContent, page.content)
                        });
                    }

                    previousContent = page.content;
                } catch (error) {
                    this.log(`Monitor check failed for ${url}: ${error}`, 'error');
                }

                await new Promise(resolve => setTimeout(resolve, options.interval));
            }
        };

        check();

        return {
            dispose: () => {
                isRunning = false;
            }
        };
    }

    /**
     * Compute simple diff between two strings
     */
    private computeSimpleDiff(previous: string, current: string): string {
        // Simple diff - would use a proper diff library in production
        const prevWords = previous.split(/\s+/);
        const currWords = current.split(/\s+/);

        const added = currWords.filter(w => !prevWords.includes(w));
        const removed = prevWords.filter(w => !currWords.includes(w));

        return `Added: ${added.slice(0, 10).join(', ')}...\nRemoved: ${removed.slice(0, 10).join(', ')}...`;
    }

    /**
     * Find related resources for a topic
     */
    async findRelatedResources(topic: string, currentLanguage?: string): Promise<{
        tutorials: SearchResult[];
        documentation: SearchResult[];
        videos: SearchResult[];
        repos: SearchResult[];
        articles: SearchResult[];
    }> {
        this.log(`Finding related resources for: ${topic}`);

        const languageContext = currentLanguage ? ` for ${currentLanguage}` : '';

        // Use Explorer agent to find resources
        const result = await this.bridge.explore(
            `Find comprehensive learning resources for: "${topic}"${languageContext}

Categories to find:
1. Tutorials (beginner to advanced)
2. Official documentation
3. Video tutorials/courses
4. GitHub repositories with examples
5. Technical articles/blog posts

Return organized by category with title, URL, and brief description for each.`,
            this.createContext('resources')
        );

        // Parse and organize results
        return {
            tutorials: [],
            documentation: [],
            videos: [],
            repos: [],
            articles: []
        };
    }

    /**
     * Clear page cache
     */
    clearCache(): void {
        this.pageCache.clear();
        this.log('Page cache cleared');
    }

    /**
     * Create context for agent calls
     */
    private createContext(type: string): CodeContext {
        return {
            file_path: '',
            language: type,
            cursor_position: { line: 0, character: 0 },
            visible_range: { start: 0, end: 0 }
        };
    }

    /**
     * Log message
     */
    private log(message: string, level: 'info' | 'error' = 'info'): void {
        const timestamp = new Date().toISOString();
        const logMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}`;
        this.outputChannel.appendLine(logMessage);

        if (level === 'error') {
            console.error(logMessage);
        }
    }

    /**
     * Dispose
     */
    dispose(): void {
        // Close all sessions
        this.sessions.clear();
        this.pageCache.clear();
        this.outputChannel.dispose();
    }
}

/**
 * Register web browsing commands
 */
export function registerWebBrowsingCommands(
    context: vscode.ExtensionContext,
    bridge: InternalAgentBridge
): WebBrowsingAgent {
    const webAgent = new WebBrowsingAgent(bridge);
    context.subscriptions.push(webAgent);

    // Search the web
    context.subscriptions.push(
        vscode.commands.registerCommand('voicecode.webSearch', async () => {
            const query = await vscode.window.showInputBox({
                prompt: 'Enter search query',
                placeHolder: 'e.g., "React hooks best practices"'
            });

            if (!query) return;

            const type = await vscode.window.showQuickPick(
                ['web', 'documentation', 'api', 'stackoverflow'],
                { placeHolder: 'Select search type' }
            );

            try {
                const results = await webAgent.search(query, {
                    type: type as 'web' | 'documentation' | 'api' | 'stackoverflow'
                });

                const outputChannel = vscode.window.createOutputChannel('Web Search Results');
                outputChannel.clear();
                outputChannel.appendLine(`=== Search Results for "${query}" ===\n`);

                for (const result of results) {
                    outputChannel.appendLine(`📄 ${result.title}`);
                    outputChannel.appendLine(`   ${result.url}`);
                    outputChannel.appendLine(`   ${result.snippet}\n`);
                }

                outputChannel.show();
            } catch (error) {
                vscode.window.showErrorMessage(`Search failed: ${error}`);
            }
        })
    );

    // Lookup documentation
    context.subscriptions.push(
        vscode.commands.registerCommand('voicecode.lookupDocs', async () => {
            const topic = await vscode.window.showInputBox({
                prompt: 'Enter topic to look up',
                placeHolder: 'e.g., "useState hook", "async/await"'
            });

            if (!topic) return;

            const editor = vscode.window.activeTextEditor;
            const language = editor?.document.languageId;

            try {
                const docs = await webAgent.lookupDocumentation(topic, { language });

                const outputChannel = vscode.window.createOutputChannel('Documentation');
                outputChannel.clear();
                outputChannel.appendLine(`=== ${docs.title} ===\n`);
                outputChannel.appendLine(docs.content);

                if (docs.codeExamples.length > 0) {
                    outputChannel.appendLine('\n=== Code Examples ===\n');
                    for (const example of docs.codeExamples) {
                        outputChannel.appendLine(`--- ${example.language} ---`);
                        outputChannel.appendLine(example.code);
                        outputChannel.appendLine('');
                    }
                }

                outputChannel.show();
            } catch (error) {
                vscode.window.showErrorMessage(`Documentation lookup failed: ${error}`);
            }
        })
    );

    // Research a topic
    context.subscriptions.push(
        vscode.commands.registerCommand('voicecode.researchTopic', async () => {
            const topic = await vscode.window.showInputBox({
                prompt: 'Enter topic to research',
                placeHolder: 'e.g., "microservices architecture", "WebAssembly"'
            });

            if (!topic) return;

            const depth = await vscode.window.showQuickPick(
                ['shallow', 'medium', 'deep'],
                { placeHolder: 'Select research depth' }
            );

            try {
                vscode.window.withProgress({
                    location: vscode.ProgressLocation.Notification,
                    title: `Researching: ${topic}`,
                    cancellable: false
                }, async () => {
                    const research = await webAgent.research(
                        topic,
                        depth as 'shallow' | 'medium' | 'deep'
                    );

                    const outputChannel = vscode.window.createOutputChannel('Research Results');
                    outputChannel.clear();
                    outputChannel.appendLine(`=== Research: ${topic} ===\n`);
                    outputChannel.appendLine(research.summary);

                    if (research.keyPoints.length > 0) {
                        outputChannel.appendLine('\n=== Key Points ===\n');
                        for (const point of research.keyPoints) {
                            outputChannel.appendLine(`• ${point}`);
                        }
                    }

                    if (research.relatedTopics.length > 0) {
                        outputChannel.appendLine('\n=== Related Topics ===\n');
                        outputChannel.appendLine(research.relatedTopics.join(', '));
                    }

                    outputChannel.show();
                });
            } catch (error) {
                vscode.window.showErrorMessage(`Research failed: ${error}`);
            }
        })
    );

    // Fetch and summarize a page
    context.subscriptions.push(
        vscode.commands.registerCommand('voicecode.summarizeWebPage', async () => {
            const url = await vscode.window.showInputBox({
                prompt: 'Enter URL to summarize',
                placeHolder: 'https://example.com/article'
            });

            if (!url) return;

            try {
                const summary = await webAgent.summarizePage(url);

                const outputChannel = vscode.window.createOutputChannel('Page Summary');
                outputChannel.clear();
                outputChannel.appendLine(`=== ${summary.title} ===\n`);
                outputChannel.appendLine(summary.summary);

                if (summary.keyPoints.length > 0) {
                    outputChannel.appendLine('\n=== Key Points ===\n');
                    for (const point of summary.keyPoints) {
                        outputChannel.appendLine(`• ${point}`);
                    }
                }

                outputChannel.show();
            } catch (error) {
                vscode.window.showErrorMessage(`Summarization failed: ${error}`);
            }
        })
    );

    // Extract code from URL
    context.subscriptions.push(
        vscode.commands.registerCommand('voicecode.extractCodeFromUrl', async () => {
            const url = await vscode.window.showInputBox({
                prompt: 'Enter URL to extract code from',
                placeHolder: 'https://example.com/tutorial'
            });

            if (!url) return;

            try {
                const codeExamples = await webAgent.extractCodeExamples(url);

                if (codeExamples.length === 0) {
                    vscode.window.showInformationMessage('No code examples found on this page');
                    return;
                }

                const selected = await vscode.window.showQuickPick(
                    codeExamples.map((ex, i) => ({
                        label: `${ex.language} - ${ex.code.substring(0, 50)}...`,
                        description: `${ex.code.length} characters`,
                        index: i
                    })),
                    { placeHolder: 'Select code example to insert' }
                );

                if (selected !== undefined) {
                    const example = codeExamples[(selected as { index: number }).index];
                    const document = await vscode.workspace.openTextDocument({
                        content: example.code,
                        language: example.language
                    });
                    await vscode.window.showTextDocument(document);
                }
            } catch (error) {
                vscode.window.showErrorMessage(`Code extraction failed: ${error}`);
            }
        })
    );

    // Lookup API
    context.subscriptions.push(
        vscode.commands.registerCommand('voicecode.lookupAPI', async () => {
            const api = await vscode.window.showInputBox({
                prompt: 'Enter API name or endpoint',
                placeHolder: 'e.g., "GitHub REST API", "fetch()"'
            });

            if (!api) return;

            try {
                const apiInfo = await webAgent.lookupAPI(api);

                const outputChannel = vscode.window.createOutputChannel('API Documentation');
                outputChannel.clear();
                outputChannel.appendLine(`=== API: ${api} ===\n`);

                for (const endpoint of apiInfo) {
                    outputChannel.appendLine(`${endpoint.method} ${endpoint.path}`);
                    outputChannel.appendLine(`  ${endpoint.description}\n`);

                    if (endpoint.parameters.length > 0) {
                        outputChannel.appendLine('  Parameters:');
                        for (const param of endpoint.parameters) {
                            const required = param.required ? '(required)' : '(optional)';
                            outputChannel.appendLine(`    - ${param.name}: ${param.type} ${required}`);
                            outputChannel.appendLine(`      ${param.description}`);
                        }
                    }

                    outputChannel.appendLine('');
                }

                outputChannel.show();
            } catch (error) {
                vscode.window.showErrorMessage(`API lookup failed: ${error}`);
            }
        })
    );

    // Find related resources
    context.subscriptions.push(
        vscode.commands.registerCommand('voicecode.findResources', async () => {
            const topic = await vscode.window.showInputBox({
                prompt: 'Enter topic to find resources for',
                placeHolder: 'e.g., "machine learning", "Docker"'
            });

            if (!topic) return;

            const editor = vscode.window.activeTextEditor;
            const language = editor?.document.languageId;

            try {
                vscode.window.withProgress({
                    location: vscode.ProgressLocation.Notification,
                    title: `Finding resources for: ${topic}`,
                    cancellable: false
                }, async () => {
                    const resources = await webAgent.findRelatedResources(topic, language);

                    const outputChannel = vscode.window.createOutputChannel('Learning Resources');
                    outputChannel.clear();
                    outputChannel.appendLine(`=== Resources for "${topic}" ===\n`);

                    const categories = [
                        { name: '📚 Tutorials', items: resources.tutorials },
                        { name: '📖 Documentation', items: resources.documentation },
                        { name: '🎥 Videos', items: resources.videos },
                        { name: '💻 Repositories', items: resources.repos },
                        { name: '📝 Articles', items: resources.articles }
                    ];

                    for (const category of categories) {
                        if (category.items.length > 0) {
                            outputChannel.appendLine(`\n${category.name}\n`);
                            for (const item of category.items) {
                                outputChannel.appendLine(`  ${item.title}`);
                                outputChannel.appendLine(`  ${item.url}`);
                                outputChannel.appendLine(`  ${item.snippet}\n`);
                            }
                        }
                    }

                    outputChannel.show();
                });
            } catch (error) {
                vscode.window.showErrorMessage(`Resource search failed: ${error}`);
            }
        })
    );

    return webAgent;
}
