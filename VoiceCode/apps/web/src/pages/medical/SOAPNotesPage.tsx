/**
 * SOAP Notes Page
 * Structured clinical documentation with Subjective, Objective, Assessment, Plan sections
 */

import React, { useState, useCallback } from 'react';
import {
  FileText,
  Save,
  Copy,
  Download,
  Trash2,
  CheckCircle,
  Mic,
  MicOff,
  Sparkles,
  User,
  Calendar,
  Clock,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface SOAPNote {
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
}

interface PatientInfo {
  id: string;
  name: string;
  dob: string;
  encounterDate: string;
  provider: string;
}

const SOAPNotesPage: React.FC = () => {
  const [patientInfo, setPatientInfo] = useState<PatientInfo>({
    id: '',
    name: '',
    dob: '',
    encounterDate: new Date().toISOString().split('T')[0],
    provider: '',
  });

  const [soapNote, setSoapNote] = useState<SOAPNote>({
    subjective: '',
    objective: '',
    assessment: '',
    plan: '',
  });

  const [activeSection, setActiveSection] = useState<keyof SOAPNote | null>(
    'subjective'
  );
  const [isRecording, setIsRecording] = useState<keyof SOAPNote | null>(null);
  const [expandedSections, setExpandedSections] = useState<Set<keyof SOAPNote>>(
    new Set(['subjective', 'objective', 'assessment', 'plan'])
  );
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>(
    'idle'
  );
  const [isGenerating, setIsGenerating] = useState(false);

  const sectionConfig = {
    subjective: {
      title: 'Subjective',
      description:
        'Chief complaint, history of present illness, review of systems',
      placeholder:
        'Patient reports...\n\nChief Complaint:\n\nHistory of Present Illness:\n\nReview of Systems:',
      color: '#3b82f6',
    },
    objective: {
      title: 'Objective',
      description: 'Vital signs, physical examination findings, lab results',
      placeholder:
        'Vital Signs:\n- BP:\n- HR:\n- Temp:\n- RR:\n- SpO2:\n\nPhysical Examination:\n\nLab Results:',
      color: '#10b981',
    },
    assessment: {
      title: 'Assessment',
      description: 'Diagnosis, differential diagnoses, clinical impression',
      placeholder:
        'Primary Diagnosis:\n\nDifferential Diagnoses:\n1.\n2.\n3.\n\nClinical Impression:',
      color: '#f59e0b',
    },
    plan: {
      title: 'Plan',
      description: 'Treatment plan, medications, follow-up instructions',
      placeholder:
        'Treatment Plan:\n\nMedications:\n\nOrders:\n\nFollow-up:\n\nPatient Education:',
      color: '#8b5cf6',
    },
  };

  const toggleSection = (section: keyof SOAPNote) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const handleSectionChange = (section: keyof SOAPNote, value: string) => {
    setSoapNote((prev) => ({ ...prev, [section]: value }));
  };

  const toggleRecording = (section: keyof SOAPNote) => {
    if (isRecording === section) {
      setIsRecording(null);
    } else {
      setIsRecording(section);
      // Simulate voice input
      setTimeout(() => {
        setSoapNote((prev) => ({
          ...prev,
          [section]:
            prev[section] +
            (prev[section] ? '\n' : '') +
            '[Voice input would appear here]',
        }));
        setIsRecording(null);
      }, 2000);
    }
  };

  const generateWithAI = useCallback(async () => {
    setIsGenerating(true);
    // Simulate AI generation
    await new Promise((resolve) => setTimeout(resolve, 1500));

    setSoapNote({
      subjective: `Chief Complaint: ${patientInfo.name || 'Patient'} presents with...\n\nHistory of Present Illness:\nThe patient reports symptoms beginning approximately...\n\nReview of Systems:\n- General: No fever, fatigue, or weight changes\n- Cardiovascular: No chest pain or palpitations\n- Respiratory: No shortness of breath or cough`,
      objective: `Vital Signs:\n- BP: 120/80 mmHg\n- HR: 72 bpm\n- Temp: 98.6°F\n- RR: 16/min\n- SpO2: 98% on room air\n\nPhysical Examination:\n- General: Alert and oriented, no acute distress\n- HEENT: Normocephalic, pupils equal and reactive\n- Cardiovascular: Regular rate and rhythm, no murmurs\n- Respiratory: Clear to auscultation bilaterally`,
      assessment: `Primary Diagnosis:\n1. [Diagnosis to be determined based on findings]\n\nDifferential Diagnoses:\n1. \n2. \n3. \n\nClinical Impression:\nPatient presents with symptoms consistent with...`,
      plan: `Treatment Plan:\n1. \n2. \n\nMedications:\n- \n\nOrders:\n- Labs: CBC, BMP\n- Imaging: As indicated\n\nFollow-up:\n- Return in 2 weeks or sooner if symptoms worsen\n\nPatient Education:\n- Discussed diagnosis and treatment plan with patient\n- Patient verbalized understanding`,
    });

    setIsGenerating(false);
  }, [patientInfo.name]);

  const saveNote = useCallback(async () => {
    setSaveStatus('saving');
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setSaveStatus('saved');
    setTimeout(() => setSaveStatus('idle'), 2000);
  }, []);

  const copyNote = useCallback(() => {
    const fullNote = `SOAP NOTE
Date: ${patientInfo.encounterDate}
Patient: ${patientInfo.name} (${patientInfo.id})
Provider: ${patientInfo.provider}

SUBJECTIVE:
${soapNote.subjective}

OBJECTIVE:
${soapNote.objective}

ASSESSMENT:
${soapNote.assessment}

PLAN:
${soapNote.plan}`;

    navigator.clipboard.writeText(fullNote);
  }, [patientInfo, soapNote]);

  const downloadNote = useCallback(() => {
    const fullNote = `SOAP NOTE\nDate: ${patientInfo.encounterDate}\nPatient: ${patientInfo.name}\n\nSUBJECTIVE:\n${soapNote.subjective}\n\nOBJECTIVE:\n${soapNote.objective}\n\nASSESSMENT:\n${soapNote.assessment}\n\nPLAN:\n${soapNote.plan}`;
    const blob = new Blob([fullNote], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `soap-note-${patientInfo.id || 'draft'}-${patientInfo.encounterDate}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }, [patientInfo, soapNote]);

  const clearNote = () => {
    setSoapNote({ subjective: '', objective: '', assessment: '', plan: '' });
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb' }}>
      {/* Header */}
      <div
        style={{
          background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
          color: 'white',
          padding: '32px 24px',
        }}
      >
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              marginBottom: '8px',
            }}
          >
            <FileText size={32} />
            <h1 style={{ fontSize: '28px', fontWeight: '700' }}>SOAP Notes</h1>
          </div>
          <p style={{ fontSize: '15px', opacity: 0.9 }}>
            Structured clinical documentation with AI assistance
          </p>
        </div>
      </div>

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px' }}>
        {/* Patient Info Bar */}
        <div
          style={{
            background: 'white',
            borderRadius: '12px',
            padding: '16px 20px',
            marginBottom: '20px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            display: 'flex',
            gap: '16px',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ flex: '1', minWidth: '150px' }}>
            <label
              style={{
                fontSize: '11px',
                color: '#6b7280',
                display: 'block',
                marginBottom: '4px',
              }}
            >
              Patient ID
            </label>
            <input
              type="text"
              value={patientInfo.id}
              onChange={(e) =>
                setPatientInfo((prev) => ({ ...prev, id: e.target.value }))
              }
              placeholder="MRN"
              style={{
                width: '100%',
                padding: '8px 10px',
                border: '1px solid #e5e7eb',
                borderRadius: '6px',
                fontSize: '13px',
              }}
            />
          </div>
          <div style={{ flex: '2', minWidth: '200px' }}>
            <label
              style={{
                fontSize: '11px',
                color: '#6b7280',
                display: 'block',
                marginBottom: '4px',
              }}
            >
              Patient Name
            </label>
            <input
              type="text"
              value={patientInfo.name}
              onChange={(e) =>
                setPatientInfo((prev) => ({ ...prev, name: e.target.value }))
              }
              placeholder="Full name"
              style={{
                width: '100%',
                padding: '8px 10px',
                border: '1px solid #e5e7eb',
                borderRadius: '6px',
                fontSize: '13px',
              }}
            />
          </div>
          <div style={{ flex: '1', minWidth: '130px' }}>
            <label
              style={{
                fontSize: '11px',
                color: '#6b7280',
                display: 'block',
                marginBottom: '4px',
              }}
            >
              DOB
            </label>
            <input
              type="date"
              value={patientInfo.dob}
              onChange={(e) =>
                setPatientInfo((prev) => ({ ...prev, dob: e.target.value }))
              }
              style={{
                width: '100%',
                padding: '8px 10px',
                border: '1px solid #e5e7eb',
                borderRadius: '6px',
                fontSize: '13px',
              }}
            />
          </div>
          <div style={{ flex: '1', minWidth: '130px' }}>
            <label
              style={{
                fontSize: '11px',
                color: '#6b7280',
                display: 'block',
                marginBottom: '4px',
              }}
            >
              Encounter Date
            </label>
            <input
              type="date"
              value={patientInfo.encounterDate}
              onChange={(e) =>
                setPatientInfo((prev) => ({
                  ...prev,
                  encounterDate: e.target.value,
                }))
              }
              style={{
                width: '100%',
                padding: '8px 10px',
                border: '1px solid #e5e7eb',
                borderRadius: '6px',
                fontSize: '13px',
              }}
            />
          </div>
          <div style={{ flex: '1.5', minWidth: '180px' }}>
            <label
              style={{
                fontSize: '11px',
                color: '#6b7280',
                display: 'block',
                marginBottom: '4px',
              }}
            >
              Provider
            </label>
            <input
              type="text"
              value={patientInfo.provider}
              onChange={(e) =>
                setPatientInfo((prev) => ({
                  ...prev,
                  provider: e.target.value,
                }))
              }
              placeholder="Provider name"
              style={{
                width: '100%',
                padding: '8px 10px',
                border: '1px solid #e5e7eb',
                borderRadius: '6px',
                fontSize: '13px',
              }}
            />
          </div>
        </div>

        {/* AI Generate Button */}
        <div style={{ marginBottom: '20px' }}>
          <button
            onClick={generateWithAI}
            disabled={isGenerating}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 24px',
              background: 'linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(139, 92, 246, 0.3)',
            }}
          >
            <Sparkles size={18} />
            {isGenerating ? 'Generating...' : 'Generate Template with AI'}
          </button>
        </div>

        {/* SOAP Sections */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {(Object.keys(sectionConfig) as Array<keyof SOAPNote>).map(
            (section) => (
              <div
                key={section}
                style={{
                  background: 'white',
                  borderRadius: '12px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                  overflow: 'hidden',
                  borderLeft: `4px solid ${sectionConfig[section].color}`,
                }}
              >
                {/* Section Header */}
                <div
                  onClick={() => toggleSection(section)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '16px 20px',
                    cursor: 'pointer',
                    background: expandedSections.has(section)
                      ? '#fafafa'
                      : 'white',
                  }}
                >
                  <div>
                    <h3
                      style={{
                        fontSize: '16px',
                        fontWeight: '600',
                        color: '#1f2937',
                        marginBottom: '2px',
                      }}
                    >
                      {sectionConfig[section].title}
                    </h3>
                    <p style={{ fontSize: '12px', color: '#6b7280' }}>
                      {sectionConfig[section].description}
                    </p>
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                    }}
                  >
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleRecording(section);
                      }}
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '50%',
                        border: 'none',
                        background:
                          isRecording === section ? '#dc2626' : '#f3f4f6',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {isRecording === section ? (
                        <MicOff size={16} color="white" />
                      ) : (
                        <Mic size={16} color="#6b7280" />
                      )}
                    </button>
                    {expandedSections.has(section) ? (
                      <ChevronUp size={20} color="#6b7280" />
                    ) : (
                      <ChevronDown size={20} color="#6b7280" />
                    )}
                  </div>
                </div>

                {/* Section Content */}
                {expandedSections.has(section) && (
                  <div style={{ padding: '0 20px 20px' }}>
                    <textarea
                      value={soapNote[section]}
                      onChange={(e) =>
                        handleSectionChange(section, e.target.value)
                      }
                      placeholder={sectionConfig[section].placeholder}
                      style={{
                        width: '100%',
                        minHeight: '150px',
                        padding: '14px',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        fontSize: '14px',
                        lineHeight: '1.6',
                        resize: 'vertical',
                        fontFamily: 'inherit',
                      }}
                    />
                  </div>
                )}
              </div>
            )
          )}
        </div>

        {/* Action Bar */}
        <div
          style={{
            display: 'flex',
            gap: '12px',
            marginTop: '24px',
            padding: '20px',
            background: 'white',
            borderRadius: '12px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          }}
        >
          <button
            onClick={saveNote}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 24px',
              background: saveStatus === 'saved' ? '#059669' : '#4f46e5',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
            }}
          >
            {saveStatus === 'saving' ? (
              'Saving...'
            ) : saveStatus === 'saved' ? (
              <>
                <CheckCircle size={16} /> Saved
              </>
            ) : (
              <>
                <Save size={16} /> Save Note
              </>
            )}
          </button>
          <button
            onClick={copyNote}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 20px',
              background: '#f3f4f6',
              color: '#374151',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
            }}
          >
            <Copy size={16} /> Copy
          </button>
          <button
            onClick={downloadNote}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 20px',
              background: '#f3f4f6',
              color: '#374151',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
            }}
          >
            <Download size={16} /> Download
          </button>
          <button
            onClick={clearNote}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 20px',
              background: '#fef2f2',
              color: '#dc2626',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
              marginLeft: 'auto',
            }}
          >
            <Trash2 size={16} /> Clear All
          </button>
        </div>
      </div>
    </div>
  );
};

export default SOAPNotesPage;
