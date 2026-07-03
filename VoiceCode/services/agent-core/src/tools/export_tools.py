"""
VoiceCode Agent Core - Export Tools
Tools for exporting, formatting, and sharing transcripts
"""

from typing import Optional, List, Literal
from datetime import datetime
from langchain_core.tools import tool

from .registry import register_tool


# Tool implementations
def export_transcript_handler(
    transcript_id: str,
    format: Literal["pdf", "docx", "txt", "md", "json"] = "pdf",
    include_timestamps: bool = True,
    include_speakers: bool = True,
    _user_id: str = "",
    _context: dict = None,
) -> dict:
    """Export transcript to specified format."""
    return {
        "transcript_id": transcript_id,
        "format": format,
        "download_url": f"https://api.voicecode.ai/exports/{transcript_id}.{format}",
        "expires_at": "2024-01-16T10:00:00Z",
        "file_size_bytes": 45678,
        "message": f"Transcript exported as {format.upper()}",
    }


def export_summary_handler(
    transcript_id: str,
    format: Literal["pdf", "docx", "txt", "md"] = "pdf",
    include_action_items: bool = True,
    include_key_points: bool = True,
    _user_id: str = "",
    _context: dict = None,
) -> dict:
    """Export summary document."""
    return {
        "transcript_id": transcript_id,
        "format": format,
        "sections": {
            "summary": True,
            "action_items": include_action_items,
            "key_points": include_key_points,
        },
        "download_url": f"https://api.voicecode.ai/exports/summary_{transcript_id}.{format}",
        "expires_at": "2024-01-16T10:00:00Z",
        "message": f"Summary exported as {format.upper()}",
    }


def share_transcript_handler(
    transcript_id: str,
    recipients: List[str],
    permissions: Literal["view", "comment", "edit"] = "view",
    message: Optional[str] = None,
    _user_id: str = "",
    _context: dict = None,
) -> dict:
    """Share transcript with others."""
    return {
        "transcript_id": transcript_id,
        "share_link": f"https://app.voicecode.ai/shared/{transcript_id}",
        "recipients": recipients,
        "permissions": permissions,
        "expires_at": None,
        "message": f"Shared with {len(recipients)} recipient(s)",
    }


def generate_share_link_handler(
    transcript_id: str,
    expires_in_days: int = 7,
    require_password: bool = False,
    _user_id: str = "",
    _context: dict = None,
) -> dict:
    """Generate a shareable link."""
    return {
        "transcript_id": transcript_id,
        "share_link": f"https://app.voicecode.ai/s/{transcript_id[:8]}",
        "expires_in_days": expires_in_days,
        "password_protected": require_password,
        "password": "abc123" if require_password else None,
        "message": f"Share link created (expires in {expires_in_days} days)",
    }


def send_to_integration_handler(
    transcript_id: str,
    integration: str,
    destination: Optional[str] = None,
    _user_id: str = "",
    _context: dict = None,
) -> dict:
    """Send transcript to an external integration."""
    return {
        "transcript_id": transcript_id,
        "integration": integration,
        "destination": destination,
        "status": "sent",
        "message": f"Sent to {integration}",
    }


def export_meeting_minutes_handler(
    transcript_id: str,
    format: Literal["pdf", "docx", "notion", "email"] = "pdf",
    recipients: Optional[List[str]] = None,
    _user_id: str = "",
    _context: dict = None,
) -> dict:
    """Export formatted meeting minutes."""
    return {
        "transcript_id": transcript_id,
        "format": format,
        "sections": ["attendees", "agenda", "discussion", "decisions", "action_items", "next_steps"],
        "download_url": f"https://api.voicecode.ai/exports/minutes_{transcript_id}.{format}" if format in ["pdf", "docx"] else None,
        "sent_to": recipients if recipients else [],
        "message": f"Meeting minutes {'sent' if recipients else 'exported'}",
    }


# LangChain tool definitions
@tool
def export_transcript(transcript_id: str, format: str = "pdf") -> str:
    """Export a transcript to a downloadable file.
    
    Args:
        transcript_id: ID of the transcript to export
        format: Export format - 'pdf', 'docx', 'txt', 'md', or 'json'
    
    Returns:
        Download link for the exported file
    """
    result = export_transcript_handler(transcript_id, format)
    return f"**Export Ready**\n\nFormat: {format.upper()}\nDownload: {result['download_url']}\n\n_Link expires in 24 hours_"


@tool
def export_summary(transcript_id: str, format: str = "pdf") -> str:
    """Export a summary document with key points and action items.
    
    Args:
        transcript_id: ID of the transcript
        format: Export format - 'pdf', 'docx', 'txt', or 'md'
    
    Returns:
        Download link for the summary document
    """
    result = export_summary_handler(transcript_id, format)
    return f"**Summary Export Ready**\n\nIncludes: Summary, Key Points, Action Items\nFormat: {format.upper()}\nDownload: {result['download_url']}"


@tool
def share_with_team(transcript_id: str, emails: str, permission: str = "view") -> str:
    """Share a transcript with team members via email.
    
    Args:
        transcript_id: ID of the transcript to share
        emails: Comma-separated email addresses
        permission: Access level - 'view', 'comment', or 'edit'
    
    Returns:
        Sharing confirmation
    """
    recipients = [e.strip() for e in emails.split(",")]
    result = share_transcript_handler(transcript_id, recipients, permission)
    return f"**Shared Successfully**\n\nRecipients: {', '.join(recipients)}\nPermission: {permission}\nLink: {result['share_link']}"


@tool
def create_share_link(transcript_id: str, expires_days: int = 7) -> str:
    """Create a shareable link for a transcript.
    
    Args:
        transcript_id: ID of the transcript
        expires_days: Days until link expires
    
    Returns:
        Shareable link
    """
    result = generate_share_link_handler(transcript_id, expires_days)
    return f"**Share Link Created**\n\n🔗 {result['share_link']}\n\n_Expires in {expires_days} days_"


@tool
def send_to_slack(transcript_id: str, channel: str) -> str:
    """Send transcript summary to a Slack channel.
    
    Args:
        transcript_id: ID of the transcript
        channel: Slack channel name (e.g., '#team-updates')
    
    Returns:
        Confirmation message
    """
    result = send_to_integration_handler(transcript_id, "slack", channel)
    return f"Summary sent to Slack channel {channel}"


@tool
def send_to_notion(transcript_id: str, page_id: Optional[str] = None) -> str:
    """Export transcript to Notion.
    
    Args:
        transcript_id: ID of the transcript
        page_id: Optional Notion page ID (creates new if not provided)
    
    Returns:
        Confirmation with Notion link
    """
    result = send_to_integration_handler(transcript_id, "notion", page_id)
    return f"Transcript exported to Notion. View in your workspace."


@tool
def email_meeting_minutes(transcript_id: str, recipients: str) -> str:
    """Email formatted meeting minutes to recipients.
    
    Args:
        transcript_id: ID of the transcript
        recipients: Comma-separated email addresses
    
    Returns:
        Confirmation message
    """
    recipient_list = [e.strip() for e in recipients.split(",")]
    result = export_meeting_minutes_handler(transcript_id, "email", recipient_list)
    return f"Meeting minutes sent to {len(recipient_list)} recipient(s)"


def get_export_tools():
    """Get all export-related LangChain tools."""
    return [
        export_transcript,
        export_summary,
        share_with_team,
        create_share_link,
        send_to_slack,
        send_to_notion,
        email_meeting_minutes,
    ]


# Register tools
def _register_export_tools():
    register_tool(
        name="export_transcript",
        description="Export transcript to a file format",
        parameters={
            "type": "object",
            "properties": {
                "transcript_id": {"type": "string"},
                "format": {"type": "string", "enum": ["pdf", "docx", "txt", "md", "json"]},
            },
            "required": ["transcript_id"],
        },
        handler=export_transcript_handler,
        category="export",
    )
    
    register_tool(
        name="share_transcript",
        description="Share transcript with others",
        parameters={
            "type": "object",
            "properties": {
                "transcript_id": {"type": "string"},
                "recipients": {"type": "array"},
                "permissions": {"type": "string"},
            },
            "required": ["transcript_id", "recipients"],
        },
        handler=share_transcript_handler,
        category="export",
    )
    
    register_tool(
        name="send_to_integration",
        description="Send transcript to external service",
        parameters={
            "type": "object",
            "properties": {
                "transcript_id": {"type": "string"},
                "integration": {"type": "string"},
                "destination": {"type": "string"},
            },
            "required": ["transcript_id", "integration"],
        },
        handler=send_to_integration_handler,
        category="export",
    )


_register_export_tools()
