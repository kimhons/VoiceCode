"""
VoiceCode Agent Core - Database Service
Supabase integration for persistent storage
"""

from typing import Optional, List, Dict, Any
from datetime import datetime
import structlog
from supabase import create_client, Client

from ..config.settings import get_settings

settings = get_settings()
logger = structlog.get_logger()


class DatabaseService:
    """
    Database service for agent operations using Supabase.
    Handles transcripts, sessions, and user data.
    """
    
    def __init__(self):
        self._client: Optional[Client] = None
    
    @property
    def client(self) -> Client:
        """Get or create Supabase client."""
        if not self._client:
            self._client = create_client(
                settings.supabase_url,
                settings.supabase_key,
            )
        return self._client
    
    # Transcript operations
    async def get_transcript(self, transcript_id: str, user_id: str) -> Optional[Dict[str, Any]]:
        """Get a transcript by ID."""
        try:
            response = self.client.table("transcripts").select("*").eq(
                "id", transcript_id
            ).eq("user_id", user_id).single().execute()
            
            return response.data
        except Exception as e:
            logger.error("get_transcript_failed", transcript_id=transcript_id, error=str(e))
            return None
    
    async def list_transcripts(
        self,
        user_id: str,
        limit: int = 20,
        offset: int = 0,
        order_by: str = "created_at",
        ascending: bool = False,
    ) -> List[Dict[str, Any]]:
        """List transcripts for a user."""
        try:
            query = self.client.table("transcripts").select("*").eq("user_id", user_id)
            query = query.order(order_by, desc=not ascending)
            query = query.range(offset, offset + limit - 1)
            
            response = query.execute()
            return response.data or []
        except Exception as e:
            logger.error("list_transcripts_failed", user_id=user_id, error=str(e))
            return []
    
    async def create_transcript(self, data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Create a new transcript."""
        try:
            data["created_at"] = datetime.utcnow().isoformat()
            data["updated_at"] = datetime.utcnow().isoformat()
            
            response = self.client.table("transcripts").insert(data).execute()
            return response.data[0] if response.data else None
        except Exception as e:
            logger.error("create_transcript_failed", error=str(e))
            return None
    
    async def update_transcript(
        self, transcript_id: str, user_id: str, updates: Dict[str, Any]
    ) -> Optional[Dict[str, Any]]:
        """Update a transcript."""
        try:
            updates["updated_at"] = datetime.utcnow().isoformat()
            
            response = self.client.table("transcripts").update(updates).eq(
                "id", transcript_id
            ).eq("user_id", user_id).execute()
            
            return response.data[0] if response.data else None
        except Exception as e:
            logger.error("update_transcript_failed", transcript_id=transcript_id, error=str(e))
            return None
    
    async def delete_transcript(self, transcript_id: str, user_id: str) -> bool:
        """Delete a transcript."""
        try:
            self.client.table("transcripts").delete().eq(
                "id", transcript_id
            ).eq("user_id", user_id).execute()
            return True
        except Exception as e:
            logger.error("delete_transcript_failed", transcript_id=transcript_id, error=str(e))
            return False
    
    # Session operations
    async def get_session(self, session_id: str) -> Optional[Dict[str, Any]]:
        """Get agent session by ID."""
        try:
            response = self.client.table("agent_sessions").select("*").eq(
                "id", session_id
            ).single().execute()
            return response.data
        except Exception as e:
            logger.error("get_session_failed", session_id=session_id, error=str(e))
            return None
    
    async def create_session(self, data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Create a new agent session."""
        try:
            data["created_at"] = datetime.utcnow().isoformat()
            data["updated_at"] = datetime.utcnow().isoformat()
            
            response = self.client.table("agent_sessions").insert(data).execute()
            return response.data[0] if response.data else None
        except Exception as e:
            logger.error("create_session_failed", error=str(e))
            return None
    
    async def update_session(
        self, session_id: str, updates: Dict[str, Any]
    ) -> Optional[Dict[str, Any]]:
        """Update an agent session."""
        try:
            updates["updated_at"] = datetime.utcnow().isoformat()
            
            response = self.client.table("agent_sessions").update(updates).eq(
                "id", session_id
            ).execute()
            
            return response.data[0] if response.data else None
        except Exception as e:
            logger.error("update_session_failed", session_id=session_id, error=str(e))
            return None
    
    async def add_session_message(
        self, session_id: str, message: Dict[str, Any]
    ) -> bool:
        """Add a message to session history."""
        try:
            message["session_id"] = session_id
            message["created_at"] = datetime.utcnow().isoformat()
            
            self.client.table("agent_messages").insert(message).execute()
            return True
        except Exception as e:
            logger.error("add_session_message_failed", session_id=session_id, error=str(e))
            return False
    
    async def get_session_messages(
        self, session_id: str, limit: int = 50
    ) -> List[Dict[str, Any]]:
        """Get messages for a session."""
        try:
            response = self.client.table("agent_messages").select("*").eq(
                "session_id", session_id
            ).order("created_at", desc=False).limit(limit).execute()
            
            return response.data or []
        except Exception as e:
            logger.error("get_session_messages_failed", session_id=session_id, error=str(e))
            return []
    
    # User preferences
    async def get_user_preferences(self, user_id: str) -> Optional[Dict[str, Any]]:
        """Get user agent preferences."""
        try:
            response = self.client.table("user_preferences").select("*").eq(
                "user_id", user_id
            ).single().execute()
            return response.data
        except Exception as e:
            logger.error("get_user_preferences_failed", user_id=user_id, error=str(e))
            return None
    
    async def update_user_preferences(
        self, user_id: str, preferences: Dict[str, Any]
    ) -> Optional[Dict[str, Any]]:
        """Update user preferences."""
        try:
            preferences["updated_at"] = datetime.utcnow().isoformat()
            
            response = self.client.table("user_preferences").upsert({
                "user_id": user_id,
                **preferences,
            }).execute()
            
            return response.data[0] if response.data else None
        except Exception as e:
            logger.error("update_user_preferences_failed", user_id=user_id, error=str(e))
            return None
    
    # Search
    async def search_transcripts(
        self,
        user_id: str,
        query: str,
        limit: int = 10,
    ) -> List[Dict[str, Any]]:
        """Full-text search on transcripts."""
        try:
            # Using Supabase full-text search
            response = self.client.table("transcripts").select("*").eq(
                "user_id", user_id
            ).text_search("content", query).limit(limit).execute()
            
            return response.data or []
        except Exception as e:
            logger.error("search_transcripts_failed", user_id=user_id, error=str(e))
            return []


# Singleton instance
_db_instance: Optional[DatabaseService] = None


def get_database_service() -> DatabaseService:
    """Get or create database service singleton."""
    global _db_instance
    if _db_instance is None:
        _db_instance = DatabaseService()
    return _db_instance
