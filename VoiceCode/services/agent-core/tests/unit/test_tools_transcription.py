"""
Unit tests for Transcription Tools
"""

import pytest
from unittest.mock import MagicMock, patch

from src.tools.transcription_tools import (
    start_recording_handler,
    stop_recording_handler,
    get_transcript_handler,
    edit_transcript_handler,
    list_transcripts_handler,
    get_recording_status_handler,
    get_transcription_tools,
)


class TestStartRecording:
    """Tests for start_recording tool."""

    def test_start_recording_default_params(self):
        """Test starting recording with default parameters."""
        result = start_recording_handler(_user_id="user_123")

        assert "recording_id" in result
        assert result["status"] == "recording"
        assert result["language"] == "en"
        assert result["speaker_detection"] is True
        assert "user_123" in result["recording_id"]

    def test_start_recording_custom_language(self):
        """Test starting recording with custom language."""
        result = start_recording_handler(
            language="es",
            speaker_detection=False,
            _user_id="user_456",
        )

        assert result["language"] == "es"
        assert result["speaker_detection"] is False

    def test_start_recording_generates_unique_id(self):
        """Test that each recording gets a unique ID."""
        result1 = start_recording_handler(_user_id="user_1")
        result2 = start_recording_handler(_user_id="user_2")

        assert result1["recording_id"] != result2["recording_id"]


class TestStopRecording:
    """Tests for stop_recording tool."""

    def test_stop_recording_success(self):
        """Test stopping a recording."""
        result = stop_recording_handler(
            recording_id="rec_123",
            _user_id="user_123",
        )

        assert result["recording_id"] == "rec_123"
        assert result["status"] == "completed"
        assert "transcript_id" in result
        assert "duration_seconds" in result

    def test_stop_recording_creates_transcript(self):
        """Test that stopping creates a transcript reference."""
        result = stop_recording_handler(
            recording_id="rec_abc",
            _user_id="user_123",
        )

        assert result["transcript_id"].startswith("trans_")
        assert "rec_abc" in result["transcript_id"]


class TestGetTranscript:
    """Tests for get_transcript tool."""

    def test_get_transcript_returns_content(self):
        """Test retrieving a transcript."""
        result = get_transcript_handler(
            transcript_id="trans_123",
            _user_id="user_123",
        )

        assert result["id"] == "trans_123"
        assert "content" in result
        assert "duration_seconds" in result
        assert "word_count" in result
        assert "language" in result

    def test_get_transcript_includes_metadata(self):
        """Test that transcript includes metadata."""
        result = get_transcript_handler(
            transcript_id="trans_xyz",
            _user_id="user_123",
        )

        assert "created_at" in result


class TestEditTranscript:
    """Tests for edit_transcript tool."""

    def test_edit_transcript_single_edit(self):
        """Test applying a single edit."""
        edits = [{"type": "replace", "old": "hello", "new": "hi"}]
        result = edit_transcript_handler(
            transcript_id="trans_123",
            edits=edits,
            _user_id="user_123",
        )

        assert result["transcript_id"] == "trans_123"
        assert result["edits_applied"] == 1
        assert result["status"] == "updated"

    def test_edit_transcript_multiple_edits(self):
        """Test applying multiple edits."""
        edits = [
            {"type": "replace", "old": "hello", "new": "hi"},
            {"type": "replace", "old": "world", "new": "everyone"},
            {"type": "delete", "text": "um"},
        ]
        result = edit_transcript_handler(
            transcript_id="trans_123",
            edits=edits,
            _user_id="user_123",
        )

        assert result["edits_applied"] == 3

    def test_edit_transcript_empty_edits(self):
        """Test with no edits."""
        result = edit_transcript_handler(
            transcript_id="trans_123",
            edits=[],
            _user_id="user_123",
        )

        assert result["edits_applied"] == 0


class TestListTranscripts:
    """Tests for list_transcripts tool."""

    def test_list_transcripts_default(self):
        """Test listing transcripts with defaults."""
        result = list_transcripts_handler(_user_id="user_123")

        assert "transcripts" in result
        assert "total" in result
        assert result["limit"] == 10
        assert result["offset"] == 0

    def test_list_transcripts_pagination(self):
        """Test pagination parameters."""
        result = list_transcripts_handler(
            limit=5,
            offset=10,
            _user_id="user_123",
        )

        assert result["limit"] == 5
        assert result["offset"] == 10

    def test_list_transcripts_with_search(self):
        """Test listing with search query."""
        result = list_transcripts_handler(
            search_query="meeting",
            _user_id="user_123",
        )

        assert "transcripts" in result


class TestRecordingStatus:
    """Tests for get_recording_status tool."""

    def test_recording_status_not_recording(self):
        """Test status when not recording."""
        result = get_recording_status_handler(_user_id="user_123")

        assert result["is_recording"] is False
        assert result["recording_id"] is None
        assert result["duration_seconds"] == 0


class TestGetTranscriptionTools:
    """Tests for tool collection."""

    def test_get_transcription_tools_returns_list(self):
        """Test that tool collection is returned."""
        tools = get_transcription_tools()

        assert isinstance(tools, list)
        assert len(tools) > 0

    def test_get_transcription_tools_are_callable(self):
        """Test that all tools are callable."""
        tools = get_transcription_tools()

        for tool in tools:
            assert callable(tool)
