"""
VoiceCode Agent Core - State Models
LangGraph state definitions for agent orchestration
"""

from typing import TypedDict, Annotated, Optional, Literal
from typing_extensions import Required
from langgraph.graph.message import add_messages
from pydantic import BaseModel, Field
from datetime import datetime
from enum import Enum


class AgentType(str, Enum):
    """Available agent types."""
    SUPERVISOR = "supervisor"
    TRANSCRIPTION = "transcription"
    MEDICAL = "medical"
    PRODUCTIVITY = "productivity"
    SEARCH = "search"
    AUTOMATION = "automation"
    EXPORT = "export"


class Intent(str, Enum):
    """User intent classification."""
    TRANSCRIBE = "transcribe"
    SUMMARIZE = "summarize"
    EXTRACT_ACTIONS = "extract_actions"
    SEARCH = "search"
    GENERATE_MEDICAL_DOC = "generate_medical_doc"
    EXPORT = "export"
    AUTOMATE = "automate"
    CHAT = "chat"
    HELP = "help"
    UNKNOWN = "unknown"


class UserContext(BaseModel):
    """User context for personalization."""
    user_id: str
    professional_mode: Literal["general", "medical", "legal", "business"] = "general"
    language: str = "en"
    timezone: str = "UTC"
    preferences: dict = Field(default_factory=dict)
    vocabulary: list[str] = Field(default_factory=list)


class TranscriptContext(BaseModel):
    """Context about current/recent transcripts."""
    current_transcript_id: Optional[str] = None
    recent_transcript_ids: list[str] = Field(default_factory=list)
    active_recording: bool = False
    recording_duration_seconds: int = 0


class ConversationContext(BaseModel):
    """Conversation context for multi-turn."""
    topic: Optional[str] = None
    entities: list[str] = Field(default_factory=list)
    referenced_items: list[str] = Field(default_factory=list)


class PendingAction(BaseModel):
    """Action awaiting user confirmation."""
    action_id: str
    action_type: str
    description: str
    parameters: dict
    requires_confirmation: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)


class AgentState(TypedDict, total=False):
    """
    Main state for the agent orchestration graph.
    Uses LangGraph's message annotation for conversation history.
    """
    # Required fields
    messages: Annotated[list, add_messages]
    session_id: Required[str]
    user_id: Required[str]
    
    # Intent and routing
    intent: Intent
    confidence: float
    active_agent: AgentType
    
    # Context
    user_context: UserContext
    transcript_context: TranscriptContext
    conversation_context: ConversationContext
    
    # Tool execution
    tool_calls: list[dict]
    tool_results: list[dict]
    
    # Human-in-the-loop
    pending_action: Optional[PendingAction]
    awaiting_confirmation: bool
    
    # Metadata
    iteration_count: int
    started_at: datetime
    last_updated_at: datetime
    error: Optional[str]


class ToolCall(BaseModel):
    """Representation of a tool call."""
    tool_name: str
    tool_id: str
    arguments: dict
    
    
class ToolResult(BaseModel):
    """Result from a tool execution."""
    tool_id: str
    tool_name: str
    success: bool
    result: Optional[dict] = None
    error: Optional[str] = None
    execution_time_ms: int = 0


class AgentMessage(BaseModel):
    """Message in agent conversation."""
    role: Literal["user", "assistant", "system", "tool"]
    content: str
    name: Optional[str] = None
    tool_calls: Optional[list[ToolCall]] = None
    tool_call_id: Optional[str] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)


class StreamChunk(BaseModel):
    """Streaming response chunk."""
    type: Literal["text", "tool_start", "tool_end", "thinking", "complete"]
    content: str = ""
    tool_name: Optional[str] = None
    tool_result: Optional[dict] = None
    is_final: bool = False


class AgentResponse(BaseModel):
    """Complete agent response."""
    session_id: str
    message: str
    intent: Intent
    tool_calls: list[ToolCall] = Field(default_factory=list)
    tool_results: list[ToolResult] = Field(default_factory=list)
    suggestions: list[str] = Field(default_factory=list)
    pending_action: Optional[PendingAction] = None
    metadata: dict = Field(default_factory=dict)
