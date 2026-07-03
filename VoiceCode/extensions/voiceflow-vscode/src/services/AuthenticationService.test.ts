/**
 * AuthenticationService Tests
 * Tests for user authentication and tier management
 */

import { describe, it, expect, beforeEach, afterEach, vi, Mock } from 'vitest';
import * as vscode from 'vscode';
import { AuthenticationService, UserProfile } from './AuthenticationService';
import { ServiceTier } from '../utils/ServiceLoader';

// Store original env
const originalEnv = process.env;

// Mock vscode module
vi.mock('vscode', () => {
  class MockEventEmitter<T> {
    private listeners: ((e: T) => void)[] = [];
    event = (listener: (e: T) => void) => {
      this.listeners.push(listener);
      return { dispose: () => {
        const index = this.listeners.indexOf(listener);
        if (index > -1) this.listeners.splice(index, 1);
      }};
    };
    fire(data: T) { this.listeners.forEach(l => l(data)); }
    dispose() { this.listeners = []; }
  }

  return {
    window: {
      showInformationMessage: vi.fn(),
      showWarningMessage: vi.fn(),
      showErrorMessage: vi.fn(),
    },
    EventEmitter: MockEventEmitter,
  };
});

// Mock Supabase
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    auth: {
      signIn: vi.fn(),
      signOut: vi.fn(),
      getUser: vi.fn(),
    },
  })),
}));

// Mock ServiceLoader
vi.mock('../utils/ServiceLoader', () => ({
  ServiceTier: {
    FREE: 'FREE',
    PRO: 'PRO',
    ENTERPRISE: 'ENTERPRISE',
  },
}));

describe('AuthenticationService', () => {
  let service: AuthenticationService;
  let mockContext: vscode.ExtensionContext;
  let globalStateStore: Record<string, any>;

  beforeEach(() => {
    vi.clearAllMocks();

    // Reset environment
    process.env = { ...originalEnv };

    // Mock global state
    globalStateStore = {};
    mockContext = {
      globalState: {
        get: vi.fn((key: string) => globalStateStore[key]),
        update: vi.fn((key: string, value: any) => {
          globalStateStore[key] = value;
          return Promise.resolve();
        }),
        keys: vi.fn(() => Object.keys(globalStateStore)),
        setKeysForSync: vi.fn(),
      },
      subscriptions: [],
    } as unknown as vscode.ExtensionContext;
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  // ============================================================
  // ENVIRONMENT VARIABLE VALIDATION TESTS
  // ============================================================
  describe('Environment Variable Validation', () => {
    it('should detect missing VITE_SUPABASE_URL', () => {
      delete process.env.VITE_SUPABASE_URL;
      delete process.env.VITE_SUPABASE_ANON_KEY;

      service = new AuthenticationService();

      expect(service.isSupabaseConfigured()).toBe(false);
      expect(service.getInitializationWarning()).toContain('VITE_SUPABASE_URL');
    });

    it('should detect missing VITE_SUPABASE_ANON_KEY', () => {
      process.env.VITE_SUPABASE_URL = 'https://test.supabase.co';
      delete process.env.VITE_SUPABASE_ANON_KEY;

      service = new AuthenticationService();

      expect(service.isSupabaseConfigured()).toBe(false);
      expect(service.getInitializationWarning()).toContain('VITE_SUPABASE_ANON_KEY');
    });

    it('should initialize Supabase when both env vars present', () => {
      process.env.VITE_SUPABASE_URL = 'https://test.supabase.co';
      process.env.VITE_SUPABASE_ANON_KEY = 'test-anon-key';

      service = new AuthenticationService();

      expect(service.isSupabaseConfigured()).toBe(true);
      expect(service.getInitializationWarning()).toBeUndefined();
    });

    it('should show warning message when initialized with missing env vars', () => {
      delete process.env.VITE_SUPABASE_URL;
      delete process.env.VITE_SUPABASE_ANON_KEY;

      service = new AuthenticationService();
      service.initialize(mockContext);

      expect(vscode.window.showWarningMessage).toHaveBeenCalledWith(
        expect.stringContaining('VoiceFlow Pro')
      );
    });
  });

  // ============================================================
  // SIGN IN/OUT TESTS
  // ============================================================
  describe('Sign In/Out', () => {
    beforeEach(() => {
      delete process.env.VITE_SUPABASE_URL;
      delete process.env.VITE_SUPABASE_ANON_KEY;
      service = new AuthenticationService();
      service.initialize(mockContext);
    });

    it('should sign in as guest user', async () => {
      const user = await service.signIn();

      expect(user).not.toBeNull();
      expect(user?.id).toBe('guest');
      expect(user?.email).toBe('guest@voiceflow.pro');
      expect(user?.tier).toBe(ServiceTier.FREE);
      expect(vscode.window.showInformationMessage).toHaveBeenCalledWith(
        expect.stringContaining('Welcome to VoiceFlow Pro')
      );
    });

    it('should store user in global state on sign in', async () => {
      await service.signIn();

      expect(mockContext.globalState.update).toHaveBeenCalledWith(
        'voiceflow.user',
        expect.objectContaining({ id: 'guest' })
      );
    });

    it('should sign out and clear user', async () => {
      await service.signIn();
      await service.signOut();

      expect(mockContext.globalState.update).toHaveBeenCalledWith(
        'voiceflow.user',
        undefined
      );
      expect(vscode.window.showInformationMessage).toHaveBeenCalledWith(
        'Signed out of VoiceFlow Pro'
      );
    });
  });

  // ============================================================
  // CURRENT USER TESTS
  // ============================================================
  describe('Get Current User', () => {
    beforeEach(() => {
      delete process.env.VITE_SUPABASE_URL;
      delete process.env.VITE_SUPABASE_ANON_KEY;
      service = new AuthenticationService();
      service.initialize(mockContext);
    });

    it('should return current user after sign in', async () => {
      await service.signIn();
      const user = await service.getCurrentUser();

      expect(user).not.toBeNull();
      expect(user?.id).toBe('guest');
    });

    it('should restore user from global state', async () => {
      const storedUser: UserProfile = {
        id: 'stored-user',
        email: 'stored@test.com',
        tier: ServiceTier.PRO,
      };
      globalStateStore['voiceflow.user'] = storedUser;

      const user = await service.getCurrentUser();

      expect(user?.id).toBe('stored-user');
      expect(user?.tier).toBe(ServiceTier.PRO);
    });

    it('should auto sign-in as guest when no stored user', async () => {
      const user = await service.getCurrentUser();

      expect(user).not.toBeNull();
      expect(user?.id).toBe('guest');
    });
  });

  // ============================================================
  // TIER MANAGEMENT TESTS
  // ============================================================
  describe('Tier Management', () => {
    beforeEach(() => {
      delete process.env.VITE_SUPABASE_URL;
      delete process.env.VITE_SUPABASE_ANON_KEY;
      service = new AuthenticationService();
      service.initialize(mockContext);
    });

    it('should return FREE tier for guest user', async () => {
      await service.signIn();
      const tier = await service.getUserTier();

      expect(tier).toBe(ServiceTier.FREE);
    });

    it('should check premium tier correctly for FREE user', async () => {
      await service.signIn();
      const hasPremium = await service.hasPremiumTier();

      expect(hasPremium).toBe(false);
    });

    it('should check premium tier correctly for PRO user', async () => {
      globalStateStore['voiceflow.user'] = {
        id: 'pro-user',
        email: 'pro@test.com',
        tier: ServiceTier.PRO,
      };

      const hasPremium = await service.hasPremiumTier();

      expect(hasPremium).toBe(true);
    });

    it('should check enterprise tier correctly', async () => {
      globalStateStore['voiceflow.user'] = {
        id: 'enterprise-user',
        email: 'enterprise@test.com',
        tier: ServiceTier.ENTERPRISE,
      };

      const hasEnterprise = await service.hasEnterpriseTier();

      expect(hasEnterprise).toBe(true);
    });

    it('should upgrade tier successfully', async () => {
      await service.signIn();
      await service.upgradeTier(ServiceTier.PRO);

      const tier = await service.getUserTier();

      expect(tier).toBe(ServiceTier.PRO);
      expect(vscode.window.showInformationMessage).toHaveBeenCalledWith(
        expect.stringContaining('Upgraded to PRO tier')
      );
    });

    it('should throw error when upgrading without signed in user', async () => {
      await expect(service.upgradeTier(ServiceTier.PRO)).rejects.toThrow(
        'No user signed in'
      );
    });

    it('should persist upgraded tier to global state', async () => {
      await service.signIn();
      await service.upgradeTier(ServiceTier.ENTERPRISE);

      expect(mockContext.globalState.update).toHaveBeenCalledWith(
        'voiceflow.user',
        expect.objectContaining({ tier: ServiceTier.ENTERPRISE })
      );
    });
  });

  // ============================================================
  // INITIALIZATION TESTS
  // ============================================================
  describe('Initialization', () => {
    it('should not show warning when Supabase is configured', () => {
      process.env.VITE_SUPABASE_URL = 'https://test.supabase.co';
      process.env.VITE_SUPABASE_ANON_KEY = 'test-anon-key';

      service = new AuthenticationService();
      service.initialize(mockContext);

      expect(vscode.window.showWarningMessage).not.toHaveBeenCalled();
    });

    it('should work without context for basic operations', async () => {
      delete process.env.VITE_SUPABASE_URL;
      delete process.env.VITE_SUPABASE_ANON_KEY;

      service = new AuthenticationService();
      // Don't call initialize()

      const user = await service.signIn();
      expect(user).not.toBeNull();
      expect(user?.id).toBe('guest');
    });
  });
});
