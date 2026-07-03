import React, { useState, useEffect, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/tauri';
import './AgentControlPanel.css';

interface DetectedAgent {
  name: string;
  agent_type: string;
  command: string;
  installed: boolean;
}

interface AgentTaskResult {
  success: boolean;
  output: string;
  agent_used: string;
  strategy: string;
  duration_ms: number;
  error: string | null;
}

interface LLMStatus {
  initialized: boolean;
  providers: string[];
  default_model: string | null;
  default_provider: string | null;
}

interface AgentControlPanelProps {
  onClose?: () => void;
  visible?: boolean;
}

type Strategy = 'single' | 'race' | 'consensus' | 'pipeline' | 'decomposition';

export const AgentControlPanel: React.FC<AgentControlPanelProps> = ({
  onClose,
  visible = true,
}) => {
  const [agents, setAgents] = useState<DetectedAgent[]>([]);
  const [llmStatus, setLlmStatus] = useState<LLMStatus | null>(null);
  const [isDetecting, setIsDetecting] = useState(false);
  const [taskInput, setTaskInput] = useState('');
  const [strategy, setStrategy] = useState<Strategy>('single');
  const [isExecuting, setIsExecuting] = useState(false);
  const [result, setResult] = useState<AgentTaskResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<AgentTaskResult[]>([]);

  const detectAgents = useCallback(async () => {
    setIsDetecting(true);
    setError(null);
    try {
      const detected = await invoke<DetectedAgent[]>('detect_external_agents');
      setAgents(detected);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsDetecting(false);
    }
  }, []);

  const checkLLMStatus = useCallback(async () => {
    try {
      const status = await invoke<LLMStatus>('check_llm_status');
      setLlmStatus(status);
    } catch {
      // LLM status check is non-critical
    }
  }, []);

  useEffect(() => {
    if (visible) {
      detectAgents();
      checkLLMStatus();
    }
  }, [visible, detectAgents, checkLLMStatus]);

  const executeTask = useCallback(async () => {
    if (!taskInput.trim()) return;

    setIsExecuting(true);
    setError(null);
    setResult(null);

    try {
      const taskResult = await invoke<AgentTaskResult>('execute_with_strategy', {
        task: taskInput,
        strategy,
      });

      setResult(taskResult);
      setHistory((prev) => [taskResult, ...prev].slice(0, 10));

      if (!taskResult.success && taskResult.error) {
        setError(taskResult.error);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
    } finally {
      setIsExecuting(false);
    }
  }, [taskInput, strategy]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    executeTask();
  };

  const handleEmergencyStop = () => {
    setIsExecuting(false);
    setError('Task cancelled by user');
  };

  if (!visible) return null;

  const installedAgents = agents.filter((a) => a.installed);

  return (
    <div className="agent-control-panel">
      <div className="acp-header">
        <div className="acp-title">
          <span className="acp-icon">&#9881;</span>
          <h3>Agent Control</h3>
        </div>
        <div className="acp-status-badges">
          {llmStatus?.initialized && (
            <span className="acp-badge acp-badge-ok">LLM Ready</span>
          )}
          <span className="acp-badge">
            {installedAgents.length} agent{installedAgents.length !== 1 ? 's' : ''}
          </span>
        </div>
        {onClose && (
          <button className="acp-close" onClick={onClose} title="Close">
            x
          </button>
        )}
      </div>

      {/* Agent List */}
      <div className="acp-section">
        <div className="acp-section-header">
          <h4>Detected Agents</h4>
          <button
            className="acp-refresh"
            onClick={detectAgents}
            disabled={isDetecting}
            title="Refresh"
          >
            {isDetecting ? '...' : 'Scan'}
          </button>
        </div>
        <div className="acp-agent-list">
          {agents.length === 0 && !isDetecting && (
            <div className="acp-empty">No agents detected. Click Scan to search.</div>
          )}
          {agents.map((agent) => (
            <div
              key={agent.name}
              className={`acp-agent-item ${agent.installed ? 'installed' : 'missing'}`}
            >
              <span className={`acp-agent-dot ${agent.installed ? 'online' : 'offline'}`} />
              <span className="acp-agent-name">{agent.name}</span>
              <span className="acp-agent-type">{agent.agent_type}</span>
              {!agent.installed && (
                <span className="acp-agent-missing">not found</span>
              )}
            </div>
          ))}
        </div>

        {/* LLM Provider Status */}
        {llmStatus && (
          <div className="acp-llm-status">
            <span className="acp-llm-label">LLM:</span>
            {llmStatus.initialized ? (
              <>
                <span className="acp-badge acp-badge-provider">
                  {llmStatus.default_provider || 'Unknown'}
                </span>
                <span className="acp-llm-model">
                  {llmStatus.default_model || 'default'}
                </span>
              </>
            ) : (
              <span className="acp-badge acp-badge-warn">Not initialized</span>
            )}
          </div>
        )}
      </div>

      {/* Strategy Selection */}
      <div className="acp-section">
        <h4>Strategy</h4>
        <div className="acp-strategy-grid">
          {([
            { value: 'single', label: 'Single', desc: 'One agent' },
            { value: 'race', label: 'Race', desc: 'Fastest wins' },
            { value: 'consensus', label: 'Consensus', desc: 'Vote on best' },
            { value: 'pipeline', label: 'Pipeline', desc: 'Chain agents' },
            { value: 'decomposition', label: 'Decompose', desc: 'Split task' },
          ] as const).map((s) => (
            <button
              key={s.value}
              className={`acp-strategy-btn ${strategy === s.value ? 'active' : ''}`}
              onClick={() => setStrategy(s.value)}
              title={s.desc}
            >
              <span className="acp-strategy-label">{s.label}</span>
              <span className="acp-strategy-desc">{s.desc}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Task Input */}
      <form className="acp-task-form" onSubmit={handleSubmit}>
        <textarea
          className="acp-task-input"
          value={taskInput}
          onChange={(e) => setTaskInput(e.target.value)}
          placeholder="Describe the task for the agent(s)..."
          disabled={isExecuting}
          rows={3}
        />
        <div className="acp-task-actions">
          <button
            type="submit"
            className="acp-submit"
            disabled={isExecuting || !taskInput.trim() || installedAgents.length === 0}
          >
            {isExecuting ? 'Running...' : 'Execute'}
          </button>
          {isExecuting && (
            <button
              type="button"
              className="acp-stop"
              onClick={handleEmergencyStop}
            >
              Stop
            </button>
          )}
        </div>
      </form>

      {/* Error */}
      {error && (
        <div className="acp-error">
          <span className="acp-error-icon">!</span>
          {error}
        </div>
      )}

      {/* Result */}
      {result && (
        <div className="acp-result">
          <div className="acp-result-header">
            <span className={`acp-status ${result.success ? 'success' : 'fail'}`}>
              {result.success ? 'OK' : 'FAIL'}
            </span>
            <span className="acp-result-agent">{result.agent_used}</span>
            <span className="acp-result-time">{result.duration_ms}ms</span>
          </div>
          <pre className="acp-result-output">{result.output}</pre>
        </div>
      )}

      {/* History */}
      {history.length > 1 && (
        <div className="acp-section">
          <h4>Recent Tasks</h4>
          <div className="acp-history">
            {history.slice(1, 5).map((h, i) => (
              <div key={i} className="acp-history-item">
                <span className={`acp-status-dot ${h.success ? 'success' : 'fail'}`} />
                <span className="acp-history-agent">{h.agent_used}</span>
                <span className="acp-history-strategy">{h.strategy}</span>
                <span className="acp-history-time">{h.duration_ms}ms</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
