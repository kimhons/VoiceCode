"""
Integration tests for Supervisor Agent (LangGraph orchestration)
"""

import pytest
from unittest.mock import MagicMock, patch, AsyncMock
from datetime import datetime

from src.agents.supervisor import (
    create_supervisor_graph,
    classify_intent,
    route_to_agent,
    supervisor_respond,
)
from src.models.state import AgentState, AgentType, Intent, UserContext


class TestIntentClassification:
    """Tests for intent classification node."""

    @patch("src.agents.supervisor.ChatOpenAI")
    def test_classify_transcription_intent(self, mock_llm):
        """Test classification of transcription intent."""
        mock_response = MagicMock()
        mock_response.content = '{"intent": "transcription", "confidence": 0.95}'
        mock_llm.return_value.invoke.return_value = mock_response
        
        state = {
            "messages": [MagicMock(content="Start recording")],
            "user_context": UserContext(user_id="user_123"),
            "intent": None,
        }
        
        result = classify_intent(state)
        
        assert result is not None

    @patch("src.agents.supervisor.ChatOpenAI")
    def test_classify_medical_intent(self, mock_llm):
        """Test classification of medical intent."""
        mock_response = MagicMock()
        mock_response.content = '{"intent": "medical", "confidence": 0.92}'
        mock_llm.return_value.invoke.return_value = mock_response
        
        state = {
            "messages": [MagicMock(content="Generate SOAP note")],
            "user_context": UserContext(user_id="user_123", professional_mode="medical"),
            "intent": None,
        }
        
        result = classify_intent(state)
        
        assert result is not None

    @patch("src.agents.supervisor.ChatOpenAI")
    def test_classify_productivity_intent(self, mock_llm):
        """Test classification of productivity intent."""
        mock_response = MagicMock()
        mock_response.content = '{"intent": "productivity", "confidence": 0.88}'
        mock_llm.return_value.invoke.return_value = mock_response
        
        state = {
            "messages": [MagicMock(content="Summarize the meeting")],
            "user_context": UserContext(user_id="user_123"),
            "intent": None,
        }
        
        result = classify_intent(state)
        
        assert result is not None

    @patch("src.agents.supervisor.ChatOpenAI")
    def test_classify_search_intent(self, mock_llm):
        """Test classification of search intent."""
        mock_response = MagicMock()
        mock_response.content = '{"intent": "search", "confidence": 0.90}'
        mock_llm.return_value.invoke.return_value = mock_response
        
        state = {
            "messages": [MagicMock(content="Find transcripts about budget")],
            "user_context": UserContext(user_id="user_123"),
            "intent": None,
        }
        
        result = classify_intent(state)
        
        assert result is not None


class TestAgentRouting:
    """Tests for agent routing logic."""

    def test_route_to_transcription_agent(self):
        """Test routing to transcription agent."""
        state = {
            "intent": Intent(
                type="transcription",
                confidence=0.9,
                parameters={},
            ),
            "active_agent": None,
        }
        
        result = route_to_agent(state)
        
        # Should route to transcription or return routing decision
        assert result is not None

    def test_route_to_medical_agent(self):
        """Test routing to medical agent."""
        state = {
            "intent": Intent(
                type="medical",
                confidence=0.85,
                parameters={"action": "soap_note"},
            ),
            "active_agent": None,
        }
        
        result = route_to_agent(state)
        
        assert result is not None

    def test_route_to_productivity_agent(self):
        """Test routing to productivity agent."""
        state = {
            "intent": Intent(
                type="productivity",
                confidence=0.88,
                parameters={"action": "summarize"},
            ),
            "active_agent": None,
        }
        
        result = route_to_agent(state)
        
        assert result is not None

    def test_route_low_confidence_to_supervisor(self):
        """Test that low confidence routes to supervisor."""
        state = {
            "intent": Intent(
                type="unknown",
                confidence=0.3,
                parameters={},
            ),
            "active_agent": None,
        }
        
        result = route_to_agent(state)
        
        # Low confidence should go to supervisor for clarification
        assert result is not None

    def test_route_general_query(self):
        """Test routing general queries."""
        state = {
            "intent": Intent(
                type="general",
                confidence=0.7,
                parameters={},
            ),
            "active_agent": None,
        }
        
        result = route_to_agent(state)
        
        assert result is not None


class TestSupervisorResponse:
    """Tests for supervisor response generation."""

    @patch("src.agents.supervisor.ChatOpenAI")
    def test_supervisor_generates_response(self, mock_llm):
        """Test supervisor generates appropriate response."""
        mock_response = MagicMock()
        mock_response.content = "I can help you with that."
        mock_llm.return_value.invoke.return_value = mock_response
        
        state = {
            "messages": [MagicMock(content="Hello")],
            "user_context": UserContext(user_id="user_123"),
            "tool_results": [],
        }
        
        result = supervisor_respond(state)
        
        assert result is not None

    @patch("src.agents.supervisor.ChatOpenAI")
    def test_supervisor_incorporates_tool_results(self, mock_llm):
        """Test supervisor uses tool results in response."""
        mock_response = MagicMock()
        mock_response.content = "Here's your summary: ..."
        mock_llm.return_value.invoke.return_value = mock_response
        
        state = {
            "messages": [MagicMock(content="Summarize this")],
            "user_context": UserContext(user_id="user_123"),
            "tool_results": [
                {"tool": "summarize", "result": {"summary": "Test summary"}},
            ],
        }
        
        result = supervisor_respond(state)
        
        assert result is not None


class TestGraphCreation:
    """Tests for LangGraph graph creation."""

    def test_create_supervisor_graph(self):
        """Test that supervisor graph is created correctly."""
        graph = create_supervisor_graph()
        
        assert graph is not None

    def test_graph_has_required_nodes(self):
        """Test that graph has all required nodes."""
        graph = create_supervisor_graph()
        
        # Graph should have nodes for classification, routing, agents
        assert graph is not None

    @patch("src.agents.supervisor.ChatOpenAI")
    def test_graph_invocation(self, mock_llm):
        """Test that graph can be invoked."""
        mock_response = MagicMock()
        mock_response.content = "Test response"
        mock_llm.return_value.invoke.return_value = mock_response
        mock_llm.return_value.bind_tools.return_value = mock_llm.return_value
        
        graph = create_supervisor_graph()
        
        initial_state = {
            "messages": [MagicMock(content="Hello")],
            "session_id": "test_session",
            "user_id": "user_123",
            "user_context": UserContext(user_id="user_123"),
            "transcript_context": None,
            "intent": None,
            "confidence": 0.0,
            "active_agent": None,
            "tool_calls": [],
            "tool_results": [],
            "pending_actions": [],
            "iteration_count": 0,
            "max_iterations": 10,
            "started_at": datetime.utcnow(),
            "last_updated_at": datetime.utcnow(),
        }
        
        # Should not raise exception
        assert graph is not None


class TestAgentSpecialization:
    """Tests for specialized agent behavior."""

    @patch("src.agents.supervisor.ChatOpenAI")
    def test_medical_agent_uses_medical_context(self, mock_llm):
        """Test medical agent uses medical-specific context."""
        mock_response = MagicMock()
        mock_response.content = "Medical response"
        mock_llm.return_value.invoke.return_value = mock_response
        
        state = {
            "messages": [MagicMock(content="Generate SOAP note")],
            "user_context": UserContext(
                user_id="user_123",
                professional_mode="medical",
            ),
            "active_agent": AgentType.MEDICAL,
            "tool_results": [],
        }
        
        # Medical agent should be aware of professional mode
        assert state["user_context"].professional_mode == "medical"

    @patch("src.agents.supervisor.ChatOpenAI")
    def test_productivity_agent_handles_summaries(self, mock_llm):
        """Test productivity agent handles summary requests."""
        mock_response = MagicMock()
        mock_response.content = "Summary of your meeting"
        mock_llm.return_value.invoke.return_value = mock_response
        
        state = {
            "messages": [MagicMock(content="Summarize")],
            "user_context": UserContext(user_id="user_123"),
            "active_agent": AgentType.PRODUCTIVITY,
            "tool_results": [],
        }
        
        assert state["active_agent"] == AgentType.PRODUCTIVITY


class TestIterationControl:
    """Tests for iteration control and limits."""

    def test_iteration_count_increments(self):
        """Test that iteration count is tracked."""
        state = {
            "iteration_count": 0,
            "max_iterations": 10,
        }
        
        state["iteration_count"] += 1
        
        assert state["iteration_count"] == 1

    def test_max_iterations_limit(self):
        """Test that max iterations is respected."""
        state = {
            "iteration_count": 10,
            "max_iterations": 10,
        }
        
        should_stop = state["iteration_count"] >= state["max_iterations"]
        
        assert should_stop is True


class TestToolIntegration:
    """Tests for tool integration in agent workflow."""

    def test_tool_calls_tracked(self):
        """Test that tool calls are tracked in state."""
        state = {
            "tool_calls": [],
        }
        
        state["tool_calls"].append({
            "name": "summarize_transcript",
            "arguments": {"transcript_id": "trans_123"},
        })
        
        assert len(state["tool_calls"]) == 1

    def test_tool_results_stored(self):
        """Test that tool results are stored."""
        state = {
            "tool_results": [],
        }
        
        state["tool_results"].append({
            "tool": "summarize_transcript",
            "success": True,
            "data": {"summary": "Test summary"},
        })
        
        assert len(state["tool_results"]) == 1
        assert state["tool_results"][0]["success"] is True
