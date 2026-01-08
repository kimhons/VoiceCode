"use strict";
/**
 * VoiceFlow Dashboard Provider
 * Implements VS Code's WebviewViewProvider for rich dashboard UI
 * Provides visual controls for voice recognition, command history, and settings
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
exports.VoiceFlowDashboardProvider = void 0;
const vscode = __importStar(require("vscode"));
/**
 * VoiceFlow Dashboard View Provider
 */
class VoiceFlowDashboardProvider {
    static viewType = 'voiceflow.dashboard';
    view;
    extensionUri;
    telemetry;
    state = {
        isListening: false,
        currentProvider: 'anthropic',
        recentCommands: [],
        statistics: null,
    };
    constructor(extensionUri, telemetry) {
        this.extensionUri = extensionUri;
        this.telemetry = telemetry;
    }
    /**
     * Resolve the webview view
     */
    resolveWebviewView(webviewView, _context, _token) {
        this.view = webviewView;
        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [this.extensionUri],
        };
        webviewView.webview.html = this.getHtmlContent(webviewView.webview);
        // Handle messages from the webview
        webviewView.webview.onDidReceiveMessage(async (message) => {
            switch (message.command) {
                case 'toggleListening':
                    await vscode.commands.executeCommand('voiceflow.toggleListening');
                    break;
                case 'openSettings':
                    await vscode.commands.executeCommand('voiceflow.openSettings');
                    break;
                case 'showCommands':
                    await vscode.commands.executeCommand('voiceflow.showCommands');
                    break;
                case 'changeProvider':
                    await vscode.commands.executeCommand('voiceflow.setProvider', message.provider);
                    this.state.currentProvider = message.provider;
                    this.updateView();
                    break;
                case 'clearHistory':
                    this.state.recentCommands = [];
                    this.updateView();
                    break;
                case 'refreshStats':
                    this.state.statistics = this.telemetry.getStatistics();
                    this.updateView();
                    break;
            }
        });
        // Initial state update
        this.state.statistics = this.telemetry.getStatistics();
        this.updateView();
    }
    /**
     * Update the webview with current state
     */
    updateView() {
        if (this.view) {
            this.view.webview.postMessage({
                type: 'stateUpdate',
                state: this.state,
            });
        }
    }
    /**
     * Set listening state
     */
    setListening(isListening) {
        this.state.isListening = isListening;
        this.updateView();
    }
    /**
     * Add a command to history
     */
    addCommand(command, success) {
        this.state.recentCommands.unshift({
            command,
            timestamp: new Date(),
            success,
        });
        // Keep only last 20 commands
        this.state.recentCommands = this.state.recentCommands.slice(0, 20);
        this.updateView();
    }
    /**
     * Generate HTML content for the webview
     */
    getHtmlContent(webview) {
        // External resources (can be used for external CSS/JS files)
        // const styleUri = webview.asWebviewUri(
        //   vscode.Uri.joinPath(this.extensionUri, 'resources', 'dashboard.css')
        // );
        // const scriptUri = webview.asWebviewUri(
        //   vscode.Uri.joinPath(this.extensionUri, 'resources', 'dashboard.js')
        // );
        const codiconsUri = webview.asWebviewUri(vscode.Uri.joinPath(this.extensionUri, 'node_modules', '@vscode/codicons', 'dist', 'codicon.css'));
        const nonce = this.getNonce();
        return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}'; font-src ${webview.cspSource};">
  <link href="${codiconsUri}" rel="stylesheet">
  <title>VoiceFlow Dashboard</title>
  <style>
    ${this.getInlineStyles()}
  </style>
</head>
<body>
  <div class="dashboard">
    ${this.getHeaderSection()}
    ${this.getControlsSection()}
    ${this.getStatsSection()}
    ${this.getCommandHistorySection()}
  </div>
  <script nonce="${nonce}">
    ${this.getInlineScript()}
  </script>
</body>
</html>`;
    }
    getHeaderSection() {
        return `
    <div class="header">
      <div class="logo">
        <span class="codicon codicon-mic"></span>
        <span class="title">VoiceFlow PRO</span>
      </div>
      <button class="icon-button" id="settingsBtn" title="Settings">
        <span class="codicon codicon-gear"></span>
      </button>
    </div>`;
    }
    getControlsSection() {
        return `
    <div class="controls">
      <button class="primary-button" id="listenBtn">
        <span class="codicon codicon-mic" id="micIcon"></span>
        <span id="listenText">Start Listening</span>
      </button>

      <div class="provider-select">
        <label>AI Provider:</label>
        <select id="providerSelect">
          <option value="anthropic">Anthropic Claude</option>
          <option value="openai">OpenAI GPT-4</option>
          <option value="copilot">GitHub Copilot</option>
          <option value="local">Local LLM</option>
        </select>
      </div>
    </div>`;
    }
    getStatsSection() {
        return `
    <div class="stats-section">
      <div class="section-header">
        <span class="codicon codicon-graph"></span>
        <span>Statistics</span>
        <button class="icon-button" id="refreshStatsBtn" title="Refresh">
          <span class="codicon codicon-refresh"></span>
        </button>
      </div>
      <div class="stats-grid" id="statsGrid">
        <div class="stat-item">
          <span class="stat-value" id="totalCommands">0</span>
          <span class="stat-label">Commands</span>
        </div>
        <div class="stat-item">
          <span class="stat-value" id="successRate">0%</span>
          <span class="stat-label">Success Rate</span>
        </div>
        <div class="stat-item">
          <span class="stat-value" id="voiceCommands">0</span>
          <span class="stat-label">Voice</span>
        </div>
        <div class="stat-item">
          <span class="stat-value" id="aiRequests">0</span>
          <span class="stat-label">AI Requests</span>
        </div>
      </div>
    </div>`;
    }
    getCommandHistorySection() {
        return `
    <div class="history-section">
      <div class="section-header">
        <span class="codicon codicon-history"></span>
        <span>Recent Commands</span>
        <button class="icon-button" id="clearHistoryBtn" title="Clear History">
          <span class="codicon codicon-clear-all"></span>
        </button>
      </div>
      <div class="command-list" id="commandList">
        <div class="empty-state">No commands yet</div>
      </div>
    </div>`;
    }
    getInlineStyles() {
        return `
    :root {
      --vscode-font-family: var(--vscode-editor-font-family, system-ui);
    }

    * { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: var(--vscode-font-family);
      font-size: 13px;
      color: var(--vscode-foreground);
      background: var(--vscode-sideBar-background);
      padding: 12px;
    }

    .dashboard {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-bottom: 12px;
      border-bottom: 1px solid var(--vscode-panel-border);
    }

    .logo {
      display: flex;
      align-items: center;
      gap: 8px;
      font-weight: 600;
      font-size: 14px;
    }

    .icon-button {
      background: none;
      border: none;
      color: var(--vscode-foreground);
      cursor: pointer;
      padding: 4px;
      border-radius: 4px;
    }

    .icon-button:hover {
      background: var(--vscode-toolbar-hoverBackground);
    }

    .controls {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .primary-button {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 10px 16px;
      background: var(--vscode-button-background);
      color: var(--vscode-button-foreground);
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 13px;
      font-weight: 500;
      transition: background 0.2s;
    }

    .primary-button:hover {
      background: var(--vscode-button-hoverBackground);
    }

    .primary-button.listening {
      background: var(--vscode-inputValidation-errorBackground, #d32f2f);
      animation: pulse 1.5s infinite;
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.7; }
    }

    .provider-select {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .provider-select label {
      font-size: 11px;
      color: var(--vscode-descriptionForeground);
    }

    .provider-select select {
      padding: 6px 8px;
      background: var(--vscode-input-background);
      color: var(--vscode-input-foreground);
      border: 1px solid var(--vscode-input-border);
      border-radius: 4px;
      font-size: 12px;
    }

    .section-header {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 8px 0;
      font-weight: 500;
      font-size: 12px;
      color: var(--vscode-sideBarSectionHeader-foreground);
    }

    .section-header .icon-button {
      margin-left: auto;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 8px;
    }

    .stat-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 12px;
      background: var(--vscode-editor-background);
      border-radius: 6px;
    }

    .stat-value {
      font-size: 20px;
      font-weight: 600;
      color: var(--vscode-textLink-foreground);
    }

    .stat-label {
      font-size: 10px;
      color: var(--vscode-descriptionForeground);
      text-transform: uppercase;
      margin-top: 4px;
    }

    .command-list {
      max-height: 200px;
      overflow-y: auto;
      background: var(--vscode-editor-background);
      border-radius: 6px;
      padding: 8px;
    }

    .command-item {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 6px 8px;
      border-radius: 4px;
      font-size: 12px;
    }

    .command-item:hover {
      background: var(--vscode-list-hoverBackground);
    }

    .command-item.success .status-icon {
      color: var(--vscode-testing-iconPassed);
    }

    .command-item.error .status-icon {
      color: var(--vscode-testing-iconFailed);
    }

    .command-text {
      flex: 1;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .command-time {
      font-size: 10px;
      color: var(--vscode-descriptionForeground);
    }

    .empty-state {
      text-align: center;
      padding: 20px;
      color: var(--vscode-descriptionForeground);
      font-style: italic;
    }`;
    }
    getInlineScript() {
        return `
    const vscode = acquireVsCodeApi();
    let state = ${JSON.stringify(this.state)};

    // Elements
    const listenBtn = document.getElementById('listenBtn');
    const listenText = document.getElementById('listenText');
    const micIcon = document.getElementById('micIcon');
    const providerSelect = document.getElementById('providerSelect');
    const settingsBtn = document.getElementById('settingsBtn');
    const clearHistoryBtn = document.getElementById('clearHistoryBtn');
    const refreshStatsBtn = document.getElementById('refreshStatsBtn');
    const commandList = document.getElementById('commandList');

    // Event listeners
    listenBtn.addEventListener('click', () => {
      vscode.postMessage({ command: 'toggleListening' });
    });

    settingsBtn.addEventListener('click', () => {
      vscode.postMessage({ command: 'openSettings' });
    });

    providerSelect.addEventListener('change', (e) => {
      vscode.postMessage({ command: 'changeProvider', provider: e.target.value });
    });

    clearHistoryBtn.addEventListener('click', () => {
      vscode.postMessage({ command: 'clearHistory' });
    });

    refreshStatsBtn.addEventListener('click', () => {
      vscode.postMessage({ command: 'refreshStats' });
    });

    // Handle messages from extension
    window.addEventListener('message', event => {
      const message = event.data;
      if (message.type === 'stateUpdate') {
        state = message.state;
        updateUI();
      }
    });

    function updateUI() {
      // Update listening state
      if (state.isListening) {
        listenBtn.classList.add('listening');
        listenText.textContent = 'Stop Listening';
        micIcon.className = 'codicon codicon-record';
      } else {
        listenBtn.classList.remove('listening');
        listenText.textContent = 'Start Listening';
        micIcon.className = 'codicon codicon-mic';
      }

      // Update provider
      providerSelect.value = state.currentProvider;

      // Update stats
      if (state.statistics) {
        document.getElementById('totalCommands').textContent = state.statistics.totalCommands;
        const successRate = state.statistics.totalCommands > 0
          ? Math.round((1 - state.statistics.errorRate) * 100)
          : 0;
        document.getElementById('successRate').textContent = successRate + '%';
        document.getElementById('voiceCommands').textContent = state.statistics.totalVoiceRecognitions;
        document.getElementById('aiRequests').textContent = state.statistics.totalAIRequests;
      }

      // Update command history
      if (state.recentCommands.length === 0) {
        commandList.innerHTML = '<div class="empty-state">No commands yet</div>';
      } else {
        commandList.innerHTML = state.recentCommands.map(cmd => {
          const time = new Date(cmd.timestamp).toLocaleTimeString();
          return \`<div class="command-item \${cmd.success ? 'success' : 'error'}">
            <span class="codicon codicon-\${cmd.success ? 'check' : 'error'} status-icon"></span>
            <span class="command-text">\${cmd.command}</span>
            <span class="command-time">\${time}</span>
          </div>\`;
        }).join('');
      }
    }

    // Initial UI update
    updateUI();`;
    }
    /**
     * Generate a random nonce for CSP
     */
    getNonce() {
        let text = '';
        const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        for (let i = 0; i < 32; i++) {
            text += possible.charAt(Math.floor(Math.random() * possible.length));
        }
        return text;
    }
}
exports.VoiceFlowDashboardProvider = VoiceFlowDashboardProvider;
exports.default = VoiceFlowDashboardProvider;
//# sourceMappingURL=VoiceFlowDashboardProvider.js.map