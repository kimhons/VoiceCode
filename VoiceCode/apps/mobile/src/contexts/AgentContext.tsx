/**
 * AgentContext - Global agent provider for mobile app
 * Provides agent functionality and FAB access throughout the app
 */

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  ReactNode,
} from 'react';
import * as Haptics from 'expo-haptics';

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
  toolCalls: any[];
  suggestions: string[];
  metadata: Record<string, any>;
}

interface AgentContextValue {
  // State
  isConnected: boolean;
  isLoading: boolean;
  isFABOpen: boolean;
  sessionId: string | null;
  professionalMode: 'general' | 'medical' | 'legal' | 'business';
  currentContext: AgentScreenContext;
  recentActions: Array<{ query: string; timestamp: Date }>;
  
  // Actions
  openFAB: () => void;
  closeFAB: () => void;
  toggleFAB: () => void;
  sendMessage: (message: string) => Promise<ChatResponse>;
  executeCommand: (command: string, params?: Record<string, any>) => Promise<any>;
  setContext: (context: Partial<AgentScreenContext>) => void;
  setProfessionalMode: (mode: 'general' | 'medical' | 'legal' | 'business') => void;
  navigateToChat: (prefillMessage?: string) => void;
}

interface AgentScreenContext {
  currentScreen?: string;
  transcriptId?: string;
  transcriptTitle?: string;
  recordingActive?: boolean;
}

interface AgentProviderProps {
  children: ReactNode;
  config?: Partial<AgentConfig>;
  navigation?: any;
}

const defaultConfig: AgentConfig = {
  baseUrl: process.env.EXPO_PUBLIC_AGENT_API_URL || 'http://localhost:8000',
  wsUrl: process.env.EXPO_PUBLIC_AGENT_WS_URL || 'ws://localhost:8000',
  apiVersion: 'v1',
};

// Create context
const AgentContext = createContext<AgentContextValue | null>(null);

// Provider component
export const AgentProvider: React.FC<AgentProviderProps> = ({
  children,
  config: userConfig,
  navigation,
}) => {
  const config = { ...defaultConfig, ...userConfig };
  
  // State
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isFABOpen, setIsFABOpen] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [professionalMode, setProfessionalMode] = useState<'general' | 'medical' | 'legal' | 'business'>('general');
  const [currentContext, setCurrentContext] = useState<AgentScreenContext>({});
  const [recentActions, setRecentActions] = useState<Array<{ query: string; timestamp: Date }>>([]);

  // Generate session ID
  useEffect(() => {
    if (!sessionId) {
      setSessionId(`session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
    }
  }, [sessionId]);

  // API request helper
  const apiRequest = useCallback(async <T,>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> => {
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
  }, [config.baseUrl, config.apiVersion]);

  // Send message to agent
  const sendMessage = useCallback(async (message: string): Promise<ChatResponse> => {
    setIsLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
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
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      // Track recent action
      setRecentActions(prev => [
        { query: message, timestamp: new Date() },
        ...prev.slice(0, 9),
      ]);

      return response;
    } catch (error) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [apiRequest, sessionId, currentContext, professionalMode]);

  // Execute a specific command
  const executeCommand = useCallback(async (
    command: string,
    params: Record<string, any> = {}
  ): Promise<any> => {
    setIsLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    try {
      const response = await apiRequest<any>('/agent/command', {
        method: 'POST',
        body: JSON.stringify({
          command,
          parameters: { ...params, ...currentContext },
          session_id: sessionId,
        }),
      });

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      // Track recent action
      setRecentActions(prev => [
        { query: `Command: ${command}`, timestamp: new Date() },
        ...prev.slice(0, 9),
      ]);

      return response;
    } catch (error) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [apiRequest, sessionId, currentContext]);

  // Context setters
  const setContext = useCallback((context: Partial<AgentScreenContext>) => {
    setCurrentContext(prev => ({ ...prev, ...context }));
  }, []);

  // FAB controls
  const openFAB = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsFABOpen(true);
  }, []);
  
  const closeFAB = useCallback(() => {
    setIsFABOpen(false);
  }, []);
  
  const toggleFAB = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsFABOpen(prev => !prev);
  }, []);

  // Navigate to chat
  const navigateToChat = useCallback((prefillMessage?: string) => {
    closeFAB();
    if (navigation) {
      navigation.navigate('Chat', { prefillMessage });
    }
  }, [closeFAB, navigation]);

  const value: AgentContextValue = {
    isConnected,
    isLoading,
    isFABOpen,
    sessionId,
    professionalMode,
    currentContext,
    recentActions,
    openFAB,
    closeFAB,
    toggleFAB,
    sendMessage,
    executeCommand,
    setContext,
    setProfessionalMode,
    navigateToChat,
  };

  return (
    <AgentContext.Provider value={value}>
      {children}
    </AgentContext.Provider>
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

// Hook to set screen context (use in screen components)
export const useAgentScreenContext = (context: AgentScreenContext) => {
  const { setContext } = useAgentContext();
  
  useEffect(() => {
    setContext(context);
    return () => setContext({});
  }, [context.currentScreen, context.transcriptId, context.transcriptTitle, context.recordingActive, setContext]);
};

export default AgentProvider;
