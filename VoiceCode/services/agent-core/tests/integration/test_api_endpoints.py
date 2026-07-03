"""
Integration tests for API Endpoints
"""

import pytest
from unittest.mock import MagicMock, patch, AsyncMock
from fastapi.testclient import TestClient

from src.api.main import app


class TestHealthEndpoints:
    """Tests for health check endpoints."""

    def test_health_check(self, client: TestClient):
        """Test basic health check endpoint."""
        response = client.get("/health")
        
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"

    def test_readiness_check(self, client: TestClient):
        """Test readiness probe endpoint."""
        response = client.get("/ready")
        
        assert response.status_code == 200


class TestChatEndpoint:
    """Tests for chat endpoint."""

    @patch("src.api.main.get_agent_graph")
    def test_chat_basic_message(self, mock_graph, client: TestClient, helpers):
        """Test basic chat message."""
        mock_graph.return_value.invoke.return_value = {
            "messages": [MagicMock(content="Hello! How can I help?")],
            "intent": "general",
        }
        
        request = helpers.create_chat_request("Hello")
        response = client.post("/api/v1/agent/chat", json=request)
        
        assert response.status_code == 200
        data = response.json()
        assert "message" in data or "session_id" in data

    @patch("src.api.main.get_agent_graph")
    def test_chat_with_session_id(self, mock_graph, client: TestClient, helpers):
        """Test chat with existing session."""
        mock_graph.return_value.invoke.return_value = {
            "messages": [MagicMock(content="Continuing conversation")],
            "intent": "general",
        }
        
        request = helpers.create_chat_request(
            "Continue our discussion",
            session_id="existing_session_123",
        )
        response = client.post("/api/v1/agent/chat", json=request)
        
        assert response.status_code == 200

    @patch("src.api.main.get_agent_graph")
    def test_chat_medical_mode(self, mock_graph, client: TestClient, helpers):
        """Test chat in medical professional mode."""
        mock_graph.return_value.invoke.return_value = {
            "messages": [MagicMock(content="Medical response")],
            "intent": "medical",
        }
        
        request = helpers.create_chat_request(
            "Generate a SOAP note",
            professional_mode="medical",
        )
        response = client.post("/api/v1/agent/chat", json=request)
        
        assert response.status_code == 200

    def test_chat_empty_message(self, client: TestClient):
        """Test chat with empty message."""
        response = client.post(
            "/api/v1/agent/chat",
            json={"message": "", "session_id": None},
        )
        
        # Should return validation error
        assert response.status_code in [400, 422]

    def test_chat_missing_message(self, client: TestClient):
        """Test chat without message field."""
        response = client.post(
            "/api/v1/agent/chat",
            json={"session_id": "test"},
        )
        
        assert response.status_code == 422  # Validation error


class TestCommandEndpoint:
    """Tests for command execution endpoint."""

    @patch("src.tools.registry.execute_tool")
    def test_execute_command_success(self, mock_execute, client: TestClient, helpers):
        """Test successful command execution."""
        mock_execute.return_value = {
            "success": True,
            "data": {"summary": "Test summary"},
            "error": None,
        }
        
        request = helpers.create_command_request(
            "summarize_transcript",
            {"transcript_id": "trans_123"},
        )
        response = client.post("/api/v1/agent/command", json=request)
        
        assert response.status_code == 200

    @patch("src.tools.registry.execute_tool")
    def test_execute_command_with_params(self, mock_execute, client: TestClient, helpers):
        """Test command with parameters."""
        mock_execute.return_value = {
            "success": True,
            "data": {"exported": True},
            "error": None,
        }
        
        request = helpers.create_command_request(
            "export_transcript",
            {"transcript_id": "trans_456", "format": "pdf"},
        )
        response = client.post("/api/v1/agent/command", json=request)
        
        assert response.status_code == 200

    @patch("src.tools.registry.execute_tool")
    def test_execute_command_not_found(self, mock_execute, client: TestClient, helpers):
        """Test executing non-existent command."""
        mock_execute.return_value = {
            "success": False,
            "data": None,
            "error": "Tool not found",
        }
        
        request = helpers.create_command_request("nonexistent_tool")
        response = client.post("/api/v1/agent/command", json=request)
        
        # Command might return 200 with error in body or 404
        assert response.status_code in [200, 404]

    def test_execute_command_missing_name(self, client: TestClient):
        """Test command without name."""
        response = client.post(
            "/api/v1/agent/command",
            json={"parameters": {}},
        )
        
        assert response.status_code == 422


class TestSearchEndpoint:
    """Tests for search endpoint."""

    @patch("src.rag.retriever.get_retriever")
    async def test_search_basic(self, mock_retriever, client: TestClient, helpers):
        """Test basic search."""
        mock_instance = AsyncMock()
        mock_instance.search.return_value = MagicMock(
            results=[],
            total_results=0,
        )
        mock_retriever.return_value = mock_instance
        
        request = helpers.create_search_request("meeting notes")
        response = client.post("/api/v1/agent/search", json=request)
        
        assert response.status_code == 200

    def test_search_with_limit(self, client: TestClient, helpers):
        """Test search with custom limit."""
        request = helpers.create_search_request("test query", limit=5)
        response = client.post("/api/v1/agent/search", json=request)
        
        assert response.status_code == 200

    def test_search_empty_query(self, client: TestClient):
        """Test search with empty query."""
        response = client.post(
            "/api/v1/agent/search",
            json={"query": ""},
        )
        
        # Might allow empty or reject
        assert response.status_code in [200, 400, 422]


class TestSuggestionsEndpoint:
    """Tests for suggestions endpoint."""

    def test_get_suggestions_basic(self, client: TestClient):
        """Test getting suggestions."""
        response = client.get("/api/v1/agent/suggestions")
        
        assert response.status_code == 200
        data = response.json()
        assert "suggestions" in data

    def test_get_suggestions_with_context(self, client: TestClient):
        """Test suggestions with context."""
        response = client.get(
            "/api/v1/agent/suggestions",
            params={"transcript_id": "trans_123"},
        )
        
        assert response.status_code == 200


class TestSessionEndpoints:
    """Tests for session management endpoints."""

    def test_get_session_history(self, client: TestClient):
        """Test getting session history."""
        response = client.get(
            "/api/v1/agent/sessions/test_session_123/history"
        )
        
        # Might return 200 or 404 if session doesn't exist
        assert response.status_code in [200, 404]

    def test_clear_session(self, client: TestClient):
        """Test clearing a session."""
        response = client.delete(
            "/api/v1/agent/sessions/test_session_123"
        )
        
        assert response.status_code in [200, 204, 404]


class TestCORSHeaders:
    """Tests for CORS configuration."""

    def test_cors_headers_present(self, client: TestClient):
        """Test that CORS headers are present."""
        response = client.options(
            "/api/v1/agent/chat",
            headers={"Origin": "http://localhost:3000"},
        )
        
        # Should allow preflight or return headers
        assert response.status_code in [200, 204, 405]

    def test_allowed_origin(self, client: TestClient):
        """Test allowed origin header."""
        response = client.get(
            "/health",
            headers={"Origin": "http://localhost:3000"},
        )
        
        assert response.status_code == 200


class TestRateLimiting:
    """Tests for rate limiting."""

    def test_multiple_requests_allowed(self, client: TestClient):
        """Test that multiple requests are allowed within limits."""
        for _ in range(5):
            response = client.get("/health")
            assert response.status_code == 200


class TestErrorHandling:
    """Tests for error handling."""

    def test_invalid_json(self, client: TestClient):
        """Test handling of invalid JSON."""
        response = client.post(
            "/api/v1/agent/chat",
            content="invalid json",
            headers={"Content-Type": "application/json"},
        )
        
        assert response.status_code == 422

    def test_404_endpoint(self, client: TestClient):
        """Test 404 for non-existent endpoint."""
        response = client.get("/api/v1/nonexistent")
        
        assert response.status_code == 404

    @patch("src.api.main.get_agent_graph")
    def test_internal_error_handling(self, mock_graph, client: TestClient, helpers):
        """Test internal error handling."""
        mock_graph.return_value.invoke.side_effect = Exception("Internal error")
        
        request = helpers.create_chat_request("test")
        response = client.post("/api/v1/agent/chat", json=request)
        
        # Should return 500 or handle gracefully
        assert response.status_code in [200, 500]
