"""
VoiceCode Agent Core - Automation Tools
Tools for workflows, scheduling, and integrations
"""

from typing import Optional, List
from datetime import datetime
from langchain_core.tools import tool

from .registry import register_tool


# Tool implementations
def create_workflow_handler(
    name: str,
    trigger: str,
    actions: List[dict],
    _user_id: str = "",
    _context: dict = None,
) -> dict:
    """Create a new automation workflow."""
    return {
        "workflow_id": f"wf_{_user_id}_{datetime.utcnow().timestamp()}",
        "name": name,
        "trigger": trigger,
        "actions": actions,
        "status": "active",
        "created_at": datetime.utcnow().isoformat(),
        "message": f"Workflow '{name}' created successfully",
    }


def list_workflows_handler(
    status: Optional[str] = None,
    _user_id: str = "",
    _context: dict = None,
) -> dict:
    """List user's automation workflows."""
    return {
        "workflows": [
            {
                "id": "wf_001",
                "name": "Auto-summarize meetings",
                "trigger": "recording_complete",
                "status": "active",
                "last_run": "2024-01-15T10:00:00Z",
            },
            {
                "id": "wf_002",
                "name": "Extract action items",
                "trigger": "recording_complete",
                "status": "active",
                "last_run": "2024-01-14T15:30:00Z",
            },
            {
                "id": "wf_003",
                "name": "Weekly summary email",
                "trigger": "schedule:weekly",
                "status": "paused",
                "last_run": "2024-01-08T09:00:00Z",
            },
        ],
        "total": 3,
    }


def toggle_workflow_handler(
    workflow_id: str,
    enabled: bool,
    _user_id: str = "",
    _context: dict = None,
) -> dict:
    """Enable or disable a workflow."""
    return {
        "workflow_id": workflow_id,
        "status": "active" if enabled else "paused",
        "message": f"Workflow {'enabled' if enabled else 'disabled'}",
    }


def schedule_recording_handler(
    title: str,
    scheduled_time: str,
    duration_minutes: int = 60,
    meeting_url: Optional[str] = None,
    _user_id: str = "",
    _context: dict = None,
) -> dict:
    """Schedule a future recording."""
    return {
        "schedule_id": f"sched_{datetime.utcnow().timestamp()}",
        "title": title,
        "scheduled_time": scheduled_time,
        "duration_minutes": duration_minutes,
        "meeting_url": meeting_url,
        "status": "scheduled",
        "message": f"Recording scheduled for {scheduled_time}",
    }


def list_scheduled_recordings_handler(
    _user_id: str = "",
    _context: dict = None,
) -> dict:
    """List scheduled recordings."""
    return {
        "scheduled_recordings": [
            {
                "id": "sched_001",
                "title": "Team Standup",
                "scheduled_time": "2024-01-16T09:00:00Z",
                "duration_minutes": 30,
                "status": "scheduled",
            },
            {
                "id": "sched_002",
                "title": "Client Meeting",
                "scheduled_time": "2024-01-16T14:00:00Z",
                "duration_minutes": 60,
                "meeting_url": "https://zoom.us/j/123456",
                "status": "scheduled",
            },
        ],
        "total": 2,
    }


def setup_integration_handler(
    service: str,
    credentials: dict,
    settings: Optional[dict] = None,
    _user_id: str = "",
    _context: dict = None,
) -> dict:
    """Set up an external integration."""
    return {
        "integration_id": f"int_{service}_{_user_id}",
        "service": service,
        "status": "connected",
        "settings": settings or {},
        "message": f"Successfully connected to {service}",
    }


def list_integrations_handler(
    _user_id: str = "",
    _context: dict = None,
) -> dict:
    """List configured integrations."""
    return {
        "integrations": [
            {"service": "google_calendar", "status": "connected", "last_sync": "2024-01-15T10:00:00Z"},
            {"service": "slack", "status": "connected", "last_sync": "2024-01-15T09:45:00Z"},
            {"service": "notion", "status": "disconnected", "last_sync": None},
        ],
        "total": 3,
    }


# LangChain tool definitions
@tool
def create_workflow(name: str, trigger: str, action: str) -> str:
    """Create a new automation workflow.
    
    Args:
        name: Name for the workflow
        trigger: When to trigger (e.g., 'recording_complete', 'schedule:daily')
        action: Action to perform (e.g., 'summarize', 'extract_actions', 'send_email')
    
    Returns:
        Workflow creation confirmation
    """
    actions = [{"type": action}]
    result = create_workflow_handler(name, trigger, actions)
    return f"Created workflow '{name}' (ID: {result['workflow_id']}). Trigger: {trigger}, Action: {action}"


@tool
def list_workflows() -> str:
    """List all automation workflows.
    
    Returns:
        List of configured workflows
    """
    result = list_workflows_handler()
    lines = ["**Your Workflows:**\n"]
    for wf in result["workflows"]:
        status_icon = "✅" if wf["status"] == "active" else "⏸️"
        lines.append(f"{status_icon} **{wf['name']}** ({wf['id']})")
        lines.append(f"   Trigger: {wf['trigger']}")
        lines.append("")
    return "\n".join(lines)


@tool
def toggle_workflow(workflow_id: str, enable: bool) -> str:
    """Enable or disable a workflow.
    
    Args:
        workflow_id: ID of the workflow
        enable: True to enable, False to disable
    
    Returns:
        Status update confirmation
    """
    result = toggle_workflow_handler(workflow_id, enable)
    return f"Workflow {workflow_id} is now {result['status']}"


@tool
def schedule_recording(title: str, time: str, duration: int = 60) -> str:
    """Schedule a future recording session.
    
    Args:
        title: Title for the recording
        time: ISO format datetime for when to start
        duration: Duration in minutes
    
    Returns:
        Scheduling confirmation
    """
    result = schedule_recording_handler(title, time, duration)
    return f"Scheduled: '{title}' at {time} for {duration} minutes"


@tool
def list_scheduled() -> str:
    """List all scheduled recordings.
    
    Returns:
        List of upcoming scheduled recordings
    """
    result = list_scheduled_recordings_handler()
    lines = ["**Scheduled Recordings:**\n"]
    for rec in result["scheduled_recordings"]:
        lines.append(f"📅 **{rec['title']}**")
        lines.append(f"   Time: {rec['scheduled_time']} ({rec['duration_minutes']} min)")
        lines.append("")
    return "\n".join(lines)


@tool
def list_integrations() -> str:
    """List configured external integrations.
    
    Returns:
        Status of all integrations
    """
    result = list_integrations_handler()
    lines = ["**Integrations:**\n"]
    for intg in result["integrations"]:
        status_icon = "🟢" if intg["status"] == "connected" else "🔴"
        lines.append(f"{status_icon} **{intg['service'].replace('_', ' ').title()}** - {intg['status']}")
    return "\n".join(lines)


def get_automation_tools():
    """Get all automation-related LangChain tools."""
    return [
        create_workflow,
        list_workflows,
        toggle_workflow,
        schedule_recording,
        list_scheduled,
        list_integrations,
    ]


# Register tools
def _register_automation_tools():
    register_tool(
        name="create_workflow",
        description="Create a new automation workflow",
        parameters={
            "type": "object",
            "properties": {
                "name": {"type": "string"},
                "trigger": {"type": "string"},
                "actions": {"type": "array"},
            },
            "required": ["name", "trigger", "actions"],
        },
        handler=create_workflow_handler,
        category="automation",
    )
    
    register_tool(
        name="schedule_recording",
        description="Schedule a future recording",
        parameters={
            "type": "object",
            "properties": {
                "title": {"type": "string"},
                "scheduled_time": {"type": "string"},
                "duration_minutes": {"type": "integer"},
            },
            "required": ["title", "scheduled_time"],
        },
        handler=schedule_recording_handler,
        category="automation",
    )


_register_automation_tools()
