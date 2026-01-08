/**
 * Mock VSCode Module for Unit Testing
 * 
 * This module provides mock implementations of the VS Code API
 * for unit testing purposes. The real vscode module is only available
 * when running inside the VS Code extension host.
 */

import { vi } from 'vitest';

// Mock EventEmitter
export class EventEmitter<T> {
  private listeners: ((e: T) => void)[] = [];

  event = (listener: (e: T) => void) => {
    this.listeners.push(listener);
    return { dispose: () => this.listeners.splice(this.listeners.indexOf(listener), 1) };
  };

  fire(data: T) {
    this.listeners.forEach(l => l(data));
  }

  dispose() {
    this.listeners = [];
  }
}

// Mock Disposable
export class Disposable {
  static from(...disposables: { dispose: () => any }[]): Disposable {
    return new Disposable(() => disposables.forEach(d => d.dispose()));
  }

  constructor(private callOnDispose: () => void) {}

  dispose() {
    this.callOnDispose();
  }
}

// Mock Uri
export class Uri {
  static file(path: string): Uri {
    return new Uri('file', '', path, '', '');
  }

  static parse(value: string): Uri {
    return new Uri('https', '', value, '', '');
  }

  static joinPath(base: Uri, ...pathSegments: string[]): Uri {
    return new Uri(base.scheme, base.authority, [base.path, ...pathSegments].join('/'), '', '');
  }

  constructor(
    public readonly scheme: string,
    public readonly authority: string,
    public readonly path: string,
    public readonly query: string,
    public readonly fragment: string
  ) {}

  get fsPath(): string {
    return this.path;
  }

  toString(): string {
    return `${this.scheme}://${this.path}`;
  }

  with(change: { scheme?: string; authority?: string; path?: string; query?: string; fragment?: string }): Uri {
    return new Uri(
      change.scheme ?? this.scheme,
      change.authority ?? this.authority,
      change.path ?? this.path,
      change.query ?? this.query,
      change.fragment ?? this.fragment
    );
  }
}

// Mock Range
export class Range {
  constructor(
    public readonly start: Position,
    public readonly end: Position
  ) {}
}

// Mock Position
export class Position {
  constructor(
    public readonly line: number,
    public readonly character: number
  ) {}
}

// Mock Selection
export class Selection extends Range {
  constructor(
    public readonly anchor: Position,
    public readonly active: Position
  ) {
    super(anchor, active);
  }
}

// Mock TextEdit
export class TextEdit {
  static replace(range: Range, newText: string): TextEdit {
    return new TextEdit(range, newText);
  }

  static insert(position: Position, newText: string): TextEdit {
    return new TextEdit(new Range(position, position), newText);
  }

  static delete(range: Range): TextEdit {
    return new TextEdit(range, '');
  }

  constructor(
    public readonly range: Range,
    public readonly newText: string
  ) {}
}

// Mock WorkspaceEdit
export class WorkspaceEdit {
  private edits: Map<string, TextEdit[]> = new Map();

  replace(uri: Uri, range: Range, newText: string): void {
    const key = uri.toString();
    if (!this.edits.has(key)) {
      this.edits.set(key, []);
    }
    this.edits.get(key)!.push(TextEdit.replace(range, newText));
  }

  insert(uri: Uri, position: Position, newText: string): void {
    this.replace(uri, new Range(position, position), newText);
  }

  delete(uri: Uri, range: Range): void {
    this.replace(uri, range, '');
  }
}

// ViewColumn enum
export enum ViewColumn {
  Active = -1,
  Beside = -2,
  One = 1,
  Two = 2,
  Three = 3,
}

// StatusBarAlignment enum
export enum StatusBarAlignment {
  Left = 1,
  Right = 2,
}

// DiagnosticSeverity enum
export enum DiagnosticSeverity {
  Error = 0,
  Warning = 1,
  Information = 2,
  Hint = 3,
}

// ConfigurationTarget enum
export enum ConfigurationTarget {
  Global = 1,
  Workspace = 2,
  WorkspaceFolder = 3,
}

// Mock window namespace
export const window = {
  showInformationMessage: vi.fn().mockResolvedValue(undefined),
  showWarningMessage: vi.fn().mockResolvedValue(undefined),
  showErrorMessage: vi.fn().mockResolvedValue(undefined),
  showInputBox: vi.fn().mockResolvedValue(undefined),
  showQuickPick: vi.fn().mockResolvedValue(undefined),
  createOutputChannel: vi.fn().mockReturnValue({
    appendLine: vi.fn(),
    append: vi.fn(),
    clear: vi.fn(),
    show: vi.fn(),
    hide: vi.fn(),
    dispose: vi.fn(),
  }),
  createStatusBarItem: vi.fn().mockReturnValue({
    text: '',
    tooltip: '',
    command: '',
    show: vi.fn(),
    hide: vi.fn(),
    dispose: vi.fn(),
  }),
  createWebviewPanel: vi.fn().mockReturnValue({
    webview: {
      html: '',
      onDidReceiveMessage: vi.fn(),
      postMessage: vi.fn().mockResolvedValue(true),
      asWebviewUri: vi.fn((uri: Uri) => uri),
    },
    onDidDispose: vi.fn(),
    dispose: vi.fn(),
    reveal: vi.fn(),
  }),
  activeTextEditor: undefined as any,
  visibleTextEditors: [] as any[],
  onDidChangeActiveTextEditor: vi.fn(),
  onDidChangeVisibleTextEditors: vi.fn(),
  createTerminal: vi.fn().mockReturnValue({
    sendText: vi.fn(),
    show: vi.fn(),
    hide: vi.fn(),
    dispose: vi.fn(),
  }),
  withProgress: vi.fn().mockImplementation((options, task) => task({ report: vi.fn() })),
};

// Mock workspace namespace
export const workspace = {
  getConfiguration: vi.fn().mockReturnValue({
    get: vi.fn().mockReturnValue(undefined),
    has: vi.fn().mockReturnValue(false),
    update: vi.fn().mockResolvedValue(undefined),
    inspect: vi.fn().mockReturnValue(undefined),
  }),
  workspaceFolders: undefined as any[] | undefined,
  rootPath: undefined as string | undefined,
  onDidChangeConfiguration: vi.fn(),
  openTextDocument: vi.fn().mockResolvedValue({
    getText: vi.fn().mockReturnValue(''),
    lineCount: 0,
    fileName: '',
    uri: Uri.file(''),
  }),
  applyEdit: vi.fn().mockResolvedValue(true),
  fs: {
    readFile: vi.fn().mockResolvedValue(new Uint8Array()),
    writeFile: vi.fn().mockResolvedValue(undefined),
    stat: vi.fn().mockResolvedValue({ type: 1, ctime: 0, mtime: 0, size: 0 }),
    readDirectory: vi.fn().mockResolvedValue([]),
    createDirectory: vi.fn().mockResolvedValue(undefined),
    delete: vi.fn().mockResolvedValue(undefined),
  },
};

// Mock commands namespace
export const commands = {
  registerCommand: vi.fn().mockReturnValue({ dispose: vi.fn() }),
  executeCommand: vi.fn().mockResolvedValue(undefined),
  getCommands: vi.fn().mockResolvedValue([]),
};

// Mock languages namespace
export const languages = {
  registerCompletionItemProvider: vi.fn().mockReturnValue({ dispose: vi.fn() }),
  registerHoverProvider: vi.fn().mockReturnValue({ dispose: vi.fn() }),
  registerCodeActionsProvider: vi.fn().mockReturnValue({ dispose: vi.fn() }),
  createDiagnosticCollection: vi.fn().mockReturnValue({
    set: vi.fn(),
    delete: vi.fn(),
    clear: vi.fn(),
    dispose: vi.fn(),
  }),
};

// Mock extensions namespace
export const extensions = {
  getExtension: vi.fn().mockReturnValue(undefined),
  all: [] as any[],
  onDidChange: vi.fn(),
};

// Mock env namespace
export const env = {
  machineId: 'test-machine-id',
  sessionId: 'test-session-id',
  language: 'en',
  appName: 'Visual Studio Code',
  appRoot: '/test/app/root',
  uriScheme: 'vscode',
  clipboard: {
    readText: vi.fn().mockResolvedValue(''),
    writeText: vi.fn().mockResolvedValue(undefined),
  },
  openExternal: vi.fn().mockResolvedValue(true),
};

// Mock ExtensionContext
export interface ExtensionContext {
  subscriptions: { dispose: () => any }[];
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

// Mock CancellationToken
export interface CancellationToken {
  isCancellationRequested: boolean;
  onCancellationRequested: (listener: () => void) => Disposable;
}

// Mock CancellationTokenSource
export class CancellationTokenSource {
  token: CancellationToken = {
    isCancellationRequested: false,
    onCancellationRequested: vi.fn().mockReturnValue({ dispose: vi.fn() }),
  };

  cancel(): void {
    (this.token as any).isCancellationRequested = true;
  }

  dispose(): void {}
}

// Mock ProgressLocation
export enum ProgressLocation {
  SourceControl = 1,
  Window = 10,
  Notification = 15,
}

// Mock ThemeIcon
export class ThemeIcon {
  constructor(public readonly id: string) {}
}

// Default export for ESM compatibility
export default {
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
  window,
  workspace,
  commands,
  languages,
  extensions,
  env,
};

