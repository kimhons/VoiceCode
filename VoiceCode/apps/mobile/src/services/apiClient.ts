/**
 * API Client
 * Centralized HTTP client with interceptors, retry logic, and error handling
 */

import { config } from '../config/environment';

interface RequestOptions extends RequestInit {
  timeout?: number;
  retries?: number;
  retryDelay?: number;
}

interface ApiResponse<T> {
  data: T | null;
  error: Error | null;
  status: number;
}

class ApiClient {
  private baseUrl: string;
  private readonly defaultTimeout: number;
  private readonly defaultRetries: number;
  private readonly defaultRetryDelay: number;
  private authToken: string | null = null;

  constructor() {
    this.baseUrl = config.supabaseUrl;
    this.defaultTimeout = config.apiTimeout;
    this.defaultRetries = 3;
    this.defaultRetryDelay = 1000;
  }

  setAuthToken(token: string | null) {
    this.authToken = token;
  }

  setBaseUrl(url: string) {
    this.baseUrl = url;
  }

  private async fetchWithTimeout(url: string, options: RequestOptions): Promise<Response> {
    const { timeout = this.defaultTimeout, ...fetchOptions } = options;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        ...fetchOptions,
        signal: controller.signal,
      });
      return response;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  private async fetchWithRetry(url: string, options: RequestOptions): Promise<Response> {
    const {
      retries = this.defaultRetries,
      retryDelay = this.defaultRetryDelay,
      ...fetchOptions
    } = options;

    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const response = await this.fetchWithTimeout(url, fetchOptions);

        if (response.ok || response.status < 500) {
          return response;
        }

        lastError = new Error(`HTTP ${response.status}: ${response.statusText}`);
      } catch (error) {
        lastError = error as Error;

        if (error instanceof Error && error.name === 'AbortError') {
          lastError = new Error('Request timeout');
        }
      }

      if (attempt < retries) {
        await new Promise(resolve => setTimeout(resolve, retryDelay * Math.pow(2, attempt)));
      }
    }

    throw lastError || new Error('Request failed');
  }

  private getHeaders(customHeaders?: HeadersInit): Headers {
    const headers = new Headers(customHeaders);

    if (!headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }

    if (this.authToken) {
      headers.set('Authorization', `Bearer ${this.authToken}`);
    }

    return headers;
  }

  async get<T>(endpoint: string, options: RequestOptions = {}): Promise<ApiResponse<T>> {
    try {
      const url = endpoint.startsWith('http') ? endpoint : `${this.baseUrl}${endpoint}`;
      const response = await this.fetchWithRetry(url, {
        ...options,
        method: 'GET',
        headers: this.getHeaders(options.headers),
      });

      const data = response.headers.get('content-type')?.includes('application/json')
        ? await response.json()
        : await response.text();

      return {
        data: response.ok ? data : null,
        error: response.ok ? null : new Error(data?.message || 'Request failed'),
        status: response.status,
      };
    } catch (error) {
      return {
        data: null,
        error: error as Error,
        status: 0,
      };
    }
  }

  async post<T>(
    endpoint: string,
    body?: unknown,
    options: RequestOptions = {}
  ): Promise<ApiResponse<T>> {
    try {
      const url = endpoint.startsWith('http') ? endpoint : `${this.baseUrl}${endpoint}`;
      const response = await this.fetchWithRetry(url, {
        ...options,
        method: 'POST',
        headers: this.getHeaders(options.headers),
        body: body ? JSON.stringify(body) : undefined,
      });

      const data = response.headers.get('content-type')?.includes('application/json')
        ? await response.json()
        : await response.text();

      return {
        data: response.ok ? data : null,
        error: response.ok ? null : new Error(data?.message || 'Request failed'),
        status: response.status,
      };
    } catch (error) {
      return {
        data: null,
        error: error as Error,
        status: 0,
      };
    }
  }

  async put<T>(
    endpoint: string,
    body?: unknown,
    options: RequestOptions = {}
  ): Promise<ApiResponse<T>> {
    try {
      const url = endpoint.startsWith('http') ? endpoint : `${this.baseUrl}${endpoint}`;
      const response = await this.fetchWithRetry(url, {
        ...options,
        method: 'PUT',
        headers: this.getHeaders(options.headers),
        body: body ? JSON.stringify(body) : undefined,
      });

      const data = response.headers.get('content-type')?.includes('application/json')
        ? await response.json()
        : await response.text();

      return {
        data: response.ok ? data : null,
        error: response.ok ? null : new Error(data?.message || 'Request failed'),
        status: response.status,
      };
    } catch (error) {
      return {
        data: null,
        error: error as Error,
        status: 0,
      };
    }
  }

  async delete<T>(endpoint: string, options: RequestOptions = {}): Promise<ApiResponse<T>> {
    try {
      const url = endpoint.startsWith('http') ? endpoint : `${this.baseUrl}${endpoint}`;
      const response = await this.fetchWithRetry(url, {
        ...options,
        method: 'DELETE',
        headers: this.getHeaders(options.headers),
      });

      const data = response.headers.get('content-type')?.includes('application/json')
        ? await response.json()
        : await response.text();

      return {
        data: response.ok ? data : null,
        error: response.ok ? null : new Error(data?.message || 'Request failed'),
        status: response.status,
      };
    } catch (error) {
      return {
        data: null,
        error: error as Error,
        status: 0,
      };
    }
  }

  async upload<T>(
    endpoint: string,
    file: Blob | File,
    onProgress?: (progress: number) => void,
    options: RequestOptions = {}
  ): Promise<ApiResponse<T>> {
    try {
      const url = endpoint.startsWith('http') ? endpoint : `${this.baseUrl}${endpoint}`;
      const formData = new FormData();
      formData.append('file', file);

      const headers = new Headers(options.headers);
      if (this.authToken) {
        headers.set('Authorization', `Bearer ${this.authToken}`);
      }

      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: formData,
      });

      const data = await response.json();

      return {
        data: response.ok ? data : null,
        error: response.ok ? null : new Error(data?.message || 'Upload failed'),
        status: response.status,
      };
    } catch (error) {
      return {
        data: null,
        error: error as Error,
        status: 0,
      };
    }
  }
}

export const apiClient = new ApiClient();
export default apiClient;
