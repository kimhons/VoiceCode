"""
VoiceCode Agent Core - Tool Registry
Central registry for all agent tools
"""

from typing import Callable, Any, Optional
from pydantic import BaseModel, Field
from datetime import datetime
import structlog

logger = structlog.get_logger()


class ToolDefinition(BaseModel):
    """Definition of a tool available to agents."""
    name: str
    description: str
    parameters: dict = Field(default_factory=dict)
    handler: Optional[Callable] = None
    requires_confirmation: bool = False
    category: str = "general"
    
    class Config:
        arbitrary_types_allowed = True


class ToolResult(BaseModel):
    """Result from executing a tool."""
    success: bool
    data: Optional[Any] = None
    error: Optional[str] = None
    execution_time_ms: int = 0
    metadata: dict = Field(default_factory=dict)


# Global tool registry
_tool_registry: dict[str, ToolDefinition] = {}


def register_tool(
    name: str,
    description: str,
    parameters: dict,
    handler: Callable,
    requires_confirmation: bool = False,
    category: str = "general",
) -> None:
    """Register a tool in the global registry."""
    _tool_registry[name] = ToolDefinition(
        name=name,
        description=description,
        parameters=parameters,
        handler=handler,
        requires_confirmation=requires_confirmation,
        category=category,
    )
    logger.info("tool_registered", name=name, category=category)


def get_tool(name: str) -> Optional[ToolDefinition]:
    """Get a tool definition by name."""
    return _tool_registry.get(name)


def get_tools_by_category(category: str) -> list[ToolDefinition]:
    """Get all tools in a category."""
    return [t for t in _tool_registry.values() if t.category == category]


def get_all_tools() -> list[ToolDefinition]:
    """Get all registered tools."""
    return list(_tool_registry.values())


def execute_tool(
    name: str,
    arguments: dict,
    user_id: str,
    context: Optional[dict] = None,
) -> dict:
    """Execute a tool by name with given arguments."""
    start_time = datetime.utcnow()
    
    tool = get_tool(name)
    if not tool:
        logger.error("tool_not_found", name=name)
        return {
            "success": False,
            "error": f"Tool '{name}' not found",
            "data": None,
        }
    
    if not tool.handler:
        logger.error("tool_no_handler", name=name)
        return {
            "success": False,
            "error": f"Tool '{name}' has no handler",
            "data": None,
        }
    
    try:
        logger.info("tool_executing", name=name, user_id=user_id)
        
        # Add context to arguments
        arguments["_user_id"] = user_id
        arguments["_context"] = context or {}
        
        result = tool.handler(**arguments)
        
        execution_time = (datetime.utcnow() - start_time).total_seconds() * 1000
        
        logger.info(
            "tool_executed",
            name=name,
            user_id=user_id,
            execution_time_ms=execution_time,
            success=True,
        )
        
        return {
            "success": True,
            "data": result,
            "error": None,
            "execution_time_ms": int(execution_time),
        }
        
    except Exception as e:
        execution_time = (datetime.utcnow() - start_time).total_seconds() * 1000
        
        logger.error(
            "tool_execution_failed",
            name=name,
            user_id=user_id,
            error=str(e),
            execution_time_ms=execution_time,
        )
        
        return {
            "success": False,
            "data": None,
            "error": str(e),
            "execution_time_ms": int(execution_time),
        }


def tools_to_langchain_format(tools: list[ToolDefinition]) -> list[dict]:
    """Convert tools to LangChain tool format."""
    return [
        {
            "type": "function",
            "function": {
                "name": tool.name,
                "description": tool.description,
                "parameters": tool.parameters,
            }
        }
        for tool in tools
    ]
