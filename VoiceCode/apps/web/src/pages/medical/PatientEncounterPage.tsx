/**
 * Patient Encounter Page
 * Complete patient visit documentation
 */

import React, { useState, useCallback } from 'react';
import {
  User,
  Calendar,
  Clock,
  Save,
  FileText,
  Heart,
  Activity,
  Thermometer,
  Stethoscope,
  Pill,
  AlertTriangle,
  CheckCircle,
  ChevronRight,
  Plus,
} from 'lucide-react';

interface VitalSigns {
  bloodPressure: string;
  heartRate: string;
  temperature: string;
  respiratoryRate: string;
  oxygenSaturation: string;
  weight: string;
  height: string;
}

interface Medication {
  name: string;
  dosage: string;
  frequency: string;
}

interface Allergy {
  allergen: string;
  reaction: string;
  severity: 'mild' | 'moderate' | 'severe';
}

const PatientEncounterPage: React.FC = () => {
  const [patientInfo, setPatientInfo] = useState({
    id: '',
    name: '',
    dob: '',
    gender: '',
    phone: '',
    email: '',
  });

  const [encounterInfo, setEncounterInfo] = useState({
    date: new Date().toISOString().split('T')[0],
    time: new Date().toTimeString().slice(0, 5),
    type: 'office-visit',
    provider: '',
    location: '',
  });

  const [vitals, setVitals] = useState<VitalSigns>({
    bloodPressure: '',
    heartRate: '',
    temperature: '',
    respiratoryRate: '',
    oxygenSaturation: '',
    weight: '',
    height: '',
  });

  const [chiefComplaint, setChiefComplaint] = useState('');
  const [historyOfPresentIllness, setHistoryOfPresentIllness] = useState('');
  const [medications, setMedications] = useState<Medication[]>([]);
  const [allergies, setAllergies] = useState<Allergy[]>([]);
  const [physicalExam, setPhysicalExam] = useState('');
  const [assessment, setAssessment] = useState('');
  const [plan, setPlan] = useState('');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>(
    'idle'
  );
  const [activeStep, setActiveStep] = useState(0);

  const steps = [
    { id: 0, name: 'Patient Info', icon: User },
    { id: 1, name: 'Vitals', icon: Activity },
    { id: 2, name: 'History', icon: FileText },
    { id: 3, name: 'Examination', icon: Stethoscope },
    { id: 4, name: 'Assessment & Plan', icon: CheckCircle },
  ];

  const addMedication = () => {
    setMedications([...medications, { name: '', dosage: '', frequency: '' }]);
  };

  const updateMedication = (
    index: number,
    field: keyof Medication,
    value: string
  ) => {
    const updated = [...medications];
    updated[index][field] = value;
    setMedications(updated);
  };

  const removeMedication = (index: number) => {
    setMedications(medications.filter((_, i) => i !== index));
  };

  const addAllergy = () => {
    setAllergies([
      ...allergies,
      { allergen: '', reaction: '', severity: 'mild' },
    ]);
  };

  const updateAllergy = (
    index: number,
    field: keyof Allergy,
    value: string
  ) => {
    const updated = [...allergies];
    (updated[index] as any)[field] = value;
    setAllergies(updated);
  };

  const removeAllergy = (index: number) => {
    setAllergies(allergies.filter((_, i) => i !== index));
  };

  const saveEncounter = useCallback(async () => {
    setSaveStatus('saving');
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setSaveStatus('saved');
    setTimeout(() => setSaveStatus('idle'), 2000);
  }, []);

  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return (
          <div>
            <h3
              style={{
                fontSize: '18px',
                fontWeight: '600',
                marginBottom: '20px',
              }}
            >
              Patient Information
            </h3>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
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
                  Patient ID / MRN
                </label>
                <input
                  type="text"
                  value={patientInfo.id}
                  onChange={(e) =>
                    setPatientInfo({ ...patientInfo, id: e.target.value })
                  }
                  style={inputStyle}
                  placeholder="Enter MRN"
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
                  Full Name
                </label>
                <input
                  type="text"
                  value={patientInfo.name}
                  onChange={(e) =>
                    setPatientInfo({ ...patientInfo, name: e.target.value })
                  }
                  style={inputStyle}
                  placeholder="Patient name"
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
                  style={inputStyle}
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
                  Gender
                </label>
                <select
                  value={patientInfo.gender}
                  onChange={(e) =>
                    setPatientInfo({ ...patientInfo, gender: e.target.value })
                  }
                  style={inputStyle}
                >
                  <option value="">Select</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
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
                  Phone
                </label>
                <input
                  type="tel"
                  value={patientInfo.phone}
                  onChange={(e) =>
                    setPatientInfo({ ...patientInfo, phone: e.target.value })
                  }
                  style={inputStyle}
                  placeholder="(555) 555-5555"
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
                  Email
                </label>
                <input
                  type="email"
                  value={patientInfo.email}
                  onChange={(e) =>
                    setPatientInfo({ ...patientInfo, email: e.target.value })
                  }
                  style={inputStyle}
                  placeholder="patient@email.com"
                />
              </div>
            </div>

            <h3
              style={{
                fontSize: '18px',
                fontWeight: '600',
                marginTop: '32px',
                marginBottom: '20px',
              }}
            >
              Encounter Details
            </h3>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr 1fr',
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
                  Date
                </label>
                <input
                  type="date"
                  value={encounterInfo.date}
                  onChange={(e) =>
                    setEncounterInfo({ ...encounterInfo, date: e.target.value })
                  }
                  style={inputStyle}
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
                  Time
                </label>
                <input
                  type="time"
                  value={encounterInfo.time}
                  onChange={(e) =>
                    setEncounterInfo({ ...encounterInfo, time: e.target.value })
                  }
                  style={inputStyle}
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
                  Visit Type
                </label>
                <select
                  value={encounterInfo.type}
                  onChange={(e) =>
                    setEncounterInfo({ ...encounterInfo, type: e.target.value })
                  }
                  style={inputStyle}
                >
                  <option value="office-visit">Office Visit</option>
                  <option value="follow-up">Follow-up</option>
                  <option value="annual-exam">Annual Exam</option>
                  <option value="urgent">Urgent Care</option>
                  <option value="telehealth">Telehealth</option>
                </select>
              </div>
            </div>
          </div>
        );

      case 1:
        return (
          <div>
            <h3
              style={{
                fontSize: '18px',
                fontWeight: '600',
                marginBottom: '20px',
              }}
            >
              Vital Signs
            </h3>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '16px',
              }}
            >
              <div style={vitalCardStyle}>
                <Heart size={20} color="#ef4444" />
                <label style={{ fontSize: '11px', color: '#6b7280' }}>
                  Blood Pressure
                </label>
                <input
                  type="text"
                  value={vitals.bloodPressure}
                  onChange={(e) =>
                    setVitals({ ...vitals, bloodPressure: e.target.value })
                  }
                  placeholder="120/80"
                  style={{ ...inputStyle, textAlign: 'center' }}
                />
                <span style={{ fontSize: '10px', color: '#9ca3af' }}>mmHg</span>
              </div>
              <div style={vitalCardStyle}>
                <Activity size={20} color="#f59e0b" />
                <label style={{ fontSize: '11px', color: '#6b7280' }}>
                  Heart Rate
                </label>
                <input
                  type="text"
                  value={vitals.heartRate}
                  onChange={(e) =>
                    setVitals({ ...vitals, heartRate: e.target.value })
                  }
                  placeholder="72"
                  style={{ ...inputStyle, textAlign: 'center' }}
                />
                <span style={{ fontSize: '10px', color: '#9ca3af' }}>bpm</span>
              </div>
              <div style={vitalCardStyle}>
                <Thermometer size={20} color="#10b981" />
                <label style={{ fontSize: '11px', color: '#6b7280' }}>
                  Temperature
                </label>
                <input
                  type="text"
                  value={vitals.temperature}
                  onChange={(e) =>
                    setVitals({ ...vitals, temperature: e.target.value })
                  }
                  placeholder="98.6"
                  style={{ ...inputStyle, textAlign: 'center' }}
                />
                <span style={{ fontSize: '10px', color: '#9ca3af' }}>°F</span>
              </div>
              <div style={vitalCardStyle}>
                <Activity size={20} color="#3b82f6" />
                <label style={{ fontSize: '11px', color: '#6b7280' }}>
                  Respiratory Rate
                </label>
                <input
                  type="text"
                  value={vitals.respiratoryRate}
                  onChange={(e) =>
                    setVitals({ ...vitals, respiratoryRate: e.target.value })
                  }
                  placeholder="16"
                  style={{ ...inputStyle, textAlign: 'center' }}
                />
                <span style={{ fontSize: '10px', color: '#9ca3af' }}>/min</span>
              </div>
              <div style={vitalCardStyle}>
                <Activity size={20} color="#8b5cf6" />
                <label style={{ fontSize: '11px', color: '#6b7280' }}>
                  SpO2
                </label>
                <input
                  type="text"
                  value={vitals.oxygenSaturation}
                  onChange={(e) =>
                    setVitals({ ...vitals, oxygenSaturation: e.target.value })
                  }
                  placeholder="98"
                  style={{ ...inputStyle, textAlign: 'center' }}
                />
                <span style={{ fontSize: '10px', color: '#9ca3af' }}>%</span>
              </div>
              <div style={vitalCardStyle}>
                <User size={20} color="#6b7280" />
                <label style={{ fontSize: '11px', color: '#6b7280' }}>
                  Weight
                </label>
                <input
                  type="text"
                  value={vitals.weight}
                  onChange={(e) =>
                    setVitals({ ...vitals, weight: e.target.value })
                  }
                  placeholder="150"
                  style={{ ...inputStyle, textAlign: 'center' }}
                />
                <span style={{ fontSize: '10px', color: '#9ca3af' }}>lbs</span>
              </div>
              <div style={vitalCardStyle}>
                <User size={20} color="#6b7280" />
                <label style={{ fontSize: '11px', color: '#6b7280' }}>
                  Height
                </label>
                <input
                  type="text"
                  value={vitals.height}
                  onChange={(e) =>
                    setVitals({ ...vitals, height: e.target.value })
                  }
                  placeholder="5'10"
                  style={{ ...inputStyle, textAlign: 'center' }}
                />
                <span style={{ fontSize: '10px', color: '#9ca3af' }}>
                  ft/in
                </span>
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div>
            <h3
              style={{
                fontSize: '18px',
                fontWeight: '600',
                marginBottom: '20px',
              }}
            >
              Medical History
            </h3>

            <div style={{ marginBottom: '24px' }}>
              <label
                style={{
                  fontSize: '13px',
                  fontWeight: '500',
                  color: '#374151',
                  display: 'block',
                  marginBottom: '8px',
                }}
              >
                Chief Complaint
              </label>
              <textarea
                value={chiefComplaint}
                onChange={(e) => setChiefComplaint(e.target.value)}
                placeholder="Primary reason for visit..."
                style={{ ...textareaStyle, minHeight: '80px' }}
              />
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label
                style={{
                  fontSize: '13px',
                  fontWeight: '500',
                  color: '#374151',
                  display: 'block',
                  marginBottom: '8px',
                }}
              >
                History of Present Illness
              </label>
              <textarea
                value={historyOfPresentIllness}
                onChange={(e) => setHistoryOfPresentIllness(e.target.value)}
                placeholder="Detailed history..."
                style={{ ...textareaStyle, minHeight: '120px' }}
              />
            </div>

            {/* Medications */}
            <div style={{ marginBottom: '24px' }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '12px',
                }}
              >
                <label
                  style={{
                    fontSize: '13px',
                    fontWeight: '500',
                    color: '#374151',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <Pill size={16} /> Current Medications
                </label>
                <button
                  onClick={addMedication}
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
                  <Plus size={14} /> Add
                </button>
              </div>
              {medications.map((med, index) => (
                <div
                  key={index}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '2fr 1fr 1fr auto',
                    gap: '8px',
                    marginBottom: '8px',
                  }}
                >
                  <input
                    type="text"
                    value={med.name}
                    onChange={(e) =>
                      updateMedication(index, 'name', e.target.value)
                    }
                    placeholder="Medication name"
                    style={inputStyle}
                  />
                  <input
                    type="text"
                    value={med.dosage}
                    onChange={(e) =>
                      updateMedication(index, 'dosage', e.target.value)
                    }
                    placeholder="Dosage"
                    style={inputStyle}
                  />
                  <input
                    type="text"
                    value={med.frequency}
                    onChange={(e) =>
                      updateMedication(index, 'frequency', e.target.value)
                    }
                    placeholder="Frequency"
                    style={inputStyle}
                  />
                  <button
                    onClick={() => removeMedication(index)}
                    style={{
                      padding: '8px',
                      background: '#fef2f2',
                      border: 'none',
                      borderRadius: '6px',
                      color: '#dc2626',
                      cursor: 'pointer',
                    }}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>

            {/* Allergies */}
            <div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '12px',
                }}
              >
                <label
                  style={{
                    fontSize: '13px',
                    fontWeight: '500',
                    color: '#374151',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <AlertTriangle size={16} /> Allergies
                </label>
                <button
                  onClick={addAllergy}
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
                  <Plus size={14} /> Add
                </button>
              </div>
              {allergies.map((allergy, index) => (
                <div
                  key={index}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '2fr 2fr 1fr auto',
                    gap: '8px',
                    marginBottom: '8px',
                  }}
                >
                  <input
                    type="text"
                    value={allergy.allergen}
                    onChange={(e) =>
                      updateAllergy(index, 'allergen', e.target.value)
                    }
                    placeholder="Allergen"
                    style={inputStyle}
                  />
                  <input
                    type="text"
                    value={allergy.reaction}
                    onChange={(e) =>
                      updateAllergy(index, 'reaction', e.target.value)
                    }
                    placeholder="Reaction"
                    style={inputStyle}
                  />
                  <select
                    value={allergy.severity}
                    onChange={(e) =>
                      updateAllergy(index, 'severity', e.target.value)
                    }
                    style={inputStyle}
                  >
                    <option value="mild">Mild</option>
                    <option value="moderate">Moderate</option>
                    <option value="severe">Severe</option>
                  </select>
                  <button
                    onClick={() => removeAllergy(index)}
                    style={{
                      padding: '8px',
                      background: '#fef2f2',
                      border: 'none',
                      borderRadius: '6px',
                      color: '#dc2626',
                      cursor: 'pointer',
                    }}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        );

      case 3:
        return (
          <div>
            <h3
              style={{
                fontSize: '18px',
                fontWeight: '600',
                marginBottom: '20px',
              }}
            >
              Physical Examination
            </h3>
            <textarea
              value={physicalExam}
              onChange={(e) => setPhysicalExam(e.target.value)}
              placeholder="General: Alert and oriented...\n\nHEENT:\n\nCardiovascular:\n\nRespiratory:\n\nAbdominal:\n\nNeurological:\n\nMusculoskeletal:\n\nSkin:"
              style={{ ...textareaStyle, minHeight: '350px' }}
            />
          </div>
        );

      case 4:
        return (
          <div>
            <h3
              style={{
                fontSize: '18px',
                fontWeight: '600',
                marginBottom: '20px',
              }}
            >
              Assessment
            </h3>
            <textarea
              value={assessment}
              onChange={(e) => setAssessment(e.target.value)}
              placeholder="Primary diagnosis...\n\nDifferential diagnoses:\n1.\n2.\n3."
              style={{
                ...textareaStyle,
                minHeight: '150px',
                marginBottom: '24px',
              }}
            />

            <h3
              style={{
                fontSize: '18px',
                fontWeight: '600',
                marginBottom: '20px',
              }}
            >
              Plan
            </h3>
            <textarea
              value={plan}
              onChange={(e) => setPlan(e.target.value)}
              placeholder="Treatment plan...\n\nMedications:\n\nOrders:\n\nFollow-up:\n\nPatient education:"
              style={{ ...textareaStyle, minHeight: '200px' }}
            />
          </div>
        );

      default:
        return null;
    }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    fontSize: '14px',
  };

  const textareaStyle: React.CSSProperties = {
    width: '100%',
    padding: '14px',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    fontSize: '14px',
    lineHeight: '1.6',
    resize: 'vertical',
    fontFamily: 'inherit',
  };

  const vitalCardStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '8px',
    padding: '16px',
    background: '#f9fafb',
    borderRadius: '12px',
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb' }}>
      {/* Header */}
      <div
        style={{
          background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
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
            <User size={32} />
            <h1 style={{ fontSize: '28px', fontWeight: '700' }}>
              Patient Encounter
            </h1>
          </div>
          <p style={{ fontSize: '15px', opacity: 0.9 }}>
            Complete visit documentation
          </p>
        </div>
      </div>

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px' }}>
        {/* Progress Steps */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: '32px',
            background: 'white',
            borderRadius: '12px',
            padding: '16px 24px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          }}
        >
          {steps.map((step, index) => (
            <button
              key={step.id}
              onClick={() => setActiveStep(step.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                background: activeStep === step.id ? '#fef2f2' : 'transparent',
                border:
                  activeStep === step.id
                    ? '2px solid #dc2626'
                    : '2px solid transparent',
                borderRadius: '8px',
                cursor: 'pointer',
                color: activeStep === step.id ? '#dc2626' : '#6b7280',
                fontWeight: activeStep === step.id ? '600' : '400',
                fontSize: '13px',
              }}
            >
              <step.icon size={18} />
              {step.name}
              {index < steps.length - 1 && (
                <ChevronRight
                  size={16}
                  style={{ marginLeft: '8px', color: '#d1d5db' }}
                />
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        <div
          style={{
            background: 'white',
            borderRadius: '12px',
            padding: '32px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            marginBottom: '24px',
          }}
        >
          {renderStepContent()}
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <button
            onClick={() => setActiveStep(Math.max(0, activeStep - 1))}
            disabled={activeStep === 0}
            style={{
              padding: '12px 24px',
              background: activeStep === 0 ? '#e5e7eb' : '#f3f4f6',
              color: activeStep === 0 ? '#9ca3af' : '#374151',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: activeStep === 0 ? 'not-allowed' : 'pointer',
            }}
          >
            Previous
          </button>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={saveEncounter}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 24px',
                background: saveStatus === 'saved' ? '#059669' : '#dc2626',
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
                  <Save size={16} /> Save Encounter
                </>
              )}
            </button>
            {activeStep < steps.length - 1 && (
              <button
                onClick={() => setActiveStep(activeStep + 1)}
                style={{
                  padding: '12px 24px',
                  background: '#374151',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                }}
              >
                Next
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientEncounterPage;
