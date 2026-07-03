import React, { useState, useEffect, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/tauri';
import './CodeIntelligenceDashboard.css';

interface InitResult {
  success: boolean;
  files_indexed: number;
  symbols_found: number;
  agents_detected: number;
  workspace_type: string | null;
  packages_found: number;
}

interface SymbolResult {
  name: string;
  kind: string;
  file: string;
}

interface RecentCommand {
  id: string;
  action: string;
  text: string;
  success: boolean;
  timestamp: number;
}

interface CodeIntelligenceDashboardProps {
  onClose?: () => void;
  visible?: boolean;
}

export const CodeIntelligenceDashboard: React.FC<CodeIntelligenceDashboardProps> = ({
  onClose,
  visible = true,
}) => {
  const [indexStatus, setIndexStatus] = useState<InitResult | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SymbolResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [recentCommands, setRecentCommands] = useState<RecentCommand[]>([]);
  const [error, setError] = useState<string | null>(null);

  const initializeProject = useCallback(async () => {
    setIsInitializing(true);
    setError(null);
    try {
      const cwd = await invoke<string>('get_current_directory').catch(() => '.');
      const result = await invoke<InitResult>('init_code_intelligence', {
        projectPath: cwd,
      });
      setIndexStatus(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsInitializing(false);
    }
  }, []);

  // Try to load status on mount
  useEffect(() => {
    if (visible) {
      // Check if already initialized by trying a lightweight command
      invoke<string[]>('search_codebase', { query: '', limit: 0 })
        .then(() => {
          // Already initialized — refresh workspace info
          invoke<InitResult>('get_workspace_info')
            .then((info) => {
              setIndexStatus({
                success: true,
                files_indexed: 0,
                symbols_found: 0,
                agents_detected: 0,
                workspace_type: info.workspace_type,
                packages_found: info.packages_found,
              } as unknown as InitResult);
            })
            .catch(() => { /* not initialized yet */ });
        })
        .catch(() => { /* not initialized yet */ });
    }
  }, [visible]);

  const searchSymbols = useCallback(async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    setError(null);
    try {
      const results = await invoke<string[]>('search_codebase', {
        query: searchQuery,
        limit: 20,
      });
      setSearchResults(
        results.map((name) => ({
          name,
          kind: 'sym',
          file: '',
        }))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsSearching(false);
    }
  }, [searchQuery]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    searchSymbols();
  };

  // Track recent voice coding commands via custom event
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as RecentCommand;
      if (detail) {
        setRecentCommands((prev) => [detail, ...prev].slice(0, 20));
      }
    };
    window.addEventListener('voicecode-command', handler);
    return () => window.removeEventListener('voicecode-command', handler);
  }, []);

  if (!visible) return null;

  const actionClass = (action: string): string => {
    const lower = action.toLowerCase();
    if (lower.includes('generat')) return 'generate';
    if (lower.includes('explain')) return 'explain';
    if (lower.includes('refactor')) return 'refactor';
    if (lower.includes('debug') || lower.includes('fix')) return 'debug';
    if (lower.includes('test')) return 'test';
    if (lower.includes('navigat') || lower.includes('go')) return 'navigate';
    if (lower.includes('edit') || lower.includes('rename')) return 'edit';
    if (lower.includes('document')) return 'document';
    return '';
  };

  return (
    <div className="code-intelligence-dashboard">
      <div className="cid-header">
        <div className="cid-title">
          <span className="cid-icon">&#128300;</span>
          <h3>Code Intelligence</h3>
        </div>
        <div className="cid-status-badges">
          {indexStatus?.success && (
            <span className="cid-badge cid-badge-ok">Indexed</span>
          )}
          {!indexStatus && (
            <span className="cid-badge cid-badge-warn">Not initialized</span>
          )}
        </div>
        {onClose && (
          <button className="cid-close" onClick={onClose} title="Close">
            x
          </button>
        )}
      </div>

      {error && <div className="cid-error">{error}</div>}

      {/* Project Index Status */}
      <div className="cid-section">
        <div className="cid-section-header">
          <h4>Project Index</h4>
          <button
            className="cid-refresh"
            onClick={initializeProject}
            disabled={isInitializing}
          >
            {isInitializing ? '...' : indexStatus ? 'Re-index' : 'Initialize'}
          </button>
        </div>

        {indexStatus ? (
          <div className="cid-stats-grid">
            <div className="cid-stat">
              <span className="cid-stat-value">{indexStatus.files_indexed}</span>
              <span className="cid-stat-label">Files Indexed</span>
            </div>
            <div className="cid-stat">
              <span className="cid-stat-value">{indexStatus.symbols_found}</span>
              <span className="cid-stat-label">Symbols Found</span>
            </div>
            <div className="cid-stat">
              <span className="cid-stat-value">{indexStatus.agents_detected}</span>
              <span className="cid-stat-label">Agents Detected</span>
            </div>
            <div className="cid-stat">
              <span className="cid-stat-value">{indexStatus.packages_found}</span>
              <span className="cid-stat-label">Packages</span>
            </div>
          </div>
        ) : (
          <button
            className="cid-init-btn primary"
            onClick={initializeProject}
            disabled={isInitializing}
          >
            {isInitializing ? 'Indexing project...' : 'Initialize Code Intelligence'}
          </button>
        )}
      </div>

      {/* Symbol Search */}
      <div className="cid-section">
        <h4>Symbol Search</h4>
        <form className="cid-search-form" onSubmit={handleSearchSubmit}>
          <input
            className="cid-search-input"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search symbols..."
            disabled={!indexStatus}
          />
          <button
            className="cid-search-btn"
            type="submit"
            disabled={!indexStatus || isSearching || !searchQuery.trim()}
          >
            {isSearching ? '...' : 'Search'}
          </button>
        </form>

        {searchResults.length > 0 && (
          <div className="cid-search-results">
            {searchResults.map((sym, i) => (
              <div key={`${sym.name}-${i}`} className="cid-symbol-item">
                <span className="cid-symbol-kind">{sym.kind}</span>
                <span className="cid-symbol-name">{sym.name}</span>
                {sym.file && <span className="cid-symbol-file">{sym.file}</span>}
              </div>
            ))}
          </div>
        )}

        {searchQuery && searchResults.length === 0 && !isSearching && (
          <div className="cid-no-results">No symbols found</div>
        )}
      </div>

      {/* Recent Commands */}
      <div className="cid-section">
        <div className="cid-section-header">
          <h4>Recent Commands</h4>
          <span className="cid-badge">{recentCommands.length}</span>
        </div>
        <div className="cid-command-list">
          {recentCommands.length === 0 && (
            <div className="cid-empty">
              No commands yet. Use the Coding Assistant to issue voice commands.
            </div>
          )}
          {recentCommands.map((cmd) => (
            <div key={cmd.id} className="cid-command-item">
              <div className="cid-command-top">
                <span className={`cid-command-action ${actionClass(cmd.action)}`}>
                  {cmd.action}
                </span>
                <span className="cid-command-text">{cmd.text}</span>
              </div>
              <div className="cid-command-meta">
                <span className={cmd.success ? 'cid-command-success' : 'cid-command-failed'}>
                  {cmd.success ? 'OK' : 'Failed'}
                </span>
                <span>{new Date(cmd.timestamp).toLocaleTimeString()}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
