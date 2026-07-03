"""
VoiceCode Agent Core - FastAPI Application
Main API entry point with WebSocket support
"""

from contextlib import asynccontextmanager
from datetime import datetime
from typing import Optional
import uuid

from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import structlog

from ..config.settings import get_settings
from ..models.state import AgentState, Intent, UserContext, TranscriptContext
from ..agents.supervisor import get_agent_graph

# Initialize
settings = get_settings()
logger = structlog.get_logger()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events."""
    logger.info("starting_agent_service", version=settings.app_version)
    # Initialize agent graph on startup
    get_agent_graph()
    yield
    logger.info("shutting_down_agent_service")


app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Request/Response Models
class ChatRequest(BaseModel):
    """Chat request from client."""
    message: str
    session_id: Optional[str] = None
    context: Optional[dict] = Field(default_factory=dict)
    professional_mode: str = "general"


class ChatResponse(BaseModel):
    """Chat response to client."""
    session_id: str
    message: str
    intent: str
    tool_calls: list = Field(default_factory=list)
    suggestions: list = Field(default_factory=list)
    metadata: dict = Field(default_factory=dict)


class CommandRequest(BaseModel):
    """Direct command request."""
    command: str
    parameters: dict = Field(default_factory=dict)
    session_id: Optional[str] = None


class ConfirmRequest(BaseModel):
    """Confirm pending action."""
    action_id: str
    confirmed: bool
    session_id: str


class SearchRequest(BaseModel):
    """Search request."""
    query: str
    limit: int = 10
    filters: Optional[dict] = None


# Active WebSocket connections
active_connections: dict[str, WebSocket] = {}


# Health check
@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "service": settings.app_name,
        "version": settings.app_version,
        "timestamp": datetime.utcnow().isoformat(),
    }


# Chat endpoint
@app.post("/api/v1/agent/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """Send a message to the agent and get a response."""
    session_id = request.session_id or str(uuid.uuid4())
    
    logger.info(
        "chat_request",
        session_id=session_id,
        message_length=len(request.message),
    )
    
    try:
        # Build initial state
        state: AgentState = {
            "messages": [{"type": "human", "content": request.message}],
            "session_id": session_id,
            "user_id": "user_placeholder",  # Would come from auth
            "user_context": UserContext(
                user_id="user_placeholder",
                professional_mode=request.professional_mode,
            ),
            "transcript_context": TranscriptContext(),
            "iteration_count": 0,
            "started_at": datetime.utcnow(),
        }
        
        # Run agent graph
        graph = get_agent_graph()
        result = graph.invoke(state)
        
        # Extract response
        messages = result.get("messages", [])
        last_message = messages[-1] if messages else None
        response_content = ""
        
        if last_message:
            if hasattr(last_message, "content"):
                response_content = last_message.content
            else:
                response_content = str(last_message)
        
        return ChatResponse(
            session_id=session_id,
            message=response_content,
            intent=result.get("intent", Intent.UNKNOWN).value if result.get("intent") else "unknown",
            tool_calls=result.get("tool_calls", []),
            suggestions=[],
            metadata={
                "model": settings.default_model,
                "iteration_count": result.get("iteration_count", 0),
            },
        )
        
    except Exception as e:
        logger.error("chat_error", session_id=session_id, error=str(e))
        raise HTTPException(status_code=500, detail=str(e))


# Command endpoint
@app.post("/api/v1/agent/command")
async def execute_command(request: CommandRequest):
    """Execute a specific command directly."""
    from ..tools.registry import execute_tool
    
    session_id = request.session_id or str(uuid.uuid4())
    
    logger.info(
        "command_request",
        session_id=session_id,
        command=request.command,
    )
    
    result = execute_tool(
        request.command,
        request.parameters,
        user_id="user_placeholder",
    )
    
    return {
        "session_id": session_id,
        "command": request.command,
        "result": result,
    }


# Search endpoint
@app.post("/api/v1/agent/search")
async def search(request: SearchRequest):
    """Semantic search across transcripts."""
    from ..tools.search_tools import semantic_search_handler
    
    result = semantic_search_handler(
        request.query,
        request.limit,
        request.filters,
        _user_id="user_placeholder",
    )
    
    return result


# Suggestions endpoint
@app.get("/api/v1/agent/suggestions")
async def get_suggestions(session_id: Optional[str] = None):
    """Get proactive suggestions based on context."""
    return {
        "suggestions": [
            {
                "type": "action",
                "text": "Summarize your latest recording",
                "command": "summarize_transcript",
                "params": {"transcript_id": "latest"},
            },
            {
                "type": "action", 
                "text": "Extract action items from recent meetings",
                "command": "extract_action_items",
                "params": {},
            },
            {
                "type": "insight",
                "text": "You have 3 unreviewed transcripts from this week",
            },
        ],
        "context": {
            "unreviewed_count": 3,
            "last_activity": "2024-01-15T10:30:00Z",
        },
    }


# WebSocket for real-time chat
@app.websocket("/ws/agent/{session_id}")
async def websocket_chat(websocket: WebSocket, session_id: str):
    """WebSocket endpoint for real-time agent chat."""
    await websocket.accept()
    active_connections[session_id] = websocket
    
    logger.info("websocket_connected", session_id=session_id)
    
    try:
        while True:
            # Receive message
            data = await websocket.receive_json()
            message_type = data.get("type", "message")
            
            if message_type == "message":
                # Process chat message
                content = data.get("content", "")
                
                # Build state
                state: AgentState = {
                    "messages": [{"type": "human", "content": content}],
                    "session_id": session_id,
                    "user_id": "user_placeholder",
                    "user_context": UserContext(
                        user_id="user_placeholder",
                        professional_mode=data.get("professional_mode", "general"),
                    ),
                    "transcript_context": TranscriptContext(),
                    "iteration_count": 0,
                    "started_at": datetime.utcnow(),
                }
                
                # Send thinking indicator
                await websocket.send_json({
                    "type": "thinking",
                    "session_id": session_id,
                })
                
                # Run agent
                graph = get_agent_graph()
                result = graph.invoke(state)
                
                # Extract and send response
                messages = result.get("messages", [])
                last_message = messages[-1] if messages else None
                response_content = ""
                
                if last_message:
                    if hasattr(last_message, "content"):
                        response_content = last_message.content
                    else:
                        response_content = str(last_message)
                
                await websocket.send_json({
                    "type": "response",
                    "session_id": session_id,
                    "content": response_content,
                    "intent": result.get("intent", Intent.UNKNOWN).value if result.get("intent") else "unknown",
                    "tool_calls": result.get("tool_calls", []),
                })
                
            elif message_type == "ping":
                await websocket.send_json({"type": "pong"})
                
    except WebSocketDisconnect:
        logger.info("websocket_disconnected", session_id=session_id)
        if session_id in active_connections:
            del active_connections[session_id]
    except Exception as e:
        logger.error("websocket_error", session_id=session_id, error=str(e))
        if session_id in active_connections:
            del active_connections[session_id]


# Session history
@app.get("/api/v1/agent/session/{session_id}")
async def get_session(session_id: str):
    """Get session history."""
    # In production, fetch from database/checkpointer
    return {
        "session_id": session_id,
        "messages": [],
        "created_at": datetime.utcnow().isoformat(),
        "metadata": {},
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host=settings.api_host, port=settings.api_port)
