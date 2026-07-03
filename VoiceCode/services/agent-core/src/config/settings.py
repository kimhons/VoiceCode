"""
VoiceCode Agent Core - Configuration Settings
"""

from pydantic_settings import BaseSettings
from pydantic import Field
from typing import Optional
from functools import lru_cache


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""
    
    # Application
    app_name: str = "VoiceCode Agent Core"
    app_version: str = "1.0.0"
    debug: bool = False
    environment: str = "development"
    
    # API
    api_host: str = "0.0.0.0"
    api_port: int = 8000
    api_prefix: str = "/api/v1"
    cors_origins: list[str] = ["http://localhost:3000", "http://localhost:5173"]
    
    # Authentication
    jwt_secret: str = Field(..., env="JWT_SECRET")
    jwt_algorithm: str = "HS256"
    jwt_expiration_hours: int = 24
    
    # Database
    database_url: str = Field(..., env="DATABASE_URL")
    supabase_url: str = Field(..., env="SUPABASE_URL")
    supabase_key: str = Field(..., env="SUPABASE_ANON_KEY")
    
    # Redis (for session state)
    redis_url: str = Field(default="redis://localhost:6379", env="REDIS_URL")
    
    # LLM Providers
    openai_api_key: str = Field(..., env="OPENAI_API_KEY")
    anthropic_api_key: Optional[str] = Field(default=None, env="ANTHROPIC_API_KEY")
    
    # Model Configuration
    default_model: str = "gpt-4o"
    embedding_model: str = "text-embedding-3-small"
    fast_model: str = "gpt-4o-mini"
    
    # LangSmith (Observability)
    langsmith_api_key: Optional[str] = Field(default=None, env="LANGSMITH_API_KEY")
    langsmith_project: str = "voicecode-agent"
    langsmith_tracing: bool = True
    
    # Rate Limiting
    rate_limit_requests: int = 100
    rate_limit_window_seconds: int = 60
    
    # Agent Configuration
    max_iterations: int = 10
    max_tokens_per_request: int = 4096
    streaming_enabled: bool = True
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = False


@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()
