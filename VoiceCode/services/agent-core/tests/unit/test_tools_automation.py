"""
Unit tests for Automation Tools
"""

import pytest
from unittest.mock import MagicMock, patch

from src.tools.automation_tools import (
    create_workflow_handler,
    list_workflows_handler,
    toggle_workflow_handler,
    schedule_recording_handler,
    list_scheduled_recordings_handler,
    list_integrations_handler,
    get_automation_tools,
)


class TestCreateWorkflow:
    """Tests for workflow creation."""

    def test_create_workflow_returns_id(self):
        """Test that workflow creation returns ID."""
        result = create_workflow_handler(
            name="Auto-summarize",
            trigger="recording_complete",
            actions=[{"type": "summarize"}],
            _user_id="user_123",
        )

        assert "workflow_id" in result
        assert result["workflow_id"].startswith("wf_")

    def test_create_workflow_includes_name(self):
        """Test that workflow name is included."""
        result = create_workflow_handler(
            name="Test Workflow",
            trigger="manual",
            actions=[],
            _user_id="user_123",
        )

        assert result["name"] == "Test Workflow"

    def test_create_workflow_status(self):
        """Test that workflow starts active."""
        result = create_workflow_handler(
            name="New Workflow",
            trigger="schedule",
            actions=[],
            _user_id="user_123",
        )

        assert result["status"] == "active"

    def test_create_workflow_includes_trigger(self):
        """Test that trigger is included."""
        result = create_workflow_handler(
            name="Scheduled Task",
            trigger="schedule:daily",
            actions=[{"type": "export"}],
            _user_id="user_123",
        )

        assert result["trigger"] == "schedule:daily"


class TestListWorkflows:
    """Tests for workflow listing."""

    def test_list_workflows_returns_list(self):
        """Test that workflows are returned as list."""
        result = list_workflows_handler(_user_id="user_123")

        assert "workflows" in result
        assert isinstance(result["workflows"], list)

    def test_list_workflows_includes_total(self):
        """Test that total is included."""
        result = list_workflows_handler(_user_id="user_123")

        assert "total" in result
        assert result["total"] == len(result["workflows"])

    def test_list_workflows_structure(self):
        """Test workflow structure."""
        result = list_workflows_handler(_user_id="user_123")

        if result["workflows"]:
            wf = result["workflows"][0]
            assert "id" in wf
            assert "name" in wf
            assert "trigger" in wf
            assert "status" in wf


class TestToggleWorkflow:
    """Tests for workflow toggling."""

    def test_toggle_workflow_enable(self):
        """Test enabling a workflow."""
        result = toggle_workflow_handler(
            workflow_id="wf_123",
            enabled=True,
            _user_id="user_123",
        )

        assert result["workflow_id"] == "wf_123"
        assert result["status"] == "active"

    def test_toggle_workflow_disable(self):
        """Test disabling a workflow."""
        result = toggle_workflow_handler(
            workflow_id="wf_456",
            enabled=False,
            _user_id="user_123",
        )

        assert result["status"] == "paused"

    def test_toggle_workflow_message(self):
        """Test toggle message."""
        result = toggle_workflow_handler(
            workflow_id="wf_789",
            enabled=True,
            _user_id="user_123",
        )

        assert "message" in result


class TestScheduleRecording:
    """Tests for recording scheduling."""

    def test_schedule_recording_returns_id(self):
        """Test that schedule ID is returned."""
        result = schedule_recording_handler(
            title="Team Meeting",
            scheduled_time="2024-02-01T10:00:00Z",
            _user_id="user_123",
        )

        assert "schedule_id" in result
        assert result["schedule_id"].startswith("sched_")

    def test_schedule_recording_includes_title(self):
        """Test that title is included."""
        result = schedule_recording_handler(
            title="Planning Session",
            scheduled_time="2024-02-01T14:00:00Z",
            _user_id="user_123",
        )

        assert result["title"] == "Planning Session"

    def test_schedule_recording_default_duration(self):
        """Test default duration."""
        result = schedule_recording_handler(
            title="Quick Sync",
            scheduled_time="2024-02-01T09:00:00Z",
            _user_id="user_123",
        )

        assert result["duration_minutes"] == 60

    def test_schedule_recording_custom_duration(self):
        """Test custom duration."""
        result = schedule_recording_handler(
            title="Long Meeting",
            scheduled_time="2024-02-01T13:00:00Z",
            duration_minutes=120,
            _user_id="user_123",
        )

        assert result["duration_minutes"] == 120

    def test_schedule_recording_with_url(self):
        """Test scheduling with meeting URL."""
        result = schedule_recording_handler(
            title="Zoom Call",
            scheduled_time="2024-02-01T15:00:00Z",
            meeting_url="https://zoom.us/j/123456",
            _user_id="user_123",
        )

        assert result["meeting_url"] == "https://zoom.us/j/123456"


class TestListScheduledRecordings:
    """Tests for scheduled recording listing."""

    def test_list_scheduled_returns_list(self):
        """Test that scheduled recordings are returned."""
        result = list_scheduled_recordings_handler(_user_id="user_123")

        assert "scheduled_recordings" in result
        assert isinstance(result["scheduled_recordings"], list)

    def test_list_scheduled_includes_total(self):
        """Test that total is included."""
        result = list_scheduled_recordings_handler(_user_id="user_123")

        assert "total" in result

    def test_list_scheduled_structure(self):
        """Test scheduled recording structure."""
        result = list_scheduled_recordings_handler(_user_id="user_123")

        if result["scheduled_recordings"]:
            rec = result["scheduled_recordings"][0]
            assert "id" in rec
            assert "title" in rec
            assert "scheduled_time" in rec
            assert "status" in rec


class TestListIntegrations:
    """Tests for integration listing."""

    def test_list_integrations_returns_list(self):
        """Test that integrations are returned."""
        result = list_integrations_handler(_user_id="user_123")

        assert "integrations" in result
        assert isinstance(result["integrations"], list)

    def test_list_integrations_structure(self):
        """Test integration structure."""
        result = list_integrations_handler(_user_id="user_123")

        if result["integrations"]:
            intg = result["integrations"][0]
            assert "service" in intg
            assert "status" in intg

    def test_list_integrations_status_values(self):
        """Test integration status values."""
        result = list_integrations_handler(_user_id="user_123")

        valid_statuses = ["connected", "disconnected", "pending"]
        for intg in result["integrations"]:
            assert intg["status"] in valid_statuses


class TestGetAutomationTools:
    """Tests for automation tool collection."""

    def test_get_automation_tools_returns_list(self):
        """Test that tool collection is returned."""
        tools = get_automation_tools()

        assert isinstance(tools, list)
        assert len(tools) >= 5

    def test_get_automation_tools_are_callable(self):
        """Test that all tools are callable."""
        tools = get_automation_tools()

        for tool in tools:
            assert callable(tool)
