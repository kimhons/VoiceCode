"""
VoiceCode Agent Core - Search Tools
Tools for semantic search and transcript retrieval
"""

from typing import Optional, List
from langchain_core.tools import tool

from .registry import register_tool


# Tool implementations
def semantic_search_handler(
    query: str,
    limit: int = 5,
    filters: Optional[dict] = None,
    _user_id: str = "",
    _context: dict = None,
) -> dict:
    """Perform semantic search across transcripts."""
    # In production, this would use LlamaIndex/pgvector
    return {
        "query": query,
        "results": [
            {
                "transcript_id": "trans_001",
                "title": "Project Planning Meeting",
                "relevance_score": 0.95,
                "matched_text": "...discussed the quarterly planning and budget allocation...",
                "date": "2024-01-10",
            },
            {
                "transcript_id": "trans_002", 
                "title": "Team Standup",
                "relevance_score": 0.82,
                "matched_text": "...planning to complete the feature by end of quarter...",
                "date": "2024-01-12",
            },
            {
                "transcript_id": "trans_003",
                "title": "Client Call",
                "relevance_score": 0.78,
                "matched_text": "...their planning requirements for the next phase...",
                "date": "2024-01-14",
            },
        ][:limit],
        "total_results": 3,
    }


def find_mentions_handler(
    term: str,
    transcript_ids: Optional[List[str]] = None,
    _user_id: str = "",
    _context: dict = None,
) -> dict:
    """Find specific term mentions in transcripts."""
    return {
        "term": term,
        "mentions": [
            {
                "transcript_id": "trans_001",
                "transcript_title": "Project Meeting",
                "occurrences": [
                    {"timestamp": "00:05:23", "context": f"...we need to discuss the {term} in more detail..."},
                    {"timestamp": "00:12:45", "context": f"...the {term} should be prioritized..."},
                ],
                "count": 2,
            },
            {
                "transcript_id": "trans_003",
                "transcript_title": "Client Call",
                "occurrences": [
                    {"timestamp": "00:08:10", "context": f"...client mentioned {term} as a key concern..."},
                ],
                "count": 1,
            },
        ],
        "total_mentions": 3,
    }


def find_similar_transcripts_handler(
    transcript_id: str,
    limit: int = 5,
    _user_id: str = "",
    _context: dict = None,
) -> dict:
    """Find transcripts similar to a given one."""
    return {
        "source_transcript_id": transcript_id,
        "similar_transcripts": [
            {
                "transcript_id": "trans_005",
                "title": "Related Project Discussion",
                "similarity_score": 0.89,
                "common_topics": ["project planning", "timeline", "resources"],
            },
            {
                "transcript_id": "trans_008",
                "title": "Follow-up Meeting",
                "similarity_score": 0.76,
                "common_topics": ["action items", "deadlines"],
            },
        ][:limit],
    }


def search_by_speaker_handler(
    speaker_name: str,
    limit: int = 10,
    _user_id: str = "",
    _context: dict = None,
) -> dict:
    """Search for transcripts by speaker."""
    return {
        "speaker": speaker_name,
        "transcripts": [
            {
                "transcript_id": "trans_001",
                "title": "Team Meeting",
                "speaking_time_seconds": 342,
                "date": "2024-01-15",
            },
            {
                "transcript_id": "trans_004",
                "title": "1:1 Discussion",
                "speaking_time_seconds": 890,
                "date": "2024-01-12",
            },
        ][:limit],
        "total_speaking_time_seconds": 1232,
    }


def search_by_date_range_handler(
    start_date: str,
    end_date: str,
    _user_id: str = "",
    _context: dict = None,
) -> dict:
    """Search transcripts within a date range."""
    return {
        "date_range": {"start": start_date, "end": end_date},
        "transcripts": [
            {"transcript_id": "trans_001", "title": "Meeting 1", "date": "2024-01-10"},
            {"transcript_id": "trans_002", "title": "Meeting 2", "date": "2024-01-12"},
            {"transcript_id": "trans_003", "title": "Meeting 3", "date": "2024-01-14"},
        ],
        "total": 3,
    }


# LangChain tool definitions
@tool
def search_transcripts(query: str, limit: int = 5) -> str:
    """Search across all transcripts using semantic/AI-powered search.
    
    Args:
        query: Natural language search query
        limit: Maximum number of results to return
    
    Returns:
        Search results with relevance scores and matched text
    """
    result = semantic_search_handler(query, limit)
    lines = []
    for r in result["results"]:
        lines.append(f"**{r['title']}** (ID: {r['transcript_id']})")
        lines.append(f"  Relevance: {r['relevance_score']*100:.0f}% | Date: {r['date']}")
        lines.append(f"  Match: \"{r['matched_text']}\"")
        lines.append("")
    
    return f"**Search Results for:** \"{query}\"\n\n" + "\n".join(lines)


@tool
def find_mentions(term: str) -> str:
    """Find all mentions of a specific term, name, or topic in transcripts.
    
    Args:
        term: Term or phrase to search for
    
    Returns:
        List of mentions with timestamps and context
    """
    result = find_mentions_handler(term)
    lines = [f"**Found {result['total_mentions']} mentions of \"{term}\":**\n"]
    
    for mention in result["mentions"]:
        lines.append(f"**{mention['transcript_title']}** ({mention['count']} mentions)")
        for occ in mention["occurrences"]:
            lines.append(f"  [{occ['timestamp']}] {occ['context']}")
        lines.append("")
    
    return "\n".join(lines)


@tool
def find_similar(transcript_id: str) -> str:
    """Find transcripts similar to a given transcript.
    
    Args:
        transcript_id: ID of the source transcript
    
    Returns:
        List of similar transcripts with similarity scores
    """
    result = find_similar_transcripts_handler(transcript_id)
    lines = [f"**Transcripts similar to {transcript_id}:**\n"]
    
    for t in result["similar_transcripts"]:
        topics = ", ".join(t["common_topics"])
        lines.append(f"- **{t['title']}** (ID: {t['transcript_id']})")
        lines.append(f"  Similarity: {t['similarity_score']*100:.0f}%")
        lines.append(f"  Common topics: {topics}")
        lines.append("")
    
    return "\n".join(lines)


@tool
def search_by_speaker(speaker_name: str) -> str:
    """Find all transcripts where a specific person spoke.
    
    Args:
        speaker_name: Name of the speaker to search for
    
    Returns:
        List of transcripts featuring the speaker
    """
    result = search_by_speaker_handler(speaker_name)
    total_mins = result["total_speaking_time_seconds"] // 60
    lines = [f"**Transcripts featuring {speaker_name}:**"]
    lines.append(f"Total speaking time: {total_mins} minutes\n")
    
    for t in result["transcripts"]:
        mins = t["speaking_time_seconds"] // 60
        lines.append(f"- {t['title']} ({t['date']}) - {mins} min speaking time")
    
    return "\n".join(lines)


@tool
def search_by_date(start_date: str, end_date: str) -> str:
    """Search for transcripts within a date range.
    
    Args:
        start_date: Start date (YYYY-MM-DD format)
        end_date: End date (YYYY-MM-DD format)
    
    Returns:
        List of transcripts in the date range
    """
    result = search_by_date_range_handler(start_date, end_date)
    lines = [f"**Transcripts from {start_date} to {end_date}:**"]
    lines.append(f"Found {result['total']} transcripts\n")
    
    for t in result["transcripts"]:
        lines.append(f"- {t['title']} ({t['date']}) - ID: {t['transcript_id']}")
    
    return "\n".join(lines)


def get_search_tools():
    """Get all search-related LangChain tools."""
    return [
        search_transcripts,
        find_mentions,
        find_similar,
        search_by_speaker,
        search_by_date,
    ]


# Register tools
def _register_search_tools():
    register_tool(
        name="semantic_search",
        description="Perform semantic search across transcripts",
        parameters={
            "type": "object",
            "properties": {
                "query": {"type": "string"},
                "limit": {"type": "integer"},
            },
            "required": ["query"],
        },
        handler=semantic_search_handler,
        category="search",
    )
    
    register_tool(
        name="find_mentions",
        description="Find mentions of a term in transcripts",
        parameters={
            "type": "object",
            "properties": {
                "term": {"type": "string"},
            },
            "required": ["term"],
        },
        handler=find_mentions_handler,
        category="search",
    )


_register_search_tools()
