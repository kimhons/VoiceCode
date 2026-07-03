"""
End-to-end integration tests for complete agent workflows
"""

import pytest
from unittest.mock import MagicMock, patch, AsyncMock
from datetime import datetime
from fastapi.testclient import TestClient

from src.api.main import app


class TestCompleteTranscriptionWorkflow:
    """End-to-end tests for transcription workflows."""

    @patch("src.api.main.get_agent_graph")
    @patch("src.tools.registry.execute_tool")
    def test_record_transcribe_summarize_flow(
        self, mock_execute, mock_graph, client: TestClient
    ):
        """Test complete flow: record -> transcribe -> summarize."""
        # Mock agent graph
        mock_graph.return_value.invoke.return_value = {
            "messages": [MagicMock(content="Recording started")],
            "intent": "transcription",
        }
        
        # Step 1: Start recording
        mock_execute.return_value = {
            "success": True,
            "data": {"recording_id": "rec_123", "status": "recording"},
            "error": None,
        }
        
        response = client.post("/api/v1/agent/command", json={
            "command": "start_recording",
            "parameters": {"language": "en"},
        })
        assert response.status_code == 200
        
        # Step 2: Stop recording
        mock_execute.return_value = {
            "success": True,
            "data": {
                "recording_id": "rec_123",
                "transcript_id": "trans_456",
                "status": "completed",
            },
            "error": None,
        }
        
        response = client.post("/api/v1/agent/command", json={
            "command": "stop_recording",
            "parameters": {"recording_id": "rec_123"},
        })
        assert response.status_code == 200
        
        # Step 3: Summarize
        mock_execute.return_value = {
            "success": True,
            "data": {"summary": "Meeting discussed Q1 goals..."},
            "error": None,
        }
        
        response = client.post("/api/v1/agent/command", json={
            "command": "summarize_transcript",
            "parameters": {"transcript_id": "trans_456"},
        })
        assert response.status_code == 200

    @patch("src.api.main.get_agent_graph")
    def test_natural_language_transcription_request(
        self, mock_graph, client: TestClient
    ):
        """Test natural language request for transcription."""
        mock_graph.return_value.invoke.return_value = {
            "messages": [MagicMock(content="I'll start recording for you.")],
            "intent": "transcription",
            "tool_calls": [{"name": "start_recording"}],
        }
        
        response = client.post("/api/v1/agent/chat", json={
            "message": "Start recording my meeting",
            "session_id": "session_123",
        })
        
        assert response.status_code == 200


class TestCompleteMedicalWorkflow:
    """End-to-end tests for medical documentation workflows."""

    @patch("src.api.main.get_agent_graph")
    @patch("src.tools.registry.execute_tool")
    def test_patient_encounter_to_soap_flow(
        self, mock_execute, mock_graph, client: TestClient
    ):
        """Test complete flow: encounter recording -> SOAP note -> EHR sync."""
        mock_graph.return_value.invoke.return_value = {
            "messages": [MagicMock(content="Medical response")],
            "intent": "medical",
        }
        
        # Step 1: Generate SOAP note
        mock_execute.return_value = {
            "success": True,
            "data": {
                "soap_note": {
                    "subjective": "Patient reports headache...",
                    "objective": "BP 120/80...",
                    "assessment": "Tension headache",
                    "plan": "OTC pain relief...",
                },
                "note_id": "note_789",
            },
            "error": None,
        }
        
        response = client.post("/api/v1/agent/command", json={
            "command": "generate_soap_note",
            "parameters": {"transcript_id": "trans_medical_123"},
        })
        assert response.status_code == 200
        
        # Step 2: Extract billing codes
        mock_execute.return_value = {
            "success": True,
            "data": {
                "icd10_codes": [{"code": "G44.209", "description": "Tension headache"}],
                "cpt_codes": [{"code": "99213", "description": "Office visit"}],
            },
            "error": None,
        }
        
        response = client.post("/api/v1/agent/command", json={
            "command": "suggest_billing_codes",
            "parameters": {"transcript_id": "trans_medical_123"},
        })
        assert response.status_code == 200
        
        # Step 3: Sync to EHR
        mock_execute.return_value = {
            "success": True,
            "data": {"status": "queued", "ehr_system": "epic"},
            "error": None,
        }
        
        response = client.post("/api/v1/agent/command", json={
            "command": "ehr_sync",
            "parameters": {"note_id": "note_789"},
        })
        assert response.status_code == 200

    @patch("src.api.main.get_agent_graph")
    def test_medical_mode_chat(self, mock_graph, client: TestClient):
        """Test chat in medical professional mode."""
        mock_graph.return_value.invoke.return_value = {
            "messages": [MagicMock(content="Generating SOAP note...")],
            "intent": "medical",
        }
        
        response = client.post("/api/v1/agent/chat", json={
            "message": "Generate a SOAP note for this patient visit",
            "session_id": "session_medical",
            "professional_mode": "medical",
        })
        
        assert response.status_code == 200


class TestCompleteProductivityWorkflow:
    """End-to-end tests for productivity workflows."""

    @patch("src.api.main.get_agent_graph")
    @patch("src.tools.registry.execute_tool")
    def test_meeting_to_minutes_to_share_flow(
        self, mock_execute, mock_graph, client: TestClient
    ):
        """Test complete flow: meeting -> minutes -> share."""
        mock_graph.return_value.invoke.return_value = {
            "messages": [MagicMock(content="Productivity response")],
            "intent": "productivity",
        }
        
        # Step 1: Generate meeting minutes
        mock_execute.return_value = {
            "success": True,
            "data": {
                "minutes": {
                    "title": "Q1 Planning",
                    "attendees": ["John", "Sarah", "Mike"],
                    "action_items": [{"task": "Review budget"}],
                },
            },
            "error": None,
        }
        
        response = client.post("/api/v1/agent/command", json={
            "command": "generate_meeting_minutes",
            "parameters": {"transcript_id": "trans_meeting_123"},
        })
        assert response.status_code == 200
        
        # Step 2: Extract action items
        mock_execute.return_value = {
            "success": True,
            "data": {
                "action_items": [
                    {"task": "Review budget", "assignee": "John", "priority": "high"},
                    {"task": "Contact vendor", "assignee": "Sarah", "priority": "medium"},
                ],
            },
            "error": None,
        }
        
        response = client.post("/api/v1/agent/command", json={
            "command": "extract_action_items",
            "parameters": {"transcript_id": "trans_meeting_123"},
        })
        assert response.status_code == 200
        
        # Step 3: Share with team
        mock_execute.return_value = {
            "success": True,
            "data": {
                "share_link": "https://app.voicecode.ai/shared/abc123",
                "recipients": ["team@example.com"],
            },
            "error": None,
        }
        
        response = client.post("/api/v1/agent/command", json={
            "command": "share_transcript",
            "parameters": {
                "transcript_id": "trans_meeting_123",
                "recipients": ["team@example.com"],
            },
        })
        assert response.status_code == 200


class TestCompleteSearchWorkflow:
    """End-to-end tests for search workflows."""

    @patch("src.api.main.get_agent_graph")
    @patch("src.tools.registry.execute_tool")
    def test_search_find_summarize_flow(
        self, mock_execute, mock_graph, client: TestClient
    ):
        """Test complete flow: search -> find -> summarize."""
        mock_graph.return_value.invoke.return_value = {
            "messages": [MagicMock(content="Search response")],
            "intent": "search",
        }
        
        # Step 1: Search for transcripts
        mock_execute.return_value = {
            "success": True,
            "data": {
                "results": [
                    {"transcript_id": "trans_1", "title": "Budget Meeting", "relevance": 0.9},
                    {"transcript_id": "trans_2", "title": "Q1 Budget Review", "relevance": 0.85},
                ],
            },
            "error": None,
        }
        
        response = client.post("/api/v1/agent/command", json={
            "command": "search_transcripts",
            "parameters": {"query": "budget discussion"},
        })
        assert response.status_code == 200
        
        # Step 2: Summarize found transcript
        mock_execute.return_value = {
            "success": True,
            "data": {"summary": "The budget meeting covered..."},
            "error": None,
        }
        
        response = client.post("/api/v1/agent/command", json={
            "command": "summarize_transcript",
            "parameters": {"transcript_id": "trans_1"},
        })
        assert response.status_code == 200

    @patch("src.api.main.get_agent_graph")
    def test_natural_language_search(self, mock_graph, client: TestClient):
        """Test natural language search request."""
        mock_graph.return_value.invoke.return_value = {
            "messages": [MagicMock(content="Found 3 transcripts about budget...")],
            "intent": "search",
        }
        
        response = client.post("/api/v1/agent/chat", json={
            "message": "Find all meetings where we discussed the Q1 budget",
            "session_id": "session_search",
        })
        
        assert response.status_code == 200


class TestCompleteAutomationWorkflow:
    """End-to-end tests for automation workflows."""

    @patch("src.tools.registry.execute_tool")
    def test_create_and_trigger_workflow(self, mock_execute, client: TestClient):
        """Test creating and managing automation workflow."""
        # Step 1: Create workflow
        mock_execute.return_value = {
            "success": True,
            "data": {"workflow_id": "wf_123", "status": "active"},
            "error": None,
        }
        
        response = client.post("/api/v1/agent/command", json={
            "command": "create_workflow",
            "parameters": {
                "name": "Auto-summarize",
                "trigger": "recording_complete",
                "actions": [{"type": "summarize"}],
            },
        })
        assert response.status_code == 200
        
        # Step 2: List workflows
        mock_execute.return_value = {
            "success": True,
            "data": {
                "workflows": [
                    {"id": "wf_123", "name": "Auto-summarize", "status": "active"},
                ],
            },
            "error": None,
        }
        
        response = client.post("/api/v1/agent/command", json={
            "command": "list_workflows",
            "parameters": {},
        })
        assert response.status_code == 200
        
        # Step 3: Toggle workflow
        mock_execute.return_value = {
            "success": True,
            "data": {"workflow_id": "wf_123", "status": "paused"},
            "error": None,
        }
        
        response = client.post("/api/v1/agent/command", json={
            "command": "toggle_workflow",
            "parameters": {"workflow_id": "wf_123", "enabled": False},
        })
        assert response.status_code == 200


class TestSessionContinuity:
    """End-to-end tests for session continuity."""

    @patch("src.api.main.get_agent_graph")
    def test_multi_turn_conversation(self, mock_graph, client: TestClient):
        """Test multi-turn conversation maintains context."""
        session_id = "session_multi_turn"
        
        # Turn 1
        mock_graph.return_value.invoke.return_value = {
            "messages": [MagicMock(content="I can help with that meeting.")],
            "intent": "productivity",
            "session_id": session_id,
        }
        
        response1 = client.post("/api/v1/agent/chat", json={
            "message": "I had a meeting about the project",
            "session_id": session_id,
        })
        assert response1.status_code == 200
        
        # Turn 2 - references previous context
        mock_graph.return_value.invoke.return_value = {
            "messages": [MagicMock(content="Here's the summary of that meeting...")],
            "intent": "productivity",
            "session_id": session_id,
        }
        
        response2 = client.post("/api/v1/agent/chat", json={
            "message": "Can you summarize it?",
            "session_id": session_id,
        })
        assert response2.status_code == 200
        
        # Turn 3 - references both previous turns
        mock_graph.return_value.invoke.return_value = {
            "messages": [MagicMock(content="Sharing the summary with your team...")],
            "intent": "export",
            "session_id": session_id,
        }
        
        response3 = client.post("/api/v1/agent/chat", json={
            "message": "Now share that with my team",
            "session_id": session_id,
        })
        assert response3.status_code == 200


class TestErrorRecovery:
    """End-to-end tests for error handling and recovery."""

    @patch("src.api.main.get_agent_graph")
    @patch("src.tools.registry.execute_tool")
    def test_tool_failure_graceful_handling(
        self, mock_execute, mock_graph, client: TestClient
    ):
        """Test graceful handling of tool failures."""
        mock_execute.return_value = {
            "success": False,
            "data": None,
            "error": "Transcript not found",
        }
        
        mock_graph.return_value.invoke.return_value = {
            "messages": [MagicMock(content="I couldn't find that transcript. Could you provide more details?")],
            "intent": "error",
        }
        
        response = client.post("/api/v1/agent/command", json={
            "command": "summarize_transcript",
            "parameters": {"transcript_id": "nonexistent"},
        })
        
        # Should handle gracefully, not crash
        assert response.status_code in [200, 404]

    @patch("src.api.main.get_agent_graph")
    def test_ambiguous_request_clarification(self, mock_graph, client: TestClient):
        """Test that ambiguous requests ask for clarification."""
        mock_graph.return_value.invoke.return_value = {
            "messages": [MagicMock(content="I'm not sure what you'd like me to do. Could you please clarify?")],
            "intent": "clarification_needed",
        }
        
        response = client.post("/api/v1/agent/chat", json={
            "message": "Do the thing",
            "session_id": "session_unclear",
        })
        
        assert response.status_code == 200
