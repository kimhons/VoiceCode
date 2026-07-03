"use strict";
/**
 * AuthenticationService Tests
 * Tests for user authentication and tier management
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
const vitest_1 = require("vitest");
const vscode = __importStar(require("vscode"));
const AuthenticationService_1 = require("./AuthenticationService");
const ServiceLoader_1 = require("../utils/ServiceLoader");
// Store original env
const originalEnv = process.env;
// Mock vscode module
vitest_1.vi.mock('vscode', () => {
    class MockEventEmitter {
        listeners = [];
        event = (listener) => {
            this.listeners.push(listener);
            return { dispose: () => {
                    const index = this.listeners.indexOf(listener);
                    if (index > -1)
                        this.listeners.splice(index, 1);
                } };
        };
        fire(data) { this.listeners.forEach(l => l(data)); }
        dispose() { this.listeners = []; }
    }
    return {
        window: {
            showInformationMessage: vitest_1.vi.fn(),
            showWarningMessage: vitest_1.vi.fn(),
            showErrorMessage: vitest_1.vi.fn(),
        },
        EventEmitter: MockEventEmitter,
    };
});
// Mock Supabase
vitest_1.vi.mock('@supabase/supabase-js', () => ({
    createClient: vitest_1.vi.fn(() => ({
        auth: {
            signIn: vitest_1.vi.fn(),
            signOut: vitest_1.vi.fn(),
            getUser: vitest_1.vi.fn(),
        },
    })),
}));
// Mock ServiceLoader
vitest_1.vi.mock('../utils/ServiceLoader', () => ({
    ServiceTier: {
        FREE: 'FREE',
        PRO: 'PRO',
        ENTERPRISE: 'ENTERPRISE',
    },
}));
(0, vitest_1.describe)('AuthenticationService', () => {
    let service;
    let mockContext;
    let globalStateStore;
    (0, vitest_1.beforeEach)(() => {
        vitest_1.vi.clearAllMocks();
        // Reset environment
        process.env = { ...originalEnv };
        // Mock global state
        globalStateStore = {};
        mockContext = {
            globalState: {
                get: vitest_1.vi.fn((key) => globalStateStore[key]),
                update: vitest_1.vi.fn((key, value) => {
                    globalStateStore[key] = value;
                    return Promise.resolve();
                }),
                keys: vitest_1.vi.fn(() => Object.keys(globalStateStore)),
                setKeysForSync: vitest_1.vi.fn(),
            },
            subscriptions: [],
        };
    });
    (0, vitest_1.afterEach)(() => {
        process.env = originalEnv;
    });
    // ============================================================
    // ENVIRONMENT VARIABLE VALIDATION TESTS
    // ============================================================
    (0, vitest_1.describe)('Environment Variable Validation', () => {
        (0, vitest_1.it)('should detect missing VITE_SUPABASE_URL', () => {
            delete process.env.VITE_SUPABASE_URL;
            delete process.env.VITE_SUPABASE_ANON_KEY;
            service = new AuthenticationService_1.AuthenticationService();
            (0, vitest_1.expect)(service.isSupabaseConfigured()).toBe(false);
            (0, vitest_1.expect)(service.getInitializationWarning()).toContain('VITE_SUPABASE_URL');
        });
        (0, vitest_1.it)('should detect missing VITE_SUPABASE_ANON_KEY', () => {
            process.env.VITE_SUPABASE_URL = 'https://test.supabase.co';
            delete process.env.VITE_SUPABASE_ANON_KEY;
            service = new AuthenticationService_1.AuthenticationService();
            (0, vitest_1.expect)(service.isSupabaseConfigured()).toBe(false);
            (0, vitest_1.expect)(service.getInitializationWarning()).toContain('VITE_SUPABASE_ANON_KEY');
        });
        (0, vitest_1.it)('should initialize Supabase when both env vars present', () => {
            process.env.VITE_SUPABASE_URL = 'https://test.supabase.co';
            process.env.VITE_SUPABASE_ANON_KEY = 'test-anon-key';
            service = new AuthenticationService_1.AuthenticationService();
            (0, vitest_1.expect)(service.isSupabaseConfigured()).toBe(true);
            (0, vitest_1.expect)(service.getInitializationWarning()).toBeUndefined();
        });
        (0, vitest_1.it)('should show warning message when initialized with missing env vars', () => {
            delete process.env.VITE_SUPABASE_URL;
            delete process.env.VITE_SUPABASE_ANON_KEY;
            service = new AuthenticationService_1.AuthenticationService();
            service.initialize(mockContext);
            (0, vitest_1.expect)(vscode.window.showWarningMessage).toHaveBeenCalledWith(vitest_1.expect.stringContaining('VoiceFlow Pro'));
        });
    });
    // ============================================================
    // SIGN IN/OUT TESTS
    // ============================================================
    (0, vitest_1.describe)('Sign In/Out', () => {
        (0, vitest_1.beforeEach)(() => {
            delete process.env.VITE_SUPABASE_URL;
            delete process.env.VITE_SUPABASE_ANON_KEY;
            service = new AuthenticationService_1.AuthenticationService();
            service.initialize(mockContext);
        });
        (0, vitest_1.it)('should sign in as guest user', async () => {
            const user = await service.signIn();
            (0, vitest_1.expect)(user).not.toBeNull();
            (0, vitest_1.expect)(user?.id).toBe('guest');
            (0, vitest_1.expect)(user?.email).toBe('guest@voiceflow.pro');
            (0, vitest_1.expect)(user?.tier).toBe(ServiceLoader_1.ServiceTier.FREE);
            (0, vitest_1.expect)(vscode.window.showInformationMessage).toHaveBeenCalledWith(vitest_1.expect.stringContaining('Welcome to VoiceFlow Pro'));
        });
        (0, vitest_1.it)('should store user in global state on sign in', async () => {
            await service.signIn();
            (0, vitest_1.expect)(mockContext.globalState.update).toHaveBeenCalledWith('voiceflow.user', vitest_1.expect.objectContaining({ id: 'guest' }));
        });
        (0, vitest_1.it)('should sign out and clear user', async () => {
            await service.signIn();
            await service.signOut();
            (0, vitest_1.expect)(mockContext.globalState.update).toHaveBeenCalledWith('voiceflow.user', undefined);
            (0, vitest_1.expect)(vscode.window.showInformationMessage).toHaveBeenCalledWith('Signed out of VoiceFlow Pro');
        });
    });
    // ============================================================
    // CURRENT USER TESTS
    // ============================================================
    (0, vitest_1.describe)('Get Current User', () => {
        (0, vitest_1.beforeEach)(() => {
            delete process.env.VITE_SUPABASE_URL;
            delete process.env.VITE_SUPABASE_ANON_KEY;
            service = new AuthenticationService_1.AuthenticationService();
            service.initialize(mockContext);
        });
        (0, vitest_1.it)('should return current user after sign in', async () => {
            await service.signIn();
            const user = await service.getCurrentUser();
            (0, vitest_1.expect)(user).not.toBeNull();
            (0, vitest_1.expect)(user?.id).toBe('guest');
        });
        (0, vitest_1.it)('should restore user from global state', async () => {
            const storedUser = {
                id: 'stored-user',
                email: 'stored@test.com',
                tier: ServiceLoader_1.ServiceTier.PRO,
            };
            globalStateStore['voiceflow.user'] = storedUser;
            const user = await service.getCurrentUser();
            (0, vitest_1.expect)(user?.id).toBe('stored-user');
            (0, vitest_1.expect)(user?.tier).toBe(ServiceLoader_1.ServiceTier.PRO);
        });
        (0, vitest_1.it)('should auto sign-in as guest when no stored user', async () => {
            const user = await service.getCurrentUser();
            (0, vitest_1.expect)(user).not.toBeNull();
            (0, vitest_1.expect)(user?.id).toBe('guest');
        });
    });
    // ============================================================
    // TIER MANAGEMENT TESTS
    // ============================================================
    (0, vitest_1.describe)('Tier Management', () => {
        (0, vitest_1.beforeEach)(() => {
            delete process.env.VITE_SUPABASE_URL;
            delete process.env.VITE_SUPABASE_ANON_KEY;
            service = new AuthenticationService_1.AuthenticationService();
            service.initialize(mockContext);
        });
        (0, vitest_1.it)('should return FREE tier for guest user', async () => {
            await service.signIn();
            const tier = await service.getUserTier();
            (0, vitest_1.expect)(tier).toBe(ServiceLoader_1.ServiceTier.FREE);
        });
        (0, vitest_1.it)('should check premium tier correctly for FREE user', async () => {
            await service.signIn();
            const hasPremium = await service.hasPremiumTier();
            (0, vitest_1.expect)(hasPremium).toBe(false);
        });
        (0, vitest_1.it)('should check premium tier correctly for PRO user', async () => {
            globalStateStore['voiceflow.user'] = {
                id: 'pro-user',
                email: 'pro@test.com',
                tier: ServiceLoader_1.ServiceTier.PRO,
            };
            const hasPremium = await service.hasPremiumTier();
            (0, vitest_1.expect)(hasPremium).toBe(true);
        });
        (0, vitest_1.it)('should check enterprise tier correctly', async () => {
            globalStateStore['voiceflow.user'] = {
                id: 'enterprise-user',
                email: 'enterprise@test.com',
                tier: ServiceLoader_1.ServiceTier.ENTERPRISE,
            };
            const hasEnterprise = await service.hasEnterpriseTier();
            (0, vitest_1.expect)(hasEnterprise).toBe(true);
        });
        (0, vitest_1.it)('should upgrade tier successfully', async () => {
            await service.signIn();
            await service.upgradeTier(ServiceLoader_1.ServiceTier.PRO);
            const tier = await service.getUserTier();
            (0, vitest_1.expect)(tier).toBe(ServiceLoader_1.ServiceTier.PRO);
            (0, vitest_1.expect)(vscode.window.showInformationMessage).toHaveBeenCalledWith(vitest_1.expect.stringContaining('Upgraded to PRO tier'));
        });
        (0, vitest_1.it)('should throw error when upgrading without signed in user', async () => {
            await (0, vitest_1.expect)(service.upgradeTier(ServiceLoader_1.ServiceTier.PRO)).rejects.toThrow('No user signed in');
        });
        (0, vitest_1.it)('should persist upgraded tier to global state', async () => {
            await service.signIn();
            await service.upgradeTier(ServiceLoader_1.ServiceTier.ENTERPRISE);
            (0, vitest_1.expect)(mockContext.globalState.update).toHaveBeenCalledWith('voiceflow.user', vitest_1.expect.objectContaining({ tier: ServiceLoader_1.ServiceTier.ENTERPRISE }));
        });
    });
    // ============================================================
    // INITIALIZATION TESTS
    // ============================================================
    (0, vitest_1.describe)('Initialization', () => {
        (0, vitest_1.it)('should not show warning when Supabase is configured', () => {
            process.env.VITE_SUPABASE_URL = 'https://test.supabase.co';
            process.env.VITE_SUPABASE_ANON_KEY = 'test-anon-key';
            service = new AuthenticationService_1.AuthenticationService();
            service.initialize(mockContext);
            (0, vitest_1.expect)(vscode.window.showWarningMessage).not.toHaveBeenCalled();
        });
        (0, vitest_1.it)('should work without context for basic operations', async () => {
            delete process.env.VITE_SUPABASE_URL;
            delete process.env.VITE_SUPABASE_ANON_KEY;
            service = new AuthenticationService_1.AuthenticationService();
            // Don't call initialize()
            const user = await service.signIn();
            (0, vitest_1.expect)(user).not.toBeNull();
            (0, vitest_1.expect)(user?.id).toBe('guest');
        });
    });
});
//# sourceMappingURL=AuthenticationService.test.js.map