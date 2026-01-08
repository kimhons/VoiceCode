// VoiceCode CLI Binary
// Command-line interface for AI-powered coding assistance
// Similar to Claude Code, with multi-agent collaboration support

use clap::{Parser, Subcommand, Args};
use std::path::PathBuf;
use colored::Colorize;

// Import from the main library
use voicecode_desktop::cli::{
    self, ReplConfig, BatchMode, AgentRegistry, AgentOrchestrator,
    OrchestratorConfig, ExternalAgentFactory,
};

#[derive(Parser)]
#[command(name = "voicecode")]
#[command(author = "VoiceCode Team")]
#[command(version)]
#[command(about = "AI-powered voice & text coding assistant", long_about = None)]
#[command(propagate_version = true)]
struct Cli {
    /// Working directory
    #[arg(short = 'C', long, global = true)]
    cwd: Option<PathBuf>,

    /// Enable verbose output
    #[arg(short, long, global = true)]
    verbose: bool,

    /// Use JSON output format
    #[arg(long, global = true)]
    json: bool,

    /// Configuration file path
    #[arg(long, global = true)]
    config: Option<PathBuf>,

    #[command(subcommand)]
    command: Option<Commands>,
}

#[derive(Subcommand)]
enum Commands {
    /// Start interactive REPL session (default)
    #[command(alias = "i")]
    Interactive(InteractiveArgs),

    /// Execute a single prompt
    #[command(alias = "p")]
    Prompt(PromptArgs),

    /// Execute commands from a script file
    #[command(alias = "s")]
    Script(ScriptArgs),

    /// Generate code from description
    #[command(alias = "g")]
    Generate(GenerateArgs),

    /// Review code in a file
    #[command(alias = "r")]
    Review(ReviewArgs),

    /// Fix bugs in code
    #[command(alias = "f")]
    Fix(FixArgs),

    /// Refactor code
    Refactor(RefactorArgs),

    /// Generate tests
    #[command(alias = "t")]
    Test(TestArgs),

    /// Explain code
    #[command(alias = "e")]
    Explain(ExplainArgs),

    /// Search codebase
    Search(SearchArgs),

    /// List available agents
    Agents(AgentsArgs),

    /// Discover external agents
    Discover,

    /// Show version and system info
    Info,

    /// Initialize VoiceCode in current directory
    Init,
}

#[derive(Args)]
struct InteractiveArgs {
    /// Initial prompt to execute
    #[arg(short, long)]
    prompt: Option<String>,

    /// Don't show banner
    #[arg(long)]
    no_banner: bool,
}

#[derive(Args)]
struct PromptArgs {
    /// The prompt to execute
    prompt: String,

    /// Output to file instead of stdout
    #[arg(short, long)]
    output: Option<PathBuf>,

    /// Print output only (no formatting)
    #[arg(long)]
    print: bool,

    /// Stream output as it's generated
    #[arg(short, long)]
    stream: bool,

    /// Select specific agent
    #[arg(long)]
    agent: Option<String>,
}

#[derive(Args)]
struct ScriptArgs {
    /// Script file path
    file: PathBuf,

    /// Continue on errors
    #[arg(long)]
    continue_on_error: bool,
}

#[derive(Args)]
struct GenerateArgs {
    /// Description of code to generate
    description: String,

    /// Target programming language
    #[arg(short, long)]
    language: Option<String>,

    /// Output file path
    #[arg(short, long)]
    output: Option<PathBuf>,

    /// Template to use
    #[arg(short, long)]
    template: Option<String>,
}

#[derive(Args)]
struct ReviewArgs {
    /// File(s) to review
    files: Vec<PathBuf>,

    /// Focus areas (security, performance, style, etc.)
    #[arg(short, long)]
    focus: Vec<String>,

    /// Severity level (low, medium, high, critical)
    #[arg(long)]
    severity: Option<String>,
}

#[derive(Args)]
struct FixArgs {
    /// File to fix
    file: Option<PathBuf>,

    /// Error message to fix
    #[arg(short, long)]
    error: Option<String>,

    /// Apply fixes automatically
    #[arg(long)]
    apply: bool,
}

#[derive(Args)]
struct RefactorArgs {
    /// File(s) to refactor
    files: Vec<PathBuf>,

    /// Refactor type (rename, extract, inline, etc.)
    #[arg(short = 't', long)]
    refactor_type: String,

    /// Target (e.g., function name for rename)
    #[arg(long)]
    target: Option<String>,

    /// New name (for rename operations)
    #[arg(long)]
    name: Option<String>,
}

#[derive(Args)]
struct TestArgs {
    /// File(s) to generate tests for
    files: Vec<PathBuf>,

    /// Test type (unit, integration, e2e)
    #[arg(short = 't', long, default_value = "unit")]
    test_type: String,

    /// Coverage target percentage
    #[arg(short, long, default_value = "80")]
    coverage: u32,

    /// Test framework to use
    #[arg(long)]
    framework: Option<String>,
}

#[derive(Args)]
struct ExplainArgs {
    /// File to explain
    file: PathBuf,

    /// Detail level (brief, normal, detailed)
    #[arg(short, long, default_value = "normal")]
    detail: String,

    /// Specific function/class to explain
    #[arg(long)]
    target: Option<String>,
}

#[derive(Args)]
struct SearchArgs {
    /// Search query
    query: String,

    /// Search scope (project, directory, file)
    #[arg(short, long, default_value = "project")]
    scope: String,

    /// File pattern to search
    #[arg(short, long)]
    pattern: Option<String>,

    /// Maximum results
    #[arg(short, long, default_value = "10")]
    max_results: usize,
}

#[derive(Args)]
struct AgentsArgs {
    /// Show only available agents
    #[arg(long)]
    available: bool,

    /// Show detailed info
    #[arg(short, long)]
    detailed: bool,
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    // Initialize logging
    tracing_subscriber::fmt()
        .with_env_filter(
            tracing_subscriber::EnvFilter::from_default_env()
                .add_directive(tracing::Level::INFO.into()),
        )
        .init();

    let cli = Cli::parse();

    // Change to specified working directory
    if let Some(ref cwd) = cli.cwd {
        std::env::set_current_dir(cwd)?;
    }

    // Execute command
    let result = match cli.command {
        None | Some(Commands::Interactive(_)) => {
            run_interactive(cli).await
        }
        Some(Commands::Prompt(args)) => {
            run_prompt(args, &cli).await
        }
        Some(Commands::Script(args)) => {
            run_script(args, &cli).await
        }
        Some(Commands::Generate(args)) => {
            run_generate(args, &cli).await
        }
        Some(Commands::Review(args)) => {
            run_review(args, &cli).await
        }
        Some(Commands::Fix(args)) => {
            run_fix(args, &cli).await
        }
        Some(Commands::Refactor(args)) => {
            run_refactor(args, &cli).await
        }
        Some(Commands::Test(args)) => {
            run_test(args, &cli).await
        }
        Some(Commands::Explain(args)) => {
            run_explain(args, &cli).await
        }
        Some(Commands::Search(args)) => {
            run_search(args, &cli).await
        }
        Some(Commands::Agents(args)) => {
            run_agents(args, &cli).await
        }
        Some(Commands::Discover) => {
            run_discover(&cli).await
        }
        Some(Commands::Info) => {
            run_info(&cli).await
        }
        Some(Commands::Init) => {
            run_init(&cli).await
        }
    };

    match result {
        Ok(_) => Ok(()),
        Err(e) => {
            if cli.json {
                println!(r#"{{"error": "{}"}}"#, e);
            } else {
                eprintln!("{} {}", "Error:".red().bold(), e);
            }
            std::process::exit(1);
        }
    }
}

async fn run_interactive(cli: Cli) -> Result<(), String> {
    let (registry, orchestrator) = cli::init_cli();

    let mut config = ReplConfig::default();

    if let Some(cwd) = cli.cwd {
        config.working_dir = cwd;
    }

    let mut session = cli::ReplSession::new(config, registry, orchestrator);
    session.run().await
}

async fn run_prompt(args: PromptArgs, cli: &Cli) -> Result<(), String> {
    let (registry, orchestrator) = cli::init_cli();
    let mut batch = BatchMode::new(registry, orchestrator);

    let result = batch.execute(&args.prompt).await?;

    if cli.json {
        println!("{}", serde_json::to_string_pretty(&result).unwrap_or_default());
    } else if args.print {
        println!("{}", result.output);
    } else {
        if result.success {
            println!("{}", result.output);
        } else {
            if let Some(error) = result.error {
                eprintln!("{}", error);
            }
        }
    }

    if let Some(output_path) = args.output {
        std::fs::write(&output_path, &result.output)
            .map_err(|e| format!("Failed to write output: {}", e))?;
        println!("{} {}", "Output written to:".green(), output_path.display());
    }

    Ok(())
}

async fn run_script(args: ScriptArgs, cli: &Cli) -> Result<(), String> {
    let (registry, orchestrator) = cli::init_cli();
    let mut batch = BatchMode::new(registry, orchestrator);

    let path = args.file.to_string_lossy().to_string();
    let results = batch.execute_file(&path).await?;

    for (i, result) in results.iter().enumerate() {
        if cli.json {
            println!("{}", serde_json::to_string(&result).unwrap_or_default());
        } else {
            println!("{} {}", format!("[{}]", i + 1).cyan(), result.output);
        }

        if !result.success && !args.continue_on_error {
            return Err(result.error.clone().unwrap_or("Script failed".to_string()));
        }
    }

    Ok(())
}

async fn run_generate(args: GenerateArgs, _cli: &Cli) -> Result<(), String> {
    let prompt = format!(
        "Generate {} code: {}",
        args.language.as_deref().unwrap_or(""),
        args.description
    );

    let result = cli::execute_command(&prompt).await?;

    if let Some(output_path) = args.output {
        std::fs::write(&output_path, &result.output)
            .map_err(|e| format!("Failed to write: {}", e))?;
        println!("{} {}", "Created:".green(), output_path.display());
    } else {
        println!("{}", result.output);
    }

    Ok(())
}

async fn run_review(args: ReviewArgs, cli: &Cli) -> Result<(), String> {
    for file in args.files {
        let focus = if args.focus.is_empty() {
            String::new()
        } else {
            format!(" focusing on {}", args.focus.join(", "))
        };

        let prompt = format!("Review the code in {}{}", file.display(), focus);
        let result = cli::execute_command(&prompt).await?;

        if cli.json {
            println!("{}", serde_json::to_string(&result).unwrap_or_default());
        } else {
            println!("{} {}\n{}", "Review of".cyan(), file.display(), result.output);
        }
    }

    Ok(())
}

async fn run_fix(args: FixArgs, cli: &Cli) -> Result<(), String> {
    let file_str = args.file
        .map(|f| f.display().to_string())
        .unwrap_or_else(|| "current file".to_string());

    let prompt = if let Some(error) = args.error {
        format!("Fix the error '{}' in {}", error, file_str)
    } else {
        format!("Fix bugs in {}", file_str)
    };

    let result = cli::execute_command(&prompt).await?;

    if cli.json {
        println!("{}", serde_json::to_string(&result).unwrap_or_default());
    } else {
        println!("{}", result.output);

        for change in &result.changes {
            println!("\n{} {}", "Would modify:".yellow(), change.file_path);
            if args.apply {
                println!("{} Applied", "✓".green());
            }
        }
    }

    Ok(())
}

async fn run_refactor(args: RefactorArgs, cli: &Cli) -> Result<(), String> {
    for file in args.files {
        let prompt = format!(
            "Refactor {} in {} - type: {}{}{}",
            args.target.as_deref().unwrap_or("code"),
            file.display(),
            args.refactor_type,
            args.target.as_ref().map(|t| format!(", target: {}", t)).unwrap_or_default(),
            args.name.as_ref().map(|n| format!(", new name: {}", n)).unwrap_or_default()
        );

        let result = cli::execute_command(&prompt).await?;

        if cli.json {
            println!("{}", serde_json::to_string(&result).unwrap_or_default());
        } else {
            println!("{} {}\n{}", "Refactoring".cyan(), file.display(), result.output);
        }
    }

    Ok(())
}

async fn run_test(args: TestArgs, cli: &Cli) -> Result<(), String> {
    for file in args.files {
        let prompt = format!(
            "Generate {} tests for {} with {}% coverage{}",
            args.test_type,
            file.display(),
            args.coverage,
            args.framework.as_ref().map(|f| format!(" using {}", f)).unwrap_or_default()
        );

        let result = cli::execute_command(&prompt).await?;

        if cli.json {
            println!("{}", serde_json::to_string(&result).unwrap_or_default());
        } else {
            println!("{} {}\n{}", "Tests for".cyan(), file.display(), result.output);
        }
    }

    Ok(())
}

async fn run_explain(args: ExplainArgs, cli: &Cli) -> Result<(), String> {
    let prompt = format!(
        "Explain the code in {} with {} detail{}",
        args.file.display(),
        args.detail,
        args.target.as_ref().map(|t| format!(", specifically {}", t)).unwrap_or_default()
    );

    let result = cli::execute_command(&prompt).await?;

    if cli.json {
        println!("{}", serde_json::to_string(&result).unwrap_or_default());
    } else {
        println!("{}", result.output);
    }

    Ok(())
}

async fn run_search(args: SearchArgs, cli: &Cli) -> Result<(), String> {
    let prompt = format!(
        "Search for '{}' in {} scope{}",
        args.query,
        args.scope,
        args.pattern.as_ref().map(|p| format!(", pattern: {}", p)).unwrap_or_default()
    );

    let result = cli::execute_command(&prompt).await?;

    if cli.json {
        println!("{}", serde_json::to_string(&result).unwrap_or_default());
    } else {
        println!("{}", result.output);
    }

    Ok(())
}

async fn run_agents(args: AgentsArgs, cli: &Cli) -> Result<(), String> {
    let registry = std::sync::Arc::new(AgentRegistry::with_voicecode_agent());
    let agents = if args.available {
        registry.list_available().await
    } else {
        registry.list().await
    };

    if cli.json {
        println!("{}", serde_json::to_string(&agents).unwrap_or_default());
    } else {
        println!("{}", "Available Agents:".cyan().bold());
        println!();

        for agent in agents {
            let status_icon = match agent.status {
                cli::AgentStatus::Available => "●".green(),
                cli::AgentStatus::Busy => "●".yellow(),
                cli::AgentStatus::Offline => "○".dimmed(),
                cli::AgentStatus::Error => "●".red(),
                cli::AgentStatus::Connecting => "◐".yellow(),
            };

            println!("{} {} [{}]", status_icon, agent.name.bold(), agent.id.dimmed());

            if args.detailed {
                println!("   Type: {:?}", agent.agent_type);
                println!("   Priority: {}", agent.priority);
                println!("   Capabilities: {:?}", agent.capabilities.len());
                if let Some(endpoint) = agent.endpoint {
                    println!("   Endpoint: {}", endpoint);
                }
                println!();
            }
        }
    }

    Ok(())
}

async fn run_discover(cli: &Cli) -> Result<(), String> {
    let registry = std::sync::Arc::new(AgentRegistry::with_voicecode_agent());
    let discovered = registry.discover().await;

    // Also check for CLI tools
    let available_cli = ExternalAgentFactory::detect_available().await;

    if cli.json {
        let output = serde_json::json!({
            "discovered_agents": discovered,
            "available_cli_tools": available_cli
        });
        println!("{}", serde_json::to_string_pretty(&output).unwrap_or_default());
    } else {
        println!("{}", "Agent Discovery Results".cyan().bold());
        println!();

        if discovered.is_empty() {
            println!("No network agents discovered.");
        } else {
            println!("Network Agents:");
            for agent in &discovered {
                println!("  {} - {}", "●".green(), agent.name);
            }
        }

        println!();
        println!("Available CLI Tools:");
        for tool in &available_cli {
            println!("  {} - {:?}", "●".green(), tool);
        }

        if available_cli.is_empty() {
            println!("  {}", "No external CLI agents found".dimmed());
            println!();
            println!("Install agents like:");
            println!("  - Claude Code: npm install -g @anthropic-ai/claude-code");
            println!("  - Aider: pip install aider-chat");
        }
    }

    Ok(())
}

async fn run_info(cli: &Cli) -> Result<(), String> {
    let info = serde_json::json!({
        "version": env!("CARGO_PKG_VERSION"),
        "name": "VoiceCode CLI",
        "rust_version": env!("CARGO_PKG_RUST_VERSION"),
        "os": std::env::consts::OS,
        "arch": std::env::consts::ARCH,
        "working_dir": std::env::current_dir().ok(),
    });

    if cli.json {
        println!("{}", serde_json::to_string_pretty(&info).unwrap_or_default());
    } else {
        println!("{}", "VoiceCode CLI".cyan().bold());
        println!("Version: {}", env!("CARGO_PKG_VERSION"));
        println!("OS: {} ({})", std::env::consts::OS, std::env::consts::ARCH);
        println!("Working Directory: {}", std::env::current_dir()
            .map(|p| p.display().to_string())
            .unwrap_or_else(|_| "unknown".to_string()));
    }

    Ok(())
}

async fn run_init(_cli: &Cli) -> Result<(), String> {
    let config_dir = PathBuf::from(".voicecode");

    if config_dir.exists() {
        return Err("VoiceCode already initialized in this directory".to_string());
    }

    std::fs::create_dir_all(&config_dir)
        .map_err(|e| format!("Failed to create config directory: {}", e))?;

    let config_file = config_dir.join("config.toml");
    let default_config = r#"# VoiceCode Configuration

[general]
# Default orchestration strategy: single, race, consensus, pipeline, decompose
strategy = "single"

[agents]
# Prefer local agents over remote
prefer_local = true
# Auto-discover external agents
auto_discover = true

[llm]
# Default LLM provider: anthropic, openai, local
provider = "anthropic"
# Model to use
model = "claude-sonnet-4-20250514"

[voice]
# Enable voice input
enabled = false
# Wake word
wake_word = "hey code"
"#;

    std::fs::write(&config_file, default_config)
        .map_err(|e| format!("Failed to write config: {}", e))?;

    println!("{} VoiceCode initialized!", "✓".green());
    println!("Configuration file created at: {}", config_file.display());
    println!();
    println!("Run {} to start coding!", "voicecode".cyan());

    Ok(())
}
