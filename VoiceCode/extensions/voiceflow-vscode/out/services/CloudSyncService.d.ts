/**
 * Cloud Sync Service (PRO TIER)
 * Syncs voice commands, preferences, and history to cloud
 */
export interface SyncStatus {
    lastSyncTime?: Date;
    status: 'synced' | 'syncing' | 'error' | 'offline';
    pendingChanges: number;
}
export declare class CloudSyncService {
    private status;
    /**
     * Sync now (manual trigger)
     */
    syncNow(): Promise<void>;
    /**
     * Get sync status
     */
    getSyncStatus(): SyncStatus;
    /**
     * Enable auto-sync
     */
    enableAutoSync(): void;
    /**
     * Disable auto-sync
     */
    disableAutoSync(): void;
    /**
     * Sync command history
     */
    syncCommandHistory(): Promise<void>;
    /**
     * Sync preferences
     */
    syncPreferences(): Promise<void>;
}
//# sourceMappingURL=CloudSyncService.d.ts.map