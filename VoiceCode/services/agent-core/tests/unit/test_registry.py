"""
Unit tests for Tool Registry
"""

import pytest
from unittest.mock import MagicMock

from src.tools.registry import (
    register_tool,
    get_tool,
    get_tools_by_category,
    get_all_tools,
    execute_tool,
    ToolDefinition,
    _tool_registry,
)


class TestToolRegistry:
    """Tests for tool registration and management."""

    def setup_method(self):
        """Clear registry before each test."""
        _tool_registry.clear()

    def test_register_tool_basic(self):
        """Test basic tool registration."""
        def sample_handler(**kwargs):
            return {"result": "success"}

        register_tool(
            name="test_tool",
            description="A test tool",
            parameters={"type": "object", "properties": {}},
            handler=sample_handler,
            category="test",
        )

        tool = get_tool("test_tool")
        assert tool is not None
        assert tool.name == "test_tool"
        assert tool.description == "A test tool"
        assert tool.category == "test"

    def test_register_tool_with_confirmation(self):
        """Test tool registration with confirmation required."""
        register_tool(
            name="dangerous_tool",
            description="A dangerous tool",
            parameters={},
            handler=lambda **kwargs: None,
            requires_confirmation=True,
            category="admin",
        )

        tool = get_tool("dangerous_tool")
        assert tool.requires_confirmation is True

    def test_get_nonexistent_tool(self):
        """Test getting a tool that doesn't exist."""
        tool = get_tool("nonexistent")
        assert tool is None

    def test_get_tools_by_category(self):
        """Test filtering tools by category."""
        register_tool("tool1", "Desc 1", {}, lambda **k: None, category="category_a")
        register_tool("tool2", "Desc 2", {}, lambda **k: None, category="category_a")
        register_tool("tool3", "Desc 3", {}, lambda **k: None, category="category_b")

        category_a_tools = get_tools_by_category("category_a")
        assert len(category_a_tools) == 2

        category_b_tools = get_tools_by_category("category_b")
        assert len(category_b_tools) == 1

    def test_get_all_tools(self):
        """Test getting all registered tools."""
        register_tool("tool1", "Desc 1", {}, lambda **k: None)
        register_tool("tool2", "Desc 2", {}, lambda **k: None)
        register_tool("tool3", "Desc 3", {}, lambda **k: None)

        all_tools = get_all_tools()
        assert len(all_tools) == 3


class TestToolExecution:
    """Tests for tool execution."""

    def setup_method(self):
        """Clear registry before each test."""
        _tool_registry.clear()

    def test_execute_tool_success(self):
        """Test successful tool execution."""
        def add_handler(a: int, b: int, _user_id: str = "", _context: dict = None):
            return {"sum": a + b}

        register_tool(
            name="add",
            description="Add two numbers",
            parameters={
                "type": "object",
                "properties": {
                    "a": {"type": "integer"},
                    "b": {"type": "integer"},
                },
            },
            handler=add_handler,
        )

        result = execute_tool("add", {"a": 5, "b": 3}, user_id="test_user")

        assert result["success"] is True
        assert result["data"]["sum"] == 8
        assert result["error"] is None
        assert "execution_time_ms" in result

    def test_execute_tool_not_found(self):
        """Test executing a non-existent tool."""
        result = execute_tool("nonexistent", {}, user_id="test_user")

        assert result["success"] is False
        assert "not found" in result["error"].lower()

    def test_execute_tool_handler_error(self):
        """Test tool execution when handler raises error."""
        def error_handler(**kwargs):
            raise ValueError("Something went wrong")

        register_tool(
            name="error_tool",
            description="A tool that errors",
            parameters={},
            handler=error_handler,
        )

        result = execute_tool("error_tool", {}, user_id="test_user")

        assert result["success"] is False
        assert "Something went wrong" in result["error"]

    def test_execute_tool_no_handler(self):
        """Test executing a tool with no handler."""
        _tool_registry["no_handler_tool"] = ToolDefinition(
            name="no_handler_tool",
            description="Tool without handler",
            parameters={},
            handler=None,
        )

        result = execute_tool("no_handler_tool", {}, user_id="test_user")

        assert result["success"] is False
        assert "no handler" in result["error"].lower()

    def test_execute_tool_with_context(self):
        """Test tool execution with context passed."""
        received_context = {}

        def context_handler(_user_id: str = "", _context: dict = None, **kwargs):
            received_context["user_id"] = _user_id
            received_context["context"] = _context
            return {"received": True}

        register_tool(
            name="context_tool",
            description="Tool that uses context",
            parameters={},
            handler=context_handler,
        )

        context = {"transcript_id": "trans_123"}
        result = execute_tool(
            "context_tool", 
            {}, 
            user_id="user_456", 
            context=context
        )

        assert result["success"] is True
        assert received_context["user_id"] == "user_456"
        assert received_context["context"] == context

    def test_execution_time_tracking(self):
        """Test that execution time is tracked."""
        import time

        def slow_handler(**kwargs):
            time.sleep(0.05)  # 50ms delay
            return {"done": True}

        register_tool(
            name="slow_tool",
            description="A slow tool",
            parameters={},
            handler=slow_handler,
        )

        result = execute_tool("slow_tool", {}, user_id="test_user")

        assert result["success"] is True
        assert result["execution_time_ms"] >= 50


class TestToolDefinition:
    """Tests for ToolDefinition model."""

    def test_tool_definition_creation(self):
        """Test creating a tool definition."""
        tool = ToolDefinition(
            name="test",
            description="Test tool",
            parameters={"type": "object"},
            handler=lambda: None,
            requires_confirmation=True,
            category="test",
        )

        assert tool.name == "test"
        assert tool.description == "Test tool"
        assert tool.requires_confirmation is True
        assert tool.category == "test"

    def test_tool_definition_defaults(self):
        """Test tool definition default values."""
        tool = ToolDefinition(
            name="minimal",
            description="Minimal tool",
        )

        assert tool.parameters == {}
        assert tool.handler is None
        assert tool.requires_confirmation is False
        assert tool.category == "general"
