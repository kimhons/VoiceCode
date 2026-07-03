import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { render } from '@testing-library/react';
import { ErrorBoundary } from '../../components/ErrorBoundary';

const Thrower: React.FC = () => {
  throw new Error('Boom');
};

describe('ErrorBoundary remote logging', () => {
  const originalFetch = global.fetch;
  const originalUrl = (globalThis as any).__ERROR_LOG_URL;

  beforeEach(() => {
    (globalThis as any).__ERROR_LOG_URL = 'https://example.invalid/log';
    global.fetch = vi.fn().mockResolvedValue({ ok: true }) as any;
  });

  afterEach(() => {
    global.fetch = originalFetch as any;
    (globalThis as any).__ERROR_LOG_URL = originalUrl;
    vi.restoreAllMocks();
  });

  it('posts error payload when ERROR_LOG_URL is set', () => {
    render(
      <ErrorBoundary>
        <Thrower />
      </ErrorBoundary>
    );

    expect(global.fetch).toHaveBeenCalledTimes(1);
    const [url, init] = (global.fetch as any).mock.calls[0];
    expect(url).toBe('https://example.invalid/log');
    expect(init.method).toBe('POST');
    expect(init.headers['Content-Type']).toBe('application/json');
    const body = JSON.parse(init.body);
    expect(body.name).toBe('Error');
    expect(body.message).toBe('Boom');
    expect(typeof body.timestamp).toBe('string');
  });
});

