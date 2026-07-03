"""
VoiceCode Agent Core - Productivity Tools
Tools for summaries, action items, and meeting productivity
"""

from typing import Optional, Literal
from langchain_core.tools import tool

from .registry import register_tool


# Tool implementations
def summarize_transcript_handler(
    transcript_id: str,
    length: Literal["short", "medium", "long"] = "medium",
    _user_id: str = "",
    _context: dict = None,
) -> dict:
    """Generate summary of transcript."""
    summaries = {
        "short": "Brief discussion about project timelines and resource allocation.",
        "medium": "The team discussed upcoming project milestones, with focus on the Q2 launch deadline. Key concerns were raised about resource constraints and the need for additional QA support. Action items were assigned to address bottlenecks.",
        "long": "The meeting covered three main topics: 1) Project timeline review - the team is on track for the Q2 launch but identified risks in the integration phase. 2) Resource allocation - there's a need for two additional QA engineers to meet testing requirements. Sarah will submit the hiring request by Friday. 3) Technical debt - the team agreed to dedicate 20% of sprint capacity to addressing critical bugs. Next meeting scheduled for Monday to review progress.",
    }
    return {
        "transcript_id": transcript_id,
        "summary": summaries.get(length, summaries["medium"]),
        "length": length,
        "word_count": len(summaries.get(length, "").split()),
    }


def extract_action_items_handler(
    transcript_id: str,
    include_assignees: bool = True,
    _user_id: str = "",
    _context: dict = None,
) -> dict:
    """Extract action items from transcript."""
    return {
        "transcript_id": transcript_id,
        "action_items": [
            {
                "id": "ai_1",
                "task": "Submit hiring request for QA engineers",
                "assignee": "Sarah" if include_assignees else None,
                "due_date": "Friday",
                "priority": "high",
            },
            {
                "id": "ai_2", 
                "task": "Review integration test results",
                "assignee": "Mike" if include_assignees else None,
                "due_date": "Wednesday",
                "priority": "medium",
            },
            {
                "id": "ai_3",
                "task": "Update project roadmap with new timelines",
                "assignee": "John" if include_assignees else None,
                "due_date": "Thursday",
                "priority": "medium",
            },
        ],
        "total_items": 3,
    }


def extract_key_points_handler(
    transcript_id: str,
    max_points: int = 5,
    _user_id: str = "",
    _context: dict = None,
) -> dict:
    """Extract key points from transcript."""
    return {
        "transcript_id": transcript_id,
        "key_points": [
            {"point": "Q2 launch deadline is confirmed for April 15", "importance": 0.95},
            {"point": "Two additional QA engineers needed for testing phase", "importance": 0.9},
            {"point": "20% of sprint capacity allocated to technical debt", "importance": 0.85},
            {"point": "Integration phase identified as highest risk area", "importance": 0.8},
            {"point": "Weekly sync meetings to continue on Mondays", "importance": 0.7},
        ][:max_points],
    }


def generate_meeting_minutes_handler(
    transcript_id: str,
    format: Literal["standard", "executive", "detailed"] = "standard",
    _user_id: str = "",
    _context: dict = None,
) -> dict:
    """Generate formatted meeting minutes."""
    return {
        "transcript_id": transcript_id,
        "meeting_minutes": {
            "title": "Project Status Meeting",
            "date": "January 15, 2024",
            "attendees": ["John Smith", "Sarah Johnson", "Mike Chen", "Lisa Wong"],
            "duration": "45 minutes",
            "agenda_items": [
                "Project timeline review",
                "Resource allocation",
                "Technical debt discussion",
            ],
            "discussion_summary": "The team reviewed current project status and identified areas requiring attention.",
            "decisions": [
                "Approved hiring request for QA engineers",
                "Agreed to allocate 20% capacity to technical debt",
            ],
            "action_items": [
                "Sarah: Submit hiring request by Friday",
                "Mike: Review integration tests by Wednesday",
            ],
            "next_meeting": "Monday, January 22, 2024 at 10:00 AM",
        },
        "format": format,
    }


def extract_decisions_handler(
    transcript_id: str,
    _user_id: str = "",
    _context: dict = None,
) -> dict:
    """Extract decisions made in the meeting."""
    return {
        "transcript_id": transcript_id,
        "decisions": [
            {
                "decision": "Approved budget for two additional QA engineers",
                "made_by": "John Smith",
                "context": "To address testing capacity concerns",
            },
            {
                "decision": "Technical debt sprint allocation set to 20%",
                "made_by": "Team consensus",
                "context": "Balance between features and maintenance",
            },
        ],
    }


# LangChain tool definitions
@tool
def summarize_transcript(transcript_id: str, length: str = "medium") -> str:
    """Generate a summary of a transcript.
    
    Args:
        transcript_id: ID of the transcript to summarize
        length: Summary length - 'short' (1-2 sentences), 'medium' (paragraph), 'long' (detailed)
    
    Returns:
        Summary of the transcript
    """
    result = summarize_transcript_handler(transcript_id, length)
    return f"**Summary ({result['length']}, {result['word_count']} words):**\n\n{result['summary']}"


@tool
def extract_action_items(transcript_id: str) -> str:
    """Extract action items and tasks from a transcript.
    
    Args:
        transcript_id: ID of the transcript to analyze
    
    Returns:
        List of action items with assignees and due dates
    """
    result = extract_action_items_handler(transcript_id)
    items = result["action_items"]
    lines = []
    for item in items:
        assignee = f" (@{item['assignee']})" if item.get('assignee') else ""
        due = f" - Due: {item['due_date']}" if item.get('due_date') else ""
        priority = f" [{item['priority'].upper()}]" if item.get('priority') else ""
        lines.append(f"- [ ] {item['task']}{assignee}{due}{priority}")
    
    return f"**Action Items ({len(items)}):**\n\n" + "\n".join(lines)


@tool
def extract_key_points(transcript_id: str, max_points: int = 5) -> str:
    """Extract the most important key points from a transcript.
    
    Args:
        transcript_id: ID of the transcript to analyze
        max_points: Maximum number of key points to extract
    
    Returns:
        List of key points ordered by importance
    """
    result = extract_key_points_handler(transcript_id, max_points)
    points = result["key_points"]
    lines = [f"- {p['point']}" for p in points]
    return f"**Key Points:**\n\n" + "\n".join(lines)


@tool
def generate_meeting_minutes(transcript_id: str) -> str:
    """Generate formatted meeting minutes from a transcript.
    
    Args:
        transcript_id: ID of the transcript to format
    
    Returns:
        Formatted meeting minutes
    """
    result = generate_meeting_minutes_handler(transcript_id)
    mm = result["meeting_minutes"]
    
    attendees = ", ".join(mm["attendees"])
    agenda = "\n".join(f"  - {a}" for a in mm["agenda_items"])
    decisions = "\n".join(f"  - {d}" for d in mm["decisions"])
    actions = "\n".join(f"  - {a}" for a in mm["action_items"])
    
    return f"""**Meeting Minutes**

**{mm['title']}**
Date: {mm['date']} | Duration: {mm['duration']}

**Attendees:** {attendees}

**Agenda:**
{agenda}

**Discussion Summary:**
{mm['discussion_summary']}

**Decisions Made:**
{decisions}

**Action Items:**
{actions}

**Next Meeting:** {mm['next_meeting']}
"""


@tool
def extract_decisions(transcript_id: str) -> str:
    """Extract decisions made during a meeting or conversation.
    
    Args:
        transcript_id: ID of the transcript to analyze
    
    Returns:
        List of decisions with context
    """
    result = extract_decisions_handler(transcript_id)
    decisions = result["decisions"]
    lines = []
    for d in decisions:
        lines.append(f"**Decision:** {d['decision']}")
        lines.append(f"  Made by: {d['made_by']}")
        lines.append(f"  Context: {d['context']}\n")
    
    return "**Decisions Made:**\n\n" + "\n".join(lines)


def get_productivity_tools():
    """Get all productivity-related LangChain tools."""
    return [
        summarize_transcript,
        extract_action_items,
        extract_key_points,
        generate_meeting_minutes,
        extract_decisions,
    ]


# Register tools
def _register_productivity_tools():
    register_tool(
        name="summarize_transcript",
        description="Generate a summary of a transcript",
        parameters={
            "type": "object",
            "properties": {
                "transcript_id": {"type": "string"},
                "length": {"type": "string", "enum": ["short", "medium", "long"]},
            },
            "required": ["transcript_id"],
        },
        handler=summarize_transcript_handler,
        category="productivity",
    )
    
    register_tool(
        name="extract_action_items",
        description="Extract action items from a transcript",
        parameters={
            "type": "object",
            "properties": {
                "transcript_id": {"type": "string"},
                "include_assignees": {"type": "boolean"},
            },
            "required": ["transcript_id"],
        },
        handler=extract_action_items_handler,
        category="productivity",
    )
    
    register_tool(
        name="extract_key_points",
        description="Extract key points from a transcript",
        parameters={
            "type": "object",
            "properties": {
                "transcript_id": {"type": "string"},
                "max_points": {"type": "integer"},
            },
            "required": ["transcript_id"],
        },
        handler=extract_key_points_handler,
        category="productivity",
    )


_register_productivity_tools()
