"""
VoiceCode Agent Core - Medical Documentation Tools
Tools for SOAP notes, clinical documentation, and EHR integration
"""

from typing import Optional, Literal
from langchain_core.tools import tool
from pydantic import BaseModel, Field

from .registry import register_tool


class SOAPNote(BaseModel):
    """SOAP note structure."""
    subjective: str
    objective: str
    assessment: str
    plan: str
    patient_id: Optional[str] = None
    encounter_date: Optional[str] = None


class ClinicalNote(BaseModel):
    """Generic clinical note."""
    note_type: str
    content: str
    patient_id: Optional[str] = None
    provider_id: Optional[str] = None


# Tool implementations
def generate_soap_note_handler(
    transcript_id: str,
    patient_info: Optional[dict] = None,
    _user_id: str = "",
    _context: dict = None,
) -> dict:
    """Generate SOAP note from transcript."""
    # In production, this would use AI to analyze transcript
    return {
        "soap_note": {
            "subjective": "Patient reports persistent headache for 3 days, described as throbbing, rated 6/10. No nausea or visual disturbances. OTC pain relievers provide partial relief.",
            "objective": "Vital signs: BP 120/80, HR 72, Temp 98.6°F. Alert and oriented. No photophobia. Neck supple, no meningeal signs.",
            "assessment": "Tension-type headache, likely stress-related.",
            "plan": "1. Continue OTC analgesics as needed\n2. Stress management techniques\n3. Follow up in 1 week if symptoms persist\n4. Return immediately if fever, vision changes, or severe symptoms develop.",
        },
        "transcript_id": transcript_id,
        "generated_at": "2024-01-15T10:30:00Z",
    }


def generate_progress_note_handler(
    transcript_id: str,
    note_type: str = "progress",
    _user_id: str = "",
    _context: dict = None,
) -> dict:
    """Generate progress note from transcript."""
    return {
        "note": {
            "type": note_type,
            "chief_complaint": "Follow-up for hypertension management",
            "interval_history": "Patient reports good medication compliance. No side effects noted.",
            "current_medications": ["Lisinopril 10mg daily", "Aspirin 81mg daily"],
            "vital_signs": {"bp": "128/82", "hr": "70", "weight": "185 lbs"},
            "assessment": "Hypertension, well-controlled on current regimen",
            "plan": "Continue current medications. Recheck BP in 3 months.",
        },
        "transcript_id": transcript_id,
    }


def generate_discharge_summary_handler(
    transcript_id: str,
    admission_info: Optional[dict] = None,
    _user_id: str = "",
    _context: dict = None,
) -> dict:
    """Generate discharge summary from transcript."""
    return {
        "discharge_summary": {
            "admission_date": "2024-01-10",
            "discharge_date": "2024-01-15",
            "admitting_diagnosis": "Community-acquired pneumonia",
            "discharge_diagnosis": "Community-acquired pneumonia, resolved",
            "hospital_course": "Patient was admitted with fever, cough, and shortness of breath. Treated with IV antibiotics x 3 days, then transitioned to oral. Symptoms improved significantly.",
            "discharge_medications": [
                "Amoxicillin-clavulanate 875mg BID x 5 more days",
                "Acetaminophen PRN for fever",
            ],
            "follow_up_instructions": [
                "Follow up with PCP in 1 week",
                "Return to ED if fever returns or breathing worsens",
                "Complete full course of antibiotics",
            ],
            "activity_restrictions": "Light activity for 1 week, then resume normal activities as tolerated",
        },
        "transcript_id": transcript_id,
    }


def extract_billing_codes_handler(
    transcript_id: str,
    _user_id: str = "",
    _context: dict = None,
) -> dict:
    """Extract potential billing codes from transcript."""
    return {
        "icd10_codes": [
            {"code": "J18.9", "description": "Pneumonia, unspecified organism"},
            {"code": "R05.9", "description": "Cough, unspecified"},
        ],
        "cpt_codes": [
            {"code": "99214", "description": "Office visit, established patient, moderate complexity"},
        ],
        "confidence": 0.85,
        "requires_review": True,
    }


def ehr_sync_handler(
    note_id: str,
    ehr_system: str = "epic",
    _user_id: str = "",
    _context: dict = None,
) -> dict:
    """Sync note to EHR system."""
    return {
        "status": "queued",
        "ehr_system": ehr_system,
        "note_id": note_id,
        "message": f"Note queued for sync to {ehr_system.upper()}",
    }


# LangChain tool definitions
@tool
def generate_soap_note(transcript_id: str) -> str:
    """Generate a SOAP note from a patient encounter transcript.
    
    Args:
        transcript_id: ID of the transcript to analyze
    
    Returns:
        Formatted SOAP note
    """
    result = generate_soap_note_handler(transcript_id)
    soap = result["soap_note"]
    return f"""**SOAP Note**

**Subjective:**
{soap['subjective']}

**Objective:**
{soap['objective']}

**Assessment:**
{soap['assessment']}

**Plan:**
{soap['plan']}
"""


@tool
def generate_progress_note(transcript_id: str) -> str:
    """Generate a progress note from a follow-up visit transcript.
    
    Args:
        transcript_id: ID of the transcript to analyze
    
    Returns:
        Formatted progress note
    """
    result = generate_progress_note_handler(transcript_id)
    note = result["note"]
    meds = "\n".join(f"  - {m}" for m in note["current_medications"])
    return f"""**Progress Note**

**Chief Complaint:** {note['chief_complaint']}

**Interval History:** {note['interval_history']}

**Current Medications:**
{meds}

**Vital Signs:** BP {note['vital_signs']['bp']}, HR {note['vital_signs']['hr']}

**Assessment:** {note['assessment']}

**Plan:** {note['plan']}
"""


@tool
def generate_discharge_summary(transcript_id: str) -> str:
    """Generate a discharge summary from hospitalization notes.
    
    Args:
        transcript_id: ID of the transcript to analyze
    
    Returns:
        Formatted discharge summary
    """
    result = generate_discharge_summary_handler(transcript_id)
    ds = result["discharge_summary"]
    meds = "\n".join(f"  - {m}" for m in ds["discharge_medications"])
    instructions = "\n".join(f"  - {i}" for i in ds["follow_up_instructions"])
    return f"""**Discharge Summary**

**Admission Date:** {ds['admission_date']}
**Discharge Date:** {ds['discharge_date']}

**Admitting Diagnosis:** {ds['admitting_diagnosis']}
**Discharge Diagnosis:** {ds['discharge_diagnosis']}

**Hospital Course:**
{ds['hospital_course']}

**Discharge Medications:**
{meds}

**Follow-up Instructions:**
{instructions}

**Activity:** {ds['activity_restrictions']}
"""


@tool
def suggest_billing_codes(transcript_id: str) -> str:
    """Suggest ICD-10 and CPT billing codes based on the encounter.
    
    Args:
        transcript_id: ID of the transcript to analyze
    
    Returns:
        Suggested billing codes
    """
    result = extract_billing_codes_handler(transcript_id)
    icd = "\n".join(f"  - {c['code']}: {c['description']}" for c in result["icd10_codes"])
    cpt = "\n".join(f"  - {c['code']}: {c['description']}" for c in result["cpt_codes"])
    return f"""**Suggested Billing Codes**

**ICD-10 Diagnoses:**
{icd}

**CPT Procedures:**
{cpt}

*Confidence: {result['confidence']*100:.0f}% - Please verify before submission*
"""


@tool
def sync_to_ehr(note_id: str, ehr_system: str = "epic") -> str:
    """Sync a clinical note to the EHR system.
    
    Args:
        note_id: ID of the note to sync
        ehr_system: Target EHR system (epic, cerner, allscripts)
    
    Returns:
        Sync status
    """
    result = ehr_sync_handler(note_id, ehr_system)
    return f"Note {note_id} queued for sync to {ehr_system.upper()}. Status: {result['status']}"


def get_medical_tools():
    """Get all medical documentation LangChain tools."""
    return [
        generate_soap_note,
        generate_progress_note,
        generate_discharge_summary,
        suggest_billing_codes,
        sync_to_ehr,
    ]


# Register tools in the global registry
def _register_medical_tools():
    register_tool(
        name="generate_soap_note",
        description="Generate a SOAP note from a patient encounter transcript",
        parameters={
            "type": "object",
            "properties": {
                "transcript_id": {"type": "string", "description": "Transcript ID"},
                "patient_info": {"type": "object", "description": "Optional patient info"},
            },
            "required": ["transcript_id"],
        },
        handler=generate_soap_note_handler,
        category="medical",
    )
    
    register_tool(
        name="generate_progress_note",
        description="Generate a progress note from a follow-up visit",
        parameters={
            "type": "object",
            "properties": {
                "transcript_id": {"type": "string", "description": "Transcript ID"},
                "note_type": {"type": "string", "description": "Type of progress note"},
            },
            "required": ["transcript_id"],
        },
        handler=generate_progress_note_handler,
        category="medical",
    )
    
    register_tool(
        name="generate_discharge_summary",
        description="Generate a discharge summary from hospitalization notes",
        parameters={
            "type": "object",
            "properties": {
                "transcript_id": {"type": "string", "description": "Transcript ID"},
            },
            "required": ["transcript_id"],
        },
        handler=generate_discharge_summary_handler,
        category="medical",
    )


_register_medical_tools()
