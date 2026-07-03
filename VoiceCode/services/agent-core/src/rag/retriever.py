"""
VoiceCode Agent Core - Transcript Retriever
Semantic search and retrieval using LlamaIndex
"""

from typing import Optional, List, Dict, Any
from datetime import datetime
import structlog

from llama_index.core import VectorStoreIndex
from llama_index.core.retrievers import VectorIndexRetriever
from llama_index.core.query_engine import RetrieverQueryEngine
from llama_index.core.postprocessor import SimilarityPostprocessor
from pydantic import BaseModel, Field

from .indexer import get_indexer, TranscriptIndexer

logger = structlog.get_logger()


class SearchResult(BaseModel):
    """Search result from retrieval."""
    transcript_id: str
    title: str
    content_snippet: str
    relevance_score: float
    metadata: dict = Field(default_factory=dict)


class RetrievalResponse(BaseModel):
    """Response from retrieval query."""
    query: str
    results: List[SearchResult]
    total_results: int
    response_text: Optional[str] = None
    sources_used: int = 0


class TranscriptRetriever:
    """
    Retrieves relevant transcripts using semantic search.
    Supports filtering by user, date range, and other metadata.
    """
    
    def __init__(self, indexer: Optional[TranscriptIndexer] = None):
        self._indexer = indexer
        self._retriever: Optional[VectorIndexRetriever] = None
        self._query_engine: Optional[RetrieverQueryEngine] = None
    
    async def initialize(self) -> None:
        """Initialize the retriever with the index."""
        if not self._indexer:
            self._indexer = await get_indexer()
        
        index = self._indexer.get_index()
        if index:
            self._retriever = VectorIndexRetriever(
                index=index,
                similarity_top_k=10,
            )
            
            # Create query engine with response synthesis
            self._query_engine = RetrieverQueryEngine.from_args(
                retriever=self._retriever,
                node_postprocessors=[
                    SimilarityPostprocessor(similarity_cutoff=0.5)
                ],
            )
            
            logger.info("transcript_retriever_initialized")
    
    async def search(
        self,
        query: str,
        user_id: str,
        limit: int = 10,
        min_score: float = 0.5,
        filters: Optional[Dict[str, Any]] = None,
    ) -> RetrievalResponse:
        """
        Perform semantic search across transcripts.
        
        Args:
            query: Natural language search query
            user_id: Filter results to this user
            limit: Maximum number of results
            min_score: Minimum relevance score (0-1)
            filters: Additional metadata filters
        
        Returns:
            RetrievalResponse with ranked results
        """
        try:
            if not self._retriever:
                await self.initialize()
            
            if not self._retriever:
                logger.warning("retriever_not_available")
                return RetrievalResponse(
                    query=query,
                    results=[],
                    total_results=0,
                )
            
            # Retrieve nodes
            nodes = self._retriever.retrieve(query)
            
            # Filter and format results
            results: List[SearchResult] = []
            for node in nodes:
                # Check user filter
                if node.metadata.get("user_id") != user_id:
                    continue
                
                # Check score threshold
                if node.score and node.score < min_score:
                    continue
                
                # Apply additional filters
                if filters:
                    skip = False
                    for key, value in filters.items():
                        if node.metadata.get(key) != value:
                            skip = True
                            break
                    if skip:
                        continue
                
                results.append(SearchResult(
                    transcript_id=node.node.ref_doc_id or "",
                    title=node.metadata.get("title", "Untitled"),
                    content_snippet=node.text[:200] + "..." if len(node.text) > 200 else node.text,
                    relevance_score=node.score or 0.0,
                    metadata={
                        k: v for k, v in node.metadata.items()
                        if k not in ["user_id"]
                    },
                ))
                
                if len(results) >= limit:
                    break
            
            logger.info(
                "search_completed",
                query=query[:50],
                user_id=user_id,
                results_count=len(results),
            )
            
            return RetrievalResponse(
                query=query,
                results=results,
                total_results=len(results),
                sources_used=len(results),
            )
            
        except Exception as e:
            logger.error("search_failed", query=query, error=str(e))
            return RetrievalResponse(
                query=query,
                results=[],
                total_results=0,
            )
    
    async def query_with_response(
        self,
        query: str,
        user_id: str,
    ) -> RetrievalResponse:
        """
        Query transcripts and generate a natural language response.
        Uses LlamaIndex's query engine for response synthesis.
        """
        try:
            if not self._query_engine:
                await self.initialize()
            
            if not self._query_engine:
                return RetrievalResponse(
                    query=query,
                    results=[],
                    total_results=0,
                    response_text="Unable to process query at this time.",
                )
            
            # Execute query
            response = self._query_engine.query(query)
            
            # Extract source nodes
            results: List[SearchResult] = []
            for node in response.source_nodes:
                if node.metadata.get("user_id") != user_id:
                    continue
                    
                results.append(SearchResult(
                    transcript_id=node.node.ref_doc_id or "",
                    title=node.metadata.get("title", "Untitled"),
                    content_snippet=node.text[:200] + "...",
                    relevance_score=node.score or 0.0,
                    metadata=node.metadata,
                ))
            
            return RetrievalResponse(
                query=query,
                results=results,
                total_results=len(results),
                response_text=str(response),
                sources_used=len(response.source_nodes),
            )
            
        except Exception as e:
            logger.error("query_with_response_failed", query=query, error=str(e))
            return RetrievalResponse(
                query=query,
                results=[],
                total_results=0,
                response_text=f"Error: {str(e)}",
            )
    
    async def find_similar(
        self,
        transcript_id: str,
        user_id: str,
        limit: int = 5,
    ) -> List[SearchResult]:
        """Find transcripts similar to a given transcript."""
        try:
            if not self._indexer:
                await self.initialize()
            
            index = self._indexer.get_index() if self._indexer else None
            if not index:
                return []
            
            # Get the source document
            # In production, fetch from database
            # For now, return empty
            logger.info("find_similar", transcript_id=transcript_id)
            return []
            
        except Exception as e:
            logger.error("find_similar_failed", transcript_id=transcript_id, error=str(e))
            return []


# Singleton instance
_retriever_instance: Optional[TranscriptRetriever] = None


async def get_retriever() -> TranscriptRetriever:
    """Get or create the transcript retriever singleton."""
    global _retriever_instance
    if _retriever_instance is None:
        _retriever_instance = TranscriptRetriever()
        await _retriever_instance.initialize()
    return _retriever_instance
