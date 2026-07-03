/**
 * Progress Notes Page
 * Create and manage patient progress notes
 */

import React, { useState, useCallback } from 'react';
import {
  FileText,
  Save,
  Copy,
  Download,
  Mic,
  MicOff,
  Sparkles,
  Clock,
  User,
  Calendar,
  TrendingUp,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';

interface ProgressNote {
  id: string;
  patientId: string;
  patientName: string;
  date: string;
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
  followUp: string;
  status: 'draft' | 'completed' | 'signed';
}

const ProgressNotesPage: React.FC = () => {
  const [patientId, setPatientId] = useState('');
  const [patientName, setPatientName] = useState('');
  const [visitDate, setVisitDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [chiefComplaint, setChiefComplaint] = useState('');
  const [intervalHistory, setIntervalHistory] = useState('');
  const [currentMedications, setCurrentMedications] = useState('');
  const [vitalSigns, setVitalSigns] = useState('');
  const [physicalExam, setPhysicalExam] = useState('');
  const [assessment, setAssessment] = useState('');
  const [plan, setPlan] = useState('');
  const [followUp, setFollowUp] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [activeField, setActiveField] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>(
    'idle'
  );

  const toggleRecording = (field: string) => {
    if (isRecording && activeField === field) {
      setIsRecording(false);
      setActiveField(null);
    } else {
      setIsRecording(true);
      setActiveField(field);
      // Simulate dictation
      setTimeout(() => {
        const fieldSetters: Record<string, (v: string) => void> = {
          chiefComplaint: setChiefComplaint,
          intervalHistory: setIntervalHistory,
          physicalExam: setPhysicalExam,
          assessment: setAssessment,
          plan: setPlan,
        };
        if (fieldSetters[field]) {
          fieldSetters[field](
            (prev: string) => prev + '\n[Dictated content...]'
          );
        }
        setIsRecording(false);
        setActiveField(null);
      }, 2000);
    }
  };

  const generateWithAI = useCallback(async () => {
    // Simulate AI generation
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setAssessment(
      `Patient presents for follow-up of ${chiefComplaint || 'ongoing condition'}.\n\nAssessment:\n1. Primary diagnosis stable/improved/worsening\n2. Secondary conditions as noted\n\nClinical impression: Patient is responding to current treatment plan.`
    );
    setPlan(
      `1. Continue current medications\n2. Order follow-up labs as indicated\n3. Lifestyle modifications discussed\n4. Return for follow-up in 4-6 weeks\n5. Patient to call if symptoms worsen`
    );
  }, [chiefComplaint]);

  const saveNote = useCallback(async () => {
    setSaveStatus('saving');
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setSaveStatus('saved');
    setTimeout(() => setSaveStatus('idle'), 2000);
  }, []);

  const copyNote = useCallback(() => {
    const fullNote = `PROGRESS NOTE
Date: ${visitDate}
Patient: ${patientName} (MRN: ${patientId})

CHIEF COMPLAINT:
${chiefComplaint}

INTERVAL HISTORY:
${intervalHistory}

CURRENT MEDICATIONS:
${currentMedications}

VITAL SIGNS:
${vitalSigns}

PHYSICAL EXAMINATION:
${physicalExam}

ASSESSMENT:
${assessment}

PLAN:
${plan}

FOLLOW-UP:
${followUp}`;
    navigator.clipboard.writeText(fullNote);
  }, [
    patientId,
    patientName,
    visitDate,
    chiefComplaint,
    intervalHistory,
    currentMedications,
    vitalSigns,
    physicalExam,
    assessment,
    plan,
    followUp,
  ]);

  const FieldSection: React.FC<{
    title: string;
    field: string;
    value: string;
    onChange: (v: string) => void;
    placeholder: string;
    rows?: number;
  }> = ({ title, field, value, onChange, placeholder, rows = 3 }) => (
    <div style={{ marginBottom: '20px' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '8px',
        }}
      >
        <label
          style={{ fontSize: '13px', fontWeight: '600', color: '#374151' }}
        >
          {title}
        </label>
        <button
          onClick={() => toggleRecording(field)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 12px',
            background:
              isRecording && activeField === field ? '#dc2626' : '#f3f4f6',
            color: isRecording && activeField === field ? 'white' : '#6b7280',
            border: 'none',
            borderRadius: '6px',
            fontSize: '12px',
            cursor: 'pointer',
          }}
        >
          {isRecording && activeField === field ? (
            <MicOff size={14} />
          ) : (
            <Mic size={14} />
          )}
          {isRecording && activeField === field ? 'Stop' : 'Dictate'}
        </button>
      </div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        style={{
          width: '100%',
          padding: '12px',
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
          fontSize: '14px',
          lineHeight: '1.6',
          resize: 'vertical',
          fontFamily: 'inherit',
        }}
      />
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb' }}>
      {/* Header */}
      <div
        style={{
          background: 'linear-gradient(135deg, #0891b2 0%, #0e7490 100%)',
          color: 'white',
          padding: '32px 24px',
        }}
      >
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              marginBottom: '8px',
            }}
          >
            <TrendingUp size={32} />
            <h1 style={{ fontSize: '28px', fontWeight: '700' }}>
              Progress Notes
            </h1>
          </div>
          <p style={{ fontSize: '15px', opacity: 0.9 }}>
            Document patient follow-up visits and progress
          </p>
        </div>
      </div>

      <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '24px' }}>
        {/* Patient Info */}
        <div
          style={{
            background: 'white',
            borderRadius: '12px',
            padding: '20px',
            marginBottom: '20px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          }}
        >
          <h3
            style={{
              fontSize: '14px',
              fontWeight: '600',
              color: '#374151',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <User size={16} /> Patient Information
          </h3>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 2fr 1fr',
              gap: '16px',
            }}
          >
            <div>
              <label
                style={{
                  fontSize: '12px',
                  color: '#6b7280',
                  display: 'block',
                  marginBottom: '4px',
                }}
              >
                MRN
              </label>
              <input
                type="text"
                value={patientId}
                onChange={(e) => setPatientId(e.target.value)}
                placeholder="Patient ID"
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '14px',
                }}
              />
            </div>
            <div>
              <label
                style={{
                  fontSize: '12px',
                  color: '#6b7280',
                  display: 'block',
                  marginBottom: '4px',
                }}
              >
                Patient Name
              </label>
              <input
                type="text"
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
                placeholder="Full name"
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '14px',
                }}
              />
            </div>
            <div>
              <label
                style={{
                  fontSize: '12px',
                  color: '#6b7280',
                  display: 'block',
                  marginBottom: '4px',
                }}
              >
                Visit Date
              </label>
              <input
                type="date"
                value={visitDate}
                onChange={(e) => setVisitDate(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '14px',
                }}
              />
            </div>
          </div>
        </div>

        {/* Note Content */}
        <div
          style={{
            background: 'white',
            borderRadius: '12px',
            padding: '24px',
            marginBottom: '20px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          }}
        >
          <FieldSection
            title="Chief Complaint / Reason for Visit"
            field="chiefComplaint"
            value={chiefComplaint}
            onChange={setChiefComplaint}
            placeholder="Patient presents for..."
          />
          <FieldSection
            title="Interval History"
            field="intervalHistory"
            value={intervalHistory}
            onChange={setIntervalHistory}
            placeholder="Since last visit, patient reports..."
            rows={4}
          />
          <FieldSection
            title="Current Medications"
            field="currentMedications"
            value={currentMedications}
            onChange={setCurrentMedications}
            placeholder="1. Medication - dose - frequency"
            rows={4}
          />

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '20px',
            }}
          >
            <div>
              <label
                style={{
                  fontSize: '13px',
                  fontWeight: '600',
                  color: '#374151',
                  display: 'block',
                  marginBottom: '8px',
                }}
              >
                Vital Signs
              </label>
              <textarea
                value={vitalSigns}
                onChange={(e) => setVitalSigns(e.target.value)}
                placeholder="BP: /  HR:  Temp:  RR:  SpO2:"
                rows={4}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '14px',
                  resize: 'vertical',
                }}
              />
            </div>
            <div>
              <label
                style={{
                  fontSize: '13px',
                  fontWeight: '600',
                  color: '#374151',
                  display: 'block',
                  marginBottom: '8px',
                }}
              >
                Physical Examination
              </label>
              <textarea
                value={physicalExam}
                onChange={(e) => setPhysicalExam(e.target.value)}
                placeholder="General appearance, focused exam findings..."
                rows={4}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '14px',
                  resize: 'vertical',
                }}
              />
            </div>
          </div>

          {/* AI Generate Button */}
          <div style={{ margin: '20px 0' }}>
            <button
              onClick={generateWithAI}
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
              }}
            >
              <Sparkles size={18} /> Generate Assessment & Plan with AI
            </button>
          </div>

          <FieldSection
            title="Assessment"
            field="assessment"
            value={assessment}
            onChange={setAssessment}
            placeholder="Clinical assessment and diagnoses..."
            rows={5}
          />
          <FieldSection
            title="Plan"
            field="plan"
            value={plan}
            onChange={setPlan}
            placeholder="Treatment plan, orders, follow-up..."
            rows={5}
          />

          <div>
            <label
              style={{
                fontSize: '13px',
                fontWeight: '600',
                color: '#374151',
                display: 'block',
                marginBottom: '8px',
              }}
            >
              Follow-Up
            </label>
            <input
              type="text"
              value={followUp}
              onChange={(e) => setFollowUp(e.target.value)}
              placeholder="Return in X weeks, sooner if..."
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '14px',
              }}
            />
          </div>
        </div>

        {/* Actions */}
        <div
          style={{
            display: 'flex',
            gap: '12px',
            background: 'white',
            borderRadius: '12px',
            padding: '20px',
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
              background: saveStatus === 'saved' ? '#059669' : '#0891b2',
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
            <Download size={16} /> Export PDF
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProgressNotesPage;
