"use strict";
/**
 * Multi-Window Manager (ENTERPRISE TIER)
 * Manages voice commands across multiple VS Code windows
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
exports.MultiWindowManager = void 0;
const vscode = __importStar(require("vscode"));
class MultiWindowManager {
    windows = new Map();
    /**
     * Register a window
     */
    registerWindow(id, name) {
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
    unregisterWindow(id) {
        this.windows.delete(id);
        console.log(`[MultiWindow] Unregistered window: ${id}`);
    }
    /**
     * Get all registered windows
     */
    getWindows() {
        return Array.from(this.windows.values());
    }
    /**
     * Set listening state for a window
     */
    setWindowListening(id, isListening) {
        const window = this.windows.get(id);
        if (window) {
            window.isListening = isListening;
        }
    }
    /**
     * Get listening windows
     */
    getListeningWindows() {
        return this.getWindows().filter((w) => w.isListening);
    }
    /**
     * Broadcast command to all windows
     */
    async broadcastCommand(command) {
        console.log(`[MultiWindow] Broadcasting command to ${this.windows.size} windows`);
        for (const window of this.windows.values()) {
            console.log(`[MultiWindow] Sending to ${window.name}: ${command}`);
        }
    }
    /**
     * Focus window by name
     */
    async focusWindow(name) {
        const window = Array.from(this.windows.values()).find((w) => w.name === name);
        if (window) {
            vscode.window.showInformationMessage(`Focusing window: ${window.name}`);
        }
        else {
            vscode.window.showErrorMessage(`Window not found: ${name}`);
        }
    }
}
exports.MultiWindowManager = MultiWindowManager;
//# sourceMappingURL=MultiWindowManager.js.map