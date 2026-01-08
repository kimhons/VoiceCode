/**
 * Custom Dictionary UI Component
 * Phase 1.6: AquaVoice Parity - Custom Dictionary
 *
 * Allows users to add, edit, and manage custom vocabulary terms
 * for improved voice recognition accuracy with developer-specific terminology.
 */

import React, { useState, useEffect, useCallback } from 'react';

// Types matching the Rust backend
interface VocabularyTerm {
  canonical: string;
  aliases: string[];
  category: string;
  weight: number;
  is_custom: boolean;
  corrections: string[];
}

interface VocabularyStats {
  total_terms: number;
  custom_terms: number;
  total_aliases: number;
  total_corrections: number;
  categories: Record<string, number>;
}

type VocabularyCategory =
  | 'languages'
  | 'frameworks'
  | 'cli_tools'
  | 'ai_models'
  | 'cloud_services'
  | 'databases'
  | 'devops'
  | 'syntax'
  | 'custom';

const CATEGORY_LABELS: Record<VocabularyCategory, string> = {
  languages: 'Programming Languages',
  frameworks: 'Frameworks & Libraries',
  cli_tools: 'CLI Tools',
  ai_models: 'AI/ML Models',
  cloud_services: 'Cloud Services',
  databases: 'Databases',
  devops: 'DevOps & Infrastructure',
  syntax: 'Code Syntax',
  custom: 'Custom Terms',
};

const CATEGORY_ICONS: Record<VocabularyCategory, string> = {
  languages: '💻',
  frameworks: '🛠️',
  cli_tools: '⌨️',
  ai_models: '🤖',
  cloud_services: '☁️',
  databases: '🗄️',
  devops: '🚀',
  syntax: '📝',
  custom: '✨',
};

interface CustomDictionaryProps {
  className?: string;
  onTermAdded?: (term: VocabularyTerm) => void;
  onTermRemoved?: (canonical: string) => void;
}

// Mock API for web - in desktop this would use Tauri invoke
const dictionaryApi = {
  getCustomTerms: async (): Promise<VocabularyTerm[]> => {
    const stored = localStorage.getItem('voicecode_custom_dictionary');
    return stored ? JSON.parse(stored) : [];
  },

  addCustomTerm: async (term: string, aliases: string[], category: string): Promise<void> => {
    const terms = await dictionaryApi.getCustomTerms();
    const newTerm: VocabularyTerm = {
      canonical: term,
      aliases,
      category,
      weight: 2.0,
      is_custom: true,
      corrections: [],
    };
    terms.push(newTerm);
    localStorage.setItem('voicecode_custom_dictionary', JSON.stringify(terms));
  },

  removeCustomTerm: async (term: string): Promise<boolean> => {
    const terms = await dictionaryApi.getCustomTerms();
    const filtered = terms.filter(t => t.canonical !== term);
    localStorage.setItem('voicecode_custom_dictionary', JSON.stringify(filtered));
    return terms.length !== filtered.length;
  },

  addCorrection: async (from: string, to: string): Promise<void> => {
    const corrections = JSON.parse(localStorage.getItem('voicecode_corrections') || '{}');
    corrections[from.toLowerCase()] = to;
    localStorage.setItem('voicecode_corrections', JSON.stringify(corrections));
  },

  getStats: async (): Promise<VocabularyStats> => {
    const terms = await dictionaryApi.getCustomTerms();
    const categories: Record<string, number> = {};
    let totalAliases = 0;

    terms.forEach(term => {
      categories[term.category] = (categories[term.category] || 0) + 1;
      totalAliases += term.aliases.length;
    });

    return {
      total_terms: 300 + terms.length, // Base vocabulary + custom
      custom_terms: terms.length,
      total_aliases: totalAliases,
      total_corrections: Object.keys(JSON.parse(localStorage.getItem('voicecode_corrections') || '{}')).length,
      categories,
    };
  },
};

export const CustomDictionary: React.FC<CustomDictionaryProps> = ({
  className,
  onTermAdded,
  onTermRemoved,
}) => {
  const [customTerms, setCustomTerms] = useState<VocabularyTerm[]>([]);
  const [stats, setStats] = useState<VocabularyStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // New term form state
  const [newTerm, setNewTerm] = useState('');
  const [newAliases, setNewAliases] = useState('');
  const [newCategory, setNewCategory] = useState<VocabularyCategory>('custom');
  const [isAdding, setIsAdding] = useState(false);

  // Correction form state
  const [correctionFrom, setCorrectionFrom] = useState('');
  const [correctionTo, setCorrectionTo] = useState('');

  // Search/filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<VocabularyCategory | 'all'>('all');

  // Tab state
  const [activeTab, setActiveTab] = useState<'terms' | 'corrections' | 'stats'>('terms');

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const [terms, vocabStats] = await Promise.all([
        dictionaryApi.getCustomTerms(),
        dictionaryApi.getStats(),
      ]);
      setCustomTerms(terms);
      setStats(vocabStats);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dictionary');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleAddTerm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTerm.trim()) return;

    try {
      setIsAdding(true);
      const aliases = newAliases
        .split(',')
        .map(a => a.trim().toLowerCase())
        .filter(a => a.length > 0);

      await dictionaryApi.addCustomTerm(newTerm.trim(), aliases, newCategory);

      const updatedTerms = await dictionaryApi.getCustomTerms();
      setCustomTerms(updatedTerms);

      const addedTerm = updatedTerms.find(t => t.canonical === newTerm.trim());
      if (addedTerm && onTermAdded) {
        onTermAdded(addedTerm);
      }

      // Reset form
      setNewTerm('');
      setNewAliases('');
      setNewCategory('custom');

      // Refresh stats
      const vocabStats = await dictionaryApi.getStats();
      setStats(vocabStats);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add term');
    } finally {
      setIsAdding(false);
    }
  };

  const handleRemoveTerm = async (canonical: string) => {
    try {
      const removed = await dictionaryApi.removeCustomTerm(canonical);
      if (removed) {
        setCustomTerms(prev => prev.filter(t => t.canonical !== canonical));
        if (onTermRemoved) {
          onTermRemoved(canonical);
        }
        const vocabStats = await dictionaryApi.getStats();
        setStats(vocabStats);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove term');
    }
  };

  const handleAddCorrection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!correctionFrom.trim() || !correctionTo.trim()) return;

    try {
      await dictionaryApi.addCorrection(correctionFrom.trim(), correctionTo.trim());
      setCorrectionFrom('');
      setCorrectionTo('');
      const vocabStats = await dictionaryApi.getStats();
      setStats(vocabStats);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add correction');
    }
  };

  const filteredTerms = customTerms.filter(term => {
    const matchesSearch = searchQuery === '' ||
      term.canonical.toLowerCase().includes(searchQuery.toLowerCase()) ||
      term.aliases.some(a => a.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = filterCategory === 'all' || term.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const styles = {
    container: {
      fontFamily: 'var(--font-family, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif)',
      backgroundColor: 'var(--color-surface, #ffffff)',
      borderRadius: 'var(--border-radius-lg, 12px)',
      border: '1px solid var(--color-border, #e2e8f0)',
      overflow: 'hidden',
    } as React.CSSProperties,
    header: {
      padding: '20px 24px',
      borderBottom: '1px solid var(--color-border, #e2e8f0)',
      backgroundColor: 'var(--color-surface-alt, #f8fafc)',
    } as React.CSSProperties,
    title: {
      margin: 0,
      fontSize: '20px',
      fontWeight: 600,
      color: 'var(--color-text, #1a202c)',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
    } as React.CSSProperties,
    subtitle: {
      margin: '4px 0 0 0',
      fontSize: '14px',
      color: 'var(--color-text-secondary, #718096)',
    } as React.CSSProperties,
    tabs: {
      display: 'flex',
      borderBottom: '1px solid var(--color-border, #e2e8f0)',
    } as React.CSSProperties,
    tab: (active: boolean) => ({
      padding: '12px 20px',
      border: 'none',
      backgroundColor: active ? 'var(--color-surface, #ffffff)' : 'transparent',
      color: active ? 'var(--color-primary, #3b82f6)' : 'var(--color-text-secondary, #718096)',
      fontWeight: active ? 600 : 400,
      cursor: 'pointer',
      borderBottom: active ? '2px solid var(--color-primary, #3b82f6)' : '2px solid transparent',
      transition: 'all 0.2s',
    } as React.CSSProperties),
    content: {
      padding: '20px 24px',
    } as React.CSSProperties,
    form: {
      display: 'flex',
      flexDirection: 'column' as const,
      gap: '16px',
      marginBottom: '24px',
      padding: '16px',
      backgroundColor: 'var(--color-surface-alt, #f8fafc)',
      borderRadius: 'var(--border-radius-md, 8px)',
    } as React.CSSProperties,
    formRow: {
      display: 'flex',
      gap: '12px',
      alignItems: 'flex-end',
    } as React.CSSProperties,
    formGroup: {
      display: 'flex',
      flexDirection: 'column' as const,
      gap: '4px',
      flex: 1,
    } as React.CSSProperties,
    label: {
      fontSize: '13px',
      fontWeight: 500,
      color: 'var(--color-text-secondary, #718096)',
    } as React.CSSProperties,
    input: {
      padding: '8px 12px',
      border: '1px solid var(--color-border, #e2e8f0)',
      borderRadius: 'var(--border-radius-sm, 6px)',
      fontSize: '14px',
      color: 'var(--color-text, #1a202c)',
      backgroundColor: 'var(--color-surface, #ffffff)',
      outline: 'none',
      transition: 'border-color 0.2s',
    } as React.CSSProperties,
    select: {
      padding: '8px 12px',
      border: '1px solid var(--color-border, #e2e8f0)',
      borderRadius: 'var(--border-radius-sm, 6px)',
      fontSize: '14px',
      color: 'var(--color-text, #1a202c)',
      backgroundColor: 'var(--color-surface, #ffffff)',
      outline: 'none',
      cursor: 'pointer',
    } as React.CSSProperties,
    button: (variant: 'primary' | 'secondary' | 'danger') => ({
      padding: '8px 16px',
      border: 'none',
      borderRadius: 'var(--border-radius-sm, 6px)',
      fontSize: '14px',
      fontWeight: 500,
      cursor: 'pointer',
      transition: 'all 0.2s',
      backgroundColor: variant === 'primary' ? 'var(--color-primary, #3b82f6)' :
                       variant === 'danger' ? 'var(--color-error, #ef4444)' :
                       'var(--color-surface, #ffffff)',
      color: variant === 'secondary' ? 'var(--color-text, #1a202c)' : '#ffffff',
      border: variant === 'secondary' ? '1px solid var(--color-border, #e2e8f0)' : 'none',
    } as React.CSSProperties),
    searchRow: {
      display: 'flex',
      gap: '12px',
      marginBottom: '16px',
    } as React.CSSProperties,
    termsList: {
      display: 'flex',
      flexDirection: 'column' as const,
      gap: '8px',
    } as React.CSSProperties,
    termItem: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '12px 16px',
      backgroundColor: 'var(--color-surface-alt, #f8fafc)',
      borderRadius: 'var(--border-radius-md, 8px)',
      border: '1px solid var(--color-border, #e2e8f0)',
    } as React.CSSProperties,
    termInfo: {
      display: 'flex',
      flexDirection: 'column' as const,
      gap: '4px',
    } as React.CSSProperties,
    termCanonical: {
      fontSize: '15px',
      fontWeight: 600,
      color: 'var(--color-text, #1a202c)',
    } as React.CSSProperties,
    termAliases: {
      fontSize: '13px',
      color: 'var(--color-text-secondary, #718096)',
    } as React.CSSProperties,
    termCategory: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '4px',
      padding: '2px 8px',
      backgroundColor: 'var(--color-primary-light, #dbeafe)',
      color: 'var(--color-primary, #3b82f6)',
      borderRadius: '4px',
      fontSize: '12px',
      fontWeight: 500,
    } as React.CSSProperties,
    statsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
      gap: '16px',
    } as React.CSSProperties,
    statCard: {
      padding: '20px',
      backgroundColor: 'var(--color-surface-alt, #f8fafc)',
      borderRadius: 'var(--border-radius-md, 8px)',
      border: '1px solid var(--color-border, #e2e8f0)',
    } as React.CSSProperties,
    statValue: {
      fontSize: '28px',
      fontWeight: 700,
      color: 'var(--color-primary, #3b82f6)',
      margin: 0,
    } as React.CSSProperties,
    statLabel: {
      fontSize: '14px',
      color: 'var(--color-text-secondary, #718096)',
      margin: '4px 0 0 0',
    } as React.CSSProperties,
    emptyState: {
      textAlign: 'center' as const,
      padding: '40px 20px',
      color: 'var(--color-text-secondary, #718096)',
    } as React.CSSProperties,
    error: {
      padding: '12px 16px',
      backgroundColor: 'var(--color-error-light, #fee2e2)',
      color: 'var(--color-error, #ef4444)',
      borderRadius: 'var(--border-radius-md, 8px)',
      marginBottom: '16px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
    } as React.CSSProperties,
  };

  if (isLoading) {
    return (
      <div className={className} style={styles.container}>
        <div style={styles.header}>
          <h2 style={styles.title}>📚 Custom Dictionary</h2>
        </div>
        <div style={{ ...styles.content, textAlign: 'center', padding: '60px 20px' }}>
          <div style={{ fontSize: '24px', marginBottom: '12px' }}>⏳</div>
          <p style={{ color: 'var(--color-text-secondary, #718096)' }}>Loading dictionary...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={className} style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>
          📚 Custom Dictionary
        </h2>
        <p style={styles.subtitle}>
          Add custom terms and corrections to improve voice recognition accuracy
        </p>
      </div>

      {/* Tabs */}
      <div style={styles.tabs}>
        <button
          style={styles.tab(activeTab === 'terms')}
          onClick={() => setActiveTab('terms')}
        >
          Custom Terms
        </button>
        <button
          style={styles.tab(activeTab === 'corrections')}
          onClick={() => setActiveTab('corrections')}
        >
          Corrections
        </button>
        <button
          style={styles.tab(activeTab === 'stats')}
          onClick={() => setActiveTab('stats')}
        >
          Statistics
        </button>
      </div>

      <div style={styles.content}>
        {/* Error Display */}
        {error && (
          <div style={styles.error}>
            <span>{error}</span>
            <button
              onClick={() => setError(null)}
              style={{ ...styles.button('secondary'), padding: '4px 8px' }}
            >
              ✕
            </button>
          </div>
        )}

        {/* Terms Tab */}
        {activeTab === 'terms' && (
          <>
            {/* Add Term Form */}
            <form style={styles.form} onSubmit={handleAddTerm}>
              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Term (canonical form)</label>
                  <input
                    type="text"
                    style={styles.input}
                    placeholder="e.g., Kubernetes"
                    value={newTerm}
                    onChange={(e) => setNewTerm(e.target.value)}
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Category</label>
                  <select
                    style={styles.select}
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as VocabularyCategory)}
                  >
                    {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                      <option key={key} value={key}>
                        {CATEGORY_ICONS[key as VocabularyCategory]} {label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Aliases (comma-separated, how it might be spoken)</label>
                <input
                  type="text"
                  style={styles.input}
                  placeholder="e.g., kubernetes, kube, k8s, cube nettie"
                  value={newAliases}
                  onChange={(e) => setNewAliases(e.target.value)}
                />
              </div>
              <button
                type="submit"
                style={styles.button('primary')}
                disabled={isAdding || !newTerm.trim()}
              >
                {isAdding ? 'Adding...' : '+ Add Term'}
              </button>
            </form>

            {/* Search and Filter */}
            <div style={styles.searchRow}>
              <div style={{ ...styles.formGroup, flex: 2 }}>
                <input
                  type="text"
                  style={styles.input}
                  placeholder="Search terms..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div style={styles.formGroup}>
                <select
                  style={styles.select}
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value as VocabularyCategory | 'all')}
                >
                  <option value="all">All Categories</option>
                  {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Terms List */}
            {filteredTerms.length === 0 ? (
              <div style={styles.emptyState}>
                <div style={{ fontSize: '48px', marginBottom: '12px' }}>📝</div>
                <p style={{ margin: 0 }}>
                  {customTerms.length === 0
                    ? 'No custom terms yet. Add your first term above!'
                    : 'No terms match your search.'}
                </p>
              </div>
            ) : (
              <div style={styles.termsList}>
                {filteredTerms.map((term) => (
                  <div key={term.canonical} style={styles.termItem}>
                    <div style={styles.termInfo}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={styles.termCanonical}>{term.canonical}</span>
                        <span style={styles.termCategory}>
                          {CATEGORY_ICONS[term.category as VocabularyCategory]} {CATEGORY_LABELS[term.category as VocabularyCategory] || term.category}
                        </span>
                      </div>
                      {term.aliases.length > 0 && (
                        <span style={styles.termAliases}>
                          Aliases: {term.aliases.join(', ')}
                        </span>
                      )}
                    </div>
                    <button
                      style={styles.button('danger')}
                      onClick={() => handleRemoveTerm(term.canonical)}
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Corrections Tab */}
        {activeTab === 'corrections' && (
          <>
            <form style={styles.form} onSubmit={handleAddCorrection}>
              <p style={{ margin: '0 0 12px 0', fontSize: '14px', color: 'var(--color-text-secondary, #718096)' }}>
                Add corrections for common misrecognitions. When the speech engine hears the "from" text,
                it will be automatically corrected to the "to" text.
              </p>
              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>When I say (misrecognized as)</label>
                  <input
                    type="text"
                    style={styles.input}
                    placeholder="e.g., high torch"
                    value={correctionFrom}
                    onChange={(e) => setCorrectionFrom(e.target.value)}
                  />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', padding: '0 8px' }}>
                  →
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Correct to</label>
                  <input
                    type="text"
                    style={styles.input}
                    placeholder="e.g., PyTorch"
                    value={correctionTo}
                    onChange={(e) => setCorrectionTo(e.target.value)}
                  />
                </div>
              </div>
              <button
                type="submit"
                style={styles.button('primary')}
                disabled={!correctionFrom.trim() || !correctionTo.trim()}
              >
                + Add Correction
              </button>
            </form>

            <div style={styles.emptyState}>
              <div style={{ fontSize: '48px', marginBottom: '12px' }}>🔧</div>
              <p style={{ margin: 0, marginBottom: '8px' }}>
                Common corrections are applied automatically.
              </p>
              <p style={{ margin: 0, fontSize: '13px' }}>
                Add custom corrections for terms specific to your workflow.
              </p>
            </div>
          </>
        )}

        {/* Stats Tab */}
        {activeTab === 'stats' && stats && (
          <div style={styles.statsGrid}>
            <div style={styles.statCard}>
              <p style={styles.statValue}>{stats.total_terms}</p>
              <p style={styles.statLabel}>Total Vocabulary Terms</p>
            </div>
            <div style={styles.statCard}>
              <p style={styles.statValue}>{stats.custom_terms}</p>
              <p style={styles.statLabel}>Custom Terms Added</p>
            </div>
            <div style={styles.statCard}>
              <p style={styles.statValue}>{stats.total_aliases}</p>
              <p style={styles.statLabel}>Total Aliases</p>
            </div>
            <div style={styles.statCard}>
              <p style={styles.statValue}>{stats.total_corrections}</p>
              <p style={styles.statLabel}>Custom Corrections</p>
            </div>
            <div style={{ ...styles.statCard, gridColumn: 'span 2' }}>
              <p style={{ ...styles.statLabel, marginBottom: '12px' }}>Terms by Category</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {Object.entries(stats.categories).map(([category, count]) => (
                  <span
                    key={category}
                    style={{
                      padding: '4px 12px',
                      backgroundColor: 'var(--color-primary-light, #dbeafe)',
                      borderRadius: '16px',
                      fontSize: '13px',
                      color: 'var(--color-primary, #3b82f6)',
                    }}
                  >
                    {CATEGORY_ICONS[category as VocabularyCategory]} {CATEGORY_LABELS[category as VocabularyCategory] || category}: {count}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomDictionary;
