"""
VoiceCode Agent Core - Transcript Service
High-level transcript operations combining database and RAG
"""

from typing import Optional, List, Dict, Any
from datetime import datetime
import structlog

from .database import get_database_service, DatabaseService
from ..rag.indexer import get_indexer, TranscriptDocument
from ..rag.retriever import get_retriever

logger = structlog.get_logger()


class TranscriptService:
    """
    Unified service for transcript operations.
    Combines database CRUD with RAG indexing.
    """
    
    def __init__(self):
        self._db: Optional[DatabaseService] = None
    
    @property
    def db(self) -> DatabaseService:
        if not self._db:
            self._db = get_database_service()
        return self._db
    
    async def get_transcript(
        self, transcript_id: str, user_id: str
    ) -> Optional[Dict[str, Any]]:
        """Get transcript by ID."""
        return await self.db.get_transcript(transcript_id, user_id)
    
    async def list_transcripts(
        self,
        user_id: str,
        limit: int = 20,
        offset: int = 0,
    ) -> List[Dict[str, Any]]:
        """List user's transcripts."""
        return await self.db.list_transcripts(user_id, limit, offset)
    
    async def create_transcript(
        self,
        user_id: str,
        title: str,
        content: str,
        language: str = "en",
        speakers: Optional[List[str]] = None,
        duration_seconds: int = 0,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> Optional[Dict[str, Any]]:
        """Create a new transcript and index it for search."""
        # Create in database
        transcript_data = {
            "user_id": user_id,
            "title": title,
            "content": content,
            "language": language,
            "speakers": speakers or [],
            "duration_seconds": duration_seconds,
            "metadata": metadata or {},
        }
        
        result = await self.db.create_transcript(transcript_data)
        
        if result:
            # Index for semantic search
            try:
                indexer = await get_indexer()
                doc = TranscriptDocument(
                    id=result["id"],
                    user_id=user_id,
                    title=title,
                    content=content,
                    language=language,
                    speakers=speakers or [],
                    duration_seconds=duration_seconds,
                    metadata=metadata or {},
                )
                await indexer.index_transcript(doc)
            except Exception as e:
                logger.error("transcript_indexing_failed", transcript_id=result["id"], error=str(e))
        
        return result
    
    async def update_transcript(
        self,
        transcript_id: str,
        user_id: str,
        updates: Dict[str, Any],
    ) -> Optional[Dict[str, Any]]:
        """Update a transcript and re-index if content changed."""
        result = await self.db.update_transcript(transcript_id, user_id, updates)
        
        if result and "content" in updates:
            # Re-index for semantic search
            try:
                indexer = await get_indexer()
                doc = TranscriptDocument(
                    id=transcript_id,
                    user_id=user_id,
                    title=result.get("title", ""),
                    content=updates["content"],
                    language=result.get("language", "en"),
                    speakers=result.get("speakers", []),
                    duration_seconds=result.get("duration_seconds", 0),
                )
                await indexer.update_transcript(doc)
            except Exception as e:
                logger.error("transcript_reindexing_failed", transcript_id=transcript_id, error=str(e))
        
        return result
    
    async def delete_transcript(
        self, transcript_id: str, user_id: str
    ) -> bool:
        """Delete transcript from database and search index."""
        success = await self.db.delete_transcript(transcript_id, user_id)
        
        if success:
            try:
                indexer = await get_indexer()
                await indexer.delete_transcript(transcript_id)
            except Exception as e:
                logger.error("transcript_index_delete_failed", transcript_id=transcript_id, error=str(e))
        
        return success
    
    async def search(
        self,
        user_id: str,
        query: str,
        limit: int = 10,
        use_semantic: bool = True,
    ) -> List[Dict[str, Any]]:
        """Search transcripts using semantic or full-text search."""
        if use_semantic:
            try:
                retriever = await get_retriever()
                response = await retriever.search(query, user_id, limit)
                return [
                    {
                        "id": r.transcript_id,
                        "title": r.title,
                        "snippet": r.content_snippet,
                        "relevance": r.relevance_score,
                        **r.metadata,
                    }
                    for r in response.results
                ]
            except Exception as e:
                logger.error("semantic_search_failed", error=str(e))
                # Fallback to database search
        
        # Full-text search fallback
        return await self.db.search_transcripts(user_id, query, limit)
    
    async def find_similar(
        self,
        transcript_id: str,
        user_id: str,
        limit: int = 5,
    ) -> List[Dict[str, Any]]:
        """Find transcripts similar to a given one."""
        try:
            retriever = await get_retriever()
            results = await retriever.find_similar(transcript_id, user_id, limit)
            return [
                {
                    "id": r.transcript_id,
                    "title": r.title,
                    "similarity": r.relevance_score,
                }
                for r in results
            ]
        except Exception as e:
            logger.error("find_similar_failed", transcript_id=transcript_id, error=str(e))
            return []
    
    async def get_recent(self, user_id: str, limit: int = 5) -> List[Dict[str, Any]]:
        """Get most recent transcripts."""
        return await self.db.list_transcripts(
            user_id, limit=limit, order_by="created_at", ascending=False
        )
    
    async def get_stats(self, user_id: str) -> Dict[str, Any]:
        """Get transcript statistics for a user."""
        transcripts = await self.db.list_transcripts(user_id, limit=1000)
        
        total_duration = sum(t.get("duration_seconds", 0) for t in transcripts)
        total_words = sum(len(t.get("content", "").split()) for t in transcripts)
        
        return {
            "total_transcripts": len(transcripts),
            "total_duration_seconds": total_duration,
            "total_duration_hours": round(total_duration / 3600, 1),
            "total_words": total_words,
            "avg_duration_seconds": total_duration // len(transcripts) if transcripts else 0,
        }


# Singleton instance
_service_instance: Optional[TranscriptService] = None


def get_transcript_service() -> TranscriptService:
    """Get or create transcript service singleton."""
    global _service_instance
    if _service_instance is None:
        _service_instance = TranscriptService()
    return _service_instance
