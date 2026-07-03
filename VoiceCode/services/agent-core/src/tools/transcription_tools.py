"""
VoiceCode Agent Core - Transcription Tools
Tools for recording, transcription, and audio management
"""

from typing import Optional
from langchain_core.tools import tool
from pydantic import BaseModel, Field

from .registry import register_tool


class TranscriptData(BaseModel):
    """Transcript data structure."""
    id: str
    content: str
    duration_seconds: int
    word_count: int
    language: str = "en"
    speakers: list[str] = Field(default_factory=list)


# Tool implementations
def start_recording_handler(
    language: str = "en",
    speaker_detection: bool = True,
    _user_id: str = "",
    _context: dict = None,
) -> dict:
    """Start a new recording session."""
    # In production, this would interface with the actual recording service
    return {
        "recording_id": f"rec_{_user_id}_{language}",
        "status": "recording",
        "language": language,
        "speaker_detection": speaker_detection,
        "message": "Recording started successfully",
    }


def stop_recording_handler(
    recording_id: str,
    _user_id: str = "",
    _context: dict = None,
) -> dict:
    """Stop the current recording and return transcript."""
    # In production, this would stop recording and trigger transcription
    return {
        "recording_id": recording_id,
        "status": "completed",
        "transcript_id": f"trans_{recording_id}",
        "duration_seconds": 120,
        "message": "Recording stopped. Transcript is being processed.",
    }


def get_transcript_handler(
    transcript_id: str,
    _user_id: str = "",
    _context: dict = None,
) -> dict:
    """Retrieve a transcript by ID."""
    # In production, fetch from database
    return {
        "id": transcript_id,
        "content": "This is a sample transcript content...",
        "duration_seconds": 120,
        "word_count": 250,
        "language": "en",
        "created_at": "2024-01-15T10:30:00Z",
    }


def edit_transcript_handler(
    transcript_id: str,
    edits: list[dict],
    _user_id: str = "",
    _context: dict = None,
) -> dict:
    """Apply edits to a transcript."""
    # edits format: [{"type": "replace", "old": "text", "new": "text"}, ...]
    return {
        "transcript_id": transcript_id,
        "edits_applied": len(edits),
        "status": "updated",
        "message": f"Applied {len(edits)} edit(s) to transcript",
    }


def list_transcripts_handler(
    limit: int = 10,
    offset: int = 0,
    search_query: Optional[str] = None,
    _user_id: str = "",
    _context: dict = None,
) -> dict:
    """List user's transcripts."""
    return {
        "transcripts": [
            {"id": "trans_1", "title": "Team Meeting", "date": "2024-01-15"},
            {"id": "trans_2", "title": "Client Call", "date": "2024-01-14"},
        ],
        "total": 2,
        "limit": limit,
        "offset": offset,
    }


def get_recording_status_handler(
    _user_id: str = "",
    _context: dict = None,
) -> dict:
    """Get current recording status."""
    return {
        "is_recording": False,
        "recording_id": None,
        "duration_seconds": 0,
    }


# LangChain tool definitions
@tool
def start_recording(language: str = "en", speaker_detection: bool = True) -> str:
    """Start a new voice recording session.
    
    Args:
        language: Language code for transcription (e.g., 'en', 'es', 'fr')
        speaker_detection: Whether to detect and label different speakers
    
    Returns:
        Recording session information
    """
    result = start_recording_handler(language, speaker_detection)
    return f"Recording started. ID: {result['recording_id']}"


@tool
def stop_recording(recording_id: str) -> str:
    """Stop the current recording and save the transcript.
    
    Args:
        recording_id: ID of the recording session to stop
    
    Returns:
        Transcript information
    """
    result = stop_recording_handler(recording_id)
    return f"Recording stopped. Transcript ID: {result['transcript_id']}, Duration: {result['duration_seconds']}s"


@tool
def get_transcript(transcript_id: str) -> str:
    """Retrieve a transcript by its ID.
    
    Args:
        transcript_id: ID of the transcript to retrieve
    
    Returns:
        Transcript content and metadata
    """
    result = get_transcript_handler(transcript_id)
    return f"Transcript ({result['word_count']} words):\n{result['content']}"


@tool
def edit_transcript(transcript_id: str, find_text: str, replace_with: str) -> str:
    """Edit text in a transcript by finding and replacing.
    
    Args:
        transcript_id: ID of the transcript to edit
        find_text: Text to find in the transcript
        replace_with: Text to replace with
    
    Returns:
        Edit confirmation
    """
    edits = [{"type": "replace", "old": find_text, "new": replace_with}]
    result = edit_transcript_handler(transcript_id, edits)
    return result["message"]


@tool
def list_recent_transcripts(limit: int = 5) -> str:
    """List the user's most recent transcripts.
    
    Args:
        limit: Maximum number of transcripts to return
    
    Returns:
        List of recent transcripts
    """
    result = list_transcripts_handler(limit=limit)
    transcripts = result["transcripts"]
    lines = [f"- {t['title']} ({t['date']}) - ID: {t['id']}" for t in transcripts]
    return "Recent transcripts:\n" + "\n".join(lines)


@tool
def check_recording_status() -> str:
    """Check if there's an active recording session.
    
    Returns:
        Current recording status
    """
    result = get_recording_status_handler()
    if result["is_recording"]:
        return f"Recording in progress. Duration: {result['duration_seconds']}s"
    return "No active recording"


def get_transcription_tools():
    """Get all transcription-related LangChain tools."""
    return [
        start_recording,
        stop_recording,
        get_transcript,
        edit_transcript,
        list_recent_transcripts,
        check_recording_status,
    ]


# Register tools in the global registry
def _register_transcription_tools():
    register_tool(
        name="start_recording",
        description="Start a new voice recording session",
        parameters={
            "type": "object",
            "properties": {
                "language": {"type": "string", "description": "Language code"},
                "speaker_detection": {"type": "boolean", "description": "Enable speaker detection"},
            },
        },
        handler=start_recording_handler,
        category="transcription",
    )
    
    register_tool(
        name="stop_recording",
        description="Stop the current recording session",
        parameters={
            "type": "object",
            "properties": {
                "recording_id": {"type": "string", "description": "Recording session ID"},
            },
            "required": ["recording_id"],
        },
        handler=stop_recording_handler,
        category="transcription",
    )
    
    register_tool(
        name="get_transcript",
        description="Retrieve a transcript by ID",
        parameters={
            "type": "object",
            "properties": {
                "transcript_id": {"type": "string", "description": "Transcript ID"},
            },
            "required": ["transcript_id"],
        },
        handler=get_transcript_handler,
        category="transcription",
    )
    
    register_tool(
        name="edit_transcript",
        description="Apply edits to a transcript",
        parameters={
            "type": "object",
            "properties": {
                "transcript_id": {"type": "string", "description": "Transcript ID"},
                "edits": {"type": "array", "description": "List of edits to apply"},
            },
            "required": ["transcript_id", "edits"],
        },
        handler=edit_transcript_handler,
        category="transcription",
    )


# Auto-register on import
_register_transcription_tools()
