"""
VoiceCode Agent Core - Supervisor Agent
Main orchestration agent using LangGraph
"""

from typing import Literal
from datetime import datetime
from langgraph.graph import StateGraph, END
from langgraph.checkpoint.postgres import PostgresSaver
from langchain_openai import ChatOpenAI
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage

from ..models.state import (
    AgentState, AgentType, Intent, UserContext,
    TranscriptContext, ConversationContext, PendingAction
)
from ..config.settings import get_settings

settings = get_settings()


# System prompts
SUPERVISOR_SYSTEM_PROMPT = """You are the VoiceCode AI Supervisor - an intelligent orchestrator that helps users with voice transcription, medical documentation, and productivity tasks.

Your role is to:
1. Understand user intent and context
2. Route requests to the appropriate specialized agent
3. Maintain conversation continuity
4. Ensure high-quality, helpful responses

Available agents:
- TRANSCRIPTION: Recording, editing transcripts, real-time transcription
- MEDICAL: SOAP notes, clinical documentation, discharge summaries, EHR integration
- PRODUCTIVITY: Summaries, key points, action items, meeting minutes
- SEARCH: Finding transcripts, semantic search, retrieving context
- AUTOMATION: Workflows, scheduled tasks, integrations
- EXPORT: PDF, DOCX, sharing, formatting

User context:
- Professional Mode: {professional_mode}
- Language: {language}

Current context:
- Active transcript: {has_active_transcript}
- Recording: {is_recording}

Based on the user's message, determine the intent and route appropriately.
Always be helpful, concise, and professional."""

INTENT_CLASSIFIER_PROMPT = """Classify the user's intent into one of these categories:
- TRANSCRIBE: Starting/stopping recording, editing transcripts
- SUMMARIZE: Creating summaries of content
- EXTRACT_ACTIONS: Finding action items, tasks, to-dos
- SEARCH: Looking for specific information in transcripts
- GENERATE_MEDICAL_DOC: SOAP notes, clinical docs, discharge summaries
- EXPORT: Converting formats, sharing, downloading
- AUTOMATE: Setting up workflows, automations
- CHAT: General conversation, questions
- HELP: Asking for help or guidance

User message: {message}
Context: {context}

Respond with ONLY the intent category name."""


def create_supervisor_graph():
    """Create the LangGraph supervisor orchestration graph."""
    
    # Initialize LLM
    llm = ChatOpenAI(
        model=settings.default_model,
        temperature=0.1,
        api_key=settings.openai_api_key,
        streaming=settings.streaming_enabled,
    )
    
    fast_llm = ChatOpenAI(
        model=settings.fast_model,
        temperature=0,
        api_key=settings.openai_api_key,
    )
    
    # Node functions
    def classify_intent(state: AgentState) -> AgentState:
        """Classify user intent from the latest message."""
        messages = state.get("messages", [])
        if not messages:
            return {**state, "intent": Intent.UNKNOWN, "confidence": 0.0}
        
        last_message = messages[-1]
        user_message = last_message.content if hasattr(last_message, 'content') else str(last_message)
        
        # Build context string
        context_parts = []
        if state.get("transcript_context"):
            tc = state["transcript_context"]
            if tc.active_recording:
                context_parts.append("User is currently recording")
            if tc.current_transcript_id:
                context_parts.append(f"Active transcript: {tc.current_transcript_id}")
        
        context_str = "; ".join(context_parts) if context_parts else "No specific context"
        
        # Classify intent
        prompt = INTENT_CLASSIFIER_PROMPT.format(
            message=user_message,
            context=context_str
        )
        
        response = fast_llm.invoke([HumanMessage(content=prompt)])
        intent_str = response.content.strip().upper()
        
        # Map to Intent enum
        intent_map = {
            "TRANSCRIBE": Intent.TRANSCRIBE,
            "SUMMARIZE": Intent.SUMMARIZE,
            "EXTRACT_ACTIONS": Intent.EXTRACT_ACTIONS,
            "SEARCH": Intent.SEARCH,
            "GENERATE_MEDICAL_DOC": Intent.GENERATE_MEDICAL_DOC,
            "EXPORT": Intent.EXPORT,
            "AUTOMATE": Intent.AUTOMATE,
            "CHAT": Intent.CHAT,
            "HELP": Intent.HELP,
        }
        
        intent = intent_map.get(intent_str, Intent.UNKNOWN)
        
        return {
            **state,
            "intent": intent,
            "confidence": 0.9 if intent != Intent.UNKNOWN else 0.5,
            "last_updated_at": datetime.utcnow(),
        }
    
    def route_to_agent(state: AgentState) -> AgentState:
        """Route to the appropriate specialized agent."""
        intent = state.get("intent", Intent.UNKNOWN)
        user_context = state.get("user_context")
        
        # Determine which agent to route to
        agent_routing = {
            Intent.TRANSCRIBE: AgentType.TRANSCRIPTION,
            Intent.SUMMARIZE: AgentType.PRODUCTIVITY,
            Intent.EXTRACT_ACTIONS: AgentType.PRODUCTIVITY,
            Intent.SEARCH: AgentType.SEARCH,
            Intent.GENERATE_MEDICAL_DOC: AgentType.MEDICAL,
            Intent.EXPORT: AgentType.EXPORT,
            Intent.AUTOMATE: AgentType.AUTOMATION,
            Intent.CHAT: AgentType.SUPERVISOR,
            Intent.HELP: AgentType.SUPERVISOR,
            Intent.UNKNOWN: AgentType.SUPERVISOR,
        }
        
        # Override for medical mode
        if user_context and user_context.professional_mode == "medical":
            if intent in [Intent.SUMMARIZE, Intent.EXTRACT_ACTIONS]:
                agent_routing[intent] = AgentType.MEDICAL
        
        active_agent = agent_routing.get(intent, AgentType.SUPERVISOR)
        
        return {
            **state,
            "active_agent": active_agent,
            "last_updated_at": datetime.utcnow(),
        }
    
    def supervisor_respond(state: AgentState) -> AgentState:
        """Supervisor handles general chat and help requests."""
        messages = state.get("messages", [])
        user_context = state.get("user_context", UserContext(user_id="unknown"))
        transcript_context = state.get("transcript_context", TranscriptContext())
        
        # Build system message
        system_msg = SUPERVISOR_SYSTEM_PROMPT.format(
            professional_mode=user_context.professional_mode,
            language=user_context.language,
            has_active_transcript=bool(transcript_context.current_transcript_id),
            is_recording=transcript_context.active_recording,
        )
        
        # Prepare messages for LLM
        llm_messages = [SystemMessage(content=system_msg)]
        for msg in messages[-10:]:  # Last 10 messages for context
            if hasattr(msg, 'type'):
                if msg.type == "human":
                    llm_messages.append(HumanMessage(content=msg.content))
                elif msg.type == "ai":
                    llm_messages.append(AIMessage(content=msg.content))
            else:
                llm_messages.append(HumanMessage(content=str(msg)))
        
        # Generate response
        response = llm.invoke(llm_messages)
        
        return {
            **state,
            "messages": [AIMessage(content=response.content)],
            "last_updated_at": datetime.utcnow(),
        }
    
    def transcription_agent(state: AgentState) -> AgentState:
        """Handle transcription-related requests."""
        # Import transcription tools
        from ..tools.transcription_tools import get_transcription_tools
        
        messages = state.get("messages", [])
        tools = get_transcription_tools()
        
        # Create agent with tools
        llm_with_tools = llm.bind_tools(tools)
        
        system_msg = """You are the VoiceCode Transcription Agent. You help users with:
- Starting and stopping recordings
- Editing transcripts
- Managing audio files
- Real-time transcription settings

Use the available tools to accomplish tasks. Be concise and helpful."""
        
        llm_messages = [SystemMessage(content=system_msg)]
        for msg in messages[-5:]:
            if hasattr(msg, 'type') and msg.type == "human":
                llm_messages.append(HumanMessage(content=msg.content))
        
        response = llm_with_tools.invoke(llm_messages)
        
        # Process tool calls if any
        tool_calls = []
        if response.tool_calls:
            for tc in response.tool_calls:
                tool_calls.append({
                    "tool_name": tc["name"],
                    "tool_id": tc["id"],
                    "arguments": tc["args"],
                })
        
        return {
            **state,
            "messages": [AIMessage(content=response.content or "Processing your request...")],
            "tool_calls": tool_calls,
            "last_updated_at": datetime.utcnow(),
        }
    
    def medical_agent(state: AgentState) -> AgentState:
        """Handle medical documentation requests."""
        from ..tools.medical_tools import get_medical_tools
        
        messages = state.get("messages", [])
        tools = get_medical_tools()
        
        llm_with_tools = llm.bind_tools(tools)
        
        system_msg = """You are the VoiceCode Medical Scribe Agent. You help healthcare professionals with:
- SOAP notes generation
- Progress notes
- Discharge summaries
- Clinical documentation
- EHR integration

Ensure all documentation follows medical best practices and includes appropriate structure.
Always ask for clarification if patient information is incomplete."""
        
        llm_messages = [SystemMessage(content=system_msg)]
        for msg in messages[-5:]:
            if hasattr(msg, 'type') and msg.type == "human":
                llm_messages.append(HumanMessage(content=msg.content))
        
        response = llm_with_tools.invoke(llm_messages)
        
        tool_calls = []
        if response.tool_calls:
            for tc in response.tool_calls:
                tool_calls.append({
                    "tool_name": tc["name"],
                    "tool_id": tc["id"],
                    "arguments": tc["args"],
                })
        
        return {
            **state,
            "messages": [AIMessage(content=response.content or "Generating medical documentation...")],
            "tool_calls": tool_calls,
            "last_updated_at": datetime.utcnow(),
        }
    
    def productivity_agent(state: AgentState) -> AgentState:
        """Handle productivity requests (summaries, action items)."""
        from ..tools.productivity_tools import get_productivity_tools
        
        messages = state.get("messages", [])
        tools = get_productivity_tools()
        
        llm_with_tools = llm.bind_tools(tools)
        
        system_msg = """You are the VoiceCode Productivity Agent. You help users with:
- Creating summaries of transcripts
- Extracting key points
- Identifying action items and tasks
- Generating meeting minutes
- Organizing information

Be concise but thorough. Prioritize actionable insights."""
        
        llm_messages = [SystemMessage(content=system_msg)]
        for msg in messages[-5:]:
            if hasattr(msg, 'type') and msg.type == "human":
                llm_messages.append(HumanMessage(content=msg.content))
        
        response = llm_with_tools.invoke(llm_messages)
        
        tool_calls = []
        if response.tool_calls:
            for tc in response.tool_calls:
                tool_calls.append({
                    "tool_name": tc["name"],
                    "tool_id": tc["id"],
                    "arguments": tc["args"],
                })
        
        return {
            **state,
            "messages": [AIMessage(content=response.content or "Analyzing content...")],
            "tool_calls": tool_calls,
            "last_updated_at": datetime.utcnow(),
        }
    
    def search_agent(state: AgentState) -> AgentState:
        """Handle search and retrieval requests."""
        from ..tools.search_tools import get_search_tools
        
        messages = state.get("messages", [])
        tools = get_search_tools()
        
        llm_with_tools = llm.bind_tools(tools)
        
        system_msg = """You are the VoiceCode Search Agent. You help users find information:
- Search across transcripts
- Find specific mentions or topics
- Retrieve related content
- Semantic search for concepts

Provide relevant results with context. Highlight the most relevant matches."""
        
        llm_messages = [SystemMessage(content=system_msg)]
        for msg in messages[-5:]:
            if hasattr(msg, 'type') and msg.type == "human":
                llm_messages.append(HumanMessage(content=msg.content))
        
        response = llm_with_tools.invoke(llm_messages)
        
        tool_calls = []
        if response.tool_calls:
            for tc in response.tool_calls:
                tool_calls.append({
                    "tool_name": tc["name"],
                    "tool_id": tc["id"],
                    "arguments": tc["args"],
                })
        
        return {
            **state,
            "messages": [AIMessage(content=response.content or "Searching...")],
            "tool_calls": tool_calls,
            "last_updated_at": datetime.utcnow(),
        }
    
    def should_continue(state: AgentState) -> Literal["execute_tools", "end"]:
        """Determine if we need to execute tools or can end."""
        tool_calls = state.get("tool_calls", [])
        if tool_calls:
            return "execute_tools"
        return "end"
    
    def execute_tools(state: AgentState) -> AgentState:
        """Execute pending tool calls."""
        from ..tools.registry import execute_tool
        
        tool_calls = state.get("tool_calls", [])
        tool_results = []
        
        for tc in tool_calls:
            result = execute_tool(
                tc["tool_name"],
                tc["arguments"],
                user_id=state.get("user_id", "unknown"),
            )
            tool_results.append({
                "tool_id": tc["tool_id"],
                "tool_name": tc["tool_name"],
                "success": result.get("success", False),
                "result": result.get("data"),
                "error": result.get("error"),
            })
        
        return {
            **state,
            "tool_results": tool_results,
            "tool_calls": [],  # Clear processed calls
            "last_updated_at": datetime.utcnow(),
        }
    
    def route_by_agent(state: AgentState) -> str:
        """Route to the appropriate agent node."""
        agent = state.get("active_agent", AgentType.SUPERVISOR)
        
        routing = {
            AgentType.SUPERVISOR: "supervisor_respond",
            AgentType.TRANSCRIPTION: "transcription_agent",
            AgentType.MEDICAL: "medical_agent",
            AgentType.PRODUCTIVITY: "productivity_agent",
            AgentType.SEARCH: "search_agent",
            AgentType.AUTOMATION: "supervisor_respond",  # Fallback for now
            AgentType.EXPORT: "supervisor_respond",  # Fallback for now
        }
        
        return routing.get(agent, "supervisor_respond")
    
    # Build the graph
    graph = StateGraph(AgentState)
    
    # Add nodes
    graph.add_node("classify_intent", classify_intent)
    graph.add_node("route_to_agent", route_to_agent)
    graph.add_node("supervisor_respond", supervisor_respond)
    graph.add_node("transcription_agent", transcription_agent)
    graph.add_node("medical_agent", medical_agent)
    graph.add_node("productivity_agent", productivity_agent)
    graph.add_node("search_agent", search_agent)
    graph.add_node("execute_tools", execute_tools)
    
    # Add edges
    graph.set_entry_point("classify_intent")
    graph.add_edge("classify_intent", "route_to_agent")
    
    # Conditional routing to specialized agents
    graph.add_conditional_edges(
        "route_to_agent",
        route_by_agent,
        {
            "supervisor_respond": "supervisor_respond",
            "transcription_agent": "transcription_agent",
            "medical_agent": "medical_agent",
            "productivity_agent": "productivity_agent",
            "search_agent": "search_agent",
        }
    )
    
    # All agents can either execute tools or end
    for agent_node in ["supervisor_respond", "transcription_agent", "medical_agent", 
                       "productivity_agent", "search_agent"]:
        graph.add_conditional_edges(
            agent_node,
            should_continue,
            {
                "execute_tools": "execute_tools",
                "end": END,
            }
        )
    
    graph.add_edge("execute_tools", END)
    
    return graph


def get_compiled_graph(checkpointer=None):
    """Get compiled graph with optional checkpointing."""
    graph = create_supervisor_graph()
    
    if checkpointer:
        return graph.compile(checkpointer=checkpointer)
    
    return graph.compile()


# Singleton instance
_graph_instance = None


def get_agent_graph():
    """Get the singleton agent graph instance."""
    global _graph_instance
    if _graph_instance is None:
        _graph_instance = get_compiled_graph()
    return _graph_instance
