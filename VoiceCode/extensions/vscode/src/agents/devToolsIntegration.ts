/**
 * Developer Tools Integration
 * Provides comprehensive integration with build tools, testing frameworks,
 * deployment pipelines, and development infrastructure
 */

import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { InternalAgentBridge } from './internalAgentBridge';
import { SubagentType, CodeContext } from '../types/agents';

/**
 * Build result
 */
interface BuildResult {
    success: boolean;
    duration: number;
    output: string;
    errors: Array<{
        file: string;
        line: number;
        column: number;
        message: string;
        severity: 'error' | 'warning';
    }>;
    artifacts?: string[];
}

/**
 * Test result
 */
interface TestResult {
    success: boolean;
    total: number;
    passed: number;
    failed: number;
    skipped: number;
    duration: number;
    coverage?: {
        lines: number;
        functions: number;
        branches: number;
        statements: number;
    };
    failedTests: Array<{
        name: string;
        file: string;
        error: string;
        stack?: string;
    }>;
}

/**
 * Lint result
 */
interface LintResult {
    success: boolean;
    total: number;
    errors: number;
    warnings: number;
    issues: Array<{
        file: string;
        line: number;
        column: number;
        rule: string;
        message: string;
        severity: 'error' | 'warning' | 'info';
        fixable: boolean;
    }>;
}

/**
 * Deployment config
 */
interface DeploymentConfig {
    environment: 'development' | 'staging' | 'production';
    target: string;
    variables?: Record<string, string>;
    preDeploySteps?: string[];
    postDeploySteps?: string[];
}

/**
 * Deployment result
 */
interface DeploymentResult {
    success: boolean;
    environment: string;
    url?: string;
    version?: string;
    duration: number;
    logs: string;
}

/**
 * Package info
 */
interface PackageInfo {
    name: string;
    version: string;
    description?: string;
    dependencies: Record<string, string>;
    devDependencies: Record<string, string>;
    scripts: Record<string, string>;
    type: 'npm' | 'cargo' | 'pip' | 'go' | 'maven' | 'gradle';
}

/**
 * Git info
 */
interface GitInfo {
    branch: string;
    commit: string;
    status: Array<{
        file: string;
        status: 'modified' | 'added' | 'deleted' | 'untracked' | 'renamed';
    }>;
    remotes: Array<{ name: string; url: string }>;
    tags: string[];
    stashes: number;
}

/**
 * Developer Tools Integration
 */
export class DevToolsIntegration implements vscode.Disposable {
    private bridge: InternalAgentBridge;
    private outputChannel: vscode.OutputChannel;
    private terminal: vscode.Terminal | undefined;
    private workspaceRoot: string;
    private packageInfo: PackageInfo | undefined;
    private buildWatchers: Map<string, vscode.FileSystemWatcher> = new Map();
    private taskProvider: vscode.Disposable | undefined;

    constructor(bridge: InternalAgentBridge) {
        this.bridge = bridge;
        this.outputChannel = vscode.window.createOutputChannel('VoiceCode Dev Tools');
        this.workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || '';

        // Initialize package info
        this.detectProjectType();
    }

    /**
     * Detect project type and load package info
     */
    private async detectProjectType(): Promise<void> {
        if (!this.workspaceRoot) return;

        // Check for different package managers
        const packageJsonPath = path.join(this.workspaceRoot, 'package.json');
        const cargoTomlPath = path.join(this.workspaceRoot, 'Cargo.toml');
        const requirementsPath = path.join(this.workspaceRoot, 'requirements.txt');
        const goModPath = path.join(this.workspaceRoot, 'go.mod');
        const pomPath = path.join(this.workspaceRoot, 'pom.xml');
        const buildGradlePath = path.join(this.workspaceRoot, 'build.gradle');

        try {
            if (fs.existsSync(packageJsonPath)) {
                const content = fs.readFileSync(packageJsonPath, 'utf-8');
                const pkg = JSON.parse(content);
                this.packageInfo = {
                    name: pkg.name,
                    version: pkg.version,
                    description: pkg.description,
                    dependencies: pkg.dependencies || {},
                    devDependencies: pkg.devDependencies || {},
                    scripts: pkg.scripts || {},
                    type: 'npm'
                };
            } else if (fs.existsSync(cargoTomlPath)) {
                this.packageInfo = await this.parseCargoToml(cargoTomlPath);
            } else if (fs.existsSync(goModPath)) {
                this.packageInfo = await this.parseGoMod(goModPath);
            }
            // Add more package manager support as needed
        } catch (error) {
            this.log(`Failed to detect project type: ${error}`, 'error');
        }
    }

    /**
     * Parse Cargo.toml for Rust projects
     */
    private async parseCargoToml(filePath: string): Promise<PackageInfo> {
        const content = fs.readFileSync(filePath, 'utf-8');

        // Simple TOML parsing for package info
        const nameMatch = content.match(/name\s*=\s*"([^"]+)"/);
        const versionMatch = content.match(/version\s*=\s*"([^"]+)"/);

        return {
            name: nameMatch?.[1] || 'unknown',
            version: versionMatch?.[1] || '0.0.0',
            dependencies: {},
            devDependencies: {},
            scripts: {
                build: 'cargo build',
                test: 'cargo test',
                run: 'cargo run',
                check: 'cargo check'
            },
            type: 'cargo'
        };
    }

    /**
     * Parse go.mod for Go projects
     */
    private async parseGoMod(filePath: string): Promise<PackageInfo> {
        const content = fs.readFileSync(filePath, 'utf-8');

        const moduleMatch = content.match(/module\s+(\S+)/);

        return {
            name: moduleMatch?.[1] || 'unknown',
            version: '0.0.0',
            dependencies: {},
            devDependencies: {},
            scripts: {
                build: 'go build',
                test: 'go test ./...',
                run: 'go run .'
            },
            type: 'go'
        };
    }

    /**
     * Run build command
     */
    async build(options: {
        watch?: boolean;
        production?: boolean;
        target?: string;
    } = {}): Promise<BuildResult> {
        const startTime = Date.now();

        try {
            let buildCommand = this.getBuildCommand(options);
            this.log(`Running build: ${buildCommand}`);

            const output = await this.runCommand(buildCommand);
            const errors = this.parseBuildErrors(output);

            const result: BuildResult = {
                success: errors.filter(e => e.severity === 'error').length === 0,
                duration: Date.now() - startTime,
                output,
                errors
            };

            this.log(`Build ${result.success ? 'succeeded' : 'failed'} in ${result.duration}ms`);

            // Analyze build result if failed
            if (!result.success && errors.length > 0) {
                await this.analyzeBuildErrors(errors);
            }

            return result;
        } catch (error) {
            return {
                success: false,
                duration: Date.now() - startTime,
                output: String(error),
                errors: [{
                    file: '',
                    line: 0,
                    column: 0,
                    message: String(error),
                    severity: 'error'
                }]
            };
        }
    }

    /**
     * Get build command based on project type
     */
    private getBuildCommand(options: { production?: boolean; target?: string }): string {
        const type = this.packageInfo?.type || 'npm';

        switch (type) {
            case 'npm':
                const npmBuild = this.packageInfo?.scripts?.build || 'npm run build';
                return options.production ? `${npmBuild} -- --production` : npmBuild;
            case 'cargo':
                let cargo = 'cargo build';
                if (options.production) cargo += ' --release';
                if (options.target) cargo += ` --target ${options.target}`;
                return cargo;
            case 'go':
                return options.production ? 'go build -ldflags="-s -w"' : 'go build';
            default:
                return 'npm run build';
        }
    }

    /**
     * Parse build errors from output
     */
    private parseBuildErrors(output: string): BuildResult['errors'] {
        const errors: BuildResult['errors'] = [];

        // TypeScript/JavaScript errors
        const tsErrors = output.matchAll(/(.+)\((\d+),(\d+)\):\s*(error|warning)\s+TS\d+:\s*(.+)/g);
        for (const match of tsErrors) {
            errors.push({
                file: match[1],
                line: parseInt(match[2]),
                column: parseInt(match[3]),
                message: match[5],
                severity: match[4] as 'error' | 'warning'
            });
        }

        // Rust errors
        const rustErrors = output.matchAll(/error(?:\[E\d+\])?: (.+)\n\s*--> (.+):(\d+):(\d+)/g);
        for (const match of rustErrors) {
            errors.push({
                file: match[2],
                line: parseInt(match[3]),
                column: parseInt(match[4]),
                message: match[1],
                severity: 'error'
            });
        }

        // Generic errors
        const genericErrors = output.matchAll(/(?:Error|error):\s*(.+)/gi);
        for (const match of genericErrors) {
            if (!errors.some(e => e.message === match[1])) {
                errors.push({
                    file: '',
                    line: 0,
                    column: 0,
                    message: match[1],
                    severity: 'error'
                });
            }
        }

        return errors;
    }

    /**
     * Analyze build errors and suggest fixes
     */
    private async analyzeBuildErrors(errors: BuildResult['errors']): Promise<void> {
        const errorSummary = errors.map(e =>
            `${e.file}:${e.line} - ${e.message}`
        ).join('\n');

        const result = await this.bridge.debug(
            `Analyze these build errors and suggest fixes:\n\n${errorSummary}`,
            this.createContext()
        );

        if (result.content) {
            this.outputChannel.appendLine('\n=== Build Error Analysis ===\n');
            this.outputChannel.appendLine(result.content);
            this.outputChannel.show();
        }
    }

    /**
     * Run tests
     */
    async runTests(options: {
        pattern?: string;
        watch?: boolean;
        coverage?: boolean;
        file?: string;
    } = {}): Promise<TestResult> {
        const startTime = Date.now();

        try {
            let testCommand = this.getTestCommand(options);
            this.log(`Running tests: ${testCommand}`);

            const output = await this.runCommand(testCommand);
            const result = this.parseTestResults(output);

            result.duration = Date.now() - startTime;
            this.log(`Tests ${result.success ? 'passed' : 'failed'}: ${result.passed}/${result.total}`);

            // Analyze failed tests
            if (!result.success && result.failedTests.length > 0) {
                await this.analyzeFailedTests(result.failedTests);
            }

            return result;
        } catch (error) {
            return {
                success: false,
                total: 0,
                passed: 0,
                failed: 1,
                skipped: 0,
                duration: Date.now() - startTime,
                failedTests: [{
                    name: 'Test execution',
                    file: '',
                    error: String(error)
                }]
            };
        }
    }

    /**
     * Get test command based on project type
     */
    private getTestCommand(options: { pattern?: string; coverage?: boolean; file?: string }): string {
        const type = this.packageInfo?.type || 'npm';

        switch (type) {
            case 'npm':
                let npm = this.packageInfo?.scripts?.test || 'npm test';
                if (options.coverage) npm += ' -- --coverage';
                if (options.pattern) npm += ` -- -t "${options.pattern}"`;
                if (options.file) npm += ` -- ${options.file}`;
                return npm;
            case 'cargo':
                let cargo = 'cargo test';
                if (options.pattern) cargo += ` ${options.pattern}`;
                return cargo;
            case 'go':
                let go = 'go test';
                if (options.coverage) go += ' -cover';
                if (options.file) go = `go test ${options.file}`;
                else go += ' ./...';
                return go;
            default:
                return 'npm test';
        }
    }

    /**
     * Parse test results from output
     */
    private parseTestResults(output: string): TestResult {
        // Jest format
        let jestMatch = output.match(/Tests:\s*(\d+)\s+passed,?\s*(\d+)?\s*failed?,?\s*(\d+)?\s*skipped?,?\s*(\d+)\s+total/i);
        if (jestMatch) {
            const passed = parseInt(jestMatch[1]) || 0;
            const failed = parseInt(jestMatch[2]) || 0;
            const skipped = parseInt(jestMatch[3]) || 0;
            const total = parseInt(jestMatch[4]) || passed + failed + skipped;

            return {
                success: failed === 0,
                total,
                passed,
                failed,
                skipped,
                duration: 0,
                failedTests: this.extractFailedTests(output)
            };
        }

        // Cargo test format
        const cargoMatch = output.match(/test result: (ok|FAILED)\. (\d+) passed; (\d+) failed; (\d+) ignored/);
        if (cargoMatch) {
            return {
                success: cargoMatch[1] === 'ok',
                total: parseInt(cargoMatch[2]) + parseInt(cargoMatch[3]) + parseInt(cargoMatch[4]),
                passed: parseInt(cargoMatch[2]),
                failed: parseInt(cargoMatch[3]),
                skipped: parseInt(cargoMatch[4]),
                duration: 0,
                failedTests: this.extractFailedTests(output)
            };
        }

        // Generic fallback
        const hasError = /fail|error|FAILED/i.test(output);
        return {
            success: !hasError,
            total: 0,
            passed: 0,
            failed: hasError ? 1 : 0,
            skipped: 0,
            duration: 0,
            failedTests: hasError ? [{ name: 'Unknown', file: '', error: output }] : []
        };
    }

    /**
     * Extract failed tests from output
     */
    private extractFailedTests(output: string): TestResult['failedTests'] {
        const failed: TestResult['failedTests'] = [];

        // Jest format
        const jestFailed = output.matchAll(/● (.+)\n\n\s+(.+)\n\n([\s\S]+?)(?=\n\n●|\n\n\s*Test Suites:|$)/g);
        for (const match of jestFailed) {
            failed.push({
                name: match[1],
                file: '',
                error: match[2],
                stack: match[3]
            });
        }

        return failed;
    }

    /**
     * Analyze failed tests and suggest fixes
     */
    private async analyzeFailedTests(tests: TestResult['failedTests']): Promise<void> {
        const testSummary = tests.map(t =>
            `Test: ${t.name}\nError: ${t.error}\n${t.stack || ''}`
        ).join('\n---\n');

        const result = await this.bridge.test(
            `Analyze these failed tests and suggest fixes:\n\n${testSummary}`,
            this.createContext()
        );

        if (result.content) {
            this.outputChannel.appendLine('\n=== Failed Test Analysis ===\n');
            this.outputChannel.appendLine(result.content);
            this.outputChannel.show();
        }
    }

    /**
     * Run linter
     */
    async lint(options: {
        fix?: boolean;
        files?: string[];
    } = {}): Promise<LintResult> {
        try {
            let lintCommand = this.getLintCommand(options);
            this.log(`Running linter: ${lintCommand}`);

            const output = await this.runCommand(lintCommand);
            const result = this.parseLintResults(output);

            this.log(`Lint completed: ${result.errors} errors, ${result.warnings} warnings`);

            return result;
        } catch (error) {
            return {
                success: false,
                total: 1,
                errors: 1,
                warnings: 0,
                issues: [{
                    file: '',
                    line: 0,
                    column: 0,
                    rule: 'execution',
                    message: String(error),
                    severity: 'error',
                    fixable: false
                }]
            };
        }
    }

    /**
     * Get lint command based on project type
     */
    private getLintCommand(options: { fix?: boolean; files?: string[] }): string {
        const type = this.packageInfo?.type || 'npm';

        switch (type) {
            case 'npm':
                let eslint = this.packageInfo?.scripts?.lint || 'npx eslint .';
                if (options.fix) eslint += ' --fix';
                if (options.files) eslint = `npx eslint ${options.files.join(' ')}`;
                return eslint;
            case 'cargo':
                return 'cargo clippy';
            case 'go':
                return 'golangci-lint run';
            default:
                return 'npx eslint .';
        }
    }

    /**
     * Parse lint results from output
     */
    private parseLintResults(output: string): LintResult {
        const issues: LintResult['issues'] = [];

        // ESLint format
        const eslintIssues = output.matchAll(/(.+):(\d+):(\d+):\s+(error|warning)\s+(.+?)\s+(\S+)/g);
        for (const match of eslintIssues) {
            issues.push({
                file: match[1],
                line: parseInt(match[2]),
                column: parseInt(match[3]),
                severity: match[4] as 'error' | 'warning',
                message: match[5],
                rule: match[6],
                fixable: false
            });
        }

        const errors = issues.filter(i => i.severity === 'error').length;
        const warnings = issues.filter(i => i.severity === 'warning').length;

        return {
            success: errors === 0,
            total: issues.length,
            errors,
            warnings,
            issues
        };
    }

    /**
     * Format code
     */
    async format(options: {
        files?: string[];
        check?: boolean;
    } = {}): Promise<{ success: boolean; filesChanged: string[] }> {
        try {
            let formatCommand = this.getFormatCommand(options);
            this.log(`Running formatter: ${formatCommand}`);

            const output = await this.runCommand(formatCommand);

            return {
                success: true,
                filesChanged: this.parseFormattedFiles(output)
            };
        } catch (error) {
            return {
                success: false,
                filesChanged: []
            };
        }
    }

    /**
     * Get format command based on project type
     */
    private getFormatCommand(options: { check?: boolean; files?: string[] }): string {
        const type = this.packageInfo?.type || 'npm';

        switch (type) {
            case 'npm':
                let prettier = 'npx prettier';
                if (options.check) {
                    prettier += ' --check';
                } else {
                    prettier += ' --write';
                }
                if (options.files) {
                    prettier += ` ${options.files.join(' ')}`;
                } else {
                    prettier += ' .';
                }
                return prettier;
            case 'cargo':
                return options.check ? 'cargo fmt --check' : 'cargo fmt';
            case 'go':
                return options.check ? 'gofmt -l .' : 'gofmt -w .';
            default:
                return 'npx prettier --write .';
        }
    }

    /**
     * Parse formatted files from output
     */
    private parseFormattedFiles(output: string): string[] {
        // Extract file paths from output
        const files: string[] = [];
        const fileMatches = output.matchAll(/(?:Formatted|Checking|Writing)\s+(\S+)/g);
        for (const match of fileMatches) {
            files.push(match[1]);
        }
        return files;
    }

    /**
     * Deploy application
     */
    async deploy(config: DeploymentConfig): Promise<DeploymentResult> {
        const startTime = Date.now();

        try {
            this.log(`Deploying to ${config.environment}: ${config.target}`);

            let logs = '';

            // Run pre-deploy steps
            if (config.preDeploySteps) {
                for (const step of config.preDeploySteps) {
                    this.log(`Pre-deploy: ${step}`);
                    const output = await this.runCommand(step);
                    logs += `[pre-deploy] ${step}\n${output}\n`;
                }
            }

            // Run deployment
            const deployCommand = this.getDeployCommand(config);
            const output = await this.runCommand(deployCommand, config.variables);
            logs += `[deploy]\n${output}\n`;

            // Run post-deploy steps
            if (config.postDeploySteps) {
                for (const step of config.postDeploySteps) {
                    this.log(`Post-deploy: ${step}`);
                    const output = await this.runCommand(step);
                    logs += `[post-deploy] ${step}\n${output}\n`;
                }
            }

            return {
                success: true,
                environment: config.environment,
                duration: Date.now() - startTime,
                logs
            };
        } catch (error) {
            return {
                success: false,
                environment: config.environment,
                duration: Date.now() - startTime,
                logs: String(error)
            };
        }
    }

    /**
     * Get deploy command based on target
     */
    private getDeployCommand(config: DeploymentConfig): string {
        // Common deployment targets
        if (config.target.includes('vercel')) {
            return config.environment === 'production' ? 'vercel --prod' : 'vercel';
        }
        if (config.target.includes('netlify')) {
            return config.environment === 'production' ? 'netlify deploy --prod' : 'netlify deploy';
        }
        if (config.target.includes('heroku')) {
            return 'git push heroku main';
        }
        if (config.target.includes('docker')) {
            return 'docker-compose up -d';
        }

        return config.target;
    }

    /**
     * Get Git status
     */
    async getGitInfo(): Promise<GitInfo> {
        try {
            const branch = (await this.runCommand('git branch --show-current')).trim();
            const commit = (await this.runCommand('git rev-parse HEAD')).trim().substring(0, 8);

            const statusOutput = await this.runCommand('git status --porcelain');
            const status = statusOutput.split('\n')
                .filter(line => line.trim())
                .map(line => {
                    const statusCode = line.substring(0, 2).trim();
                    const file = line.substring(3);
                    let fileStatus: GitInfo['status'][0]['status'] = 'modified';

                    if (statusCode.includes('A')) fileStatus = 'added';
                    else if (statusCode.includes('D')) fileStatus = 'deleted';
                    else if (statusCode.includes('R')) fileStatus = 'renamed';
                    else if (statusCode === '??') fileStatus = 'untracked';

                    return { file, status: fileStatus };
                });

            const remotesOutput = await this.runCommand('git remote -v');
            const remotes: GitInfo['remotes'] = [];
            const remoteLines = remotesOutput.split('\n').filter(l => l.includes('(fetch)'));
            for (const line of remoteLines) {
                const parts = line.split(/\s+/);
                remotes.push({ name: parts[0], url: parts[1] });
            }

            const tagsOutput = await this.runCommand('git tag --list');
            const tags = tagsOutput.split('\n').filter(t => t.trim());

            const stashOutput = await this.runCommand('git stash list');
            const stashes = stashOutput.split('\n').filter(s => s.trim()).length;

            return { branch, commit, status, remotes, tags, stashes };
        } catch (error) {
            return {
                branch: 'unknown',
                commit: 'unknown',
                status: [],
                remotes: [],
                tags: [],
                stashes: 0
            };
        }
    }

    /**
     * Run Git operations
     */
    async gitOperation(operation: 'commit' | 'push' | 'pull' | 'stash' | 'branch', options: {
        message?: string;
        branch?: string;
        files?: string[];
    } = {}): Promise<{ success: boolean; output: string }> {
        try {
            let command: string;

            switch (operation) {
                case 'commit':
                    if (options.files) {
                        await this.runCommand(`git add ${options.files.join(' ')}`);
                    }
                    command = `git commit -m "${options.message || 'Update'}"`;
                    break;
                case 'push':
                    command = options.branch ? `git push origin ${options.branch}` : 'git push';
                    break;
                case 'pull':
                    command = options.branch ? `git pull origin ${options.branch}` : 'git pull';
                    break;
                case 'stash':
                    command = options.message ? `git stash push -m "${options.message}"` : 'git stash';
                    break;
                case 'branch':
                    command = options.branch ? `git checkout -b ${options.branch}` : 'git branch';
                    break;
                default:
                    throw new Error(`Unknown git operation: ${operation}`);
            }

            const output = await this.runCommand(command);
            return { success: true, output };
        } catch (error) {
            return { success: false, output: String(error) };
        }
    }

    /**
     * Generate AI-assisted commit message
     */
    async generateCommitMessage(): Promise<string> {
        const diff = await this.runCommand('git diff --staged');

        if (!diff.trim()) {
            return 'No staged changes';
        }

        const result = await this.bridge.document(
            `Generate a concise, conventional commit message for these changes:\n\n${diff.substring(0, 5000)}`,
            this.createContext()
        );

        return result.content || 'Update code';
    }

    /**
     * Install dependencies
     */
    async installDependencies(packages?: string[], dev: boolean = false): Promise<{ success: boolean; output: string }> {
        try {
            let command: string;
            const type = this.packageInfo?.type || 'npm';

            switch (type) {
                case 'npm':
                    if (packages) {
                        command = `npm install ${dev ? '--save-dev' : '--save'} ${packages.join(' ')}`;
                    } else {
                        command = 'npm install';
                    }
                    break;
                case 'cargo':
                    if (packages) {
                        command = `cargo add ${packages.join(' ')}`;
                    } else {
                        command = 'cargo build';
                    }
                    break;
                case 'go':
                    if (packages) {
                        command = `go get ${packages.join(' ')}`;
                    } else {
                        command = 'go mod download';
                    }
                    break;
                default:
                    command = 'npm install';
            }

            const output = await this.runCommand(command);
            return { success: true, output };
        } catch (error) {
            return { success: false, output: String(error) };
        }
    }

    /**
     * Check for security vulnerabilities
     */
    async auditDependencies(): Promise<{
        vulnerabilities: Array<{
            name: string;
            severity: 'low' | 'moderate' | 'high' | 'critical';
            description: string;
            fixAvailable: boolean;
        }>;
    }> {
        try {
            const type = this.packageInfo?.type || 'npm';
            let output: string;

            switch (type) {
                case 'npm':
                    output = await this.runCommand('npm audit --json');
                    break;
                case 'cargo':
                    output = await this.runCommand('cargo audit --json');
                    break;
                default:
                    output = await this.runCommand('npm audit --json');
            }

            // Parse audit results
            const vulnerabilities = this.parseAuditResults(output);

            // Use Security agent to analyze
            if (vulnerabilities.length > 0) {
                const summary = vulnerabilities.map(v =>
                    `${v.name}: ${v.severity} - ${v.description}`
                ).join('\n');

                await this.bridge.security(
                    `Analyze these security vulnerabilities and recommend fixes:\n\n${summary}`,
                    this.createContext()
                );
            }

            return { vulnerabilities };
        } catch {
            return { vulnerabilities: [] };
        }
    }

    /**
     * Parse audit results
     */
    private parseAuditResults(output: string): Array<{
        name: string;
        severity: 'low' | 'moderate' | 'high' | 'critical';
        description: string;
        fixAvailable: boolean;
    }> {
        try {
            const data = JSON.parse(output);
            const vulnerabilities: Array<{
                name: string;
                severity: 'low' | 'moderate' | 'high' | 'critical';
                description: string;
                fixAvailable: boolean;
            }> = [];

            if (data.vulnerabilities) {
                for (const [name, info] of Object.entries(data.vulnerabilities)) {
                    const vulnInfo = info as {
                        severity: 'low' | 'moderate' | 'high' | 'critical';
                        via: Array<{ title?: string }>;
                        fixAvailable: boolean;
                    };
                    vulnerabilities.push({
                        name,
                        severity: vulnInfo.severity,
                        description: vulnInfo.via?.[0]?.title || 'Unknown vulnerability',
                        fixAvailable: vulnInfo.fixAvailable
                    });
                }
            }

            return vulnerabilities;
        } catch {
            return [];
        }
    }

    /**
     * Watch for file changes and rebuild
     */
    watchBuild(options: {
        patterns: string[];
        onBuild: (result: BuildResult) => void;
    }): vscode.Disposable {
        const watchers: vscode.FileSystemWatcher[] = [];

        for (const pattern of options.patterns) {
            const watcher = vscode.workspace.createFileSystemWatcher(pattern);

            const handler = async () => {
                const result = await this.build();
                options.onBuild(result);
            };

            watcher.onDidChange(handler);
            watcher.onDidCreate(handler);
            watcher.onDidDelete(handler);

            watchers.push(watcher);
        }

        return {
            dispose: () => {
                for (const watcher of watchers) {
                    watcher.dispose();
                }
            }
        };
    }

    /**
     * Run a command
     */
    private runCommand(command: string, env?: Record<string, string>): Promise<string> {
        return new Promise((resolve, reject) => {
            const { exec } = require('child_process');

            exec(command, {
                cwd: this.workspaceRoot,
                env: { ...process.env, ...env },
                maxBuffer: 10 * 1024 * 1024 // 10MB
            }, (error: Error | null, stdout: string, stderr: string) => {
                if (error) {
                    reject(new Error(`${error.message}\n${stderr}`));
                } else {
                    resolve(stdout + stderr);
                }
            });
        });
    }

    /**
     * Create context for agent calls
     */
    private createContext(): CodeContext {
        const editor = vscode.window.activeTextEditor;
        return {
            file_path: editor?.document.uri.fsPath || '',
            language: editor?.document.languageId || '',
            cursor_position: {
                line: editor?.selection.active.line || 0,
                character: editor?.selection.active.character || 0
            },
            visible_range: {
                start: editor?.visibleRanges[0]?.start.line || 0,
                end: editor?.visibleRanges[0]?.end.line || 0
            }
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
     * Get package info
     */
    getPackageInfo(): PackageInfo | undefined {
        return this.packageInfo;
    }

    /**
     * Dispose
     */
    dispose(): void {
        for (const watcher of this.buildWatchers.values()) {
            watcher.dispose();
        }
        this.buildWatchers.clear();

        if (this.taskProvider) {
            this.taskProvider.dispose();
        }

        if (this.terminal) {
            this.terminal.dispose();
        }

        this.outputChannel.dispose();
    }
}

/**
 * Register dev tools commands
 */
export function registerDevToolsCommands(
    context: vscode.ExtensionContext,
    bridge: InternalAgentBridge
): DevToolsIntegration {
    const devTools = new DevToolsIntegration(bridge);
    context.subscriptions.push(devTools);

    // Build project
    context.subscriptions.push(
        vscode.commands.registerCommand('voicecode.build', async () => {
            const production = await vscode.window.showQuickPick(['development', 'production'], {
                placeHolder: 'Select build type'
            });

            vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: 'Building project...',
                cancellable: false
            }, async () => {
                const result = await devTools.build({
                    production: production === 'production'
                });

                if (result.success) {
                    vscode.window.showInformationMessage(
                        `Build succeeded in ${result.duration}ms`
                    );
                } else {
                    vscode.window.showErrorMessage(
                        `Build failed with ${result.errors.length} errors`
                    );
                }
            });
        })
    );

    // Run tests
    context.subscriptions.push(
        vscode.commands.registerCommand('voicecode.runTests', async () => {
            const coverage = await vscode.window.showQuickPick(['no', 'yes'], {
                placeHolder: 'Include coverage?'
            });

            vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: 'Running tests...',
                cancellable: false
            }, async () => {
                const result = await devTools.runTests({
                    coverage: coverage === 'yes'
                });

                if (result.success) {
                    vscode.window.showInformationMessage(
                        `Tests passed: ${result.passed}/${result.total} in ${result.duration}ms`
                    );
                } else {
                    vscode.window.showErrorMessage(
                        `Tests failed: ${result.failed}/${result.total} failed`
                    );
                }
            });
        })
    );

    // Run linter
    context.subscriptions.push(
        vscode.commands.registerCommand('voicecode.lint', async () => {
            const fix = await vscode.window.showQuickPick(['check only', 'auto-fix'], {
                placeHolder: 'Lint mode'
            });

            vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: 'Running linter...',
                cancellable: false
            }, async () => {
                const result = await devTools.lint({
                    fix: fix === 'auto-fix'
                });

                if (result.success) {
                    vscode.window.showInformationMessage(
                        `Lint passed: ${result.warnings} warnings`
                    );
                } else {
                    vscode.window.showWarningMessage(
                        `Lint found ${result.errors} errors, ${result.warnings} warnings`
                    );
                }
            });
        })
    );

    // Format code
    context.subscriptions.push(
        vscode.commands.registerCommand('voicecode.formatProject', async () => {
            vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: 'Formatting code...',
                cancellable: false
            }, async () => {
                const result = await devTools.format();

                if (result.success) {
                    vscode.window.showInformationMessage(
                        `Formatted ${result.filesChanged.length} files`
                    );
                } else {
                    vscode.window.showErrorMessage('Format failed');
                }
            });
        })
    );

    // Deploy
    context.subscriptions.push(
        vscode.commands.registerCommand('voicecode.deploy', async () => {
            const environment = await vscode.window.showQuickPick(
                ['development', 'staging', 'production'],
                { placeHolder: 'Select environment' }
            );

            if (!environment) return;

            const target = await vscode.window.showQuickPick(
                ['vercel', 'netlify', 'heroku', 'docker', 'custom'],
                { placeHolder: 'Select deployment target' }
            );

            if (!target) return;

            let targetCommand = target;
            if (target === 'custom') {
                targetCommand = await vscode.window.showInputBox({
                    prompt: 'Enter deployment command'
                }) || '';
            }

            if (!targetCommand) return;

            vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: `Deploying to ${environment}...`,
                cancellable: false
            }, async () => {
                const result = await devTools.deploy({
                    environment: environment as 'development' | 'staging' | 'production',
                    target: targetCommand
                });

                if (result.success) {
                    vscode.window.showInformationMessage(
                        `Deployed to ${environment} successfully!`
                    );
                } else {
                    vscode.window.showErrorMessage(
                        `Deployment failed: ${result.logs.substring(0, 200)}`
                    );
                }
            });
        })
    );

    // Git status
    context.subscriptions.push(
        vscode.commands.registerCommand('voicecode.gitStatus', async () => {
            const info = await devTools.getGitInfo();

            const outputChannel = vscode.window.createOutputChannel('Git Status');
            outputChannel.clear();
            outputChannel.appendLine(`=== Git Status ===\n`);
            outputChannel.appendLine(`Branch: ${info.branch}`);
            outputChannel.appendLine(`Commit: ${info.commit}`);
            outputChannel.appendLine(`Stashes: ${info.stashes}`);
            outputChannel.appendLine(`\nChanged files (${info.status.length}):`);

            for (const file of info.status) {
                outputChannel.appendLine(`  [${file.status}] ${file.file}`);
            }

            outputChannel.show();
        })
    );

    // Generate commit message
    context.subscriptions.push(
        vscode.commands.registerCommand('voicecode.generateCommitMessage', async () => {
            const message = await devTools.generateCommitMessage();

            const action = await vscode.window.showInformationMessage(
                `Suggested: "${message}"`,
                'Use this', 'Edit', 'Cancel'
            );

            if (action === 'Use this') {
                await devTools.gitOperation('commit', { message });
                vscode.window.showInformationMessage('Committed!');
            } else if (action === 'Edit') {
                const edited = await vscode.window.showInputBox({
                    value: message,
                    prompt: 'Edit commit message'
                });
                if (edited) {
                    await devTools.gitOperation('commit', { message: edited });
                    vscode.window.showInformationMessage('Committed!');
                }
            }
        })
    );

    // Audit dependencies
    context.subscriptions.push(
        vscode.commands.registerCommand('voicecode.auditDependencies', async () => {
            vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: 'Auditing dependencies...',
                cancellable: false
            }, async () => {
                const result = await devTools.auditDependencies();

                if (result.vulnerabilities.length === 0) {
                    vscode.window.showInformationMessage('No vulnerabilities found!');
                } else {
                    const critical = result.vulnerabilities.filter(v => v.severity === 'critical').length;
                    const high = result.vulnerabilities.filter(v => v.severity === 'high').length;

                    vscode.window.showWarningMessage(
                        `Found ${result.vulnerabilities.length} vulnerabilities ` +
                        `(${critical} critical, ${high} high)`
                    );
                }
            });
        })
    );

    // Install dependencies
    context.subscriptions.push(
        vscode.commands.registerCommand('voicecode.installDependency', async () => {
            const packageName = await vscode.window.showInputBox({
                prompt: 'Enter package name(s) to install',
                placeHolder: 'e.g., lodash axios'
            });

            if (!packageName) return;

            const devDep = await vscode.window.showQuickPick(
                ['dependencies', 'devDependencies'],
                { placeHolder: 'Install as' }
            );

            vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: `Installing ${packageName}...`,
                cancellable: false
            }, async () => {
                const result = await devTools.installDependencies(
                    packageName.split(/\s+/),
                    devDep === 'devDependencies'
                );

                if (result.success) {
                    vscode.window.showInformationMessage(`Installed ${packageName}`);
                } else {
                    vscode.window.showErrorMessage(`Installation failed: ${result.output}`);
                }
            });
        })
    );

    return devTools;
}
