"""
VoiceCode Agent Core - Transcript Indexer
LlamaIndex-based document indexing for semantic search
"""

from typing import Optional, List
from datetime import datetime
import asyncio
import structlog

from llama_index.core import (
    VectorStoreIndex,
    Document,
    StorageContext,
    Settings as LlamaSettings,
)
from llama_index.core.node_parser import SentenceSplitter
from llama_index.embeddings.openai import OpenAIEmbedding
from llama_index.vector_stores.postgres import PGVectorStore
from pydantic import BaseModel, Field

from ..config.settings import get_settings

settings = get_settings()
logger = structlog.get_logger()


class TranscriptDocument(BaseModel):
    """Transcript document for indexing."""
    id: str
    user_id: str
    title: str
    content: str
    language: str = "en"
    speakers: List[str] = Field(default_factory=list)
    duration_seconds: int = 0
    created_at: datetime = Field(default_factory=datetime.utcnow)
    metadata: dict = Field(default_factory=dict)


class TranscriptIndexer:
    """
    Indexes transcripts for semantic search using LlamaIndex and pgvector.
    """
    
    def __init__(self, connection_string: Optional[str] = None):
        self.connection_string = connection_string or settings.database_url
        self._index: Optional[VectorStoreIndex] = None
        self._vector_store: Optional[PGVectorStore] = None
        
        # Configure LlamaIndex settings
        LlamaSettings.embed_model = OpenAIEmbedding(
            model=settings.embedding_model,
            api_key=settings.openai_api_key,
        )
        LlamaSettings.node_parser = SentenceSplitter(
            chunk_size=512,
            chunk_overlap=50,
        )
    
    async def initialize(self) -> None:
        """Initialize the vector store and index."""
        try:
            self._vector_store = PGVectorStore.from_params(
                database=self.connection_string,
                host="localhost",
                password="",
                port="5432",
                user="postgres",
                table_name="transcript_embeddings",
                embed_dim=1536,  # OpenAI embedding dimension
            )
            
            storage_context = StorageContext.from_defaults(
                vector_store=self._vector_store
            )
            
            self._index = VectorStoreIndex.from_vector_store(
                self._vector_store,
                storage_context=storage_context,
            )
            
            logger.info("transcript_indexer_initialized")
            
        except Exception as e:
            logger.error("transcript_indexer_init_failed", error=str(e))
            # Fallback to in-memory index for development
            self._index = VectorStoreIndex([])
            logger.info("using_in_memory_index")
    
    async def index_transcript(self, transcript: TranscriptDocument) -> bool:
        """Index a single transcript."""
        try:
            if not self._index:
                await self.initialize()
            
            # Create document with metadata
            doc = Document(
                text=transcript.content,
                doc_id=transcript.id,
                metadata={
                    "user_id": transcript.user_id,
                    "title": transcript.title,
                    "language": transcript.language,
                    "speakers": ",".join(transcript.speakers),
                    "duration_seconds": transcript.duration_seconds,
                    "created_at": transcript.created_at.isoformat(),
                    **transcript.metadata,
                },
            )
            
            # Insert into index
            self._index.insert(doc)
            
            logger.info(
                "transcript_indexed",
                transcript_id=transcript.id,
                user_id=transcript.user_id,
            )
            
            return True
            
        except Exception as e:
            logger.error(
                "transcript_index_failed",
                transcript_id=transcript.id,
                error=str(e),
            )
            return False
    
    async def index_batch(self, transcripts: List[TranscriptDocument]) -> dict:
        """Index multiple transcripts."""
        results = {"success": 0, "failed": 0, "ids": []}
        
        for transcript in transcripts:
            success = await self.index_transcript(transcript)
            if success:
                results["success"] += 1
                results["ids"].append(transcript.id)
            else:
                results["failed"] += 1
        
        return results
    
    async def delete_transcript(self, transcript_id: str) -> bool:
        """Remove a transcript from the index."""
        try:
            if self._index:
                self._index.delete_ref_doc(transcript_id)
                logger.info("transcript_deleted_from_index", transcript_id=transcript_id)
                return True
            return False
        except Exception as e:
            logger.error("transcript_delete_failed", transcript_id=transcript_id, error=str(e))
            return False
    
    async def update_transcript(self, transcript: TranscriptDocument) -> bool:
        """Update a transcript in the index (delete + re-index)."""
        await self.delete_transcript(transcript.id)
        return await self.index_transcript(transcript)
    
    def get_index(self) -> Optional[VectorStoreIndex]:
        """Get the underlying index for querying."""
        return self._index


# Singleton instance
_indexer_instance: Optional[TranscriptIndexer] = None


async def get_indexer() -> TranscriptIndexer:
    """Get or create the transcript indexer singleton."""
    global _indexer_instance
    if _indexer_instance is None:
        _indexer_instance = TranscriptIndexer()
        await _indexer_instance.initialize()
    return _indexer_instance
