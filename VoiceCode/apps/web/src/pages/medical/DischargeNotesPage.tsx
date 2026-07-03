/**
 * Discharge Notes Page
 * Create discharge summaries and instructions
 */

import React, { useState, useCallback } from 'react';
import {
  LogOut,
  Save,
  Copy,
  Download,
  Printer,
  Sparkles,
  User,
  Calendar,
  Pill,
  AlertTriangle,
  FileText,
  CheckCircle,
  Clock,
} from 'lucide-react';

const DischargeNotesPage: React.FC = () => {
  const [patientInfo, setPatientInfo] = useState({
    name: '',
    mrn: '',
    dob: '',
    admitDate: '',
    dischargeDate: new Date().toISOString().split('T')[0],
    attendingPhysician: '',
    primaryDiagnosis: '',
  });

  const [hospitalCourse, setHospitalCourse] = useState('');
  const [procedures, setProcedures] = useState('');
  const [dischargeDiagnoses, setDischargeDiagnoses] = useState('');
  const [dischargeMedications, setDischargeMedications] = useState('');
  const [discontinuedMedications, setDiscontinuedMedications] = useState('');
  const [followUpInstructions, setFollowUpInstructions] = useState('');
  const [activityRestrictions, setActivityRestrictions] = useState('');
  const [dietInstructions, setDietInstructions] = useState('');
  const [warningSignsToWatch, setWarningSignsToWatch] = useState('');
  const [patientEducation, setPatientEducation] = useState('');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>(
    'idle'
  );

  const generateWithAI = useCallback(async () => {
    await new Promise((resolve) => setTimeout(resolve, 1500));

    setWarningSignsToWatch(`Return to the emergency department or call your doctor immediately if you experience:
• Fever greater than 101°F (38.3°C)
• Increasing pain not relieved by medication
• Difficulty breathing or shortness of breath
• Signs of infection: redness, swelling, drainage at incision site
• Nausea/vomiting preventing medication intake
• Any other concerning symptoms`);

    setPatientEducation(`The following was discussed with the patient/family:
• Diagnosis and hospital course
• Discharge medications and their purpose
• Activity restrictions and timeline
• Follow-up appointments
• Warning signs requiring immediate attention
• Contact information for questions

Patient/family verbalized understanding of discharge instructions.`);
  }, []);

  const saveNote = useCallback(async () => {
    setSaveStatus('saving');
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setSaveStatus('saved');
    setTimeout(() => setSaveStatus('idle'), 2000);
  }, []);

  const printSummary = () => {
    window.print();
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb' }}>
      {/* Header */}
      <div
        style={{
          background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
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
            <LogOut size={32} />
            <h1 style={{ fontSize: '28px', fontWeight: '700' }}>
              Discharge Summary
            </h1>
          </div>
          <p style={{ fontSize: '15px', opacity: 0.9 }}>
            Create comprehensive discharge documentation
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
            <User size={16} /> Patient & Admission Information
          </h3>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
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
                Patient Name
              </label>
              <input
                type="text"
                value={patientInfo.name}
                onChange={(e) =>
                  setPatientInfo({ ...patientInfo, name: e.target.value })
                }
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
                MRN
              </label>
              <input
                type="text"
                value={patientInfo.mrn}
                onChange={(e) =>
                  setPatientInfo({ ...patientInfo, mrn: e.target.value })
                }
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
                Date of Birth
              </label>
              <input
                type="date"
                value={patientInfo.dob}
                onChange={(e) =>
                  setPatientInfo({ ...patientInfo, dob: e.target.value })
                }
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
                Admission Date
              </label>
              <input
                type="date"
                value={patientInfo.admitDate}
                onChange={(e) =>
                  setPatientInfo({ ...patientInfo, admitDate: e.target.value })
                }
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
                Discharge Date
              </label>
              <input
                type="date"
                value={patientInfo.dischargeDate}
                onChange={(e) =>
                  setPatientInfo({
                    ...patientInfo,
                    dischargeDate: e.target.value,
                  })
                }
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
                Attending Physician
              </label>
              <input
                type="text"
                value={patientInfo.attendingPhysician}
                onChange={(e) =>
                  setPatientInfo({
                    ...patientInfo,
                    attendingPhysician: e.target.value,
                  })
                }
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
          <div style={{ marginTop: '16px' }}>
            <label
              style={{
                fontSize: '12px',
                color: '#6b7280',
                display: 'block',
                marginBottom: '4px',
              }}
            >
              Primary Diagnosis
            </label>
            <input
              type="text"
              value={patientInfo.primaryDiagnosis}
              onChange={(e) =>
                setPatientInfo({
                  ...patientInfo,
                  primaryDiagnosis: e.target.value,
                })
              }
              placeholder="Primary admission diagnosis"
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

        {/* Hospital Course */}
        <div
          style={{
            background: 'white',
            borderRadius: '12px',
            padding: '24px',
            marginBottom: '20px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          }}
        >
          <h3
            style={{
              fontSize: '14px',
              fontWeight: '600',
              color: '#374151',
              marginBottom: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <FileText size={16} /> Hospital Course
          </h3>
          <textarea
            value={hospitalCourse}
            onChange={(e) => setHospitalCourse(e.target.value)}
            placeholder="Summarize the patient's hospital stay, treatments, and response to therapy..."
            rows={6}
            style={{
              width: '100%',
              padding: '14px',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              fontSize: '14px',
              lineHeight: '1.6',
              resize: 'vertical',
            }}
          />
        </div>

        {/* Procedures & Diagnoses */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '20px',
            marginBottom: '20px',
          }}
        >
          <div
            style={{
              background: 'white',
              borderRadius: '12px',
              padding: '24px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            }}
          >
            <h3
              style={{
                fontSize: '14px',
                fontWeight: '600',
                color: '#374151',
                marginBottom: '12px',
              }}
            >
              Procedures Performed
            </h3>
            <textarea
              value={procedures}
              onChange={(e) => setProcedures(e.target.value)}
              placeholder="1. Procedure - Date&#10;2. Procedure - Date"
              rows={5}
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
          <div
            style={{
              background: 'white',
              borderRadius: '12px',
              padding: '24px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            }}
          >
            <h3
              style={{
                fontSize: '14px',
                fontWeight: '600',
                color: '#374151',
                marginBottom: '12px',
              }}
            >
              Discharge Diagnoses
            </h3>
            <textarea
              value={dischargeDiagnoses}
              onChange={(e) => setDischargeDiagnoses(e.target.value)}
              placeholder="1. Primary diagnosis&#10;2. Secondary diagnoses"
              rows={5}
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

        {/* Medications */}
        <div
          style={{
            background: 'white',
            borderRadius: '12px',
            padding: '24px',
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
            <Pill size={16} /> Medications
          </h3>
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
                  fontWeight: '500',
                  color: '#374151',
                  display: 'block',
                  marginBottom: '8px',
                }}
              >
                Discharge Medications
              </label>
              <textarea
                value={dischargeMedications}
                onChange={(e) => setDischargeMedications(e.target.value)}
                placeholder="1. Medication - Dose - Frequency - Duration&#10;2. Medication - Dose - Frequency - Duration"
                rows={6}
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
                  fontWeight: '500',
                  color: '#374151',
                  display: 'block',
                  marginBottom: '8px',
                }}
              >
                Discontinued Medications
              </label>
              <textarea
                value={discontinuedMedications}
                onChange={(e) => setDiscontinuedMedications(e.target.value)}
                placeholder="Medications stopped during hospitalization..."
                rows={6}
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
        </div>

        {/* Instructions */}
        <div
          style={{
            background: 'white',
            borderRadius: '12px',
            padding: '24px',
            marginBottom: '20px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
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
              style={{ fontSize: '14px', fontWeight: '600', color: '#374151' }}
            >
              Discharge Instructions
            </h3>
            <button
              onClick={generateWithAI}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 16px',
                background: 'linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: '500',
                cursor: 'pointer',
              }}
            >
              <Sparkles size={14} /> Generate with AI
            </button>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label
              style={{
                fontSize: '13px',
                fontWeight: '500',
                color: '#374151',
                display: 'block',
                marginBottom: '8px',
              }}
            >
              Follow-Up Appointments
            </label>
            <textarea
              value={followUpInstructions}
              onChange={(e) => setFollowUpInstructions(e.target.value)}
              placeholder="• PCP: Dr. Name - Date/Time&#10;• Specialist: Dr. Name - Date/Time"
              rows={3}
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

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '16px',
              marginBottom: '16px',
            }}
          >
            <div>
              <label
                style={{
                  fontSize: '13px',
                  fontWeight: '500',
                  color: '#374151',
                  display: 'block',
                  marginBottom: '8px',
                }}
              >
                Activity Restrictions
              </label>
              <textarea
                value={activityRestrictions}
                onChange={(e) => setActivityRestrictions(e.target.value)}
                placeholder="Lifting restrictions, driving, return to work..."
                rows={3}
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
                  fontWeight: '500',
                  color: '#374151',
                  display: 'block',
                  marginBottom: '8px',
                }}
              >
                Diet Instructions
              </label>
              <textarea
                value={dietInstructions}
                onChange={(e) => setDietInstructions(e.target.value)}
                placeholder="Dietary modifications, restrictions..."
                rows={3}
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

          <div style={{ marginBottom: '16px' }}>
            <label
              style={{
                fontSize: '13px',
                fontWeight: '500',
                color: '#dc2626',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                marginBottom: '8px',
              }}
            >
              <AlertTriangle size={14} /> Warning Signs - When to Seek Care
            </label>
            <textarea
              value={warningSignsToWatch}
              onChange={(e) => setWarningSignsToWatch(e.target.value)}
              placeholder="Symptoms requiring immediate medical attention..."
              rows={4}
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #fecaca',
                borderRadius: '8px',
                fontSize: '14px',
                resize: 'vertical',
                background: '#fef2f2',
              }}
            />
          </div>

          <div>
            <label
              style={{
                fontSize: '13px',
                fontWeight: '500',
                color: '#374151',
                display: 'block',
                marginBottom: '8px',
              }}
            >
              Patient Education
            </label>
            <textarea
              value={patientEducation}
              onChange={(e) => setPatientEducation(e.target.value)}
              placeholder="Education provided to patient/family..."
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
              background: saveStatus === 'saved' ? '#059669' : '#f59e0b',
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
                <Save size={16} /> Save
              </>
            )}
          </button>
          <button
            onClick={printSummary}
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
            <Printer size={16} /> Print
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
            <Copy size={16} /> Copy
          </button>
        </div>
      </div>
    </div>
  );
};

export default DischargeNotesPage;
