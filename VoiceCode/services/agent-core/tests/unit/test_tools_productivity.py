"""
Unit tests for Productivity Tools
"""

import pytest
from unittest.mock import MagicMock, patch

from src.tools.productivity_tools import (
    summarize_transcript_handler,
    extract_action_items_handler,
    extract_key_points_handler,
    generate_meeting_minutes_handler,
    extract_decisions_handler,
    get_productivity_tools,
)


class TestSummarizeTranscript:
    """Tests for transcript summarization."""

    def test_summarize_returns_summary(self):
        """Test that summary is returned."""
        result = summarize_transcript_handler(
            transcript_id="trans_123",
            _user_id="user_123",
        )

        assert "summary" in result
        assert len(result["summary"]) > 0

    def test_summarize_with_length_option(self):
        """Test summary with length option."""
        result = summarize_transcript_handler(
            transcript_id="trans_123",
            length="short",
            _user_id="user_123",
        )

        assert "summary" in result
        assert result["length"] == "short"

    def test_summarize_includes_metadata(self):
        """Test that metadata is included."""
        result = summarize_transcript_handler(
            transcript_id="trans_456",
            _user_id="user_123",
        )

        assert result["transcript_id"] == "trans_456"
        assert "word_count" in result

    def test_summarize_long_length(self):
        """Test long summary length."""
        result = summarize_transcript_handler(
            transcript_id="trans_123",
            length="long",
            _user_id="user_123",
        )

        assert "summary" in result
        assert result["length"] == "long"


class TestExtractActionItems:
    """Tests for action item extraction."""

    def test_extract_action_items_returns_list(self):
        """Test that action items are returned as a list."""
        result = extract_action_items_handler(
            transcript_id="trans_123",
            _user_id="user_123",
        )

        assert "action_items" in result
        assert isinstance(result["action_items"], list)

    def test_action_items_have_structure(self):
        """Test action item structure."""
        result = extract_action_items_handler(
            transcript_id="trans_123",
            _user_id="user_123",
        )

        if result["action_items"]:
            item = result["action_items"][0]
            assert "task" in item
            assert "assignee" in item
            assert "priority" in item

    def test_action_items_include_count(self):
        """Test that count is included."""
        result = extract_action_items_handler(
            transcript_id="trans_123",
            _user_id="user_123",
        )

        assert "total_items" in result
        assert result["total_items"] == len(result["action_items"])

    def test_action_items_priority_levels(self):
        """Test priority level assignment."""
        result = extract_action_items_handler(
            transcript_id="trans_123",
            _user_id="user_123",
        )

        valid_priorities = ["high", "medium", "low"]
        for item in result["action_items"]:
            assert item["priority"] in valid_priorities


class TestExtractKeyPoints:
    """Tests for key point extraction."""

    def test_extract_key_points_returns_list(self):
        """Test that key points are returned."""
        result = extract_key_points_handler(
            transcript_id="trans_123",
            _user_id="user_123",
        )

        assert "key_points" in result
        assert isinstance(result["key_points"], list)

    def test_key_points_default_limit(self):
        """Test default key points limit."""
        result = extract_key_points_handler(
            transcript_id="trans_123",
            _user_id="user_123",
        )

        assert len(result["key_points"]) <= 10

    def test_key_points_custom_limit(self):
        """Test custom key points limit."""
        result = extract_key_points_handler(
            transcript_id="trans_123",
            max_points=5,
            _user_id="user_123",
        )

        assert "key_points" in result

    def test_key_points_have_content(self):
        """Test that key points have content."""
        result = extract_key_points_handler(
            transcript_id="trans_123",
            _user_id="user_123",
        )

        for point in result["key_points"]:
            assert len(point) > 0


class TestGenerateMeetingMinutes:
    """Tests for meeting minutes generation."""

    def test_generate_minutes_structure(self):
        """Test meeting minutes structure."""
        result = generate_meeting_minutes_handler(
            transcript_id="trans_123",
            _user_id="user_123",
        )

        assert "meeting_minutes" in result
        minutes = result["meeting_minutes"]
        assert "title" in minutes
        assert "date" in minutes
        assert "attendees" in minutes

    def test_minutes_include_agenda(self):
        """Test that agenda is included."""
        result = generate_meeting_minutes_handler(
            transcript_id="trans_123",
            _user_id="user_123",
        )

        minutes = result["meeting_minutes"]
        assert "agenda_items" in minutes
        assert isinstance(minutes["agenda_items"], list)

    def test_minutes_include_discussion(self):
        """Test that discussion summary is included."""
        result = generate_meeting_minutes_handler(
            transcript_id="trans_123",
            _user_id="user_123",
        )

        minutes = result["meeting_minutes"]
        assert "discussion_summary" in minutes

    def test_minutes_include_action_items(self):
        """Test that action items are included in minutes."""
        result = generate_meeting_minutes_handler(
            transcript_id="trans_123",
            _user_id="user_123",
        )

        minutes = result["meeting_minutes"]
        assert "action_items" in minutes
        assert isinstance(minutes["action_items"], list)

    def test_minutes_include_next_meeting(self):
        """Test that next meeting is included."""
        result = generate_meeting_minutes_handler(
            transcript_id="trans_123",
            _user_id="user_123",
        )

        minutes = result["meeting_minutes"]
        assert "next_meeting" in minutes

    def test_minutes_include_format(self):
        """Test that format is included in result."""
        result = generate_meeting_minutes_handler(
            transcript_id="trans_123",
            format="executive",
            _user_id="user_123",
        )

        assert result["format"] == "executive"


class TestExtractDecisions:
    """Tests for decision extraction."""

    def test_extract_decisions_returns_list(self):
        """Test that decisions are returned."""
        result = extract_decisions_handler(
            transcript_id="trans_123",
            _user_id="user_123",
        )

        assert "decisions" in result
        assert isinstance(result["decisions"], list)

    def test_decisions_have_structure(self):
        """Test decision structure."""
        result = extract_decisions_handler(
            transcript_id="trans_123",
            _user_id="user_123",
        )

        if result["decisions"]:
            decision = result["decisions"][0]
            assert "decision" in decision
            assert "context" in decision

    def test_decisions_include_made_by(self):
        """Test that decisions include who made them."""
        result = extract_decisions_handler(
            transcript_id="trans_123",
            _user_id="user_123",
        )

        if result["decisions"]:
            decision = result["decisions"][0]
            assert "made_by" in decision


class TestGetProductivityTools:
    """Tests for productivity tool collection."""

    def test_get_productivity_tools_returns_list(self):
        """Test that tool collection is returned."""
        tools = get_productivity_tools()

        assert isinstance(tools, list)
        assert len(tools) >= 4

    def test_get_productivity_tools_are_callable(self):
        """Test that all tools are callable."""
        tools = get_productivity_tools()

        for tool in tools:
            assert callable(tool)
