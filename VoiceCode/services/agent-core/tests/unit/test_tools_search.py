"""
Unit tests for Search Tools
"""

import pytest
from unittest.mock import MagicMock, patch

from src.tools.search_tools import (
    semantic_search_handler,
    find_mentions_handler,
    find_similar_transcripts_handler,
    search_by_speaker_handler,
    search_by_date_range_handler,
    get_search_tools,
)


class TestSemanticSearch:
    """Tests for semantic search."""

    def test_semantic_search_returns_results(self):
        """Test that search returns results."""
        result = semantic_search_handler(
            query="quarterly planning meeting",
            _user_id="user_123",
        )

        assert "results" in result
        assert isinstance(result["results"], list)

    def test_semantic_search_default_limit(self):
        """Test default result limit."""
        result = semantic_search_handler(
            query="test query",
            _user_id="user_123",
        )

        assert len(result["results"]) <= 10

    def test_semantic_search_custom_limit(self):
        """Test custom result limit."""
        result = semantic_search_handler(
            query="test query",
            limit=5,
            _user_id="user_123",
        )

        assert "results" in result

    def test_semantic_search_includes_scores(self):
        """Test that relevance scores are included."""
        result = semantic_search_handler(
            query="meeting",
            _user_id="user_123",
        )

        for item in result["results"]:
            assert "relevance_score" in item
            assert 0 <= item["relevance_score"] <= 1

    def test_semantic_search_result_structure(self):
        """Test search result structure."""
        result = semantic_search_handler(
            query="project discussion",
            _user_id="user_123",
        )

        if result["results"]:
            item = result["results"][0]
            assert "transcript_id" in item
            assert "title" in item
            assert "matched_text" in item

    def test_semantic_search_includes_total(self):
        """Test that total count is included."""
        result = semantic_search_handler(
            query="search term",
            _user_id="user_123",
        )

        assert "total_results" in result


class TestFindMentions:
    """Tests for mention finding."""

    def test_find_mentions_returns_results(self):
        """Test that mentions are found."""
        result = find_mentions_handler(
            term="project alpha",
            _user_id="user_123",
        )

        assert "mentions" in result
        assert isinstance(result["mentions"], list)

    def test_find_mentions_structure(self):
        """Test mention result structure."""
        result = find_mentions_handler(
            term="budget",
            _user_id="user_123",
        )

        if result["mentions"]:
            mention = result["mentions"][0]
            assert "transcript_id" in mention
            assert "occurrences" in mention
            assert "count" in mention

    def test_find_mentions_with_term(self):
        """Test term is included in result."""
        result = find_mentions_handler(
            term="MEETING",
            _user_id="user_123",
        )

        assert "term" in result
        assert "mentions" in result

    def test_find_mentions_includes_count(self):
        """Test that mention count is included."""
        result = find_mentions_handler(
            term="test",
            _user_id="user_123",
        )

        assert "total_mentions" in result


class TestFindSimilarTranscripts:
    """Tests for similar transcript finding."""

    def test_find_similar_returns_results(self):
        """Test that similar transcripts are found."""
        result = find_similar_transcripts_handler(
            transcript_id="trans_123",
            _user_id="user_123",
        )

        assert "similar_transcripts" in result
        assert isinstance(result["similar_transcripts"], list)

    def test_find_similar_default_limit(self):
        """Test default similar limit."""
        result = find_similar_transcripts_handler(
            transcript_id="trans_123",
            _user_id="user_123",
        )

        assert len(result["similar_transcripts"]) <= 5

    def test_find_similar_custom_limit(self):
        """Test custom similar limit."""
        result = find_similar_transcripts_handler(
            transcript_id="trans_123",
            limit=3,
            _user_id="user_123",
        )

        assert "similar_transcripts" in result

    def test_find_similar_includes_similarity_score(self):
        """Test that similarity scores are included."""
        result = find_similar_transcripts_handler(
            transcript_id="trans_123",
            _user_id="user_123",
        )

        for item in result["similar_transcripts"]:
            assert "similarity_score" in item
            assert 0 <= item["similarity_score"] <= 1


class TestSearchBySpeaker:
    """Tests for speaker-based search."""

    def test_search_by_speaker_returns_results(self):
        """Test that speaker search returns results."""
        result = search_by_speaker_handler(
            speaker_name="John",
            _user_id="user_123",
        )

        assert "transcripts" in result
        assert isinstance(result["transcripts"], list)

    def test_search_by_speaker_includes_speaker(self):
        """Test that results include speaker info."""
        result = search_by_speaker_handler(
            speaker_name="Sarah",
            _user_id="user_123",
        )

        assert result["speaker"] == "Sarah"

    def test_search_by_speaker_with_limit(self):
        """Test speaker search with limit."""
        result = search_by_speaker_handler(
            speaker_name="Mike",
            limit=5,
            _user_id="user_123",
        )

        assert len(result["transcripts"]) <= 5


class TestSearchByDateRange:
    """Tests for date range search."""

    def test_search_by_date_range_returns_results(self):
        """Test that date range search returns results."""
        result = search_by_date_range_handler(
            start_date="2024-01-01",
            end_date="2024-01-31",
            _user_id="user_123",
        )

        assert "transcripts" in result
        assert isinstance(result["transcripts"], list)

    def test_search_by_date_range_includes_dates(self):
        """Test that date range is included in response."""
        result = search_by_date_range_handler(
            start_date="2024-01-15",
            end_date="2024-01-20",
            _user_id="user_123",
        )

        assert result["date_range"]["start"] == "2024-01-15"
        assert result["date_range"]["end"] == "2024-01-20"

    def test_search_by_date_range_includes_total(self):
        """Test that total count is included."""
        result = search_by_date_range_handler(
            start_date="2024-01-01",
            end_date="2024-12-31",
            _user_id="user_123",
        )

        assert "total" in result


class TestGetSearchTools:
    """Tests for search tool collection."""

    def test_get_search_tools_returns_list(self):
        """Test that tool collection is returned."""
        tools = get_search_tools()

        assert isinstance(tools, list)
        assert len(tools) >= 4

    def test_get_search_tools_are_callable(self):
        """Test that all tools are callable."""
        tools = get_search_tools()

        for tool in tools:
            assert callable(tool)
