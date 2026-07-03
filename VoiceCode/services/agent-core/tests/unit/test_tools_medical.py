"""
Unit tests for Medical Tools
"""

import pytest
from unittest.mock import MagicMock, patch

from src.tools.medical_tools import (
    generate_soap_note_handler,
    generate_progress_note_handler,
    generate_discharge_summary_handler,
    extract_billing_codes_handler,
    ehr_sync_handler,
    get_medical_tools,
)


class TestGenerateSOAPNote:
    """Tests for SOAP note generation."""

    def test_generate_soap_note_returns_structure(self):
        """Test that SOAP note has correct structure."""
        result = generate_soap_note_handler(
            transcript_id="trans_123",
            _user_id="user_123",
        )

        assert "soap_note" in result
        soap = result["soap_note"]
        assert "subjective" in soap
        assert "objective" in soap
        assert "assessment" in soap
        assert "plan" in soap

    def test_generate_soap_note_includes_metadata(self):
        """Test that result includes metadata."""
        result = generate_soap_note_handler(
            transcript_id="trans_456",
            _user_id="user_123",
        )

        assert result["transcript_id"] == "trans_456"
        assert "generated_at" in result

    def test_generate_soap_note_with_patient_info(self):
        """Test SOAP note with patient info context."""
        patient_info = {"name": "John Doe", "dob": "1990-01-15"}
        result = generate_soap_note_handler(
            transcript_id="trans_789",
            patient_info=patient_info,
            _user_id="user_123",
        )

        assert "soap_note" in result

    def test_soap_note_sections_not_empty(self):
        """Test that SOAP sections have content."""
        result = generate_soap_note_handler(
            transcript_id="trans_123",
            _user_id="user_123",
        )

        soap = result["soap_note"]
        assert len(soap["subjective"]) > 0
        assert len(soap["objective"]) > 0
        assert len(soap["assessment"]) > 0
        assert len(soap["plan"]) > 0


class TestGenerateProgressNote:
    """Tests for progress note generation."""

    def test_generate_progress_note_structure(self):
        """Test progress note structure."""
        result = generate_progress_note_handler(
            transcript_id="trans_123",
            _user_id="user_123",
        )

        assert "note" in result
        note = result["note"]
        assert "type" in note
        assert "chief_complaint" in note
        assert "assessment" in note
        assert "plan" in note

    def test_generate_progress_note_type(self):
        """Test custom note type."""
        result = generate_progress_note_handler(
            transcript_id="trans_123",
            note_type="follow_up",
            _user_id="user_123",
        )

        assert result["note"]["type"] == "follow_up"

    def test_progress_note_includes_medications(self):
        """Test that progress note includes medications."""
        result = generate_progress_note_handler(
            transcript_id="trans_123",
            _user_id="user_123",
        )

        assert "current_medications" in result["note"]
        assert isinstance(result["note"]["current_medications"], list)

    def test_progress_note_includes_vitals(self):
        """Test that progress note includes vital signs."""
        result = generate_progress_note_handler(
            transcript_id="trans_123",
            _user_id="user_123",
        )

        assert "vital_signs" in result["note"]


class TestGenerateDischargeSummary:
    """Tests for discharge summary generation."""

    def test_discharge_summary_structure(self):
        """Test discharge summary structure."""
        result = generate_discharge_summary_handler(
            transcript_id="trans_123",
            _user_id="user_123",
        )

        assert "discharge_summary" in result
        ds = result["discharge_summary"]
        assert "admission_date" in ds
        assert "discharge_date" in ds
        assert "admitting_diagnosis" in ds
        assert "discharge_diagnosis" in ds

    def test_discharge_summary_includes_hospital_course(self):
        """Test that hospital course is included."""
        result = generate_discharge_summary_handler(
            transcript_id="trans_123",
            _user_id="user_123",
        )

        ds = result["discharge_summary"]
        assert "hospital_course" in ds
        assert len(ds["hospital_course"]) > 0

    def test_discharge_summary_includes_medications(self):
        """Test discharge medications are included."""
        result = generate_discharge_summary_handler(
            transcript_id="trans_123",
            _user_id="user_123",
        )

        ds = result["discharge_summary"]
        assert "discharge_medications" in ds
        assert isinstance(ds["discharge_medications"], list)

    def test_discharge_summary_includes_follow_up(self):
        """Test follow-up instructions are included."""
        result = generate_discharge_summary_handler(
            transcript_id="trans_123",
            _user_id="user_123",
        )

        ds = result["discharge_summary"]
        assert "follow_up_instructions" in ds
        assert isinstance(ds["follow_up_instructions"], list)


class TestExtractBillingCodes:
    """Tests for billing code extraction."""

    def test_extract_billing_codes_returns_codes(self):
        """Test that billing codes are returned."""
        result = extract_billing_codes_handler(
            transcript_id="trans_123",
            _user_id="user_123",
        )

        assert "icd10_codes" in result
        assert "cpt_codes" in result

    def test_billing_codes_have_descriptions(self):
        """Test that codes have descriptions."""
        result = extract_billing_codes_handler(
            transcript_id="trans_123",
            _user_id="user_123",
        )

        for code in result["icd10_codes"]:
            assert "code" in code
            assert "description" in code

        for code in result["cpt_codes"]:
            assert "code" in code
            assert "description" in code

    def test_billing_codes_include_confidence(self):
        """Test that confidence score is included."""
        result = extract_billing_codes_handler(
            transcript_id="trans_123",
            _user_id="user_123",
        )

        assert "confidence" in result
        assert 0 <= result["confidence"] <= 1

    def test_billing_codes_requires_review_flag(self):
        """Test requires_review flag is present."""
        result = extract_billing_codes_handler(
            transcript_id="trans_123",
            _user_id="user_123",
        )

        assert "requires_review" in result
        assert isinstance(result["requires_review"], bool)


class TestEHRSync:
    """Tests for EHR synchronization."""

    def test_ehr_sync_default_system(self):
        """Test EHR sync with default system."""
        result = ehr_sync_handler(
            note_id="note_123",
            _user_id="user_123",
        )

        assert result["ehr_system"] == "epic"
        assert result["note_id"] == "note_123"
        assert result["status"] == "queued"

    def test_ehr_sync_custom_system(self):
        """Test EHR sync with custom system."""
        result = ehr_sync_handler(
            note_id="note_456",
            ehr_system="cerner",
            _user_id="user_123",
        )

        assert result["ehr_system"] == "cerner"

    def test_ehr_sync_returns_message(self):
        """Test that sync returns a message."""
        result = ehr_sync_handler(
            note_id="note_789",
            ehr_system="allscripts",
            _user_id="user_123",
        )

        assert "message" in result
        assert "allscripts" in result["message"].lower()


class TestGetMedicalTools:
    """Tests for medical tool collection."""

    def test_get_medical_tools_returns_list(self):
        """Test that tool collection is returned."""
        tools = get_medical_tools()

        assert isinstance(tools, list)
        assert len(tools) >= 4  # At least 4 medical tools

    def test_get_medical_tools_are_callable(self):
        """Test that all tools are callable."""
        tools = get_medical_tools()

        for tool in tools:
            assert callable(tool)
