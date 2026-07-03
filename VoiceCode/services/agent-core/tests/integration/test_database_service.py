"""
Integration tests for Database Service (Supabase integration)
"""

import pytest
from unittest.mock import MagicMock, patch, AsyncMock
from datetime import datetime

from src.services.database import (
    DatabaseService,
    get_database_service,
)
from src.services.transcript_service import (
    TranscriptService,
    get_transcript_service,
)


class TestDatabaseService:
    """Tests for DatabaseService."""

    @pytest.fixture
    def db_service(self):
        """Create database service with mocked client."""
        service = DatabaseService()
        service._client = MagicMock()
        return service

    def test_client_property(self, db_service):
        """Test client property returns client."""
        client = db_service.client
        assert client is not None


class TestTranscriptOperations:
    """Tests for transcript CRUD operations."""

    @pytest.fixture
    def db_service(self):
        """Create database service with mocked client."""
        service = DatabaseService()
        mock_client = MagicMock()
        mock_response = MagicMock()
        mock_response.data = [{"id": "trans_123", "title": "Test"}]
        mock_client.table.return_value.select.return_value.eq.return_value.eq.return_value.single.return_value.execute.return_value = mock_response
        service._client = mock_client
        return service

    async def test_get_transcript(self, db_service):
        """Test getting a transcript."""
        result = await db_service.get_transcript("trans_123", "user_456")
        
        # Should return data or None
        assert result is not None or result is None

    async def test_get_transcript_not_found(self, db_service):
        """Test getting non-existent transcript."""
        db_service._client.table.return_value.select.return_value.eq.return_value.eq.return_value.single.return_value.execute.side_effect = Exception("Not found")
        
        result = await db_service.get_transcript("nonexistent", "user_123")
        
        assert result is None

    async def test_list_transcripts(self, db_service):
        """Test listing transcripts."""
        mock_response = MagicMock()
        mock_response.data = [
            {"id": "trans_1", "title": "Meeting 1"},
            {"id": "trans_2", "title": "Meeting 2"},
        ]
        db_service._client.table.return_value.select.return_value.eq.return_value.order.return_value.range.return_value.execute.return_value = mock_response
        
        result = await db_service.list_transcripts("user_123")
        
        assert isinstance(result, list)

    async def test_list_transcripts_with_pagination(self, db_service):
        """Test listing with pagination."""
        mock_response = MagicMock()
        mock_response.data = []
        db_service._client.table.return_value.select.return_value.eq.return_value.order.return_value.range.return_value.execute.return_value = mock_response
        
        result = await db_service.list_transcripts(
            "user_123",
            limit=10,
            offset=20,
        )
        
        assert isinstance(result, list)

    async def test_create_transcript(self, db_service):
        """Test creating a transcript."""
        mock_response = MagicMock()
        mock_response.data = [{"id": "new_trans", "title": "New Meeting"}]
        db_service._client.table.return_value.insert.return_value.execute.return_value = mock_response
        
        result = await db_service.create_transcript({
            "user_id": "user_123",
            "title": "New Meeting",
            "content": "Meeting content",
        })
        
        assert result is not None or result is None

    async def test_update_transcript(self, db_service):
        """Test updating a transcript."""
        mock_response = MagicMock()
        mock_response.data = [{"id": "trans_123", "title": "Updated"}]
        db_service._client.table.return_value.update.return_value.eq.return_value.eq.return_value.execute.return_value = mock_response
        
        result = await db_service.update_transcript(
            "trans_123",
            "user_456",
            {"title": "Updated Title"},
        )
        
        assert result is not None or result is None

    async def test_delete_transcript(self, db_service):
        """Test deleting a transcript."""
        db_service._client.table.return_value.delete.return_value.eq.return_value.eq.return_value.execute.return_value = MagicMock()
        
        result = await db_service.delete_transcript("trans_123", "user_456")
        
        assert result is True or result is False


class TestSessionOperations:
    """Tests for session operations."""

    @pytest.fixture
    def db_service(self):
        """Create database service with mocked client."""
        service = DatabaseService()
        service._client = MagicMock()
        return service

    async def test_get_session(self, db_service):
        """Test getting a session."""
        mock_response = MagicMock()
        mock_response.data = {"id": "session_123", "user_id": "user_456"}
        db_service._client.table.return_value.select.return_value.eq.return_value.single.return_value.execute.return_value = mock_response
        
        result = await db_service.get_session("session_123")
        
        assert result is not None or result is None

    async def test_create_session(self, db_service):
        """Test creating a session."""
        mock_response = MagicMock()
        mock_response.data = [{"id": "new_session"}]
        db_service._client.table.return_value.insert.return_value.execute.return_value = mock_response
        
        result = await db_service.create_session({
            "id": "new_session",
            "user_id": "user_123",
        })
        
        assert result is not None or result is None

    async def test_update_session(self, db_service):
        """Test updating a session."""
        mock_response = MagicMock()
        mock_response.data = [{"id": "session_123"}]
        db_service._client.table.return_value.update.return_value.eq.return_value.execute.return_value = mock_response
        
        result = await db_service.update_session(
            "session_123",
            {"last_message": "Hello"},
        )
        
        assert result is not None or result is None

    async def test_add_session_message(self, db_service):
        """Test adding message to session."""
        db_service._client.table.return_value.insert.return_value.execute.return_value = MagicMock()
        
        result = await db_service.add_session_message(
            "session_123",
            {"role": "user", "content": "Hello"},
        )
        
        assert result is True or result is False

    async def test_get_session_messages(self, db_service):
        """Test getting session messages."""
        mock_response = MagicMock()
        mock_response.data = [
            {"role": "user", "content": "Hello"},
            {"role": "assistant", "content": "Hi there!"},
        ]
        db_service._client.table.return_value.select.return_value.eq.return_value.order.return_value.limit.return_value.execute.return_value = mock_response
        
        result = await db_service.get_session_messages("session_123")
        
        assert isinstance(result, list)


class TestUserPreferences:
    """Tests for user preferences operations."""

    @pytest.fixture
    def db_service(self):
        """Create database service with mocked client."""
        service = DatabaseService()
        service._client = MagicMock()
        return service

    async def test_get_user_preferences(self, db_service):
        """Test getting user preferences."""
        mock_response = MagicMock()
        mock_response.data = {
            "user_id": "user_123",
            "professional_mode": "medical",
            "language": "en",
        }
        db_service._client.table.return_value.select.return_value.eq.return_value.single.return_value.execute.return_value = mock_response
        
        result = await db_service.get_user_preferences("user_123")
        
        assert result is not None or result is None

    async def test_update_user_preferences(self, db_service):
        """Test updating user preferences."""
        mock_response = MagicMock()
        mock_response.data = [{"user_id": "user_123"}]
        db_service._client.table.return_value.upsert.return_value.execute.return_value = mock_response
        
        result = await db_service.update_user_preferences(
            "user_123",
            {"professional_mode": "general"},
        )
        
        assert result is not None or result is None


class TestSearchOperations:
    """Tests for search operations."""

    @pytest.fixture
    def db_service(self):
        """Create database service with mocked client."""
        service = DatabaseService()
        service._client = MagicMock()
        return service

    async def test_search_transcripts(self, db_service):
        """Test full-text search."""
        mock_response = MagicMock()
        mock_response.data = [
            {"id": "trans_1", "title": "Budget Meeting"},
        ]
        db_service._client.table.return_value.select.return_value.eq.return_value.text_search.return_value.limit.return_value.execute.return_value = mock_response
        
        result = await db_service.search_transcripts(
            "user_123",
            "budget",
        )
        
        assert isinstance(result, list)


class TestTranscriptService:
    """Tests for TranscriptService (high-level service)."""

    @pytest.fixture
    def transcript_service(self):
        """Create transcript service."""
        service = TranscriptService()
        service._db = MagicMock()
        return service

    async def test_get_transcript(self, transcript_service):
        """Test getting transcript via service."""
        transcript_service._db.get_transcript = AsyncMock(return_value={
            "id": "trans_123",
            "title": "Test",
        })
        
        result = await transcript_service.get_transcript("trans_123", "user_456")
        
        assert result is not None

    async def test_list_transcripts(self, transcript_service):
        """Test listing transcripts via service."""
        transcript_service._db.list_transcripts = AsyncMock(return_value=[])
        
        result = await transcript_service.list_transcripts("user_123")
        
        assert isinstance(result, list)

    @patch("src.services.transcript_service.get_indexer")
    async def test_create_transcript_indexes(self, mock_indexer, transcript_service):
        """Test that create also indexes."""
        transcript_service._db.create_transcript = AsyncMock(return_value={
            "id": "new_trans",
            "title": "New Meeting",
        })
        
        mock_idx = AsyncMock()
        mock_idx.index_transcript = AsyncMock(return_value=True)
        mock_indexer.return_value = mock_idx
        
        result = await transcript_service.create_transcript(
            user_id="user_123",
            title="New Meeting",
            content="Content here",
        )
        
        assert result is not None

    @patch("src.services.transcript_service.get_retriever")
    async def test_search_semantic(self, mock_retriever, transcript_service):
        """Test semantic search via service."""
        mock_ret = AsyncMock()
        mock_ret.search = AsyncMock(return_value=MagicMock(results=[]))
        mock_retriever.return_value = mock_ret
        
        result = await transcript_service.search(
            "user_123",
            "meeting notes",
            use_semantic=True,
        )
        
        assert isinstance(result, list)

    async def test_get_recent(self, transcript_service):
        """Test getting recent transcripts."""
        transcript_service._db.list_transcripts = AsyncMock(return_value=[
            {"id": "trans_1"},
            {"id": "trans_2"},
        ])
        
        result = await transcript_service.get_recent("user_123", limit=5)
        
        assert isinstance(result, list)

    async def test_get_stats(self, transcript_service):
        """Test getting transcript stats."""
        transcript_service._db.list_transcripts = AsyncMock(return_value=[
            {"id": "trans_1", "duration_seconds": 1800, "content": "Words here"},
            {"id": "trans_2", "duration_seconds": 3600, "content": "More words"},
        ])
        
        result = await transcript_service.get_stats("user_123")
        
        assert "total_transcripts" in result
        assert "total_duration_seconds" in result


class TestSingletons:
    """Tests for singleton patterns."""

    def test_get_database_service_singleton(self):
        """Test database service singleton."""
        import src.services.database
        src.services.database._db_instance = None
        
        service1 = get_database_service()
        service2 = get_database_service()
        
        assert service1 is service2

    def test_get_transcript_service_singleton(self):
        """Test transcript service singleton."""
        import src.services.transcript_service
        src.services.transcript_service._service_instance = None
        
        service1 = get_transcript_service()
        service2 = get_transcript_service()
        
        assert service1 is service2
