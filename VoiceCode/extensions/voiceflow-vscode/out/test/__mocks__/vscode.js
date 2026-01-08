"use strict";
/**
 * Mock VSCode Module for Unit Testing
 *
 * This module provides mock implementations of the VS Code API
 * for unit testing purposes. The real vscode module is only available
 * when running inside the VS Code extension host.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ThemeIcon = exports.ProgressLocation = exports.CancellationTokenSource = exports.env = exports.extensions = exports.languages = exports.commands = exports.workspace = exports.window = exports.ConfigurationTarget = exports.DiagnosticSeverity = exports.StatusBarAlignment = exports.ViewColumn = exports.WorkspaceEdit = exports.TextEdit = exports.Selection = exports.Position = exports.Range = exports.Uri = exports.Disposable = exports.EventEmitter = void 0;
const vitest_1 = require("vitest");
// Mock EventEmitter
class EventEmitter {
    listeners = [];
    event = (listener) => {
        this.listeners.push(listener);
        return { dispose: () => this.listeners.splice(this.listeners.indexOf(listener), 1) };
    };
    fire(data) {
        this.listeners.forEach(l => l(data));
    }
    dispose() {
        this.listeners = [];
    }
}
exports.EventEmitter = EventEmitter;
// Mock Disposable
class Disposable {
    callOnDispose;
    static from(...disposables) {
        return new Disposable(() => disposables.forEach(d => d.dispose()));
    }
    constructor(callOnDispose) {
        this.callOnDispose = callOnDispose;
    }
    dispose() {
        this.callOnDispose();
    }
}
exports.Disposable = Disposable;
// Mock Uri
class Uri {
    scheme;
    authority;
    path;
    query;
    fragment;
    static file(path) {
        return new Uri('file', '', path, '', '');
    }
    static parse(value) {
        return new Uri('https', '', value, '', '');
    }
    static joinPath(base, ...pathSegments) {
        return new Uri(base.scheme, base.authority, [base.path, ...pathSegments].join('/'), '', '');
    }
    constructor(scheme, authority, path, query, fragment) {
        this.scheme = scheme;
        this.authority = authority;
        this.path = path;
        this.query = query;
        this.fragment = fragment;
    }
    get fsPath() {
        return this.path;
    }
    toString() {
        return `${this.scheme}://${this.path}`;
    }
    with(change) {
        return new Uri(change.scheme ?? this.scheme, change.authority ?? this.authority, change.path ?? this.path, change.query ?? this.query, change.fragment ?? this.fragment);
    }
}
exports.Uri = Uri;
// Mock Range
class Range {
    start;
    end;
    constructor(start, end) {
        this.start = start;
        this.end = end;
    }
}
exports.Range = Range;
// Mock Position
class Position {
    line;
    character;
    constructor(line, character) {
        this.line = line;
        this.character = character;
    }
}
exports.Position = Position;
// Mock Selection
class Selection extends Range {
    anchor;
    active;
    constructor(anchor, active) {
        super(anchor, active);
        this.anchor = anchor;
        this.active = active;
    }
}
exports.Selection = Selection;
// Mock TextEdit
class TextEdit {
    range;
    newText;
    static replace(range, newText) {
        return new TextEdit(range, newText);
    }
    static insert(position, newText) {
        return new TextEdit(new Range(position, position), newText);
    }
    static delete(range) {
        return new TextEdit(range, '');
    }
    constructor(range, newText) {
        this.range = range;
        this.newText = newText;
    }
}
exports.TextEdit = TextEdit;
// Mock WorkspaceEdit
class WorkspaceEdit {
    edits = new Map();
    replace(uri, range, newText) {
        const key = uri.toString();
        if (!this.edits.has(key)) {
            this.edits.set(key, []);
        }
        this.edits.get(key).push(TextEdit.replace(range, newText));
    }
    insert(uri, position, newText) {
        this.replace(uri, new Range(position, position), newText);
    }
    delete(uri, range) {
        this.replace(uri, range, '');
    }
}
exports.WorkspaceEdit = WorkspaceEdit;
// ViewColumn enum
var ViewColumn;
(function (ViewColumn) {
    ViewColumn[ViewColumn["Active"] = -1] = "Active";
    ViewColumn[ViewColumn["Beside"] = -2] = "Beside";
    ViewColumn[ViewColumn["One"] = 1] = "One";
    ViewColumn[ViewColumn["Two"] = 2] = "Two";
    ViewColumn[ViewColumn["Three"] = 3] = "Three";
})(ViewColumn || (exports.ViewColumn = ViewColumn = {}));
// StatusBarAlignment enum
var StatusBarAlignment;
(function (StatusBarAlignment) {
    StatusBarAlignment[StatusBarAlignment["Left"] = 1] = "Left";
    StatusBarAlignment[StatusBarAlignment["Right"] = 2] = "Right";
})(StatusBarAlignment || (exports.StatusBarAlignment = StatusBarAlignment = {}));
// DiagnosticSeverity enum
var DiagnosticSeverity;
(function (DiagnosticSeverity) {
    DiagnosticSeverity[DiagnosticSeverity["Error"] = 0] = "Error";
    DiagnosticSeverity[DiagnosticSeverity["Warning"] = 1] = "Warning";
    DiagnosticSeverity[DiagnosticSeverity["Information"] = 2] = "Information";
    DiagnosticSeverity[DiagnosticSeverity["Hint"] = 3] = "Hint";
})(DiagnosticSeverity || (exports.DiagnosticSeverity = DiagnosticSeverity = {}));
// ConfigurationTarget enum
var ConfigurationTarget;
(function (ConfigurationTarget) {
    ConfigurationTarget[ConfigurationTarget["Global"] = 1] = "Global";
    ConfigurationTarget[ConfigurationTarget["Workspace"] = 2] = "Workspace";
    ConfigurationTarget[ConfigurationTarget["WorkspaceFolder"] = 3] = "WorkspaceFolder";
})(ConfigurationTarget || (exports.ConfigurationTarget = ConfigurationTarget = {}));
// Mock window namespace
exports.window = {
    showInformationMessage: vitest_1.vi.fn().mockResolvedValue(undefined),
    showWarningMessage: vitest_1.vi.fn().mockResolvedValue(undefined),
    showErrorMessage: vitest_1.vi.fn().mockResolvedValue(undefined),
    showInputBox: vitest_1.vi.fn().mockResolvedValue(undefined),
    showQuickPick: vitest_1.vi.fn().mockResolvedValue(undefined),
    createOutputChannel: vitest_1.vi.fn().mockReturnValue({
        appendLine: vitest_1.vi.fn(),
        append: vitest_1.vi.fn(),
        clear: vitest_1.vi.fn(),
        show: vitest_1.vi.fn(),
        hide: vitest_1.vi.fn(),
        dispose: vitest_1.vi.fn(),
    }),
    createStatusBarItem: vitest_1.vi.fn().mockReturnValue({
        text: '',
        tooltip: '',
        command: '',
        show: vitest_1.vi.fn(),
        hide: vitest_1.vi.fn(),
        dispose: vitest_1.vi.fn(),
    }),
    createWebviewPanel: vitest_1.vi.fn().mockReturnValue({
        webview: {
            html: '',
            onDidReceiveMessage: vitest_1.vi.fn(),
            postMessage: vitest_1.vi.fn().mockResolvedValue(true),
            asWebviewUri: vitest_1.vi.fn((uri) => uri),
        },
        onDidDispose: vitest_1.vi.fn(),
        dispose: vitest_1.vi.fn(),
        reveal: vitest_1.vi.fn(),
    }),
    activeTextEditor: undefined,
    visibleTextEditors: [],
    onDidChangeActiveTextEditor: vitest_1.vi.fn(),
    onDidChangeVisibleTextEditors: vitest_1.vi.fn(),
    createTerminal: vitest_1.vi.fn().mockReturnValue({
        sendText: vitest_1.vi.fn(),
        show: vitest_1.vi.fn(),
        hide: vitest_1.vi.fn(),
        dispose: vitest_1.vi.fn(),
    }),
    withProgress: vitest_1.vi.fn().mockImplementation((options, task) => task({ report: vitest_1.vi.fn() })),
};
// Mock workspace namespace
exports.workspace = {
    getConfiguration: vitest_1.vi.fn().mockReturnValue({
        get: vitest_1.vi.fn().mockReturnValue(undefined),
        has: vitest_1.vi.fn().mockReturnValue(false),
        update: vitest_1.vi.fn().mockResolvedValue(undefined),
        inspect: vitest_1.vi.fn().mockReturnValue(undefined),
    }),
    workspaceFolders: undefined,
    rootPath: undefined,
    onDidChangeConfiguration: vitest_1.vi.fn(),
    openTextDocument: vitest_1.vi.fn().mockResolvedValue({
        getText: vitest_1.vi.fn().mockReturnValue(''),
        lineCount: 0,
        fileName: '',
        uri: Uri.file(''),
    }),
    applyEdit: vitest_1.vi.fn().mockResolvedValue(true),
    fs: {
        readFile: vitest_1.vi.fn().mockResolvedValue(new Uint8Array()),
        writeFile: vitest_1.vi.fn().mockResolvedValue(undefined),
        stat: vitest_1.vi.fn().mockResolvedValue({ type: 1, ctime: 0, mtime: 0, size: 0 }),
        readDirectory: vitest_1.vi.fn().mockResolvedValue([]),
        createDirectory: vitest_1.vi.fn().mockResolvedValue(undefined),
        delete: vitest_1.vi.fn().mockResolvedValue(undefined),
    },
};
// Mock commands namespace
exports.commands = {
    registerCommand: vitest_1.vi.fn().mockReturnValue({ dispose: vitest_1.vi.fn() }),
    executeCommand: vitest_1.vi.fn().mockResolvedValue(undefined),
    getCommands: vitest_1.vi.fn().mockResolvedValue([]),
};
// Mock languages namespace
exports.languages = {
    registerCompletionItemProvider: vitest_1.vi.fn().mockReturnValue({ dispose: vitest_1.vi.fn() }),
    registerHoverProvider: vitest_1.vi.fn().mockReturnValue({ dispose: vitest_1.vi.fn() }),
    registerCodeActionsProvider: vitest_1.vi.fn().mockReturnValue({ dispose: vitest_1.vi.fn() }),
    createDiagnosticCollection: vitest_1.vi.fn().mockReturnValue({
        set: vitest_1.vi.fn(),
        delete: vitest_1.vi.fn(),
        clear: vitest_1.vi.fn(),
        dispose: vitest_1.vi.fn(),
    }),
};
// Mock extensions namespace
exports.extensions = {
    getExtension: vitest_1.vi.fn().mockReturnValue(undefined),
    all: [],
    onDidChange: vitest_1.vi.fn(),
};
// Mock env namespace
exports.env = {
    machineId: 'test-machine-id',
    sessionId: 'test-session-id',
    language: 'en',
    appName: 'Visual Studio Code',
    appRoot: '/test/app/root',
    uriScheme: 'vscode',
    clipboard: {
        readText: vitest_1.vi.fn().mockResolvedValue(''),
        writeText: vitest_1.vi.fn().mockResolvedValue(undefined),
    },
    openExternal: vitest_1.vi.fn().mockResolvedValue(true),
};
// Mock CancellationTokenSource
class CancellationTokenSource {
    token = {
        isCancellationRequested: false,
        onCancellationRequested: vitest_1.vi.fn().mockReturnValue({ dispose: vitest_1.vi.fn() }),
    };
    cancel() {
        this.token.isCancellationRequested = true;
    }
    dispose() { }
}
exports.CancellationTokenSource = CancellationTokenSource;
// Mock ProgressLocation
var ProgressLocation;
(function (ProgressLocation) {
    ProgressLocation[ProgressLocation["SourceControl"] = 1] = "SourceControl";
    ProgressLocation[ProgressLocation["Window"] = 10] = "Window";
    ProgressLocation[ProgressLocation["Notification"] = 15] = "Notification";
})(ProgressLocation || (exports.ProgressLocation = ProgressLocation = {}));
// Mock ThemeIcon
class ThemeIcon {
    id;
    constructor(id) {
        this.id = id;
    }
}
exports.ThemeIcon = ThemeIcon;
// Default export for ESM compatibility
exports.default = {
    EventEmitter,
    Disposable,
    Uri,
    Range,
    Position,
    Selection,
    TextEdit,
    WorkspaceEdit,
    ViewColumn,
    StatusBarAlignment,
    DiagnosticSeverity,
    ConfigurationTarget,
    ProgressLocation,
    ThemeIcon,
    CancellationTokenSource,
    window: exports.window,
    workspace: exports.workspace,
    commands: exports.commands,
    languages: exports.languages,
    extensions: exports.extensions,
    env: exports.env,
};
//# sourceMappingURL=vscode.js.map