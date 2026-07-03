/**
 * AgentContext - Global agent provider for web app
 * Provides agent functionality and command palette access throughout the app
 */

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
  ReactNode,
} from 'react';

// Types
interface AgentConfig {
  baseUrl: string;
  wsUrl: string;
  apiVersion: string;
}

interface ChatResponse {
  sessionId: string;
  message: string;
  intent: string;
  toolCalls: Array<{ name: string; args: Record<string, unknown>; result?: unknown }>;
  suggestions: string[];
  metadata: Record<string, unknown>;
}

interface AgentContextValue {
  // State
  isConnected: boolean;
  isLoading: boolean;
  isCommandPaletteOpen: boolean;
  sessionId: string | null;
  professionalMode: 'general' | 'medical' | 'legal' | 'business';
  currentContext: AgentPageContext;
  recentActions: Array<{ query: string; timestamp: Date }>;

  // Actions
  openCommandPalette: () => void;
  closeCommandPalette: () => void;
  toggleCommandPalette: () => void;
  sendMessage: (message: string) => Promise<ChatResponse>;
  executeCommand: (
    command: string,
    params?: Record<string, any>
  ) => Promise<any>;
  setContext: (context: Partial<AgentPageContext>) => void;
  setProfessionalMode: (
    mode: 'general' | 'medical' | 'legal' | 'business'
  ) => void;
  navigateToChat: (prefillMessage?: string) => void;
}

interface AgentPageContext {
  currentPage?: string;
  transcriptId?: string;
  transcriptTitle?: string;
  recordingActive?: boolean;
}

interface AgentProviderProps {
  children: ReactNode;
  config?: Partial<AgentConfig>;
  onNavigateToChat?: (prefillMessage?: string) => void;
}

const defaultConfig: AgentConfig = {
  baseUrl: import.meta.env.VITE_AGENT_API_URL || 'http://localhost:8000',
  wsUrl: import.meta.env.VITE_AGENT_WS_URL || 'ws://localhost:8000',
  apiVersion: 'v1',
};

// Create context
const AgentContext = createContext<AgentContextValue | null>(null);

// Provider component
export const AgentProvider: React.FC<AgentProviderProps> = ({
  children,
  config: userConfig,
  onNavigateToChat,
}) => {
  const config = { ...defaultConfig, ...userConfig };

  // State
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [professionalMode, setProfessionalMode] = useState<
    'general' | 'medical' | 'legal' | 'business'
  >('general');
  const [currentContext, setCurrentContext] = useState<AgentPageContext>({});
  const [recentActions, setRecentActions] = useState<
    Array<{ query: string; timestamp: Date }>
  >([]);

  const wsRef = useRef<WebSocket | null>(null);

  // Generate session ID
  useEffect(() => {
    if (!sessionId) {
      setSessionId(
        `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      );
    }
  }, [sessionId]);

  // Keyboard shortcut for command palette (⌘K / Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      }
      if (e.key === 'Escape' && isCommandPaletteOpen) {
        setIsCommandPaletteOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCommandPaletteOpen]);

  // API request helper
  const apiRequest = useCallback(
    async function <T>(
      endpoint: string,
      options: RequestInit = {}
    ): Promise<T> {
      const url = `${config.baseUrl}/api/${config.apiVersion}${endpoint}`;

      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.detail || `HTTP ${response.status}`);
      }

      return response.json();
    },
    [config.baseUrl, config.apiVersion]
  );

  // Send message to agent
  const sendMessage = useCallback(
    async (message: string): Promise<ChatResponse> => {
      setIsLoading(true);

      try {
        const response = await apiRequest<ChatResponse>('/agent/chat', {
          method: 'POST',
          body: JSON.stringify({
            message,
            session_id: sessionId,
            context: currentContext,
            professional_mode: professionalMode,
          }),
        });

        setSessionId(response.sessionId);

        // Track recent action
        setRecentActions((prev) => [
          { query: message, timestamp: new Date() },
          ...prev.slice(0, 9),
        ]);

        return response;
      } finally {
        setIsLoading(false);
      }
    },
    [apiRequest, sessionId, currentContext, professionalMode]
  );

  // Execute a specific command
  const executeCommand = useCallback(
    async (command: string, params: Record<string, any> = {}): Promise<any> => {
      setIsLoading(true);

      try {
        const response = await apiRequest<any>('/agent/command', {
          method: 'POST',
          body: JSON.stringify({
            command,
            parameters: { ...params, ...currentContext },
            session_id: sessionId,
          }),
        });

        // Track recent action
        setRecentActions((prev) => [
          { query: `Command: ${command}`, timestamp: new Date() },
          ...prev.slice(0, 9),
        ]);

        return response;
      } finally {
        setIsLoading(false);
      }
    },
    [apiRequest, sessionId, currentContext]
  );

  // Context setters
  const setContext = useCallback((context: Partial<AgentPageContext>) => {
    setCurrentContext((prev) => ({ ...prev, ...context }));
  }, []);

  // Command palette controls
  const openCommandPalette = useCallback(
    () => setIsCommandPaletteOpen(true),
    []
  );
  const closeCommandPalette = useCallback(
    () => setIsCommandPaletteOpen(false),
    []
  );
  const toggleCommandPalette = useCallback(
    () => setIsCommandPaletteOpen((prev) => !prev),
    []
  );

  // Navigate to chat
  const navigateToChat = useCallback(
    (prefillMessage?: string) => {
      closeCommandPalette();
      if (onNavigateToChat) {
        onNavigateToChat(prefillMessage);
      }
    },
    [closeCommandPalette, onNavigateToChat]
  );

  const value: AgentContextValue = {
    isConnected,
    isLoading,
    isCommandPaletteOpen,
    sessionId,
    professionalMode,
    currentContext,
    recentActions,
    openCommandPalette,
    closeCommandPalette,
    toggleCommandPalette,
    sendMessage,
    executeCommand,
    setContext,
    setProfessionalMode,
    navigateToChat,
  };

  return (
    <AgentContext.Provider value={value}>{children}</AgentContext.Provider>
  );
};

// Hook to use agent context
export const useAgentContext = (): AgentContextValue => {
  const context = useContext(AgentContext);
  if (!context) {
    throw new Error('useAgentContext must be used within an AgentProvider');
  }
  return context;
};

// Hook to set page context (use in page components)
export const useAgentPageContext = (context: AgentPageContext) => {
  const { setContext } = useAgentContext();

  useEffect(() => {
    setContext(context);
    return () => setContext({});
  }, [
    context.currentPage,
    context.transcriptId,
    context.transcriptTitle,
    context.recordingActive,
    setContext,
  ]);
};

export default AgentProvider;
