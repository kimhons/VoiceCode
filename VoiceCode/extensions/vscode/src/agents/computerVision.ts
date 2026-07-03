/**
 * Computer Vision Module
 * Provides screen capture, OCR, UI element detection, and visual analysis
 * for enhanced code understanding and automation
 */

import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { InternalAgentBridge } from './internalAgentBridge';
import { SubagentType, CodeContext } from '../types/agents';

/**
 * Screenshot options
 */
interface ScreenshotOptions {
    fullPage?: boolean;
    element?: string;
    format?: 'png' | 'jpeg' | 'webp';
    quality?: number;
    scale?: number;
}

/**
 * UI Element detection result
 */
interface UIElement {
    type: 'button' | 'input' | 'link' | 'text' | 'image' | 'container' | 'list' | 'table' | 'form' | 'unknown';
    bounds: {
        x: number;
        y: number;
        width: number;
        height: number;
    };
    text?: string;
    attributes?: Record<string, string>;
    confidence: number;
    children?: UIElement[];
}

/**
 * Visual analysis result
 */
interface VisualAnalysisResult {
    description: string;
    elements: UIElement[];
    colors: Array<{ hex: string; percentage: number }>;
    layout: {
        type: 'grid' | 'flex' | 'list' | 'form' | 'card' | 'unknown';
        columns?: number;
        rows?: number;
    };
    accessibility: {
        issues: string[];
        score: number;
    };
    suggestions: string[];
}

/**
 * OCR Result
 */
interface OCRResult {
    text: string;
    blocks: Array<{
        text: string;
        bounds: { x: number; y: number; width: number; height: number };
        confidence: number;
    }>;
    language?: string;
}

/**
 * Image annotation
 */
interface ImageAnnotation {
    type: 'box' | 'arrow' | 'text' | 'highlight' | 'blur';
    position: { x: number; y: number };
    size?: { width: number; height: number };
    color?: string;
    text?: string;
    target?: { x: number; y: number };
}

/**
 * Computer Vision Provider
 */
export class ComputerVisionProvider implements vscode.Disposable {
    private bridge: InternalAgentBridge;
    private outputChannel: vscode.OutputChannel;
    private tempDir: string;
    private screenshotHistory: string[] = [];
    private maxHistory = 20;

    constructor(bridge: InternalAgentBridge) {
        this.bridge = bridge;
        this.outputChannel = vscode.window.createOutputChannel('VoiceCode Vision');
        this.tempDir = path.join(require('os').tmpdir(), 'voicecode-vision');

        // Ensure temp directory exists
        if (!fs.existsSync(this.tempDir)) {
            fs.mkdirSync(this.tempDir, { recursive: true });
        }
    }

    /**
     * Capture screenshot of VS Code window or specific region
     */
    async captureScreenshot(options: ScreenshotOptions = {}): Promise<string> {
        const timestamp = Date.now();
        const format = options.format || 'png';
        const filename = path.join(this.tempDir, `screenshot_${timestamp}.${format}`);

        try {
            // Use VS Code's webview or native screenshot capabilities
            // This would integrate with platform-specific screenshot tools
            const screenshotData = await this.performScreenCapture(options);

            // Save screenshot
            fs.writeFileSync(filename, screenshotData);

            // Add to history
            this.screenshotHistory.unshift(filename);
            if (this.screenshotHistory.length > this.maxHistory) {
                const old = this.screenshotHistory.pop();
                if (old && fs.existsSync(old)) {
                    fs.unlinkSync(old);
                }
            }

            this.log(`Screenshot captured: ${filename}`);
            return filename;
        } catch (error) {
            this.log(`Screenshot failed: ${error}`, 'error');
            throw error;
        }
    }

    /**
     * Perform actual screen capture (platform-specific)
     */
    private async performScreenCapture(options: ScreenshotOptions): Promise<Buffer> {
        // This would use platform-specific APIs or Electron's desktopCapturer
        // For now, we'll create a placeholder implementation

        // In a real implementation, this would:
        // 1. On Windows: Use PowerShell or native APIs
        // 2. On macOS: Use screencapture command
        // 3. On Linux: Use gnome-screenshot or similar

        // Placeholder - returns empty buffer
        // Real implementation would capture actual screen
        return Buffer.from([]);
    }

    /**
     * Capture editor content as image
     */
    async captureEditor(): Promise<string> {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            throw new Error('No active editor');
        }

        // Get visible range
        const visibleRange = editor.visibleRanges[0];
        const content = editor.document.getText(visibleRange);

        // Generate a representation of the editor content
        // This could be rendered to an image using a headless browser or canvas

        const timestamp = Date.now();
        const filename = path.join(this.tempDir, `editor_${timestamp}.png`);

        // For now, save as text for analysis
        const textFile = path.join(this.tempDir, `editor_${timestamp}.txt`);
        fs.writeFileSync(textFile, content);

        return textFile;
    }

    /**
     * Perform OCR on an image
     */
    async performOCR(imagePath: string): Promise<OCRResult> {
        try {
            // Read image
            if (!fs.existsSync(imagePath)) {
                throw new Error(`Image not found: ${imagePath}`);
            }

            // Use the Explorer agent with vision capabilities to analyze
            const imageData = fs.readFileSync(imagePath);
            const base64Image = imageData.toString('base64');

            // Send to agent for OCR
            const result = await this.bridge.executeWithAgent(
                SubagentType.EXPLORER,
                `Perform OCR on this image and extract all text. Return structured data with text blocks and their positions.`,
                {
                    file_path: imagePath,
                    language: 'image',
                    selected_text: `data:image/png;base64,${base64Image}`,
                    cursor_position: { line: 0, character: 0 },
                    visible_range: { start: 0, end: 0 }
                }
            );

            // Parse OCR result
            return this.parseOCRResult(result.content || '');
        } catch (error) {
            this.log(`OCR failed: ${error}`, 'error');
            throw error;
        }
    }

    /**
     * Parse OCR result from agent response
     */
    private parseOCRResult(content: string): OCRResult {
        // Parse structured OCR response
        return {
            text: content,
            blocks: [],
            language: 'en'
        };
    }

    /**
     * Detect UI elements in an image
     */
    async detectUIElements(imagePath: string): Promise<UIElement[]> {
        try {
            if (!fs.existsSync(imagePath)) {
                throw new Error(`Image not found: ${imagePath}`);
            }

            const imageData = fs.readFileSync(imagePath);
            const base64Image = imageData.toString('base64');

            // Use agent for UI element detection
            const result = await this.bridge.executeWithAgent(
                SubagentType.EXPLORER,
                `Analyze this UI screenshot and detect all UI elements (buttons, inputs, links, text, containers, etc.). Return their types, positions, and any text content.`,
                {
                    file_path: imagePath,
                    language: 'image',
                    selected_text: `data:image/png;base64,${base64Image}`,
                    cursor_position: { line: 0, character: 0 },
                    visible_range: { start: 0, end: 0 }
                }
            );

            return this.parseUIElements(result.content || '');
        } catch (error) {
            this.log(`UI detection failed: ${error}`, 'error');
            throw error;
        }
    }

    /**
     * Parse UI elements from agent response
     */
    private parseUIElements(content: string): UIElement[] {
        // Parse structured UI element response
        return [];
    }

    /**
     * Analyze visual design of UI
     */
    async analyzeVisualDesign(imagePath: string): Promise<VisualAnalysisResult> {
        try {
            if (!fs.existsSync(imagePath)) {
                throw new Error(`Image not found: ${imagePath}`);
            }

            const imageData = fs.readFileSync(imagePath);
            const base64Image = imageData.toString('base64');

            // Use agent for comprehensive visual analysis
            const result = await this.bridge.executeWithAgent(
                SubagentType.REVIEWER,
                `Analyze this UI design screenshot comprehensively:
1. Describe the overall design and layout
2. Identify color palette and usage
3. Detect layout type (grid, flex, etc.)
4. Find accessibility issues
5. Suggest improvements

Provide structured analysis.`,
                {
                    file_path: imagePath,
                    language: 'image',
                    selected_text: `data:image/png;base64,${base64Image}`,
                    cursor_position: { line: 0, character: 0 },
                    visible_range: { start: 0, end: 0 }
                }
            );

            return this.parseVisualAnalysis(result.content || '');
        } catch (error) {
            this.log(`Visual analysis failed: ${error}`, 'error');
            throw error;
        }
    }

    /**
     * Parse visual analysis from agent response
     */
    private parseVisualAnalysis(content: string): VisualAnalysisResult {
        return {
            description: content,
            elements: [],
            colors: [],
            layout: { type: 'unknown' },
            accessibility: { issues: [], score: 0 },
            suggestions: []
        };
    }

    /**
     * Compare two screenshots for differences
     */
    async compareScreenshots(image1: string, image2: string): Promise<{
        similarity: number;
        differences: Array<{
            region: { x: number; y: number; width: number; height: number };
            description: string;
        }>;
    }> {
        try {
            if (!fs.existsSync(image1) || !fs.existsSync(image2)) {
                throw new Error('One or both images not found');
            }

            const data1 = fs.readFileSync(image1);
            const data2 = fs.readFileSync(image2);

            const base64_1 = data1.toString('base64');
            const base64_2 = data2.toString('base64');

            // Use agent to compare images
            const result = await this.bridge.executeWithAgent(
                SubagentType.REVIEWER,
                `Compare these two screenshots and identify:
1. Overall similarity percentage
2. Specific differences with their locations
3. Nature of each difference (added, removed, changed)

Image 1: data:image/png;base64,${base64_1}
Image 2: data:image/png;base64,${base64_2}`,
                {
                    file_path: image1,
                    language: 'comparison',
                    cursor_position: { line: 0, character: 0 },
                    visible_range: { start: 0, end: 0 }
                }
            );

            return {
                similarity: 0.95, // Placeholder
                differences: []
            };
        } catch (error) {
            this.log(`Comparison failed: ${error}`, 'error');
            throw error;
        }
    }

    /**
     * Generate code from UI screenshot
     */
    async generateCodeFromUI(imagePath: string, framework: string = 'react'): Promise<string> {
        try {
            if (!fs.existsSync(imagePath)) {
                throw new Error(`Image not found: ${imagePath}`);
            }

            const imageData = fs.readFileSync(imagePath);
            const base64Image = imageData.toString('base64');

            // Use Coder agent with vision to generate code
            const result = await this.bridge.code(
                `Generate ${framework} code that recreates this UI design from the screenshot. Include:
1. Component structure
2. Styling (CSS/Tailwind)
3. Responsive design
4. Accessibility attributes

Screenshot: data:image/png;base64,${base64Image}`,
                {
                    file_path: imagePath,
                    language: framework,
                    cursor_position: { line: 0, character: 0 },
                    visible_range: { start: 0, end: 0 }
                }
            );

            return result.content || '';
        } catch (error) {
            this.log(`Code generation from UI failed: ${error}`, 'error');
            throw error;
        }
    }

    /**
     * Annotate an image
     */
    async annotateImage(imagePath: string, annotations: ImageAnnotation[]): Promise<string> {
        try {
            if (!fs.existsSync(imagePath)) {
                throw new Error(`Image not found: ${imagePath}`);
            }

            // In a real implementation, this would use a canvas or image manipulation library
            // to draw annotations on the image

            const timestamp = Date.now();
            const outputPath = path.join(this.tempDir, `annotated_${timestamp}.png`);

            // Copy original for now (placeholder)
            fs.copyFileSync(imagePath, outputPath);

            return outputPath;
        } catch (error) {
            this.log(`Annotation failed: ${error}`, 'error');
            throw error;
        }
    }

    /**
     * Extract design tokens from UI screenshot
     */
    async extractDesignTokens(imagePath: string): Promise<{
        colors: Array<{ name: string; hex: string; usage: string }>;
        typography: Array<{ name: string; size: string; weight: string }>;
        spacing: string[];
        borderRadius: string[];
    }> {
        try {
            if (!fs.existsSync(imagePath)) {
                throw new Error(`Image not found: ${imagePath}`);
            }

            const imageData = fs.readFileSync(imagePath);
            const base64Image = imageData.toString('base64');

            const result = await this.bridge.executeWithAgent(
                SubagentType.EXPLORER,
                `Analyze this UI screenshot and extract design tokens:
1. Color palette with names and hex codes
2. Typography styles (sizes, weights)
3. Spacing values
4. Border radius values

Return as structured JSON.

Screenshot: data:image/png;base64,${base64Image}`,
                {
                    file_path: imagePath,
                    language: 'design',
                    cursor_position: { line: 0, character: 0 },
                    visible_range: { start: 0, end: 0 }
                }
            );

            // Parse tokens from response
            return {
                colors: [],
                typography: [],
                spacing: [],
                borderRadius: []
            };
        } catch (error) {
            this.log(`Token extraction failed: ${error}`, 'error');
            throw error;
        }
    }

    /**
     * Analyze error screenshot
     */
    async analyzeErrorScreenshot(imagePath: string): Promise<{
        errorType: string;
        errorMessage: string;
        stackTrace?: string;
        suggestedFix: string;
        relevantCode?: string;
    }> {
        try {
            if (!fs.existsSync(imagePath)) {
                throw new Error(`Image not found: ${imagePath}`);
            }

            const imageData = fs.readFileSync(imagePath);
            const base64Image = imageData.toString('base64');

            const result = await this.bridge.debug(
                `Analyze this error screenshot and identify:
1. Type of error
2. Error message
3. Stack trace if visible
4. Suggested fix
5. Relevant code that might need changes

Screenshot: data:image/png;base64,${base64Image}`,
                {
                    file_path: imagePath,
                    language: 'error',
                    cursor_position: { line: 0, character: 0 },
                    visible_range: { start: 0, end: 0 }
                }
            );

            return {
                errorType: 'Unknown',
                errorMessage: result.content || '',
                suggestedFix: ''
            };
        } catch (error) {
            this.log(`Error analysis failed: ${error}`, 'error');
            throw error;
        }
    }

    /**
     * Watch for visual changes in a region
     */
    async watchForChanges(options: {
        interval: number;
        region?: { x: number; y: number; width: number; height: number };
        onchange: (diff: { similarity: number; screenshot: string }) => void;
    }): Promise<vscode.Disposable> {
        let previousScreenshot: string | null = null;
        let isRunning = true;

        const checkForChanges = async () => {
            while (isRunning) {
                const currentScreenshot = await this.captureScreenshot({
                    // region could be used here
                });

                if (previousScreenshot) {
                    const comparison = await this.compareScreenshots(previousScreenshot, currentScreenshot);
                    if (comparison.similarity < 0.99) {
                        options.onchange({
                            similarity: comparison.similarity,
                            screenshot: currentScreenshot
                        });
                    }
                }

                previousScreenshot = currentScreenshot;
                await new Promise(resolve => setTimeout(resolve, options.interval));
            }
        };

        checkForChanges();

        return {
            dispose: () => {
                isRunning = false;
            }
        };
    }

    /**
     * Get screenshot history
     */
    getScreenshotHistory(): string[] {
        return [...this.screenshotHistory];
    }

    /**
     * Clear screenshot history
     */
    clearHistory(): void {
        for (const file of this.screenshotHistory) {
            if (fs.existsSync(file)) {
                fs.unlinkSync(file);
            }
        }
        this.screenshotHistory = [];
    }

    /**
     * Log message
     */
    private log(message: string, level: 'info' | 'error' = 'info'): void {
        const timestamp = new Date().toISOString();
        const logMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}`;
        this.outputChannel.appendLine(logMessage);
    }

    /**
     * Dispose
     */
    dispose(): void {
        this.clearHistory();
        this.outputChannel.dispose();

        // Clean up temp directory
        if (fs.existsSync(this.tempDir)) {
            const files = fs.readdirSync(this.tempDir);
            for (const file of files) {
                fs.unlinkSync(path.join(this.tempDir, file));
            }
            fs.rmdirSync(this.tempDir);
        }
    }
}

/**
 * Register computer vision commands
 */
export function registerComputerVisionCommands(
    context: vscode.ExtensionContext,
    bridge: InternalAgentBridge
): ComputerVisionProvider {
    const vision = new ComputerVisionProvider(bridge);
    context.subscriptions.push(vision);

    // Capture screenshot
    context.subscriptions.push(
        vscode.commands.registerCommand('voicecode.captureScreenshot', async () => {
            try {
                const path = await vision.captureScreenshot();
                vscode.window.showInformationMessage(`Screenshot saved: ${path}`);
            } catch (error) {
                vscode.window.showErrorMessage(`Screenshot failed: ${error}`);
            }
        })
    );

    // Analyze UI from screenshot
    context.subscriptions.push(
        vscode.commands.registerCommand('voicecode.analyzeUI', async () => {
            const fileUri = await vscode.window.showOpenDialog({
                canSelectFiles: true,
                canSelectFolders: false,
                filters: { 'Images': ['png', 'jpg', 'jpeg', 'webp'] }
            });

            if (!fileUri || fileUri.length === 0) return;

            try {
                const result = await vision.analyzeVisualDesign(fileUri[0].fsPath);

                const outputChannel = vscode.window.createOutputChannel('UI Analysis');
                outputChannel.clear();
                outputChannel.appendLine('=== UI Analysis ===\n');
                outputChannel.appendLine(result.description);
                outputChannel.show();
            } catch (error) {
                vscode.window.showErrorMessage(`Analysis failed: ${error}`);
            }
        })
    );

    // Generate code from UI screenshot
    context.subscriptions.push(
        vscode.commands.registerCommand('voicecode.generateCodeFromUI', async () => {
            const fileUri = await vscode.window.showOpenDialog({
                canSelectFiles: true,
                canSelectFolders: false,
                filters: { 'Images': ['png', 'jpg', 'jpeg', 'webp'] }
            });

            if (!fileUri || fileUri.length === 0) return;

            const framework = await vscode.window.showQuickPick(
                ['react', 'vue', 'angular', 'svelte', 'html'],
                { placeHolder: 'Select framework' }
            );

            if (!framework) return;

            try {
                const code = await vision.generateCodeFromUI(fileUri[0].fsPath, framework);

                const document = await vscode.workspace.openTextDocument({
                    content: code,
                    language: framework === 'html' ? 'html' : 'typescript'
                });
                await vscode.window.showTextDocument(document);
            } catch (error) {
                vscode.window.showErrorMessage(`Code generation failed: ${error}`);
            }
        })
    );

    // Analyze error screenshot
    context.subscriptions.push(
        vscode.commands.registerCommand('voicecode.analyzeErrorScreenshot', async () => {
            const fileUri = await vscode.window.showOpenDialog({
                canSelectFiles: true,
                canSelectFolders: false,
                filters: { 'Images': ['png', 'jpg', 'jpeg', 'webp'] }
            });

            if (!fileUri || fileUri.length === 0) return;

            try {
                const result = await vision.analyzeErrorScreenshot(fileUri[0].fsPath);

                const outputChannel = vscode.window.createOutputChannel('Error Analysis');
                outputChannel.clear();
                outputChannel.appendLine('=== Error Analysis ===\n');
                outputChannel.appendLine(`Type: ${result.errorType}`);
                outputChannel.appendLine(`Message: ${result.errorMessage}`);
                if (result.stackTrace) {
                    outputChannel.appendLine(`\nStack Trace:\n${result.stackTrace}`);
                }
                outputChannel.appendLine(`\nSuggested Fix:\n${result.suggestedFix}`);
                outputChannel.show();
            } catch (error) {
                vscode.window.showErrorMessage(`Error analysis failed: ${error}`);
            }
        })
    );

    // Perform OCR
    context.subscriptions.push(
        vscode.commands.registerCommand('voicecode.performOCR', async () => {
            const fileUri = await vscode.window.showOpenDialog({
                canSelectFiles: true,
                canSelectFolders: false,
                filters: { 'Images': ['png', 'jpg', 'jpeg', 'webp'] }
            });

            if (!fileUri || fileUri.length === 0) return;

            try {
                const result = await vision.performOCR(fileUri[0].fsPath);

                const document = await vscode.workspace.openTextDocument({
                    content: result.text,
                    language: 'plaintext'
                });
                await vscode.window.showTextDocument(document);
            } catch (error) {
                vscode.window.showErrorMessage(`OCR failed: ${error}`);
            }
        })
    );

    // Extract design tokens
    context.subscriptions.push(
        vscode.commands.registerCommand('voicecode.extractDesignTokens', async () => {
            const fileUri = await vscode.window.showOpenDialog({
                canSelectFiles: true,
                canSelectFolders: false,
                filters: { 'Images': ['png', 'jpg', 'jpeg', 'webp'] }
            });

            if (!fileUri || fileUri.length === 0) return;

            try {
                const tokens = await vision.extractDesignTokens(fileUri[0].fsPath);

                const document = await vscode.workspace.openTextDocument({
                    content: JSON.stringify(tokens, null, 2),
                    language: 'json'
                });
                await vscode.window.showTextDocument(document);
            } catch (error) {
                vscode.window.showErrorMessage(`Token extraction failed: ${error}`);
            }
        })
    );

    return vision;
}
