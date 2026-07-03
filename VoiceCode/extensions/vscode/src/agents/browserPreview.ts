/**
 * Browser Preview Panel
 * Provides embedded web browser preview within VS Code
 * Matches Cursor's browser embed capabilities
 */

import * as vscode from 'vscode';
import * as https from 'https';
import * as http from 'http';
import { URL } from 'url';
import { EventEmitter } from 'events';
import { InternalAgentBridge } from './internalAgentBridge';

/**
 * Browser session state
 */
export interface BrowserSession {
    id: string;
    url: string;
    title: string;
    history: string[];
    historyIndex: number;
    timestamp: Date;
}

/**
 * Fetched page content
 */
export interface PageContent {
    url: string;
    html: string;
    title: string;
    statusCode: number;
    contentType: string;
    fetchTime: number;
}

/**
 * Configuration for the browser preview
 */
export interface BrowserConfig {
    /** Default home URL */
    homeUrl: string;
    /** Enable JavaScript in preview (limited) */
    enableScripts: boolean;
    /** Max history entries */
    maxHistory: number;
    /** Request timeout in ms */
    timeoutMs: number;
    /** User agent string */
    userAgent: string;
}

/**
 * Default configuration
 */
const DEFAULT_CONFIG: BrowserConfig = {
    homeUrl: 'https://developer.mozilla.org',
    enableScripts: false,
    maxHistory: 50,
    timeoutMs: 30000,
    userAgent: 'VoiceCode-Browser/1.0 (VS Code Extension)'
};

/**
 * BrowserPreviewProvider - Manages embedded browser preview
 */
export class BrowserPreviewProvider extends EventEmitter implements vscode.Disposable {
    private panel: vscode.WebviewPanel | undefined;
    private session: BrowserSession | undefined;
    private config: BrowserConfig;
    private disposables: vscode.Disposable[] = [];
    private outputChannel: vscode.OutputChannel;
    private cache: Map<string, { content: PageContent; expires: number }> = new Map();

    constructor(
        private context: vscode.ExtensionContext,
        private agentBridge?: InternalAgentBridge
    ) {
        super();
        this.config = this.loadConfig();
        this.outputChannel = vscode.window.createOutputChannel('VoiceCode Browser');
        this.disposables.push(this.outputChannel);

        // Listen for config changes
        this.disposables.push(
            vscode.workspace.onDidChangeConfiguration(e => {
                if (e.affectsConfiguration('voicecode.browser')) {
                    this.config = this.loadConfig();
                }
            })
        );

        // Clean up cache periodically
        setInterval(() => this.cleanCache(), 60000);
    }

    /**
     * Load configuration from VS Code settings
     */
    private loadConfig(): BrowserConfig {
        const config = vscode.workspace.getConfiguration('voicecode.browser');

        return {
            homeUrl: config.get<string>('homeUrl', DEFAULT_CONFIG.homeUrl),
            enableScripts: config.get<boolean>('enableScripts', DEFAULT_CONFIG.enableScripts),
            maxHistory: config.get<number>('maxHistory', DEFAULT_CONFIG.maxHistory),
            timeoutMs: config.get<number>('timeoutMs', DEFAULT_CONFIG.timeoutMs),
            userAgent: config.get<string>('userAgent', DEFAULT_CONFIG.userAgent)
        };
    }

    /**
     * Show the browser panel
     */
    async show(url?: string): Promise<void> {
        const targetUrl = url || this.config.homeUrl;

        if (this.panel) {
            // Panel already exists, navigate to URL
            this.panel.reveal();
            await this.navigateTo(targetUrl);
            return;
        }

        // Create new panel
        this.panel = vscode.window.createWebviewPanel(
            'voicecode.browser',
            'VoiceCode Browser',
            vscode.ViewColumn.Beside,
            {
                enableScripts: true,
                retainContextWhenHidden: true,
                localResourceRoots: [this.context.extensionUri]
            }
        );

        // Initialize session
        this.session = {
            id: `browser-${Date.now()}`,
            url: targetUrl,
            title: 'Loading...',
            history: [],
            historyIndex: -1,
            timestamp: new Date()
        };

        // Handle messages from webview
        this.panel.webview.onDidReceiveMessage(
            message => this.handleWebviewMessage(message),
            undefined,
            this.disposables
        );

        // Handle panel disposal
        this.panel.onDidDispose(
            () => {
                this.panel = undefined;
                this.emit('closed');
            },
            undefined,
            this.disposables
        );

        // Navigate to initial URL
        await this.navigateTo(targetUrl);
    }

    /**
     * Navigate to a URL
     */
    async navigateTo(url: string): Promise<void> {
        if (!this.panel || !this.session) {
            await this.show(url);
            return;
        }

        try {
            // Normalize URL
            const normalizedUrl = this.normalizeUrl(url);
            this.log(`Navigating to: ${normalizedUrl}`);

            // Update panel title
            this.panel.title = `Loading: ${normalizedUrl}`;

            // Show loading state
            this.panel.webview.html = this.getLoadingHtml(normalizedUrl);

            // Fetch page content
            const content = await this.fetchPage(normalizedUrl);

            // Update session
            this.session.url = normalizedUrl;
            this.session.title = content.title || normalizedUrl;

            // Add to history
            if (this.session.historyIndex < this.session.history.length - 1) {
                // Truncate forward history
                this.session.history = this.session.history.slice(0, this.session.historyIndex + 1);
            }
            this.session.history.push(normalizedUrl);
            this.session.historyIndex = this.session.history.length - 1;

            // Enforce max history
            if (this.session.history.length > this.config.maxHistory) {
                this.session.history.shift();
                this.session.historyIndex--;
            }

            // Update panel
            this.panel.title = content.title || 'VoiceCode Browser';
            this.panel.webview.html = this.getBrowserHtml(content);

            this.emit('navigated', { url: normalizedUrl, title: content.title });
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            this.log(`Navigation failed: ${errorMessage}`);

            if (this.panel) {
                this.panel.webview.html = this.getErrorHtml(url, errorMessage);
            }

            this.emit('error', { url, error: errorMessage });
        }
    }

    /**
     * Normalize a URL
     */
    private normalizeUrl(input: string): string {
        // Add protocol if missing
        if (!input.match(/^https?:\/\//)) {
            // Check if it looks like a domain
            if (input.match(/^[\w-]+\.[\w.-]+/)) {
                input = `https://${input}`;
            } else {
                // Treat as search query
                input = `https://www.google.com/search?q=${encodeURIComponent(input)}`;
            }
        }

        return input;
    }

    /**
     * Fetch a page
     */
    async fetchPage(url: string): Promise<PageContent> {
        // Check cache
        const cached = this.cache.get(url);
        if (cached && cached.expires > Date.now()) {
            this.log(`Using cached content for: ${url}`);
            return cached.content;
        }

        const startTime = Date.now();
        const parsedUrl = new URL(url);
        const isHttps = parsedUrl.protocol === 'https:';

        return new Promise((resolve, reject) => {
            const options = {
                hostname: parsedUrl.hostname,
                port: parsedUrl.port || (isHttps ? 443 : 80),
                path: parsedUrl.pathname + parsedUrl.search,
                method: 'GET',
                headers: {
                    'User-Agent': this.config.userAgent,
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                    'Accept-Language': 'en-US,en;q=0.5'
                },
                timeout: this.config.timeoutMs
            };

            const protocol = isHttps ? https : http;

            const req = protocol.request(options, (res) => {
                let data = '';

                // Handle redirects
                if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                    const redirectUrl = new URL(res.headers.location, url).toString();
                    this.log(`Redirecting to: ${redirectUrl}`);
                    this.fetchPage(redirectUrl).then(resolve).catch(reject);
                    return;
                }

                res.on('data', chunk => {
                    data += chunk;
                });

                res.on('end', () => {
                    const fetchTime = Date.now() - startTime;
                    const title = this.extractTitle(data);

                    const content: PageContent = {
                        url,
                        html: data,
                        title,
                        statusCode: res.statusCode || 200,
                        contentType: res.headers['content-type'] || 'text/html',
                        fetchTime
                    };

                    // Cache for 5 minutes
                    this.cache.set(url, {
                        content,
                        expires: Date.now() + 300000
                    });

                    this.log(`Fetched ${url} in ${fetchTime}ms`);
                    resolve(content);
                });
            });

            req.on('error', (error) => {
                reject(new Error(`Failed to fetch: ${error.message}`));
            });

            req.on('timeout', () => {
                req.destroy();
                reject(new Error('Request timed out'));
            });

            req.end();
        });
    }

    /**
     * Extract title from HTML
     */
    private extractTitle(html: string): string {
        const match = html.match(/<title[^>]*>([^<]+)<\/title>/i);
        return match ? match[1].trim() : '';
    }

    /**
     * Handle messages from webview
     */
    private async handleWebviewMessage(message: { type: string; url?: string }): Promise<void> {
        switch (message.type) {
            case 'navigate':
                if (message.url) {
                    await this.navigateTo(message.url);
                }
                break;

            case 'back':
                await this.goBack();
                break;

            case 'forward':
                await this.goForward();
                break;

            case 'refresh':
                await this.refresh();
                break;

            case 'home':
                await this.navigateTo(this.config.homeUrl);
                break;
        }
    }

    /**
     * Go back in history
     */
    async goBack(): Promise<void> {
        if (!this.session || this.session.historyIndex <= 0) {
            return;
        }

        this.session.historyIndex--;
        const url = this.session.history[this.session.historyIndex];
        await this.navigateTo(url);
    }

    /**
     * Go forward in history
     */
    async goForward(): Promise<void> {
        if (!this.session || this.session.historyIndex >= this.session.history.length - 1) {
            return;
        }

        this.session.historyIndex++;
        const url = this.session.history[this.session.historyIndex];
        await this.navigateTo(url);
    }

    /**
     * Refresh current page
     */
    async refresh(): Promise<void> {
        if (!this.session) return;

        // Clear cache for current URL
        this.cache.delete(this.session.url);
        await this.navigateTo(this.session.url);
    }

    /**
     * Get current session
     */
    getSession(): BrowserSession | undefined {
        return this.session;
    }

    /**
     * Close the browser panel
     */
    close(): void {
        if (this.panel) {
            this.panel.dispose();
            this.panel = undefined;
        }
    }

    /**
     * Clean expired cache entries
     */
    private cleanCache(): void {
        const now = Date.now();
        for (const [url, entry] of this.cache) {
            if (entry.expires < now) {
                this.cache.delete(url);
            }
        }
    }

    /**
     * Get loading HTML
     */
    private getLoadingHtml(url: string): string {
        return `<!DOCTYPE html>
<html>
<head>
    <style>
        body {
            font-family: var(--vscode-font-family);
            display: flex;
            align-items: center;
            justify-content: center;
            height: 100vh;
            margin: 0;
            background: var(--vscode-editor-background);
            color: var(--vscode-foreground);
        }
        .loader {
            text-align: center;
        }
        .spinner {
            width: 40px;
            height: 40px;
            border: 4px solid var(--vscode-panel-border);
            border-top-color: var(--vscode-focusBorder);
            border-radius: 50%;
            animation: spin 1s linear infinite;
        }
        @keyframes spin {
            to { transform: rotate(360deg); }
        }
        .url {
            margin-top: 10px;
            color: var(--vscode-descriptionForeground);
            font-size: 0.9em;
        }
    </style>
</head>
<body>
    <div class="loader">
        <div class="spinner"></div>
        <div class="url">Loading ${this.escapeHtml(url)}...</div>
    </div>
</body>
</html>`;
    }

    /**
     * Get error HTML
     */
    private getErrorHtml(url: string, error: string): string {
        return `<!DOCTYPE html>
<html>
<head>
    <style>
        body {
            font-family: var(--vscode-font-family);
            display: flex;
            align-items: center;
            justify-content: center;
            height: 100vh;
            margin: 0;
            background: var(--vscode-editor-background);
            color: var(--vscode-foreground);
        }
        .error {
            text-align: center;
            max-width: 400px;
        }
        .icon {
            font-size: 48px;
            margin-bottom: 20px;
        }
        h1 {
            font-size: 1.5em;
            margin-bottom: 10px;
        }
        .message {
            color: var(--vscode-errorForeground);
            margin-bottom: 20px;
        }
        .url {
            color: var(--vscode-descriptionForeground);
            font-size: 0.9em;
            word-break: break-all;
        }
    </style>
</head>
<body>
    <div class="error">
        <div class="icon">:(</div>
        <h1>Failed to Load Page</h1>
        <div class="message">${this.escapeHtml(error)}</div>
        <div class="url">${this.escapeHtml(url)}</div>
    </div>
</body>
</html>`;
    }

    /**
     * Get browser HTML with content
     */
    private getBrowserHtml(content: PageContent): string {
        const canGoBack = this.session && this.session.historyIndex > 0;
        const canGoForward = this.session && this.session.historyIndex < this.session.history.length - 1;

        // Sanitize content - remove scripts and event handlers for security
        let sanitizedHtml = content.html;
        if (!this.config.enableScripts) {
            sanitizedHtml = sanitizedHtml
                .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
                .replace(/\bon\w+\s*=/gi, 'data-disabled-')
                .replace(/<iframe\b[^>]*>/gi, '<!-- iframe removed -->')
                .replace(/<object\b[^>]*>[\s\S]*?<\/object>/gi, '<!-- object removed -->')
                .replace(/<embed\b[^>]*>/gi, '<!-- embed removed -->');
        }

        // Make links open in the webview
        sanitizedHtml = sanitizedHtml.replace(
            /<a\s+([^>]*?)href\s*=\s*["']([^"']+)["']([^>]*)>/gi,
            (match, before, href, after) => {
                // Convert relative URLs to absolute
                try {
                    const absoluteUrl = new URL(href, content.url).toString();
                    return `<a ${before}href="#" onclick="navigate('${this.escapeHtml(absoluteUrl)}')" ${after}>`;
                } catch {
                    return match;
                }
            }
        );

        return `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline' https:; img-src https: data:; font-src https: data:;">
    <style>
        * { box-sizing: border-box; }
        body {
            margin: 0;
            font-family: var(--vscode-font-family);
            background: var(--vscode-editor-background);
        }
        .toolbar {
            position: sticky;
            top: 0;
            z-index: 1000;
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 8px;
            background: var(--vscode-titleBar-activeBackground);
            border-bottom: 1px solid var(--vscode-panel-border);
        }
        .toolbar button {
            padding: 4px 8px;
            background: var(--vscode-button-secondaryBackground);
            color: var(--vscode-button-secondaryForeground);
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 14px;
        }
        .toolbar button:hover {
            background: var(--vscode-button-secondaryHoverBackground);
        }
        .toolbar button:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }
        .url-bar {
            flex: 1;
            padding: 6px 12px;
            background: var(--vscode-input-background);
            color: var(--vscode-input-foreground);
            border: 1px solid var(--vscode-input-border);
            border-radius: 4px;
            font-size: 13px;
        }
        .url-bar:focus {
            outline: none;
            border-color: var(--vscode-focusBorder);
        }
        .status {
            font-size: 11px;
            color: var(--vscode-descriptionForeground);
        }
        .content {
            padding: 16px;
            background: white;
            color: black;
            min-height: calc(100vh - 50px);
        }
        .content img {
            max-width: 100%;
            height: auto;
        }
    </style>
</head>
<body>
    <div class="toolbar">
        <button onclick="goBack()" ${!canGoBack ? 'disabled' : ''} title="Back">\u2190</button>
        <button onclick="goForward()" ${!canGoForward ? 'disabled' : ''} title="Forward">\u2192</button>
        <button onclick="refresh()" title="Refresh">\u21BB</button>
        <button onclick="goHome()" title="Home">\u2302</button>
        <input type="text" class="url-bar" id="urlBar" value="${this.escapeHtml(content.url)}"
               onkeypress="if(event.key==='Enter')navigate(this.value)">
        <span class="status">${content.fetchTime}ms</span>
    </div>
    <div class="content">
        ${sanitizedHtml}
    </div>
    <script>
        const vscode = acquireVsCodeApi();

        function navigate(url) {
            vscode.postMessage({ type: 'navigate', url: url });
        }

        function goBack() {
            vscode.postMessage({ type: 'back' });
        }

        function goForward() {
            vscode.postMessage({ type: 'forward' });
        }

        function refresh() {
            vscode.postMessage({ type: 'refresh' });
        }

        function goHome() {
            vscode.postMessage({ type: 'home' });
        }
    </script>
</body>
</html>`;
    }

    /**
     * Escape HTML special characters
     */
    private escapeHtml(text: string): string {
        return text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    /**
     * Log a message
     */
    private log(message: string): void {
        const timestamp = new Date().toISOString();
        this.outputChannel.appendLine(`[${timestamp}] ${message}`);
    }

    /**
     * Dispose resources
     */
    dispose(): void {
        this.close();
        this.cache.clear();
        this.disposables.forEach(d => d.dispose());
        this.removeAllListeners();
    }
}

// Singleton instance
let browserPreviewInstance: BrowserPreviewProvider | null = null;

/**
 * Get the singleton BrowserPreviewProvider instance
 */
export function getBrowserPreview(
    context?: vscode.ExtensionContext,
    agentBridge?: InternalAgentBridge
): BrowserPreviewProvider {
    if (!browserPreviewInstance && context) {
        browserPreviewInstance = new BrowserPreviewProvider(context, agentBridge);
    }
    if (!browserPreviewInstance) {
        throw new Error('BrowserPreviewProvider not initialized. Call with context first.');
    }
    return browserPreviewInstance;
}

/**
 * Dispose the singleton instance
 */
export function disposeBrowserPreview(): void {
    if (browserPreviewInstance) {
        browserPreviewInstance.dispose();
        browserPreviewInstance = null;
    }
}

/**
 * Register browser preview commands
 */
export function registerBrowserPreviewCommands(
    context: vscode.ExtensionContext,
    agentBridge: InternalAgentBridge
): BrowserPreviewProvider {
    const browser = getBrowserPreview(context, agentBridge);

    // Command: Open browser
    context.subscriptions.push(
        vscode.commands.registerCommand('voicecode.browser.open', async () => {
            await browser.show();
        })
    );

    // Command: Open URL in browser
    context.subscriptions.push(
        vscode.commands.registerCommand('voicecode.browser.openUrl', async (url?: string) => {
            if (!url) {
                url = await vscode.window.showInputBox({
                    prompt: 'Enter URL to open',
                    placeHolder: 'https://example.com'
                });
            }

            if (url) {
                await browser.show(url);
            }
        })
    );

    // Command: Search in browser
    context.subscriptions.push(
        vscode.commands.registerCommand('voicecode.browser.search', async () => {
            const query = await vscode.window.showInputBox({
                prompt: 'Enter search query',
                placeHolder: 'Search the web...'
            });

            if (query) {
                const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
                await browser.show(searchUrl);
            }
        })
    );

    // Command: Look up documentation
    context.subscriptions.push(
        vscode.commands.registerCommand('voicecode.browser.docs', async () => {
            const items = [
                { label: 'MDN Web Docs', url: 'https://developer.mozilla.org' },
                { label: 'TypeScript Docs', url: 'https://www.typescriptlang.org/docs/' },
                { label: 'Node.js Docs', url: 'https://nodejs.org/docs/latest/api/' },
                { label: 'React Docs', url: 'https://react.dev' },
                { label: 'VS Code API', url: 'https://code.visualstudio.com/api' },
                { label: 'Rust Docs', url: 'https://doc.rust-lang.org/book/' }
            ];

            const selected = await vscode.window.showQuickPick(items, {
                placeHolder: 'Select documentation to open'
            });

            if (selected) {
                await browser.show(selected.url);
            }
        })
    );

    // Command: Close browser
    context.subscriptions.push(
        vscode.commands.registerCommand('voicecode.browser.close', () => {
            browser.close();
        })
    );

    return browser;
}
