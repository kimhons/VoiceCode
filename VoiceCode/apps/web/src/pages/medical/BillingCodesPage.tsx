/**
 * Billing Codes Page
 * CPT and ICD-10 code lookup with AI suggestions
 */

import React, { useState, useCallback } from 'react';
import {
  DollarSign,
  Search,
  Plus,
  Trash2,
  Copy,
  Sparkles,
  FileText,
  CheckCircle,
  Info,
  Tag,
} from 'lucide-react';

interface BillingCode {
  code: string;
  description: string;
  type: 'CPT' | 'ICD-10';
  category: string;
  fee?: number;
}

interface SelectedCode extends BillingCode {
  units: number;
  modifier?: string;
}

const commonCPTCodes: BillingCode[] = [
  {
    code: '99213',
    description: 'Office visit, established patient, low complexity',
    type: 'CPT',
    category: 'E&M',
    fee: 95,
  },
  {
    code: '99214',
    description: 'Office visit, established patient, moderate complexity',
    type: 'CPT',
    category: 'E&M',
    fee: 130,
  },
  {
    code: '99215',
    description: 'Office visit, established patient, high complexity',
    type: 'CPT',
    category: 'E&M',
    fee: 180,
  },
  {
    code: '99203',
    description: 'Office visit, new patient, low complexity',
    type: 'CPT',
    category: 'E&M',
    fee: 110,
  },
  {
    code: '99204',
    description: 'Office visit, new patient, moderate complexity',
    type: 'CPT',
    category: 'E&M',
    fee: 165,
  },
  {
    code: '99205',
    description: 'Office visit, new patient, high complexity',
    type: 'CPT',
    category: 'E&M',
    fee: 220,
  },
  {
    code: '99441',
    description: 'Telephone E&M, 5-10 minutes',
    type: 'CPT',
    category: 'Telehealth',
    fee: 45,
  },
  {
    code: '99442',
    description: 'Telephone E&M, 11-20 minutes',
    type: 'CPT',
    category: 'Telehealth',
    fee: 75,
  },
  {
    code: '99443',
    description: 'Telephone E&M, 21-30 minutes',
    type: 'CPT',
    category: 'Telehealth',
    fee: 105,
  },
  {
    code: '36415',
    description: 'Venipuncture',
    type: 'CPT',
    category: 'Lab',
    fee: 15,
  },
  {
    code: '81002',
    description: 'Urinalysis, non-automated',
    type: 'CPT',
    category: 'Lab',
    fee: 12,
  },
  {
    code: '87880',
    description: 'Strep A test',
    type: 'CPT',
    category: 'Lab',
    fee: 20,
  },
];

const commonICD10Codes: BillingCode[] = [
  {
    code: 'J06.9',
    description: 'Acute upper respiratory infection, unspecified',
    type: 'ICD-10',
    category: 'Respiratory',
  },
  {
    code: 'J02.9',
    description: 'Acute pharyngitis, unspecified',
    type: 'ICD-10',
    category: 'Respiratory',
  },
  {
    code: 'J00',
    description: 'Acute nasopharyngitis (common cold)',
    type: 'ICD-10',
    category: 'Respiratory',
  },
  {
    code: 'N39.0',
    description: 'Urinary tract infection, site not specified',
    type: 'ICD-10',
    category: 'Genitourinary',
  },
  {
    code: 'I10',
    description: 'Essential (primary) hypertension',
    type: 'ICD-10',
    category: 'Cardiovascular',
  },
  {
    code: 'E11.9',
    description: 'Type 2 diabetes mellitus without complications',
    type: 'ICD-10',
    category: 'Endocrine',
  },
  {
    code: 'M54.5',
    description: 'Low back pain',
    type: 'ICD-10',
    category: 'Musculoskeletal',
  },
  {
    code: 'R51',
    description: 'Headache',
    type: 'ICD-10',
    category: 'Symptoms',
  },
  { code: 'R05', description: 'Cough', type: 'ICD-10', category: 'Symptoms' },
  {
    code: 'R50.9',
    description: 'Fever, unspecified',
    type: 'ICD-10',
    category: 'Symptoms',
  },
  {
    code: 'Z00.00',
    description: 'General adult medical examination without abnormal findings',
    type: 'ICD-10',
    category: 'Encounters',
  },
  {
    code: 'Z23',
    description: 'Encounter for immunization',
    type: 'ICD-10',
    category: 'Encounters',
  },
];

const BillingCodesPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [codeType, setCodeType] = useState<'all' | 'CPT' | 'ICD-10'>('all');
  const [selectedCodes, setSelectedCodes] = useState<SelectedCode[]>([]);
  const [clinicalNotes, setClinicalNotes] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [suggestedCodes, setSuggestedCodes] = useState<BillingCode[]>([]);

  const allCodes = [...commonCPTCodes, ...commonICD10Codes];

  const filteredCodes = allCodes.filter((code) => {
    const matchesSearch =
      code.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      code.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = codeType === 'all' || code.type === codeType;
    return matchesSearch && matchesType;
  });

  const addCode = (code: BillingCode) => {
    if (!selectedCodes.find((c) => c.code === code.code)) {
      setSelectedCodes([...selectedCodes, { ...code, units: 1 }]);
    }
  };

  const removeCode = (codeToRemove: string) => {
    setSelectedCodes(selectedCodes.filter((c) => c.code !== codeToRemove));
  };

  const updateCodeUnits = (code: string, units: number) => {
    setSelectedCodes(
      selectedCodes.map((c) =>
        c.code === code ? { ...c, units: Math.max(1, units) } : c
      )
    );
  };

  const updateCodeModifier = (code: string, modifier: string) => {
    setSelectedCodes(
      selectedCodes.map((c) => (c.code === code ? { ...c, modifier } : c))
    );
  };

  const generateSuggestions = useCallback(async () => {
    if (!clinicalNotes.trim()) return;

    setIsGenerating(true);
    // Simulate AI suggestion
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Mock AI suggestions based on keywords
    const suggestions: BillingCode[] = [];
    const notesLower = clinicalNotes.toLowerCase();

    if (
      notesLower.includes('sore throat') ||
      notesLower.includes('pharyngitis')
    ) {
      suggestions.push(commonICD10Codes.find((c) => c.code === 'J02.9')!);
      suggestions.push(commonCPTCodes.find((c) => c.code === '87880')!);
    }
    if (notesLower.includes('cough') || notesLower.includes('cold')) {
      suggestions.push(commonICD10Codes.find((c) => c.code === 'J06.9')!);
    }
    if (
      notesLower.includes('hypertension') ||
      notesLower.includes('blood pressure')
    ) {
      suggestions.push(commonICD10Codes.find((c) => c.code === 'I10')!);
    }
    if (notesLower.includes('diabetes')) {
      suggestions.push(commonICD10Codes.find((c) => c.code === 'E11.9')!);
    }
    if (notesLower.includes('established patient')) {
      suggestions.push(commonCPTCodes.find((c) => c.code === '99214')!);
    }
    if (notesLower.includes('new patient')) {
      suggestions.push(commonCPTCodes.find((c) => c.code === '99204')!);
    }

    setSuggestedCodes(suggestions.filter(Boolean));
    setIsGenerating(false);
  }, [clinicalNotes]);

  const copySelectedCodes = useCallback(() => {
    const text = selectedCodes
      .map(
        (c) =>
          `${c.code} - ${c.description}${c.modifier ? ` (${c.modifier})` : ''} x${c.units}`
      )
      .join('\n');
    navigator.clipboard.writeText(text);
  }, [selectedCodes]);

  const totalEstimate = selectedCodes.reduce(
    (sum, code) => sum + (code.fee || 0) * code.units,
    0
  );

  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb' }}>
      {/* Header */}
      <div
        style={{
          background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
          color: 'white',
          padding: '32px 24px',
        }}
      >
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              marginBottom: '8px',
            }}
          >
            <DollarSign size={32} />
            <h1 style={{ fontSize: '28px', fontWeight: '700' }}>
              Billing Codes
            </h1>
          </div>
          <p style={{ fontSize: '15px', opacity: 0.9 }}>
            CPT and ICD-10 code lookup with AI suggestions
          </p>
        </div>
      </div>

      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '24px' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 400px',
            gap: '24px',
          }}
        >
          {/* Main Content */}
          <div>
            {/* AI Suggestion Panel */}
            <div
              style={{
                background: 'linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%)',
                borderRadius: '12px',
                padding: '20px',
                marginBottom: '20px',
                color: 'white',
              }}
            >
              <h3
                style={{
                  fontSize: '16px',
                  fontWeight: '600',
                  marginBottom: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <Sparkles size={20} /> AI Code Suggestions
              </h3>
              <textarea
                value={clinicalNotes}
                onChange={(e) => setClinicalNotes(e.target.value)}
                placeholder="Paste your clinical notes here for AI-powered code suggestions..."
                style={{
                  width: '100%',
                  minHeight: '100px',
                  padding: '12px',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  resize: 'vertical',
                  marginBottom: '12px',
                }}
              />
              <button
                onClick={generateSuggestions}
                disabled={isGenerating || !clinicalNotes.trim()}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 20px',
                  background: 'rgba(255,255,255,0.2)',
                  color: 'white',
                  border: '1px solid rgba(255,255,255,0.3)',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: clinicalNotes.trim() ? 'pointer' : 'not-allowed',
                }}
              >
                <Sparkles size={16} />
                {isGenerating ? 'Analyzing...' : 'Generate Suggestions'}
              </button>

              {suggestedCodes.length > 0 && (
                <div style={{ marginTop: '16px' }}>
                  <p
                    style={{
                      fontSize: '12px',
                      opacity: 0.8,
                      marginBottom: '8px',
                    }}
                  >
                    Suggested codes:
                  </p>
                  <div
                    style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}
                  >
                    {suggestedCodes.map((code) => (
                      <button
                        key={code.code}
                        onClick={() => addCode(code)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '6px 12px',
                          background: 'rgba(255,255,255,0.2)',
                          border: '1px solid rgba(255,255,255,0.3)',
                          borderRadius: '6px',
                          color: 'white',
                          fontSize: '12px',
                          cursor: 'pointer',
                        }}
                      >
                        <Tag size={12} />
                        {code.code}
                        <Plus size={12} />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Search and Filter */}
            <div
              style={{
                background: 'white',
                borderRadius: '12px',
                padding: '20px',
                marginBottom: '20px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              }}
            >
              <div
                style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}
              >
                <div style={{ flex: 1, position: 'relative' }}>
                  <Search
                    size={18}
                    style={{
                      position: 'absolute',
                      left: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: '#9ca3af',
                    }}
                  />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search codes by number or description..."
                    style={{
                      width: '100%',
                      padding: '12px 12px 12px 40px',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      fontSize: '14px',
                    }}
                  />
                </div>
                <div style={{ display: 'flex', gap: '4px' }}>
                  {(['all', 'CPT', 'ICD-10'] as const).map((type) => (
                    <button
                      key={type}
                      onClick={() => setCodeType(type)}
                      style={{
                        padding: '12px 16px',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '13px',
                        fontWeight: '500',
                        cursor: 'pointer',
                        background: codeType === type ? '#059669' : '#f3f4f6',
                        color: codeType === type ? 'white' : '#6b7280',
                      }}
                    >
                      {type === 'all' ? 'All' : type}
                    </button>
                  ))}
                </div>
              </div>

              {/* Code List */}
              <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                {filteredCodes.map((code) => (
                  <div
                    key={code.code}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px',
                      borderBottom: '1px solid #f3f4f6',
                      cursor: 'pointer',
                    }}
                    onClick={() => addCode(code)}
                  >
                    <div style={{ flex: 1 }}>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                        }}
                      >
                        <span
                          style={{
                            padding: '2px 8px',
                            background:
                              code.type === 'CPT' ? '#dbeafe' : '#fef3c7',
                            color: code.type === 'CPT' ? '#1d4ed8' : '#92400e',
                            borderRadius: '4px',
                            fontSize: '11px',
                            fontWeight: '600',
                          }}
                        >
                          {code.type}
                        </span>
                        <span
                          style={{
                            fontWeight: '600',
                            fontSize: '14px',
                            color: '#1f2937',
                          }}
                        >
                          {code.code}
                        </span>
                      </div>
                      <p
                        style={{
                          fontSize: '13px',
                          color: '#6b7280',
                          marginTop: '4px',
                        }}
                      >
                        {code.description}
                      </p>
                    </div>
                    {code.fee && (
                      <span
                        style={{
                          fontSize: '13px',
                          color: '#059669',
                          fontWeight: '500',
                        }}
                      >
                        ${code.fee}
                      </span>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        addCode(code);
                      }}
                      style={{
                        marginLeft: '12px',
                        padding: '6px',
                        background: '#f3f4f6',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                      }}
                    >
                      <Plus size={16} color="#6b7280" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Selected Codes Sidebar */}
          <div>
            <div
              style={{
                background: 'white',
                borderRadius: '12px',
                padding: '20px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                position: 'sticky',
                top: '24px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '16px',
                }}
              >
                <h3
                  style={{
                    fontSize: '16px',
                    fontWeight: '600',
                    color: '#1f2937',
                  }}
                >
                  Selected Codes
                </h3>
                {selectedCodes.length > 0 && (
                  <button
                    onClick={copySelectedCodes}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '6px 12px',
                      background: '#f3f4f6',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '12px',
                      cursor: 'pointer',
                    }}
                  >
                    <Copy size={14} /> Copy
                  </button>
                )}
              </div>

              {selectedCodes.length === 0 ? (
                <div
                  style={{
                    textAlign: 'center',
                    padding: '40px 20px',
                    color: '#9ca3af',
                  }}
                >
                  <FileText
                    size={32}
                    style={{ marginBottom: '12px', opacity: 0.5 }}
                  />
                  <p style={{ fontSize: '13px' }}>
                    Click on codes to add them here
                  </p>
                </div>
              ) : (
                <>
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px',
                      marginBottom: '20px',
                    }}
                  >
                    {selectedCodes.map((code) => (
                      <div
                        key={code.code}
                        style={{
                          padding: '12px',
                          background: '#f9fafb',
                          borderRadius: '8px',
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'flex-start',
                            marginBottom: '8px',
                          }}
                        >
                          <div>
                            <span
                              style={{
                                padding: '2px 6px',
                                background:
                                  code.type === 'CPT' ? '#dbeafe' : '#fef3c7',
                                color:
                                  code.type === 'CPT' ? '#1d4ed8' : '#92400e',
                                borderRadius: '4px',
                                fontSize: '10px',
                                fontWeight: '600',
                              }}
                            >
                              {code.type}
                            </span>
                            <span
                              style={{
                                fontWeight: '600',
                                fontSize: '14px',
                                color: '#1f2937',
                                marginLeft: '8px',
                              }}
                            >
                              {code.code}
                            </span>
                          </div>
                          <button
                            onClick={() => removeCode(code.code)}
                            style={{
                              padding: '4px',
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              color: '#dc2626',
                            }}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                        <p
                          style={{
                            fontSize: '12px',
                            color: '#6b7280',
                            marginBottom: '8px',
                          }}
                        >
                          {code.description}
                        </p>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <div>
                            <label
                              style={{ fontSize: '10px', color: '#9ca3af' }}
                            >
                              Units
                            </label>
                            <input
                              type="number"
                              value={code.units}
                              onChange={(e) =>
                                updateCodeUnits(
                                  code.code,
                                  parseInt(e.target.value) || 1
                                )
                              }
                              min="1"
                              style={{
                                width: '60px',
                                padding: '4px 8px',
                                border: '1px solid #e5e7eb',
                                borderRadius: '4px',
                                fontSize: '12px',
                              }}
                            />
                          </div>
                          <div>
                            <label
                              style={{ fontSize: '10px', color: '#9ca3af' }}
                            >
                              Modifier
                            </label>
                            <input
                              type="text"
                              value={code.modifier || ''}
                              onChange={(e) =>
                                updateCodeModifier(code.code, e.target.value)
                              }
                              placeholder="25, 59..."
                              style={{
                                width: '70px',
                                padding: '4px 8px',
                                border: '1px solid #e5e7eb',
                                borderRadius: '4px',
                                fontSize: '12px',
                              }}
                            />
                          </div>
                          {code.fee && (
                            <div
                              style={{ marginLeft: 'auto', textAlign: 'right' }}
                            >
                              <label
                                style={{ fontSize: '10px', color: '#9ca3af' }}
                              >
                                Est.
                              </label>
                              <p
                                style={{
                                  fontSize: '14px',
                                  fontWeight: '600',
                                  color: '#059669',
                                }}
                              >
                                ${code.fee * code.units}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Total */}
                  <div
                    style={{
                      padding: '16px',
                      background: '#ecfdf5',
                      borderRadius: '8px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <span
                      style={{
                        fontSize: '14px',
                        fontWeight: '500',
                        color: '#065f46',
                      }}
                    >
                      Estimated Total
                    </span>
                    <span
                      style={{
                        fontSize: '24px',
                        fontWeight: '700',
                        color: '#059669',
                      }}
                    >
                      ${totalEstimate}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BillingCodesPage;
