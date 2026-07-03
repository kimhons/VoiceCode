"""
VoiceCode Agent Core - Hybrid Search
Combines semantic and keyword search for better retrieval
"""

from typing import Optional, List, Dict, Any
from datetime import datetime
import structlog
from pydantic import BaseModel, Field

from .indexer import get_indexer, TranscriptDocument
from .retriever import get_retriever, SearchResult, RetrievalResponse

logger = structlog.get_logger()


class HybridSearchConfig(BaseModel):
    """Configuration for hybrid search."""
    semantic_weight: float = 0.7
    keyword_weight: float = 0.3
    min_semantic_score: float = 0.5
    min_keyword_matches: int = 1
    boost_recent: bool = True
    recent_days_boost: int = 7
    boost_factor: float = 1.2


class HybridSearchResult(BaseModel):
    """Combined search result from hybrid search."""
    transcript_id: str
    title: str
    content_snippet: str
    semantic_score: float = 0.0
    keyword_score: float = 0.0
    combined_score: float = 0.0
    matched_keywords: List[str] = Field(default_factory=list)
    metadata: dict = Field(default_factory=dict)


class HybridSearchResponse(BaseModel):
    """Response from hybrid search."""
    query: str
    results: List[HybridSearchResult]
    total_results: int
    search_config: HybridSearchConfig


class HybridSearchEngine:
    """
    Combines semantic search (vector similarity) with keyword search
    for more accurate and comprehensive transcript retrieval.
    """
    
    def __init__(self, config: Optional[HybridSearchConfig] = None):
        self.config = config or HybridSearchConfig()
        self._retriever = None
        self._indexer = None
    
    async def initialize(self) -> None:
        """Initialize search components."""
        self._retriever = await get_retriever()
        self._indexer = await get_indexer()
        logger.info("hybrid_search_initialized")
    
    def _extract_keywords(self, query: str) -> List[str]:
        """Extract keywords from query for keyword matching."""
        # Simple keyword extraction - split and filter
        stop_words = {
            'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to',
            'for', 'of', 'with', 'by', 'from', 'is', 'are', 'was', 'were',
            'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did',
            'will', 'would', 'could', 'should', 'may', 'might', 'can',
            'this', 'that', 'these', 'those', 'what', 'which', 'who', 'whom',
            'my', 'your', 'his', 'her', 'its', 'our', 'their', 'me', 'him',
        }
        
        words = query.lower().split()
        keywords = [w.strip('.,!?;:"\'') for w in words if len(w) > 2 and w.lower() not in stop_words]
        return list(set(keywords))
    
    def _calculate_keyword_score(
        self,
        content: str,
        keywords: List[str],
    ) -> tuple[float, List[str]]:
        """Calculate keyword match score and return matched keywords."""
        content_lower = content.lower()
        matched = []
        
        for keyword in keywords:
            if keyword in content_lower:
                matched.append(keyword)
        
        if not keywords:
            return 0.0, []
        
        score = len(matched) / len(keywords)
        return score, matched
    
    def _apply_recency_boost(
        self,
        score: float,
        created_at: Optional[str],
    ) -> float:
        """Apply recency boost to score."""
        if not self.config.boost_recent or not created_at:
            return score
        
        try:
            created = datetime.fromisoformat(created_at.replace('Z', '+00:00'))
            days_old = (datetime.utcnow() - created.replace(tzinfo=None)).days
            
            if days_old <= self.config.recent_days_boost:
                return score * self.config.boost_factor
        except (ValueError, AttributeError):
            pass
        
        return score
    
    async def search(
        self,
        query: str,
        user_id: str,
        limit: int = 10,
        filters: Optional[Dict[str, Any]] = None,
    ) -> HybridSearchResponse:
        """
        Perform hybrid search combining semantic and keyword search.
        
        Args:
            query: Natural language search query
            user_id: Filter results to this user
            limit: Maximum number of results
            filters: Additional metadata filters
        
        Returns:
            HybridSearchResponse with ranked results
        """
        try:
            if not self._retriever:
                await self.initialize()
            
            # Extract keywords for keyword matching
            keywords = self._extract_keywords(query)
            
            # Perform semantic search
            semantic_response = await self._retriever.search(
                query=query,
                user_id=user_id,
                limit=limit * 2,  # Get more results for re-ranking
                min_score=self.config.min_semantic_score,
                filters=filters,
            )
            
            # Combine and re-rank results
            hybrid_results: List[HybridSearchResult] = []
            
            for result in semantic_response.results:
                # Calculate keyword score
                keyword_score, matched = self._calculate_keyword_score(
                    result.content_snippet,
                    keywords,
                )
                
                # Calculate combined score
                combined_score = (
                    self.config.semantic_weight * result.relevance_score +
                    self.config.keyword_weight * keyword_score
                )
                
                # Apply recency boost
                combined_score = self._apply_recency_boost(
                    combined_score,
                    result.metadata.get('created_at'),
                )
                
                hybrid_results.append(HybridSearchResult(
                    transcript_id=result.transcript_id,
                    title=result.title,
                    content_snippet=result.content_snippet,
                    semantic_score=result.relevance_score,
                    keyword_score=keyword_score,
                    combined_score=combined_score,
                    matched_keywords=matched,
                    metadata=result.metadata,
                ))
            
            # Sort by combined score
            hybrid_results.sort(key=lambda x: x.combined_score, reverse=True)
            
            # Limit results
            hybrid_results = hybrid_results[:limit]
            
            logger.info(
                "hybrid_search_completed",
                query=query[:50],
                user_id=user_id,
                results_count=len(hybrid_results),
            )
            
            return HybridSearchResponse(
                query=query,
                results=hybrid_results,
                total_results=len(hybrid_results),
                search_config=self.config,
            )
            
        except Exception as e:
            logger.error("hybrid_search_failed", query=query, error=str(e))
            return HybridSearchResponse(
                query=query,
                results=[],
                total_results=0,
                search_config=self.config,
            )
    
    async def search_with_expansion(
        self,
        query: str,
        user_id: str,
        limit: int = 10,
    ) -> HybridSearchResponse:
        """
        Search with automatic query expansion for better recall.
        Adds synonyms and related terms to improve search coverage.
        """
        # Simple query expansion - in production, use a proper thesaurus or LLM
        expansions = {
            'meeting': ['discussion', 'call', 'sync'],
            'project': ['initiative', 'program', 'work'],
            'budget': ['cost', 'expense', 'financial'],
            'deadline': ['due date', 'timeline', 'milestone'],
            'action item': ['task', 'todo', 'follow-up'],
            'decision': ['conclusion', 'resolution', 'determination'],
        }
        
        expanded_query = query
        query_lower = query.lower()
        
        for term, synonyms in expansions.items():
            if term in query_lower:
                expanded_query += ' ' + ' '.join(synonyms[:2])
        
        return await self.search(expanded_query, user_id, limit)


# Singleton instance
_hybrid_search_instance: Optional[HybridSearchEngine] = None


async def get_hybrid_search() -> HybridSearchEngine:
    """Get or create the hybrid search engine singleton."""
    global _hybrid_search_instance
    if _hybrid_search_instance is None:
        _hybrid_search_instance = HybridSearchEngine()
        await _hybrid_search_instance.initialize()
    return _hybrid_search_instance
