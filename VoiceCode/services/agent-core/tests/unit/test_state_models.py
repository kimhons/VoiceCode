"""
Unit tests for State Models
"""

import pytest
from datetime import datetime
from pydantic import ValidationError

from src.models.state import (
    AgentType,
    Intent,
    UserContext,
    TranscriptContext,
    ConversationContext,
    PendingAction,
    ToolCall,
    ToolResult,
    AgentMessage,
    StreamChunk,
    AgentResponse,
    AgentState,
)


class TestAgentType:
    """Tests for AgentType enum."""

    def test_agent_type_values(self):
        """Test all agent type values exist."""
        assert AgentType.SUPERVISOR is not None
        assert AgentType.TRANSCRIPTION is not None
        assert AgentType.MEDICAL is not None
        assert AgentType.PRODUCTIVITY is not None
        assert AgentType.SEARCH is not None

    def test_agent_type_string_values(self):
        """Test agent type string values."""
        assert AgentType.SUPERVISOR.value == "supervisor"
        assert AgentType.TRANSCRIPTION.value == "transcription"
        assert AgentType.MEDICAL.value == "medical"


class TestIntent:
    """Tests for Intent enum."""

    def test_intent_values(self):
        """Test all intent values exist."""
        assert Intent.TRANSCRIBE is not None
        assert Intent.SUMMARIZE is not None
        assert Intent.EXTRACT_ACTIONS is not None
        assert Intent.SEARCH is not None
        assert Intent.GENERATE_MEDICAL_DOC is not None
        assert Intent.EXPORT is not None
        assert Intent.AUTOMATE is not None
        assert Intent.CHAT is not None
        assert Intent.HELP is not None
        assert Intent.UNKNOWN is not None

    def test_intent_string_values(self):
        """Test intent string values."""
        assert Intent.TRANSCRIBE.value == "transcribe"
        assert Intent.SUMMARIZE.value == "summarize"
        assert Intent.SEARCH.value == "search"

    def test_intent_from_string(self):
        """Test creating intent from string."""
        intent = Intent("transcribe")
        assert intent == Intent.TRANSCRIBE


class TestUserContext:
    """Tests for UserContext model."""

    def test_create_user_context(self):
        """Test creating user context."""
        ctx = UserContext(
            user_id="user_123",
            professional_mode="general",
            language="en",
        )
        
        assert ctx.user_id == "user_123"
        assert ctx.professional_mode == "general"
        assert ctx.language == "en"

    def test_user_context_medical_mode(self):
        """Test medical professional mode."""
        ctx = UserContext(
            user_id="user_456",
            professional_mode="medical",
            language="en",
        )
        
        assert ctx.professional_mode == "medical"

    def test_user_context_with_timezone(self):
        """Test user context with timezone."""
        ctx = UserContext(
            user_id="user_789",
            timezone="America/New_York",
        )
        
        assert ctx.timezone == "America/New_York"


class TestTranscriptContext:
    """Tests for TranscriptContext model."""

    def test_create_transcript_context(self):
        """Test creating transcript context."""
        ctx = TranscriptContext(
            current_transcript_id="trans_123",
            active_recording=True,
        )
        
        assert ctx.current_transcript_id == "trans_123"
        assert ctx.active_recording is True

    def test_transcript_context_with_history(self):
        """Test transcript context with recent IDs."""
        ctx = TranscriptContext(
            current_transcript_id="trans_abc",
            recent_transcript_ids=["trans_1", "trans_2", "trans_3"],
        )
        
        assert len(ctx.recent_transcript_ids) == 3

    def test_transcript_context_defaults(self):
        """Test transcript context defaults."""
        ctx = TranscriptContext()
        
        assert ctx.current_transcript_id is None
        assert ctx.active_recording is False
        assert ctx.recent_transcript_ids == []


class TestConversationContext:
    """Tests for ConversationContext model."""

    def test_create_conversation_context(self):
        """Test creating conversation context."""
        ctx = ConversationContext(
            topic="Q1 Planning",
            entities=["budget", "timeline"],
        )
        
        assert ctx.topic == "Q1 Planning"
        assert len(ctx.entities) == 2

    def test_conversation_context_defaults(self):
        """Test conversation context defaults."""
        ctx = ConversationContext()
        
        assert ctx.topic is None
        assert ctx.entities == []
        assert ctx.referenced_items == []

    def test_conversation_context_with_references(self):
        """Test conversation context with referenced items."""
        ctx = ConversationContext(
            topic="Meeting Review",
            referenced_items=["trans_123", "trans_456"],
        )
        
        assert len(ctx.referenced_items) == 2


class TestPendingAction:
    """Tests for PendingAction model."""

    def test_create_pending_action(self):
        """Test creating a pending action."""
        action = PendingAction(
            action_id="action_123",
            action_type="confirm",
            description="Delete transcript trans_123",
            parameters={"transcript_id": "trans_123"},
        )
        
        assert action.action_id == "action_123"
        assert action.action_type == "confirm"
        assert action.description == "Delete transcript trans_123"

    def test_pending_action_requires_confirmation(self):
        """Test pending action for dangerous operation."""
        action = PendingAction(
            action_id="action_456",
            action_type="ehr_sync",
            description="Sync note to EHR",
            parameters={"note_id": "note_456"},
            requires_confirmation=True,
        )
        
        assert action.requires_confirmation is True

    def test_pending_action_has_timestamp(self):
        """Test pending action has created_at timestamp."""
        action = PendingAction(
            action_id="action_789",
            action_type="export",
            description="Export transcript",
            parameters={},
        )
        
        assert action.created_at is not None


class TestToolCall:
    """Tests for ToolCall model."""

    def test_create_tool_call(self):
        """Test creating a tool call."""
        call = ToolCall(
            tool_name="summarize_transcript",
            tool_id="call_123",
            arguments={"transcript_id": "trans_abc"},
        )
        
        assert call.tool_id == "call_123"
        assert call.tool_name == "summarize_transcript"
        assert call.arguments["transcript_id"] == "trans_abc"

    def test_tool_call_empty_arguments(self):
        """Test tool call with no arguments."""
        call = ToolCall(
            tool_name="list_transcripts",
            tool_id="call_456",
            arguments={},
        )
        
        assert call.arguments == {}


class TestToolResult:
    """Tests for ToolResult model."""

    def test_create_successful_result(self):
        """Test creating a successful tool result."""
        result = ToolResult(
            tool_id="call_123",
            tool_name="summarize_transcript",
            success=True,
            result={"summary": "Meeting discussed..."},
        )
        
        assert result.success is True
        assert result.error is None
        assert "summary" in result.result

    def test_create_failed_result(self):
        """Test creating a failed tool result."""
        result = ToolResult(
            tool_id="call_456",
            tool_name="get_transcript",
            success=False,
            error="Transcript not found",
        )
        
        assert result.success is False
        assert result.error == "Transcript not found"
        assert result.result is None

    def test_result_with_execution_time(self):
        """Test tool result with execution time."""
        result = ToolResult(
            tool_id="call_789",
            tool_name="list_transcripts",
            success=True,
            result={},
            execution_time_ms=150,
        )
        
        assert result.execution_time_ms == 150


class TestAgentMessage:
    """Tests for AgentMessage model."""

    def test_create_user_message(self):
        """Test creating a user message."""
        msg = AgentMessage(
            role="user",
            content="Summarize my last meeting",
        )
        
        assert msg.role == "user"
        assert "Summarize" in msg.content

    def test_create_assistant_message(self):
        """Test creating an assistant message."""
        msg = AgentMessage(
            role="assistant",
            content="Here's your summary...",
        )
        
        assert msg.role == "assistant"

    def test_message_with_tool_calls(self):
        """Test message with tool calls."""
        msg = AgentMessage(
            role="assistant",
            content="I'll summarize that for you.",
            tool_calls=[
                ToolCall(
                    tool_id="call_1",
                    tool_name="summarize_transcript",
                    arguments={"transcript_id": "trans_123"},
                ),
            ],
        )
        
        assert len(msg.tool_calls) == 1

    def test_message_timestamp(self):
        """Test message has timestamp."""
        msg = AgentMessage(
            role="user",
            content="Hello",
        )
        
        assert msg.timestamp is not None


class TestStreamChunk:
    """Tests for StreamChunk model."""

    def test_create_text_chunk(self):
        """Test creating a text chunk."""
        chunk = StreamChunk(
            type="text",
            content="Hello, ",
        )
        
        assert chunk.type == "text"
        assert chunk.content == "Hello, "

    def test_create_tool_start_chunk(self):
        """Test creating a tool_start chunk."""
        chunk = StreamChunk(
            type="tool_start",
            tool_name="summarize_transcript",
        )
        
        assert chunk.type == "tool_start"
        assert chunk.tool_name == "summarize_transcript"

    def test_create_tool_end_chunk(self):
        """Test creating a tool_end chunk."""
        chunk = StreamChunk(
            type="tool_end",
            tool_name="summarize_transcript",
            tool_result={"summary": "Meeting notes..."},
        )
        
        assert chunk.type == "tool_end"
        assert chunk.tool_result is not None

    def test_create_complete_chunk(self):
        """Test creating a complete chunk."""
        chunk = StreamChunk(
            type="complete",
            is_final=True,
        )
        
        assert chunk.type == "complete"
        assert chunk.is_final is True


class TestAgentResponse:
    """Tests for AgentResponse model."""

    def test_create_response(self):
        """Test creating an agent response."""
        response = AgentResponse(
            session_id="session_123",
            message="Here's your summary...",
            intent=Intent.SUMMARIZE,
        )
        
        assert response.session_id == "session_123"
        assert response.intent == Intent.SUMMARIZE

    def test_response_with_tool_calls(self):
        """Test response with tool calls."""
        response = AgentResponse(
            session_id="session_456",
            message="Processing...",
            intent=Intent.SUMMARIZE,
            tool_calls=[
                ToolCall(
                    tool_id="call_1",
                    tool_name="summarize_transcript",
                    arguments={},
                ),
            ],
        )
        
        assert len(response.tool_calls) == 1

    def test_response_with_suggestions(self):
        """Test response with suggestions."""
        response = AgentResponse(
            session_id="session_789",
            message="Done!",
            intent=Intent.CHAT,
            suggestions=["Extract action items", "Share with team"],
        )
        
        assert len(response.suggestions) == 2

    def test_response_metadata(self):
        """Test response with metadata."""
        response = AgentResponse(
            session_id="session_abc",
            message="Complete",
            intent=Intent.EXPORT,
            metadata={"processing_time_ms": 250},
        )
        
        assert response.metadata["processing_time_ms"] == 250


class TestAgentState:
    """Tests for AgentState TypedDict."""

    def test_create_minimal_state(self):
        """Test creating a minimal agent state."""
        state: AgentState = {
            "messages": [],
            "session_id": "session_123",
            "user_id": "user_456",
        }
        
        assert state["session_id"] == "session_123"
        assert state["user_id"] == "user_456"

    def test_state_with_intent(self):
        """Test state with intent and confidence."""
        state: AgentState = {
            "messages": [],
            "session_id": "session_123",
            "user_id": "user_456",
            "intent": Intent.TRANSCRIBE,
            "confidence": 0.95,
        }
        
        assert state["intent"] == Intent.TRANSCRIBE

    def test_state_with_context(self):
        """Test state with user and transcript context."""
        state: AgentState = {
            "messages": [],
            "session_id": "session_123",
            "user_id": "user_456",
            "user_context": UserContext(user_id="user_456"),
            "transcript_context": TranscriptContext(active_recording=True),
        }
        
        assert state["user_context"].user_id == "user_456"
        assert state["transcript_context"].active_recording is True
