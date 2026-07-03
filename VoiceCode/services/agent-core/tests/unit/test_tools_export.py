"""
Unit tests for Export Tools
"""

import pytest
from unittest.mock import MagicMock, patch

from src.tools.export_tools import (
    export_transcript_handler,
    export_summary_handler,
    share_transcript_handler,
    generate_share_link_handler,
    send_to_integration_handler,
    export_meeting_minutes_handler,
    get_export_tools,
)


class TestExportTranscript:
    """Tests for transcript export."""

    def test_export_transcript_default_format(self):
        """Test export with default PDF format."""
        result = export_transcript_handler(
            transcript_id="trans_123",
            _user_id="user_123",
        )

        assert result["format"] == "pdf"
        assert "download_url" in result

    def test_export_transcript_custom_format(self):
        """Test export with custom format."""
        result = export_transcript_handler(
            transcript_id="trans_123",
            format="docx",
            _user_id="user_123",
        )

        assert result["format"] == "docx"
        assert ".docx" in result["download_url"]

    def test_export_transcript_includes_url(self):
        """Test that download URL is included."""
        result = export_transcript_handler(
            transcript_id="trans_456",
            _user_id="user_123",
        )

        assert "download_url" in result
        assert "trans_456" in result["download_url"]

    def test_export_transcript_includes_expiry(self):
        """Test that expiry time is included."""
        result = export_transcript_handler(
            transcript_id="trans_123",
            _user_id="user_123",
        )

        assert "expires_at" in result

    def test_export_transcript_all_formats(self):
        """Test all supported export formats."""
        formats = ["pdf", "docx", "txt", "md", "json"]
        
        for fmt in formats:
            result = export_transcript_handler(
                transcript_id="trans_123",
                format=fmt,
                _user_id="user_123",
            )
            assert result["format"] == fmt


class TestExportSummary:
    """Tests for summary export."""

    def test_export_summary_returns_url(self):
        """Test that summary export returns URL."""
        result = export_summary_handler(
            transcript_id="trans_123",
            _user_id="user_123",
        )

        assert "download_url" in result

    def test_export_summary_default_sections(self):
        """Test default sections included."""
        result = export_summary_handler(
            transcript_id="trans_123",
            _user_id="user_123",
        )

        assert "sections" in result
        assert result["sections"]["summary"] is True

    def test_export_summary_with_action_items(self):
        """Test including action items."""
        result = export_summary_handler(
            transcript_id="trans_123",
            include_action_items=True,
            _user_id="user_123",
        )

        assert result["sections"]["action_items"] is True

    def test_export_summary_with_key_points(self):
        """Test including key points."""
        result = export_summary_handler(
            transcript_id="trans_123",
            include_key_points=True,
            _user_id="user_123",
        )

        assert result["sections"]["key_points"] is True


class TestShareTranscript:
    """Tests for transcript sharing."""

    def test_share_transcript_returns_link(self):
        """Test that sharing returns a link."""
        result = share_transcript_handler(
            transcript_id="trans_123",
            recipients=["user@example.com"],
            _user_id="user_123",
        )

        assert "share_link" in result

    def test_share_transcript_includes_recipients(self):
        """Test that recipients are included."""
        recipients = ["a@test.com", "b@test.com"]
        result = share_transcript_handler(
            transcript_id="trans_123",
            recipients=recipients,
            _user_id="user_123",
        )

        assert result["recipients"] == recipients

    def test_share_transcript_default_permissions(self):
        """Test default view permissions."""
        result = share_transcript_handler(
            transcript_id="trans_123",
            recipients=["user@test.com"],
            _user_id="user_123",
        )

        assert result["permissions"] == "view"

    def test_share_transcript_edit_permissions(self):
        """Test edit permissions."""
        result = share_transcript_handler(
            transcript_id="trans_123",
            recipients=["user@test.com"],
            permissions="edit",
            _user_id="user_123",
        )

        assert result["permissions"] == "edit"

    def test_share_transcript_message(self):
        """Test share confirmation message."""
        result = share_transcript_handler(
            transcript_id="trans_123",
            recipients=["user@test.com", "other@test.com"],
            _user_id="user_123",
        )

        assert "message" in result
        assert "2" in result["message"]  # 2 recipients


class TestGenerateShareLink:
    """Tests for share link generation."""

    def test_generate_share_link_returns_link(self):
        """Test that link is generated."""
        result = generate_share_link_handler(
            transcript_id="trans_123",
            _user_id="user_123",
        )

        assert "share_link" in result
        assert "http" in result["share_link"]

    def test_generate_share_link_default_expiry(self):
        """Test default expiry of 7 days."""
        result = generate_share_link_handler(
            transcript_id="trans_123",
            _user_id="user_123",
        )

        assert result["expires_in_days"] == 7

    def test_generate_share_link_custom_expiry(self):
        """Test custom expiry."""
        result = generate_share_link_handler(
            transcript_id="trans_123",
            expires_in_days=30,
            _user_id="user_123",
        )

        assert result["expires_in_days"] == 30

    def test_generate_share_link_no_password(self):
        """Test link without password."""
        result = generate_share_link_handler(
            transcript_id="trans_123",
            require_password=False,
            _user_id="user_123",
        )

        assert result["password_protected"] is False
        assert result["password"] is None

    def test_generate_share_link_with_password(self):
        """Test link with password."""
        result = generate_share_link_handler(
            transcript_id="trans_123",
            require_password=True,
            _user_id="user_123",
        )

        assert result["password_protected"] is True
        assert result["password"] is not None


class TestSendToIntegration:
    """Tests for integration sending."""

    def test_send_to_slack(self):
        """Test sending to Slack."""
        result = send_to_integration_handler(
            transcript_id="trans_123",
            integration="slack",
            destination="#general",
            _user_id="user_123",
        )

        assert result["integration"] == "slack"
        assert result["status"] == "sent"

    def test_send_to_notion(self):
        """Test sending to Notion."""
        result = send_to_integration_handler(
            transcript_id="trans_123",
            integration="notion",
            _user_id="user_123",
        )

        assert result["integration"] == "notion"

    def test_send_includes_message(self):
        """Test that message is included."""
        result = send_to_integration_handler(
            transcript_id="trans_123",
            integration="slack",
            destination="#team",
            _user_id="user_123",
        )

        assert "message" in result
        assert "slack" in result["message"].lower()


class TestExportMeetingMinutes:
    """Tests for meeting minutes export."""

    def test_export_minutes_pdf(self):
        """Test PDF export."""
        result = export_meeting_minutes_handler(
            transcript_id="trans_123",
            format="pdf",
            _user_id="user_123",
        )

        assert result["format"] == "pdf"
        assert "download_url" in result

    def test_export_minutes_docx(self):
        """Test DOCX export."""
        result = export_meeting_minutes_handler(
            transcript_id="trans_123",
            format="docx",
            _user_id="user_123",
        )

        assert result["format"] == "docx"

    def test_export_minutes_includes_sections(self):
        """Test that sections are listed."""
        result = export_meeting_minutes_handler(
            transcript_id="trans_123",
            _user_id="user_123",
        )

        assert "sections" in result
        assert "attendees" in result["sections"]
        assert "action_items" in result["sections"]

    def test_export_minutes_with_recipients(self):
        """Test email export with recipients."""
        recipients = ["team@example.com"]
        result = export_meeting_minutes_handler(
            transcript_id="trans_123",
            format="email",
            recipients=recipients,
            _user_id="user_123",
        )

        assert result["sent_to"] == recipients


class TestGetExportTools:
    """Tests for export tool collection."""

    def test_get_export_tools_returns_list(self):
        """Test that tool collection is returned."""
        tools = get_export_tools()

        assert isinstance(tools, list)
        assert len(tools) >= 5

    def test_get_export_tools_are_callable(self):
        """Test that all tools are callable."""
        tools = get_export_tools()

        for tool in tools:
            assert callable(tool)
