// VoiceCode Mobile - Offline Queue
// Queue for failed requests to retry when online

import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';

/**
 * Queued request
 */
export interface QueuedRequest {
  id: string;
  url: string;
  method: string;
  body?: any;
  headers?: Record<string, string>;
  timestamp: number;
  retryCount: number;
  maxRetries: number;
}

/**
 * Offline Queue for failed requests
 */
export class OfflineQueue {
  private queue: QueuedRequest[];
  private storageKey: string;
  private processing: boolean;
  private listeners: Set<(queue: QueuedRequest[]) => void>;

  constructor(storageKey: string = 'offline_queue') {
    this.queue = [];
    this.storageKey = storageKey;
    this.processing = false;
    this.listeners = new Set();
    this.initialize();
  }

  /**
   * Initialize queue and network listener
   */
  private async initialize(): Promise<void> {
    await this.loadFromStorage();

    // Listen for network changes
    NetInfo.addEventListener((state) => {
      if (state.isConnected && this.queue.length > 0) {
        this.processQueue();
      }
    });
  }

  /**
   * Add request to queue
   */
  async enqueue(request: Omit<QueuedRequest, 'id' | 'timestamp' | 'retryCount'>): Promise<void> {
    const queuedRequest: QueuedRequest = {
      ...request,
      id: this.generateId(),
      timestamp: Date.now(),
      retryCount: 0,
    };

    this.queue.push(queuedRequest);
    await this.saveToStorage();
    this.notifyListeners();

    // Try to process immediately if online
    const netInfo = await NetInfo.fetch();
    if (netInfo.isConnected) {
      this.processQueue();
    }
  }

  /**
   * Process queue when online
   */
  async processQueue(): Promise<void> {
    if (this.processing || this.queue.length === 0) {
      return;
    }

    this.processing = true;

    while (this.queue.length > 0) {
      const request = this.queue[0];

      try {
        await this.executeRequest(request);
        
        // Success - remove from queue
        this.queue.shift();
        await this.saveToStorage();
        this.notifyListeners();
      } catch (error) {
        // Failed - increment retry count
        request.retryCount++;

        if (request.retryCount >= request.maxRetries) {
          // Max retries reached - remove from queue
          console.error('Request failed after max retries:', request);
          this.queue.shift();
          await this.saveToStorage();
          this.notifyListeners();
        } else {
          // Will retry later
          break;
        }
      }
    }

    this.processing = false;
  }

  /**
   * Execute a queued request
   */
  private async executeRequest(request: QueuedRequest): Promise<void> {
    const response = await fetch(request.url, {
      method: request.method,
      headers: request.headers,
      body: request.body ? JSON.stringify(request.body) : undefined,
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return response.json();
  }

  /**
   * Get current queue
   */
  getQueue(): QueuedRequest[] {
    return [...this.queue];
  }

  /**
   * Get queue size
   */
  size(): number {
    return this.queue.length;
  }

  /**
   * Clear queue
   */
  async clear(): Promise<void> {
    this.queue = [];
    await AsyncStorage.removeItem(this.storageKey);
    this.notifyListeners();
  }

  /**
   * Remove specific request
   */
  async remove(id: string): Promise<void> {
    const index = this.queue.findIndex((r) => r.id === id);
    if (index !== -1) {
      this.queue.splice(index, 1);
      await this.saveToStorage();
      this.notifyListeners();
    }
  }

  /**
   * Subscribe to queue changes
   */
  subscribe(listener: (queue: QueuedRequest[]) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Notify listeners of queue changes
   */
  private notifyListeners(): void {
    const queue = this.getQueue();
    this.listeners.forEach((listener) => listener(queue));
  }

  /**
   * Save queue to storage
   */
  private async saveToStorage(): Promise<void> {
    try {
      await AsyncStorage.setItem(this.storageKey, JSON.stringify(this.queue));
    } catch (error) {
      console.error('Failed to save queue to storage:', error);
    }
  }

  /**
   * Load queue from storage
   */
  private async loadFromStorage(): Promise<void> {
    try {
      const data = await AsyncStorage.getItem(this.storageKey);
      if (data) {
        this.queue = JSON.parse(data);
      }
    } catch (error) {
      console.error('Failed to load queue from storage:', error);
    }
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get queue statistics
   */
  getStats(): {
    size: number;
    oldestRequest: number;
    failedRequests: number;
  } {
    let oldestTimestamp = Date.now();
    let failedCount = 0;

    for (const request of this.queue) {
      if (request.timestamp < oldestTimestamp) {
        oldestTimestamp = request.timestamp;
      }
      if (request.retryCount > 0) {
        failedCount++;
      }
    }

    return {
      size: this.queue.length,
      oldestRequest: Date.now() - oldestTimestamp,
      failedRequests: failedCount,
    };
  }
}

/**
 * Global offline queue instance
 */
export const globalOfflineQueue = new OfflineQueue();
