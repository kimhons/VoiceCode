/**
 * Template Library Page
 * Clinical documentation templates organized by specialty
 */

import React, { useState, useCallback } from 'react';
import {
  FolderOpen,
  Search,
  Plus,
  Edit3,
  Trash2,
  Copy,
  Star,
  StarOff,
  FileText,
  Heart,
  Brain,
  Bone,
  Eye,
  Baby,
  Stethoscope,
  Activity,
  Filter,
  Download,
  Upload,
} from 'lucide-react';

interface Template {
  id: string;
  name: string;
  specialty: string;
  category: string;
  content: string;
  isFavorite: boolean;
  lastUsed?: string;
  useCount: number;
}

const defaultTemplates: Template[] = [
  {
    id: '1',
    name: 'General Physical Exam',
    specialty: 'Primary Care',
    category: 'Examination',
    content:
      'GENERAL: Alert, oriented, no acute distress\n\nHEENT: Normocephalic, atraumatic. PERRLA. TMs clear bilaterally. Oropharynx clear, moist mucous membranes.\n\nNECK: Supple, no lymphadenopathy, no thyromegaly\n\nCARDIOVASCULAR: Regular rate and rhythm, no murmurs, rubs, or gallops. Peripheral pulses 2+ bilaterally.\n\nRESPIRATORY: Clear to auscultation bilaterally, no wheezes, rales, or rhonchi\n\nABDOMEN: Soft, non-tender, non-distended. Normal bowel sounds. No hepatosplenomegaly.\n\nEXTREMITIES: No clubbing, cyanosis, or edema\n\nNEUROLOGICAL: Cranial nerves II-XII intact. Motor strength 5/5 throughout. Sensation intact.\n\nSKIN: Warm, dry, no rashes or lesions',
    isFavorite: true,
    useCount: 45,
  },
  {
    id: '2',
    name: 'Cardiology Consult',
    specialty: 'Cardiology',
    category: 'Consultation',
    content:
      'REASON FOR CONSULTATION:\n\nHISTORY OF PRESENT ILLNESS:\n\nCARDIAC HISTORY:\n- Prior MI: \n- Prior PCI/CABG:\n- Heart Failure:\n- Arrhythmias:\n\nCARDIAC RISK FACTORS:\n- Hypertension:\n- Diabetes:\n- Hyperlipidemia:\n- Smoking:\n- Family history:\n\nCURRENT CARDIAC MEDICATIONS:\n\nEKG INTERPRETATION:\n\nECHO FINDINGS:\n\nASSESSMENT:\n\nRECOMMENDATIONS:',
    isFavorite: true,
    useCount: 32,
  },
  {
    id: '3',
    name: 'Orthopedic Exam - Knee',
    specialty: 'Orthopedics',
    category: 'Examination',
    content:
      'KNEE EXAMINATION:\n\nINSPECTION:\n- Swelling:\n- Erythema:\n- Deformity:\n- Muscle atrophy:\n\nPALPATION:\n- Joint line tenderness (medial/lateral):\n- Patella:\n- Popliteal fossa:\n\nRANGE OF MOTION:\n- Flexion:\n- Extension:\n\nSPECIAL TESTS:\n- Lachman test:\n- Anterior drawer:\n- Posterior drawer:\n- McMurray test:\n- Varus/valgus stress:\n\nNEUROVASCULAR:\n- Pulses:\n- Sensation:\n- Motor:\n\nASSESSMENT:\n\nPLAN:',
    isFavorite: false,
    useCount: 18,
  },
  {
    id: '4',
    name: 'Pediatric Well Visit',
    specialty: 'Pediatrics',
    category: 'Well Visit',
    content:
      'PEDIATRIC WELL CHILD VISIT\n\nAge:\nWeight: (percentile)\nHeight: (percentile)\nHead Circumference: (percentile)\nBMI: (percentile)\n\nDEVELOPMENTAL MILESTONES:\n- Gross motor:\n- Fine motor:\n- Language:\n- Social:\n\nNUTRITION:\n- Feeding:\n- Diet:\n\nSLEEP:\n\nSAFETY:\n\nIMMUNIZATIONS:\n\nPHYSICAL EXAMINATION:\n\nASSESSMENT:\nHealthy child, appropriate growth and development\n\nANTICIPATORY GUIDANCE:\n\nPLAN:\n- Immunizations given:\n- Next visit:',
    isFavorite: true,
    useCount: 28,
  },
  {
    id: '5',
    name: 'Neurology H&P',
    specialty: 'Neurology',
    category: 'H&P',
    content:
      'NEUROLOGICAL HISTORY AND PHYSICAL\n\nCHIEF COMPLAINT:\n\nHISTORY OF PRESENT ILLNESS:\n\nNEUROLOGICAL HISTORY:\n- Seizures:\n- Stroke:\n- Headaches:\n- Neuropathy:\n\nNEUROLOGICAL EXAMINATION:\n\nMENTAL STATUS:\n- Alertness:\n- Orientation:\n- Attention:\n- Memory:\n- Language:\n\nCRANIAL NERVES:\nI: Smell\nII: Visual acuity, fields, fundoscopy\nIII, IV, VI: EOM, pupils\nV: Facial sensation, masseter\nVII: Facial expression\nVIII: Hearing\nIX, X: Palate, gag\nXI: Trapezius, SCM\nXII: Tongue\n\nMOTOR:\n- Bulk:\n- Tone:\n- Strength (0-5):\n\nSENSORY:\n- Light touch:\n- Pain/temperature:\n- Vibration:\n- Proprioception:\n\nREFLEXES:\n- Biceps:\n- Triceps:\n- Brachioradialis:\n- Patellar:\n- Achilles:\n- Plantar:\n\nCOORDINATION:\n- Finger-nose:\n- Heel-shin:\n- Rapid alternating:\n\nGAIT:\n\nASSESSMENT:\n\nPLAN:',
    isFavorite: false,
    useCount: 15,
  },
  {
    id: '6',
    name: 'Ophthalmology Exam',
    specialty: 'Ophthalmology',
    category: 'Examination',
    content:
      'OPHTHALMOLOGIC EXAMINATION\n\nVISUAL ACUITY:\nOD (right): \nOS (left): \n\nPUPILS:\nOD: size, reactivity, APD\nOS: size, reactivity, APD\n\nEXTRAOCULAR MOVEMENTS:\n\nVISUAL FIELDS:\nConfrontation:\n\nEXTERNAL:\nLids:\nConjunctiva:\n\nSLIT LAMP:\nCornea:\nAnterior chamber:\nIris:\nLens:\n\nINTRAOCULAR PRESSURE:\nOD:\nOS:\n\nFUNDUSCOPIC:\nDisc:\nMacula:\nVessels:\nPeriphery:\n\nASSESSMENT:\n\nPLAN:',
    isFavorite: false,
    useCount: 12,
  },
];

const specialties = [
  { name: 'Primary Care', icon: Stethoscope, color: '#3b82f6' },
  { name: 'Cardiology', icon: Heart, color: '#ef4444' },
  { name: 'Orthopedics', icon: Bone, color: '#f59e0b' },
  { name: 'Pediatrics', icon: Baby, color: '#10b981' },
  { name: 'Neurology', icon: Brain, color: '#8b5cf6' },
  { name: 'Ophthalmology', icon: Eye, color: '#06b6d4' },
];

const TemplateLibraryPage: React.FC = () => {
  const [templates, setTemplates] = useState<Template[]>(defaultTemplates);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState<string | null>(
    null
  );
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(
    null
  );
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState('');

  const filteredTemplates = templates.filter((template) => {
    const matchesSearch =
      template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSpecialty =
      !selectedSpecialty || template.specialty === selectedSpecialty;
    const matchesFavorites = !showFavoritesOnly || template.isFavorite;
    return matchesSearch && matchesSpecialty && matchesFavorites;
  });

  const toggleFavorite = (id: string) => {
    setTemplates(
      templates.map((t) =>
        t.id === id ? { ...t, isFavorite: !t.isFavorite } : t
      )
    );
    if (selectedTemplate?.id === id) {
      setSelectedTemplate({
        ...selectedTemplate,
        isFavorite: !selectedTemplate.isFavorite,
      });
    }
  };

  const selectTemplate = (template: Template) => {
    setSelectedTemplate(template);
    setEditedContent(template.content);
    setIsEditing(false);
  };

  const copyTemplate = useCallback(() => {
    if (selectedTemplate) {
      navigator.clipboard.writeText(selectedTemplate.content);
    }
  }, [selectedTemplate]);

  const saveEdit = () => {
    if (selectedTemplate) {
      setTemplates(
        templates.map((t) =>
          t.id === selectedTemplate.id ? { ...t, content: editedContent } : t
        )
      );
      setSelectedTemplate({ ...selectedTemplate, content: editedContent });
      setIsEditing(false);
    }
  };

  const useTemplate = () => {
    if (selectedTemplate) {
      setTemplates(
        templates.map((t) =>
          t.id === selectedTemplate.id
            ? {
                ...t,
                useCount: t.useCount + 1,
                lastUsed: new Date().toISOString(),
              }
            : t
        )
      );
      copyTemplate();
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb' }}>
      {/* Header */}
      <div
        style={{
          background: 'linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)',
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
            <FolderOpen size={32} />
            <h1 style={{ fontSize: '28px', fontWeight: '700' }}>
              Template Library
            </h1>
          </div>
          <p style={{ fontSize: '15px', opacity: 0.9 }}>
            Clinical documentation templates organized by specialty
          </p>
        </div>
      </div>

      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '24px' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '320px 1fr',
            gap: '24px',
          }}
        >
          {/* Sidebar */}
          <div>
            {/* Search */}
            <div
              style={{
                background: 'white',
                borderRadius: '12px',
                padding: '16px',
                marginBottom: '16px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              }}
            >
              <div style={{ position: 'relative', marginBottom: '12px' }}>
                <Search
                  size={16}
                  style={{
                    position: 'absolute',
                    left: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#9ca3af',
                  }}
                />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search templates..."
                  style={{
                    width: '100%',
                    padding: '10px 10px 10px 34px',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '13px',
                  }}
                />
              </div>
              <button
                onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 12px',
                  background: showFavoritesOnly ? '#fef3c7' : '#f3f4f6',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  color: showFavoritesOnly ? '#92400e' : '#6b7280',
                }}
              >
                <Star size={14} fill={showFavoritesOnly ? '#f59e0b' : 'none'} />
                Favorites Only
              </button>
            </div>

            {/* Specialties */}
            <div
              style={{
                background: 'white',
                borderRadius: '12px',
                padding: '16px',
                marginBottom: '16px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              }}
            >
              <h3
                style={{
                  fontSize: '12px',
                  fontWeight: '600',
                  color: '#6b7280',
                  marginBottom: '12px',
                  textTransform: 'uppercase',
                }}
              >
                Specialties
              </h3>
              <div
                style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}
              >
                <button
                  onClick={() => setSelectedSpecialty(null)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '10px 12px',
                    background: !selectedSpecialty ? '#f3f4f6' : 'transparent',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: !selectedSpecialty ? '600' : '400',
                    cursor: 'pointer',
                    textAlign: 'left',
                    color: '#374151',
                  }}
                >
                  <Filter size={16} />
                  All Specialties
                  <span
                    style={{
                      marginLeft: 'auto',
                      fontSize: '11px',
                      color: '#9ca3af',
                    }}
                  >
                    {templates.length}
                  </span>
                </button>
                {specialties.map((specialty) => {
                  const count = templates.filter(
                    (t) => t.specialty === specialty.name
                  ).length;
                  const Icon = specialty.icon;
                  return (
                    <button
                      key={specialty.name}
                      onClick={() => setSelectedSpecialty(specialty.name)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '10px 12px',
                        background:
                          selectedSpecialty === specialty.name
                            ? '#f3f4f6'
                            : 'transparent',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '13px',
                        fontWeight:
                          selectedSpecialty === specialty.name ? '600' : '400',
                        cursor: 'pointer',
                        textAlign: 'left',
                        color: '#374151',
                      }}
                    >
                      <Icon size={16} color={specialty.color} />
                      {specialty.name}
                      <span
                        style={{
                          marginLeft: 'auto',
                          fontSize: '11px',
                          color: '#9ca3af',
                        }}
                      >
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Template List */}
            <div
              style={{
                background: 'white',
                borderRadius: '12px',
                padding: '16px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              }}
            >
              <h3
                style={{
                  fontSize: '12px',
                  fontWeight: '600',
                  color: '#6b7280',
                  marginBottom: '12px',
                  textTransform: 'uppercase',
                }}
              >
                Templates ({filteredTemplates.length})
              </h3>
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  maxHeight: '400px',
                  overflowY: 'auto',
                }}
              >
                {filteredTemplates.map((template) => (
                  <button
                    key={template.id}
                    onClick={() => selectTemplate(template)}
                    style={{
                      padding: '12px',
                      background:
                        selectedTemplate?.id === template.id
                          ? '#f0f9ff'
                          : '#f9fafb',
                      border:
                        selectedTemplate?.id === template.id
                          ? '2px solid #3b82f6'
                          : '1px solid #e5e7eb',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      textAlign: 'left',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                      }}
                    >
                      <span
                        style={{
                          fontSize: '13px',
                          fontWeight: '500',
                          color: '#1f2937',
                        }}
                      >
                        {template.name}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFavorite(template.id);
                        }}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          padding: '0',
                        }}
                      >
                        {template.isFavorite ? (
                          <Star size={14} fill="#f59e0b" color="#f59e0b" />
                        ) : (
                          <StarOff size={14} color="#d1d5db" />
                        )}
                      </button>
                    </div>
                    <div
                      style={{ display: 'flex', gap: '8px', marginTop: '6px' }}
                    >
                      <span style={{ fontSize: '11px', color: '#6b7280' }}>
                        {template.specialty}
                      </span>
                      <span style={{ fontSize: '11px', color: '#9ca3af' }}>
                        •
                      </span>
                      <span style={{ fontSize: '11px', color: '#9ca3af' }}>
                        Used {template.useCount}x
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div>
            {selectedTemplate ? (
              <div
                style={{
                  background: 'white',
                  borderRadius: '12px',
                  padding: '24px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: '20px',
                  }}
                >
                  <div>
                    <h2
                      style={{
                        fontSize: '20px',
                        fontWeight: '600',
                        color: '#1f2937',
                        marginBottom: '4px',
                      }}
                    >
                      {selectedTemplate.name}
                    </h2>
                    <div style={{ display: 'flex', gap: '12px' }}>
                      <span style={{ fontSize: '13px', color: '#6b7280' }}>
                        {selectedTemplate.specialty}
                      </span>
                      <span style={{ fontSize: '13px', color: '#6b7280' }}>
                        •
                      </span>
                      <span style={{ fontSize: '13px', color: '#6b7280' }}>
                        {selectedTemplate.category}
                      </span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => toggleFavorite(selectedTemplate.id)}
                      style={{
                        padding: '8px 12px',
                        background: '#f3f4f6',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                      }}
                    >
                      {selectedTemplate.isFavorite ? (
                        <Star size={16} fill="#f59e0b" color="#f59e0b" />
                      ) : (
                        <Star size={16} color="#6b7280" />
                      )}
                    </button>
                    {isEditing ? (
                      <>
                        <button
                          onClick={() => setIsEditing(false)}
                          style={{
                            padding: '8px 16px',
                            background: '#f3f4f6',
                            border: 'none',
                            borderRadius: '6px',
                            fontSize: '13px',
                            cursor: 'pointer',
                          }}
                        >
                          Cancel
                        </button>
                        <button
                          onClick={saveEdit}
                          style={{
                            padding: '8px 16px',
                            background: '#3b82f6',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            fontSize: '13px',
                            fontWeight: '500',
                            cursor: 'pointer',
                          }}
                        >
                          Save
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => setIsEditing(true)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '8px 12px',
                            background: '#f3f4f6',
                            border: 'none',
                            borderRadius: '6px',
                            fontSize: '13px',
                            cursor: 'pointer',
                          }}
                        >
                          <Edit3 size={14} /> Edit
                        </button>
                        <button
                          onClick={copyTemplate}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '8px 12px',
                            background: '#f3f4f6',
                            border: 'none',
                            borderRadius: '6px',
                            fontSize: '13px',
                            cursor: 'pointer',
                          }}
                        >
                          <Copy size={14} /> Copy
                        </button>
                        <button
                          onClick={useTemplate}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '8px 16px',
                            background: '#7c3aed',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            fontSize: '13px',
                            fontWeight: '500',
                            cursor: 'pointer',
                          }}
                        >
                          <FileText size={14} /> Use Template
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {isEditing ? (
                  <textarea
                    value={editedContent}
                    onChange={(e) => setEditedContent(e.target.value)}
                    style={{
                      width: '100%',
                      minHeight: '500px',
                      padding: '16px',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      fontSize: '14px',
                      lineHeight: '1.7',
                      fontFamily: 'monospace',
                      resize: 'vertical',
                    }}
                  />
                ) : (
                  <pre
                    style={{
                      background: '#f9fafb',
                      padding: '20px',
                      borderRadius: '8px',
                      fontSize: '14px',
                      lineHeight: '1.7',
                      whiteSpace: 'pre-wrap',
                      fontFamily: 'inherit',
                      color: '#374151',
                      maxHeight: '600px',
                      overflowY: 'auto',
                    }}
                  >
                    {selectedTemplate.content}
                  </pre>
                )}
              </div>
            ) : (
              <div
                style={{
                  background: 'white',
                  borderRadius: '12px',
                  padding: '60px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                  textAlign: 'center',
                }}
              >
                <FileText
                  size={48}
                  color="#d1d5db"
                  style={{ marginBottom: '16px' }}
                />
                <h3
                  style={{
                    fontSize: '18px',
                    fontWeight: '500',
                    color: '#6b7280',
                    marginBottom: '8px',
                  }}
                >
                  Select a Template
                </h3>
                <p style={{ fontSize: '14px', color: '#9ca3af' }}>
                  Choose a template from the sidebar to preview and use
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TemplateLibraryPage;
