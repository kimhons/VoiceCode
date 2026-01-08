/**
 * Multi-Window Manager (ENTERPRISE TIER)
 * Manages voice commands across multiple VS Code windows
 */
export interface WindowInfo {
    id: string;
    name: string;
    activeFile?: string;
    isListening: boolean;
}
export declare class MultiWindowManager {
    private windows;
    /**
     * Register a window
     */
    registerWindow(id: string, name: string): void;
    /**
     * Unregister a window
     */
    unregisterWindow(id: string): void;
    /**
     * Get all registered windows
     */
    getWindows(): WindowInfo[];
    /**
     * Set listening state for a window
     */
    setWindowListening(id: string, isListening: boolean): void;
    /**
     * Get listening windows
     */
    getListeningWindows(): WindowInfo[];
    /**
     * Broadcast command to all windows
     */
    broadcastCommand(command: string): Promise<void>;
    /**
     * Focus window by name
     */
    focusWindow(name: string): Promise<void>;
}
//# sourceMappingURL=MultiWindowManager.d.ts.map