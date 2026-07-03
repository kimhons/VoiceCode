/**
 * Mock VSCode Module for Unit Testing
 *
 * This module provides mock implementations of the VS Code API
 * for unit testing purposes. The real vscode module is only available
 * when running inside the VS Code extension host.
 */
export declare class EventEmitter<T> {
    private listeners;
    event: (listener: (e: T) => void) => {
        dispose: () => ((e: T) => void)[];
    };
    fire(data: T): void;
    dispose(): void;
}
export declare class Disposable {
    private callOnDispose;
    static from(...disposables: {
        dispose: () => any;
    }[]): Disposable;
    constructor(callOnDispose: () => void);
    dispose(): void;
}
export declare class Uri {
    readonly scheme: string;
    readonly authority: string;
    readonly path: string;
    readonly query: string;
    readonly fragment: string;
    static file(path: string): Uri;
    static parse(value: string): Uri;
    static joinPath(base: Uri, ...pathSegments: string[]): Uri;
    constructor(scheme: string, authority: string, path: string, query: string, fragment: string);
    get fsPath(): string;
    toString(): string;
    with(change: {
        scheme?: string;
        authority?: string;
        path?: string;
        query?: string;
        fragment?: string;
    }): Uri;
}
export declare class Range {
    readonly start: Position;
    readonly end: Position;
    constructor(start: Position, end: Position);
}
export declare class Position {
    readonly line: number;
    readonly character: number;
    constructor(line: number, character: number);
}
export declare class Selection extends Range {
    readonly anchor: Position;
    readonly active: Position;
    constructor(anchor: Position, active: Position);
}
export declare class TextEdit {
    readonly range: Range;
    readonly newText: string;
    static replace(range: Range, newText: string): TextEdit;
    static insert(position: Position, newText: string): TextEdit;
    static delete(range: Range): TextEdit;
    constructor(range: Range, newText: string);
}
export declare class WorkspaceEdit {
    private edits;
    replace(uri: Uri, range: Range, newText: string): void;
    insert(uri: Uri, position: Position, newText: string): void;
    delete(uri: Uri, range: Range): void;
}
export declare enum ViewColumn {
    Active = -1,
    Beside = -2,
    One = 1,
    Two = 2,
    Three = 3
}
export declare enum StatusBarAlignment {
    Left = 1,
    Right = 2
}
export declare enum DiagnosticSeverity {
    Error = 0,
    Warning = 1,
    Information = 2,
    Hint = 3
}
export declare enum ConfigurationTarget {
    Global = 1,
    Workspace = 2,
    WorkspaceFolder = 3
}
export declare const window: {
    showInformationMessage: import("vitest").Mock<(...args: any[]) => any>;
    showWarningMessage: import("vitest").Mock<(...args: any[]) => any>;
    showErrorMessage: import("vitest").Mock<(...args: any[]) => any>;
    showInputBox: import("vitest").Mock<(...args: any[]) => any>;
    showQuickPick: import("vitest").Mock<(...args: any[]) => any>;
    createOutputChannel: import("vitest").Mock<(...args: any[]) => any>;
    createStatusBarItem: import("vitest").Mock<(...args: any[]) => any>;
    createWebviewPanel: import("vitest").Mock<(...args: any[]) => any>;
    activeTextEditor: any;
    visibleTextEditors: any[];
    onDidChangeActiveTextEditor: import("vitest").Mock<(...args: any[]) => any>;
    onDidChangeVisibleTextEditors: import("vitest").Mock<(...args: any[]) => any>;
    createTerminal: import("vitest").Mock<(...args: any[]) => any>;
    withProgress: import("vitest").Mock<(...args: any[]) => any>;
};
export declare const workspace: {
    getConfiguration: import("vitest").Mock<(...args: any[]) => any>;
    workspaceFolders: any[] | undefined;
    rootPath: string | undefined;
    onDidChangeConfiguration: import("vitest").Mock<(...args: any[]) => any>;
    openTextDocument: import("vitest").Mock<(...args: any[]) => any>;
    applyEdit: import("vitest").Mock<(...args: any[]) => any>;
    fs: {
        readFile: import("vitest").Mock<(...args: any[]) => any>;
        writeFile: import("vitest").Mock<(...args: any[]) => any>;
        stat: import("vitest").Mock<(...args: any[]) => any>;
        readDirectory: import("vitest").Mock<(...args: any[]) => any>;
        createDirectory: import("vitest").Mock<(...args: any[]) => any>;
        delete: import("vitest").Mock<(...args: any[]) => any>;
    };
};
export declare const commands: {
    registerCommand: import("vitest").Mock<(...args: any[]) => any>;
    executeCommand: import("vitest").Mock<(...args: any[]) => any>;
    getCommands: import("vitest").Mock<(...args: any[]) => any>;
};
export declare const languages: {
    registerCompletionItemProvider: import("vitest").Mock<(...args: any[]) => any>;
    registerHoverProvider: import("vitest").Mock<(...args: any[]) => any>;
    registerCodeActionsProvider: import("vitest").Mock<(...args: any[]) => any>;
    createDiagnosticCollection: import("vitest").Mock<(...args: any[]) => any>;
};
export declare const extensions: {
    getExtension: import("vitest").Mock<(...args: any[]) => any>;
    all: any[];
    onDidChange: import("vitest").Mock<(...args: any[]) => any>;
};
export declare const env: {
    machineId: string;
    sessionId: string;
    language: string;
    appName: string;
    appRoot: string;
    uriScheme: string;
    clipboard: {
        readText: import("vitest").Mock<(...args: any[]) => any>;
        writeText: import("vitest").Mock<(...args: any[]) => any>;
    };
    openExternal: import("vitest").Mock<(...args: any[]) => any>;
};
export interface ExtensionContext {
    subscriptions: {
        dispose: () => any;
    }[];
    workspaceState: {
        get: <T>(key: string) => T | undefined;
        update: (key: string, value: any) => Thenable<void>;
    };
    globalState: {
        get: <T>(key: string) => T | undefined;
        update: (key: string, value: any) => Thenable<void>;
    };
    extensionPath: string;
    extensionUri: Uri;
    storagePath: string | undefined;
    globalStoragePath: string;
    logPath: string;
}
export interface CancellationToken {
    isCancellationRequested: boolean;
    onCancellationRequested: (listener: () => void) => Disposable;
}
export declare class CancellationTokenSource {
    token: CancellationToken;
    cancel(): void;
    dispose(): void;
}
export declare enum ProgressLocation {
    SourceControl = 1,
    Window = 10,
    Notification = 15
}
export declare class ThemeIcon {
    readonly id: string;
    constructor(id: string);
}
declare const _default: {
    EventEmitter: typeof EventEmitter;
    Disposable: typeof Disposable;
    Uri: typeof Uri;
    Range: typeof Range;
    Position: typeof Position;
    Selection: typeof Selection;
    TextEdit: typeof TextEdit;
    WorkspaceEdit: typeof WorkspaceEdit;
    ViewColumn: typeof ViewColumn;
    StatusBarAlignment: typeof StatusBarAlignment;
    DiagnosticSeverity: typeof DiagnosticSeverity;
    ConfigurationTarget: typeof ConfigurationTarget;
    ProgressLocation: typeof ProgressLocation;
    ThemeIcon: typeof ThemeIcon;
    CancellationTokenSource: typeof CancellationTokenSource;
    window: {
        showInformationMessage: import("vitest").Mock<(...args: any[]) => any>;
        showWarningMessage: import("vitest").Mock<(...args: any[]) => any>;
        showErrorMessage: import("vitest").Mock<(...args: any[]) => any>;
        showInputBox: import("vitest").Mock<(...args: any[]) => any>;
        showQuickPick: import("vitest").Mock<(...args: any[]) => any>;
        createOutputChannel: import("vitest").Mock<(...args: any[]) => any>;
        createStatusBarItem: import("vitest").Mock<(...args: any[]) => any>;
        createWebviewPanel: import("vitest").Mock<(...args: any[]) => any>;
        activeTextEditor: any;
        visibleTextEditors: any[];
        onDidChangeActiveTextEditor: import("vitest").Mock<(...args: any[]) => any>;
        onDidChangeVisibleTextEditors: import("vitest").Mock<(...args: any[]) => any>;
        createTerminal: import("vitest").Mock<(...args: any[]) => any>;
        withProgress: import("vitest").Mock<(...args: any[]) => any>;
    };
    workspace: {
        getConfiguration: import("vitest").Mock<(...args: any[]) => any>;
        workspaceFolders: any[] | undefined;
        rootPath: string | undefined;
        onDidChangeConfiguration: import("vitest").Mock<(...args: any[]) => any>;
        openTextDocument: import("vitest").Mock<(...args: any[]) => any>;
        applyEdit: import("vitest").Mock<(...args: any[]) => any>;
        fs: {
            readFile: import("vitest").Mock<(...args: any[]) => any>;
            writeFile: import("vitest").Mock<(...args: any[]) => any>;
            stat: import("vitest").Mock<(...args: any[]) => any>;
            readDirectory: import("vitest").Mock<(...args: any[]) => any>;
            createDirectory: import("vitest").Mock<(...args: any[]) => any>;
            delete: import("vitest").Mock<(...args: any[]) => any>;
        };
    };
    commands: {
        registerCommand: import("vitest").Mock<(...args: any[]) => any>;
        executeCommand: import("vitest").Mock<(...args: any[]) => any>;
        getCommands: import("vitest").Mock<(...args: any[]) => any>;
    };
    languages: {
        registerCompletionItemProvider: import("vitest").Mock<(...args: any[]) => any>;
        registerHoverProvider: import("vitest").Mock<(...args: any[]) => any>;
        registerCodeActionsProvider: import("vitest").Mock<(...args: any[]) => any>;
        createDiagnosticCollection: import("vitest").Mock<(...args: any[]) => any>;
    };
    extensions: {
        getExtension: import("vitest").Mock<(...args: any[]) => any>;
        all: any[];
        onDidChange: import("vitest").Mock<(...args: any[]) => any>;
    };
    env: {
        machineId: string;
        sessionId: string;
        language: string;
        appName: string;
        appRoot: string;
        uriScheme: string;
        clipboard: {
            readText: import("vitest").Mock<(...args: any[]) => any>;
            writeText: import("vitest").Mock<(...args: any[]) => any>;
        };
        openExternal: import("vitest").Mock<(...args: any[]) => any>;
    };
};
export default _default;
//# sourceMappingURL=vscode.d.ts.map