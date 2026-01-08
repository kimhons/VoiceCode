/**
 * Multi-Window Manager (ENTERPRISE TIER)
 * Manages voice commands across multiple VS Code windows
 */

import * as vscode from 'vscode';

export interface WindowInfo {
  id: string;
  name: string;
  activeFile?: string;
  isListening: boolean;
}

export class MultiWindowManager {
  private windows: Map<string, WindowInfo> = new Map();

  /**
   * Register a window
   */
  registerWindow(id: string, name: string): void {
    this.windows.set(id, {
      id,
      name,
      isListening: false,
    });

    console.log(`[MultiWindow] Registered window: ${name}`);
  }

  /**
   * Unregister a window
   */
  unregisterWindow(id: string): void {
    this.windows.delete(id);
    console.log(`[MultiWindow] Unregistered window: ${id}`);
  }

  /**
   * Get all registered windows
   */
  getWindows(): WindowInfo[] {
    return Array.from(this.windows.values());
  }

  /**
   * Set listening state for a window
   */
  setWindowListening(id: string, isListening: boolean): void {
    const window = this.windows.get(id);
    if (window) {
      window.isListening = isListening;
    }
  }

  /**
   * Get listening windows
   */
  getListeningWindows(): WindowInfo[] {
    return this.getWindows().filter((w) => w.isListening);
  }

  /**
   * Broadcast command to all windows
   */
  async broadcastCommand(command: string): Promise<void> {
    console.log(`[MultiWindow] Broadcasting command to ${this.windows.size} windows`);

    for (const window of this.windows.values()) {
      console.log(`[MultiWindow] Sending to ${window.name}: ${command}`);
    }
  }

  /**
   * Focus window by name
   */
  async focusWindow(name: string): Promise<void> {
    const window = Array.from(this.windows.values()).find((w) => w.name === name);

    if (window) {
      vscode.window.showInformationMessage(`Focusing window: ${window.name}`);
    } else {
      vscode.window.showErrorMessage(`Window not found: ${name}`);
    }
  }
}
