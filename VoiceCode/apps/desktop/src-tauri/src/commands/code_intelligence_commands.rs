// Tauri Commands for Code Intelligence Modules
// Exposes all Phase 1-5 functionality to the frontend

use std::collections::HashMap;
use std::path::PathBuf;
use std::sync::Arc;
use tauri::State;
use tokio::sync::RwLock;
use serde::{Deserialize, Serialize};

use crate::code_intelligence::{
    // Phase 1-2
    UnifiedContextEngine, UnifiedContextConfig, UnifiedContextRequest,
    MetaAgentOrchestrator, MetaAgentConfig, TaskType, CollaborationStrategy, ExternalAgentType,
    VoiceGrammarParser, VoiceAction, SymbolContext,
    // Phase 3-5
    TribalKnowledgeExtractor, TribalKnowledge,
    RecitationValidator, RecitationResult,
    DynamicBudgetManager, ContextCategory, BudgetPlan, TaskProfile,
    MultiRepoManager, WorkspaceInfo,
    SandboxManager, SandboxConfig, SandboxMode, CommandAnalysis, CommandResult,
    PromptEngineer, PromptType, BuiltPrompt,
};

/// Application state holding all code intelligence components
pub struct CodeIntelligenceState {
    pub context_engine: RwLock<Option<Arc<UnifiedContextEngine>>>,
    pub meta_agent: RwLock<Option<Arc<MetaAgentOrchestrator>>>,
    pub voice_parser: Arc<VoiceGrammarParser>,
    pub tribal_extractor: RwLock<Option<Arc<TribalKnowledgeExtractor>>>,
    pub recitation_validator: RwLock<Option<Arc<RecitationValidator>>>,
    pub budget_manager: RwLock<Option<DynamicBudgetManager>>,
    pub multi_repo: RwLock<Option<MultiRepoManager>>,
    pub sandbox: RwLock<Option<SandboxManager>>,
    pub prompt_engineer: Arc<PromptEngineer>,
    pub project_root: RwLock<Option<PathBuf>>,
    pub initialized: RwLock<bool>,
}

impl Default for CodeIntelligenceState {
    fn default() -> Self {
        Self {
            context_engine: RwLock::new(None),
            meta_agent: RwLock::new(None),
            voice_parser: Arc::new(VoiceGrammarParser::new()),
            tribal_extractor: RwLock::new(None),
            recitation_validator: RwLock::new(None),
            budget_manager: RwLock::new(None),
            multi_repo: RwLock::new(None),
            sandbox: RwLock::new(None),
            prompt_engineer: Arc::new(PromptEngineer::new()),
            project_root: RwLock::new(None),
            initialized: RwLock::new(false),
        }
    }
}

// ============================================================================
// Initialization Commands
// ============================================================================

#[derive(Debug, Serialize, Deserialize)]
pub struct InitResult {
    pub success: bool,
    pub files_indexed: usize,
    pub symbols_found: usize,
    pub agents_detected: usize,
    pub workspace_type: Option<String>,
    pub packages_found: usize,
}

#[tauri::command]
pub async fn init_code_intelligence(
    project_path: String,
    state: State<'_, CodeIntelligenceState>,
) -> Result<InitResult, String> {
    let root = PathBuf::from(&project_path);
    if !root.exists() {
        return Err(format!("Project path does not exist: {}", project_path));
    }

    // Initialize unified context engine
    let context_config = UnifiedContextConfig::default();
    let context_engine = UnifiedContextEngine::new(root.clone(), context_config)
        .await
        .map_err(|e| format!("Failed to create context engine: {}", e))?;
    let context_engine = Arc::new(context_engine);

    // Initialize and index
    let index_stats = context_engine.initialize().await
        .map_err(|e| format!("Failed to initialize: {}", e))?;

    // Initialize meta-agent
    let agent_config = MetaAgentConfig::default();
    let meta_agent = Arc::new(MetaAgentOrchestrator::new(root.clone(), agent_config));
    let agents = meta_agent.detect_agents().await;

    // Initialize multi-repo manager
    let mut multi_repo = MultiRepoManager::new();
    let workspace_info = multi_repo.discover_workspace(&root).await.ok();

    // Initialize sandbox
    let sandbox = SandboxManager::new(root.clone(), SandboxConfig::default());

    // Initialize budget manager
    let budget_manager = DynamicBudgetManager::for_model("claude-3-sonnet");

    // Store state
    *state.context_engine.write().await = Some(context_engine);
    *state.meta_agent.write().await = Some(meta_agent);
    *state.multi_repo.write().await = Some(multi_repo);
    *state.sandbox.write().await = Some(sandbox);
    *state.budget_manager.write().await = Some(budget_manager);
    *state.project_root.write().await = Some(root);
    *state.initialized.write().await = true;

    Ok(InitResult {
        success: true,
        files_indexed: index_stats.files_indexed,
        symbols_found: index_stats.symbols_found,
        agents_detected: agents.len(),
        workspace_type: workspace_info.as_ref().map(|w| format!("{:?}", w.workspace_type)),
        packages_found: workspace_info.map(|w| w.total_packages).unwrap_or(1),
    })
}

// ============================================================================
// Voice Command Processing
// ============================================================================

#[derive(Debug, Serialize, Deserialize)]
pub struct VoiceCommandResponse {
    pub action: String,
    pub target: Option<String>,
    pub target_type: Option<String>,
    pub parameters: HashMap<String, String>,
    pub confidence: f32,
    pub requires_confirmation: bool,
    pub confirmation_prompt: Option<String>,
    pub raw_input: String,
}

#[tauri::command]
pub async fn parse_voice_command(
    input: String,
    state: State<'_, CodeIntelligenceState>,
) -> Result<VoiceCommandResponse, String> {
    let command = state.voice_parser.parse(&input);
    
    let mut params = HashMap::new();
    if let Some(ref p) = command.parameters.name {
        params.insert("name".to_string(), p.clone());
    }
    if let Some(ref p) = command.parameters.return_type {
        params.insert("return_type".to_string(), p.clone());
    }
    if command.parameters.async_flag {
        params.insert("async".to_string(), "true".to_string());
    }

    let confirmation = if command.requires_confirmation {
        Some(state.voice_parser.generate_confirmation(&command))
    } else {
        None
    };

    Ok(VoiceCommandResponse {
        action: format!("{:?}", command.action),
        target: command.target.as_ref().and_then(|t| t.name.clone()),
        target_type: command.target.as_ref().map(|t| format!("{:?}", t.target_type)),
        parameters: params,
        confidence: command.confidence,
        requires_confirmation: command.requires_confirmation,
        confirmation_prompt: confirmation,
        raw_input: command.raw_input,
    })
}

#[tauri::command]
pub async fn execute_voice_command(
    input: String,
    state: State<'_, CodeIntelligenceState>,
) -> Result<String, String> {
    let initialized = *state.initialized.read().await;
    if !initialized {
        return Err("Code intelligence not initialized. Call init_code_intelligence first.".to_string());
    }

    let command = state.voice_parser.parse(&input);
    let meta_agent = state.meta_agent.read().await;
    let meta_agent = meta_agent.as_ref().ok_or("Meta agent not initialized")?;

    // Convert voice command to agent task
    let task_type = match command.action {
        VoiceAction::Create | VoiceAction::Generate => TaskType::Generate,
        VoiceAction::Edit | VoiceAction::Modify => TaskType::Generate,
        VoiceAction::Fix | VoiceAction::Debug => TaskType::Fix,
        VoiceAction::Refactor => TaskType::Refactor,
        VoiceAction::Explain => TaskType::Explain,
        VoiceAction::Test => TaskType::Test,
        VoiceAction::Document => TaskType::Document,
        _ => TaskType::Generate,
    };

    let project_root = state.project_root.read().await;
    let task = meta_agent.create_task(
        task_type,
        &command.raw_input,
        project_root.clone(),
    );

    let result = meta_agent.execute_task(task, None).await
        .map_err(|e| format!("Task execution failed: {}", e))?;

    if result.success {
        Ok(result.output)
    } else {
        Err(result.error.unwrap_or_else(|| "Unknown error".to_string()))
    }
}

// ============================================================================
// Context Building
// ============================================================================

#[derive(Debug, Serialize, Deserialize)]
pub struct ContextResponse {
    pub context: String,
    pub token_count: usize,
    pub sources: Vec<String>,
    pub graph_nodes: usize,
    pub history_commits: usize,
}

#[tauri::command]
pub async fn build_unified_context(
    current_file: Option<String>,
    cursor_line: Option<usize>,
    cursor_col: Option<usize>,
    query: Option<String>,
    include_history: bool,
    state: State<'_, CodeIntelligenceState>,
) -> Result<ContextResponse, String> {
    let engine = state.context_engine.read().await;
    let engine = engine.as_ref().ok_or("Context engine not initialized")?;

    let request = UnifiedContextRequest {
        current_file: current_file.map(PathBuf::from),
        cursor_position: cursor_line.zip(cursor_col),
        query,
        include_history,
        ..Default::default()
    };

    let context = engine.build_context(request).await
        .map_err(|e| format!("Failed to build context: {}", e))?;

    let formatted = engine.format_for_llm(&context);
    let token_count = formatted.len() / 4; // Rough estimate

    Ok(ContextResponse {
        context: formatted,
        token_count,
        sources: vec!["code_graph".to_string(), "symbol_table".to_string(), "git_history".to_string()],
        graph_nodes: context.graph_context.len(),
        history_commits: context.history_context.len(),
    })
}

// ============================================================================
// Tribal Knowledge
// ============================================================================

#[tauri::command]
pub async fn extract_tribal_knowledge(
    state: State<'_, CodeIntelligenceState>,
) -> Result<TribalKnowledge, String> {
    let extractor = state.tribal_extractor.read().await;
    let extractor = extractor.as_ref().ok_or("Tribal extractor not initialized")?;
    
    extractor.extract().await
}

#[tauri::command]
pub async fn get_tribal_knowledge_summary(
    state: State<'_, CodeIntelligenceState>,
) -> Result<String, String> {
    let extractor = state.tribal_extractor.read().await;
    let extractor = extractor.as_ref().ok_or("Tribal extractor not initialized")?;
    
    Ok(extractor.format_for_llm())
}

// ============================================================================
// Recitation & Anti-Hallucination
// ============================================================================

#[tauri::command]
pub async fn validate_llm_response(
    response: String,
    context_file: Option<String>,
    state: State<'_, CodeIntelligenceState>,
) -> Result<RecitationResult, String> {
    let validator = state.recitation_validator.read().await;
    let validator = validator.as_ref().ok_or("Recitation validator not initialized")?;

    let file_path = context_file.map(PathBuf::from);
    Ok(validator.validate_response(&response, file_path.as_deref()))
}

#[tauri::command]
pub async fn generate_citation_prompt(
    symbols: Vec<String>,
    state: State<'_, CodeIntelligenceState>,
) -> Result<String, String> {
    let validator = state.recitation_validator.read().await;
    let validator = validator.as_ref().ok_or("Recitation validator not initialized")?;

    Ok(validator.generate_citation_prompt(&symbols))
}

// ============================================================================
// Dynamic Budget
// ============================================================================

#[derive(Debug, Serialize, Deserialize)]
pub struct BudgetRequest {
    pub task_type: String,
    pub complexity: String,
    pub scope: String,
    pub content_sizes: HashMap<String, usize>,
}

#[tauri::command]
pub async fn calculate_token_budget(
    request: BudgetRequest,
    state: State<'_, CodeIntelligenceState>,
) -> Result<BudgetPlan, String> {
    let mut manager = state.budget_manager.write().await;
    let manager = manager.as_mut().ok_or("Budget manager not initialized")?;

    // Set task profile
    let profile = TaskProfile::default();
    manager.set_task_profile(profile);

    // Convert content sizes
    let mut sizes = HashMap::new();
    for (key, value) in request.content_sizes {
        let category = match key.as_str() {
            "code" => ContextCategory::CodeContext,
            "memory" => ContextCategory::ProjectMemory,
            "history" => ContextCategory::GitHistory,
            "symbols" => ContextCategory::SymbolDefinitions,
            "examples" => ContextCategory::Examples,
            _ => continue,
        };
        sizes.insert(category, value);
    }

    Ok(manager.calculate_budget(&sizes))
}

// ============================================================================
// Multi-Repo / Workspace
// ============================================================================

#[tauri::command]
pub async fn get_workspace_info(
    state: State<'_, CodeIntelligenceState>,
) -> Result<WorkspaceInfo, String> {
    let multi_repo = state.multi_repo.read().await;
    let multi_repo = multi_repo.as_ref().ok_or("Multi-repo manager not initialized")?;

    let root = state.project_root.read().await;
    let root = root.as_ref().ok_or("Project root not set")?;

    // Return cached workspace info
    Ok(WorkspaceInfo {
        workspace_type: crate::code_intelligence::WorkspaceType::Single,
        root: root.clone(),
        repos: multi_repo.get_repos(),
        total_packages: multi_repo.get_repos().len(),
    })
}

#[tauri::command]
pub async fn get_cross_references(
    repo_name: String,
    state: State<'_, CodeIntelligenceState>,
) -> Result<Vec<String>, String> {
    let multi_repo = state.multi_repo.read().await;
    let multi_repo = multi_repo.as_ref().ok_or("Multi-repo manager not initialized")?;

    let refs = multi_repo.get_cross_refs(&repo_name);
    Ok(refs.iter().map(|r| format!("{} -> {} ({})", r.from_repo, r.to_repo, r.to_symbol)).collect())
}

// ============================================================================
// Sandbox Execution
// ============================================================================

#[tauri::command]
pub async fn analyze_command(
    command: String,
    state: State<'_, CodeIntelligenceState>,
) -> Result<CommandAnalysis, String> {
    let sandbox = state.sandbox.read().await;
    let sandbox = sandbox.as_ref().ok_or("Sandbox not initialized")?;

    Ok(sandbox.analyze_command(&command))
}

#[tauri::command]
pub async fn execute_sandboxed_command(
    command: String,
    state: State<'_, CodeIntelligenceState>,
) -> Result<CommandResult, String> {
    let sandbox = state.sandbox.read().await;
    let sandbox = sandbox.as_ref().ok_or("Sandbox not initialized")?;

    sandbox.execute_command(&command).await
}

#[tauri::command]
pub async fn set_sandbox_mode(
    mode: String,
    state: State<'_, CodeIntelligenceState>,
) -> Result<(), String> {
    let mut sandbox = state.sandbox.write().await;
    let sandbox = sandbox.as_mut().ok_or("Sandbox not initialized")?;

    let sandbox_mode = match mode.to_lowercase().as_str() {
        "preview" => SandboxMode::Preview,
        "confirm" => SandboxMode::Confirm,
        "auto" => SandboxMode::Auto,
        "disabled" => SandboxMode::Disabled,
        _ => return Err(format!("Unknown sandbox mode: {}", mode)),
    };

    sandbox.set_mode(sandbox_mode);
    Ok(())
}

#[tauri::command]
pub async fn rollback_last_operation(
    state: State<'_, CodeIntelligenceState>,
) -> Result<String, String> {
    let sandbox = state.sandbox.read().await;
    let sandbox = sandbox.as_ref().ok_or("Sandbox not initialized")?;

    sandbox.rollback_last()
}

// ============================================================================
// Prompt Engineering
// ============================================================================

#[tauri::command]
pub async fn build_prompt(
    prompt_type: String,
    variables: HashMap<String, String>,
    context: Option<String>,
    state: State<'_, CodeIntelligenceState>,
) -> Result<BuiltPrompt, String> {
    let ptype = match prompt_type.to_lowercase().as_str() {
        "generate" | "code_generation" => PromptType::CodeGeneration,
        "refactor" | "code_refactor" => PromptType::CodeRefactor,
        "review" | "code_review" => PromptType::CodeReview,
        "fix" | "bug_fix" => PromptType::BugFix,
        "explain" | "explanation" => PromptType::Explanation,
        "test" | "test_generation" => PromptType::TestGeneration,
        "document" | "documentation" => PromptType::Documentation,
        _ => PromptType::CodeGeneration,
    };

    Ok(state.prompt_engineer.build_prompt(ptype, &variables, context.as_deref()))
}

#[tauri::command]
pub async fn get_anti_hallucination_prompt(
    state: State<'_, CodeIntelligenceState>,
) -> Result<String, String> {
    Ok(state.prompt_engineer.anti_hallucination_prompt())
}

// ============================================================================
// Code Graph Queries
// ============================================================================

#[tauri::command]
pub async fn get_symbol_context(
    symbol_name: String,
    state: State<'_, CodeIntelligenceState>,
) -> Result<Option<SymbolContext>, String> {
    let engine = state.context_engine.read().await;
    let engine = engine.as_ref().ok_or("Context engine not initialized")?;

    Ok(engine.get_symbol_context(&symbol_name))
}

#[tauri::command]
pub async fn search_codebase(
    query: String,
    limit: Option<usize>,
    state: State<'_, CodeIntelligenceState>,
) -> Result<Vec<String>, String> {
    let engine = state.context_engine.read().await;
    let engine = engine.as_ref().ok_or("Context engine not initialized")?;

    let results = engine.search(&query, limit.unwrap_or(10)).await;

    Ok(results.symbols.iter().map(|s| s.name.clone()).collect())
}

// ============================================================================
// Git History / Context Lineage
// ============================================================================

#[tauri::command]
pub async fn search_git_history(
    query: String,
    limit: Option<usize>,
    state: State<'_, CodeIntelligenceState>,
) -> Result<Vec<String>, String> {
    let engine = state.context_engine.read().await;
    let engine = engine.as_ref().ok_or("Context engine not initialized")?;

    let results = engine.search_history(&query, limit.unwrap_or(10));

    Ok(results.iter().map(|c| format!("{}: {}",
        c.summary.commit_hash.get(..7).unwrap_or(&c.summary.commit_hash),
        c.summary.summary
    )).collect())
}

#[tauri::command]
pub async fn explain_code_change(
    file_path: String,
    state: State<'_, CodeIntelligenceState>,
) -> Result<String, String> {
    let engine = state.context_engine.read().await;
    let engine = engine.as_ref().ok_or("Context engine not initialized")?;

    engine.explain_file_history(&PathBuf::from(file_path))
}

// ============================================================================
// Meta-Agent / External Agents
// ============================================================================

#[derive(Debug, Serialize, Deserialize)]
pub struct AgentInfo {
    pub name: String,
    pub agent_type: String,
    pub available: bool,
}

#[tauri::command]
pub async fn detect_external_agents(
    state: State<'_, CodeIntelligenceState>,
) -> Result<Vec<AgentInfo>, String> {
    let meta_agent = state.meta_agent.read().await;
    let meta_agent = meta_agent.as_ref().ok_or("Meta agent not initialized")?;

    let agents = meta_agent.detect_agents().await;
    Ok(agents.iter().map(|a| AgentInfo {
        name: format!("{:?}", a),
        agent_type: format!("{:?}", a),
        available: true,
    }).collect())
}

#[tauri::command]
pub async fn execute_with_strategy(
    task_description: String,
    strategy: String,
    state: State<'_, CodeIntelligenceState>,
) -> Result<String, String> {
    let meta_agent = state.meta_agent.read().await;
    let meta_agent = meta_agent.as_ref().ok_or("Meta agent not initialized")?;

    let collab_strategy = match strategy.to_lowercase().as_str() {
        "single" => CollaborationStrategy::Single(ExternalAgentType::ClaudeCode),
        "fallback" => CollaborationStrategy::Fallback(vec![
            ExternalAgentType::ClaudeCode,
            ExternalAgentType::GeminiCLI,
            ExternalAgentType::Aider,
        ]),
        "competitive" => CollaborationStrategy::Competitive(vec![
            ExternalAgentType::ClaudeCode,
            ExternalAgentType::GeminiCLI,
        ]),
        "auto" => CollaborationStrategy::Auto,
        _ => CollaborationStrategy::Auto,
    };

    let project_root = state.project_root.read().await;
    let task = meta_agent.create_task(TaskType::Generate, &task_description, project_root.clone());
    let result = meta_agent.execute_task(task, Some(collab_strategy)).await
        .map_err(|e| format!("Execution failed: {}", e))?;

    if result.success {
        Ok(result.output)
    } else {
        Err(result.error.unwrap_or_else(|| "Unknown error".to_string()))
    }
}

// Voice-to-Code Pipeline commands moved to coding_agent.rs (Phase 1.3)
