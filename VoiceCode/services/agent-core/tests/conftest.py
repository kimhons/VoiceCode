"""
VoiceCode Agent Core - Test Configuration
Shared fixtures and configuration for all tests
"""

import os
import sys
import pytest
import asyncio
from typing import Generator, AsyncGenerator, Dict, Any
from unittest.mock import MagicMock, AsyncMock, patch
from datetime import datetime

# Set test environment before imports
os.environ["ENVIRONMENT"] = "test"
os.environ["JWT_SECRET"] = "test-secret-key-for-testing-only"
os.environ["DATABASE_URL"] = "postgresql://test:test@localhost:5432/test"
os.environ["SUPABASE_URL"] = "https://test.supabase.co"
os.environ["SUPABASE_ANON_KEY"] = "test-anon-key"
os.environ["SUPABASE_KEY"] = "test-supabase-key"
os.environ["OPENAI_API_KEY"] = "sk-test-key"
os.environ["REDIS_URL"] = "redis://localhost:6379"

# Mock heavy dependencies before importing
# Create proper mock modules that can be imported as packages
import types

def create_mock_module(name):
    """Create a proper mock module."""
    mod = types.ModuleType(name)
    mod.__file__ = f"<mock {name}>"
    mod.__loader__ = None
    mod.__package__ = name
    mod.__path__ = []
    return mod

# LangGraph mocks
sys.modules["langgraph"] = create_mock_module("langgraph")
sys.modules["langgraph.graph"] = create_mock_module("langgraph.graph")
sys.modules["langgraph.graph.message"] = create_mock_module("langgraph.graph.message")
sys.modules["langgraph.graph.message"].add_messages = lambda x: x
sys.modules["langgraph.checkpoint"] = create_mock_module("langgraph.checkpoint")
sys.modules["langgraph.checkpoint.postgres"] = create_mock_module("langgraph.checkpoint.postgres")
sys.modules["langgraph.checkpoint.postgres"].PostgresSaver = MagicMock()
sys.modules["langgraph.prebuilt"] = create_mock_module("langgraph.prebuilt")

# LangChain mocks
sys.modules["langchain"] = create_mock_module("langchain")
sys.modules["langchain_openai"] = create_mock_module("langchain_openai")
sys.modules["langchain_openai"].ChatOpenAI = MagicMock()
sys.modules["langchain_core"] = create_mock_module("langchain_core")
sys.modules["langchain_core.messages"] = create_mock_module("langchain_core.messages")
sys.modules["langchain_core.messages"].HumanMessage = MagicMock()
sys.modules["langchain_core.messages"].AIMessage = MagicMock()
sys.modules["langchain_core.messages"].SystemMessage = MagicMock()
sys.modules["langchain_core.tools"] = create_mock_module("langchain_core.tools")
sys.modules["langchain_core.tools"].tool = lambda f: f  # Decorator returns function as-is

# LlamaIndex mocks
sys.modules["llama_index"] = create_mock_module("llama_index")
sys.modules["llama_index.core"] = create_mock_module("llama_index.core")
sys.modules["llama_index.core"].Document = MagicMock()
sys.modules["llama_index.core"].VectorStoreIndex = MagicMock()
sys.modules["llama_index.core.schema"] = create_mock_module("llama_index.core.schema")
sys.modules["llama_index.core.node_parser"] = create_mock_module("llama_index.core.node_parser")
sys.modules["llama_index.core.indices"] = create_mock_module("llama_index.core.indices")
sys.modules["llama_index.embeddings"] = create_mock_module("llama_index.embeddings")
sys.modules["llama_index.embeddings.openai"] = create_mock_module("llama_index.embeddings.openai")
sys.modules["llama_index.embeddings.openai"].OpenAIEmbedding = MagicMock()

# Supabase mock
sys.modules["supabase"] = create_mock_module("supabase")
sys.modules["supabase"].create_client = MagicMock()

from fastapi.testclient import TestClient
from httpx import AsyncClient, ASGITransport

# Import with mocked dependencies
try:
    from src.api.main import app
except ImportError:
    app = MagicMock()

try:
    from src.config.settings import Settings, get_settings
except ImportError:
    Settings = MagicMock()
    get_settings = MagicMock()

try:
    from src.models.state import (
        AgentState, AgentType, Intent, UserContext, 
        TranscriptContext, ToolCall, ToolResult
    )
except ImportError:
    AgentState = dict
    AgentType = MagicMock()
    Intent = MagicMock()
    UserContext = MagicMock()
    TranscriptContext = MagicMock()
    ToolCall = MagicMock()
    ToolResult = MagicMock()


# ============================================================================
# Fixtures - Settings & Configuration
# ============================================================================

@pytest.fixture(scope="session")
def test_settings() -> Settings:
    """Get test settings instance."""
    return Settings(
        app_name="VoiceCode Agent Core Test",
        environment="test",
        debug=True,
        jwt_secret="test-secret-key",
        database_url="postgresql://test:test@localhost:5432/test",
        supabase_url="https://test.supabase.co",
        supabase_key="test-key",
        openai_api_key="sk-test",
    )


@pytest.fixture
def mock_settings(test_settings: Settings):
    """Mock the get_settings function."""
    with patch("src.config.settings.get_settings", return_value=test_settings):
        yield test_settings


# ============================================================================
# Fixtures - API Client
# ============================================================================

@pytest.fixture
def client() -> Generator[TestClient, None, None]:
    """Synchronous test client for FastAPI."""
    with TestClient(app) as c:
        yield c


@pytest.fixture
async def async_client() -> AsyncGenerator[AsyncClient, None]:
    """Async test client for FastAPI."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac


# ============================================================================
# Fixtures - Mock Data
# ============================================================================

@pytest.fixture
def sample_user_id() -> str:
    """Sample user ID for tests."""
    return "user_test_12345"


@pytest.fixture
def sample_session_id() -> str:
    """Sample session ID for tests."""
    return "session_test_67890"


@pytest.fixture
def sample_transcript_id() -> str:
    """Sample transcript ID for tests."""
    return "trans_test_abcdef"


@pytest.fixture
def sample_transcript() -> Dict[str, Any]:
    """Sample transcript data."""
    return {
        "id": "trans_test_abcdef",
        "user_id": "user_test_12345",
        "title": "Team Meeting - Q1 Planning",
        "content": """
        John: Good morning everyone, let's discuss our Q1 goals.
        Sarah: I think we should focus on the new product launch.
        Mike: Agreed. We need to allocate resources for marketing.
        John: Let's set a deadline of March 15th for the initial release.
        Sarah: I'll handle the product documentation.
        Mike: I'll coordinate with the design team.
        John: Great, let's reconvene next week to check progress.
        """,
        "language": "en",
        "speakers": ["John", "Sarah", "Mike"],
        "duration_seconds": 1800,
        "created_at": "2024-01-15T10:00:00Z",
        "metadata": {
            "meeting_type": "planning",
            "department": "product",
        },
    }


@pytest.fixture
def sample_medical_transcript() -> Dict[str, Any]:
    """Sample medical transcript data."""
    return {
        "id": "trans_medical_123",
        "user_id": "user_test_12345",
        "title": "Patient Visit - John Doe",
        "content": """
        Doctor: Good morning, Mr. Doe. What brings you in today?
        Patient: I've been having headaches for the past week.
        Doctor: Can you describe the pain? Is it throbbing or constant?
        Patient: It's throbbing, mostly on the right side.
        Doctor: Any nausea or sensitivity to light?
        Patient: Some light sensitivity, but no nausea.
        Doctor: Let me check your vitals. Blood pressure is 120/80, temperature normal.
        Doctor: Based on your symptoms, this appears to be a tension headache.
        Doctor: I'm recommending ibuprofen as needed and stress reduction.
        Doctor: Please come back if symptoms worsen or persist beyond two weeks.
        """,
        "language": "en",
        "speakers": ["Doctor", "Patient"],
        "duration_seconds": 600,
        "created_at": "2024-01-15T14:00:00Z",
        "metadata": {
            "encounter_type": "follow_up",
            "specialty": "general",
        },
    }


@pytest.fixture
def sample_user_context(sample_user_id: str) -> UserContext:
    """Sample user context."""
    return UserContext(
        user_id=sample_user_id,
        professional_mode="general",
        language="en",
        timezone="America/New_York",
    )


@pytest.fixture
def sample_medical_user_context(sample_user_id: str) -> UserContext:
    """Sample medical user context."""
    return UserContext(
        user_id=sample_user_id,
        professional_mode="medical",
        language="en",
        timezone="America/New_York",
    )


@pytest.fixture
def sample_transcript_context(sample_transcript_id: str) -> TranscriptContext:
    """Sample transcript context."""
    return TranscriptContext(
        current_transcript_id=sample_transcript_id,
        active_recording=False,
        recent_transcript_ids=[sample_transcript_id],
    )


@pytest.fixture
def sample_agent_state(
    sample_session_id: str,
    sample_user_id: str,
    sample_user_context: UserContext,
    sample_transcript_context: TranscriptContext,
) -> AgentState:
    """Sample agent state for testing."""
    return {
        "messages": [],
        "session_id": sample_session_id,
        "user_id": sample_user_id,
        "user_context": sample_user_context,
        "transcript_context": sample_transcript_context,
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


# ============================================================================
# Fixtures - Mocks
# ============================================================================

@pytest.fixture
def mock_openai_response():
    """Mock OpenAI API response."""
    mock = MagicMock()
    mock.content = "This is a mock AI response."
    mock.tool_calls = []
    return mock


@pytest.fixture
def mock_llm(mock_openai_response):
    """Mock LLM for testing agents."""
    mock = MagicMock()
    mock.invoke = MagicMock(return_value=mock_openai_response)
    mock.bind_tools = MagicMock(return_value=mock)
    return mock


@pytest.fixture
def mock_supabase_client():
    """Mock Supabase client."""
    mock = MagicMock()
    mock.table = MagicMock(return_value=mock)
    mock.select = MagicMock(return_value=mock)
    mock.insert = MagicMock(return_value=mock)
    mock.update = MagicMock(return_value=mock)
    mock.delete = MagicMock(return_value=mock)
    mock.eq = MagicMock(return_value=mock)
    mock.single = MagicMock(return_value=mock)
    mock.execute = MagicMock(return_value=MagicMock(data=[]))
    return mock


@pytest.fixture
def mock_vector_store():
    """Mock vector store for RAG tests."""
    mock = MagicMock()
    mock.add = MagicMock()
    mock.query = MagicMock(return_value=[])
    return mock


# ============================================================================
# Fixtures - Event Loop
# ============================================================================

@pytest.fixture(scope="session")
def event_loop():
    """Create event loop for async tests."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


# ============================================================================
# Test Helpers
# ============================================================================

class TestHelpers:
    """Helper methods for tests."""
    
    @staticmethod
    def create_chat_request(
        message: str,
        session_id: str = None,
        professional_mode: str = "general",
    ) -> Dict[str, Any]:
        """Create a chat request payload."""
        return {
            "message": message,
            "session_id": session_id,
            "context": {},
            "professional_mode": professional_mode,
        }
    
    @staticmethod
    def create_command_request(
        command: str,
        parameters: Dict[str, Any] = None,
        session_id: str = None,
    ) -> Dict[str, Any]:
        """Create a command request payload."""
        return {
            "command": command,
            "parameters": parameters or {},
            "session_id": session_id,
        }
    
    @staticmethod
    def create_search_request(
        query: str,
        limit: int = 10,
        filters: Dict[str, Any] = None,
    ) -> Dict[str, Any]:
        """Create a search request payload."""
        return {
            "query": query,
            "limit": limit,
            "filters": filters,
        }


@pytest.fixture
def helpers() -> TestHelpers:
    """Get test helpers instance."""
    return TestHelpers()
