// Integration Tests for VoiceCode Code Intelligence
// Tests against real codebase patterns



#[cfg(test)]
mod voice_grammar_tests {

    fn create_parser() -> voicecode_desktop::code_intelligence::VoiceGrammarParser {
        voicecode_desktop::code_intelligence::VoiceGrammarParser::new()
    }

    #[test]
    fn test_create_function_command() {
        let parser = create_parser();
        let cmd = parser.parse("create a function called validateEmail");
        
        assert!(matches!(cmd.action, voicecode_desktop::code_intelligence::VoiceAction::Create));
        assert!(cmd.target.is_some());
        let target = cmd.target.unwrap();
        assert_eq!(target.name, Some("validateEmail".to_string()));
    }

    #[test]
    fn test_async_function_command() {
        let parser = create_parser();
        let cmd = parser.parse("create an async function called fetchUsers that returns a Promise");
        
        assert!(cmd.parameters.async_flag);
        assert!(cmd.parameters.return_type.is_some());
    }

    #[test]
    fn test_refactor_command() {
        let parser = create_parser();
        let cmd = parser.parse("refactor this function to use async await");
        
        assert!(matches!(cmd.action, voicecode_desktop::code_intelligence::VoiceAction::Refactor));
    }

    #[test]
    fn test_navigation_command() {
        let parser = create_parser();
        let cmd = parser.parse("go to line 42");
        
        assert!(matches!(cmd.action, voicecode_desktop::code_intelligence::VoiceAction::Navigate));
    }

    #[test]
    fn test_git_commands() {
        let parser = create_parser();
        
        let commit = parser.parse("commit with message fixed the bug");
        assert!(matches!(commit.action, voicecode_desktop::code_intelligence::VoiceAction::Commit));

        let push = parser.parse("push to origin main");
        assert!(matches!(push.action, voicecode_desktop::code_intelligence::VoiceAction::Push));
    }

    #[test]
    fn test_confidence_scoring() {
        let parser = create_parser();
        
        let clear_cmd = parser.parse("create function validateEmail");
        let ambiguous_cmd = parser.parse("do something");
        
        assert!(clear_cmd.confidence > ambiguous_cmd.confidence);
    }
}

#[cfg(test)]
mod naming_convention_tests {
    use voicecode_desktop::code_intelligence::tribal_knowledge::NamingStyle;

    #[test]
    fn test_camel_case_detection() {
        assert_eq!(NamingStyle::detect("camelCase"), NamingStyle::CamelCase);
        assert_eq!(NamingStyle::detect("myVariableName"), NamingStyle::CamelCase);
    }

    #[test]
    fn test_pascal_case_detection() {
        assert_eq!(NamingStyle::detect("PascalCase"), NamingStyle::PascalCase);
        assert_eq!(NamingStyle::detect("MyClassName"), NamingStyle::PascalCase);
    }

    #[test]
    fn test_snake_case_detection() {
        assert_eq!(NamingStyle::detect("snake_case"), NamingStyle::SnakeCase);
        assert_eq!(NamingStyle::detect("my_variable_name"), NamingStyle::SnakeCase);
    }

    #[test]
    fn test_screaming_snake_detection() {
        assert_eq!(NamingStyle::detect("SCREAMING_SNAKE"), NamingStyle::ScreamingSnake);
        assert_eq!(NamingStyle::detect("MAX_VALUE"), NamingStyle::ScreamingSnake);
    }
}

#[cfg(test)]
mod dynamic_budget_tests {
    use voicecode_desktop::code_intelligence::{DynamicBudgetManager, ContextCategory};
    use std::collections::HashMap;

    #[test]
    fn test_budget_manager_creation() {
        let manager = DynamicBudgetManager::new(128_000);
        assert!(manager.available() > 0);
    }

    #[test]
    fn test_model_specific_limits() {
        let claude = DynamicBudgetManager::for_model("claude-3-sonnet");
        let gpt4 = DynamicBudgetManager::for_model("gpt-4");
        
        // Claude has larger context
        assert!(claude.available() > gpt4.available());
    }

    #[test]
    fn test_budget_calculation() {
        let manager = DynamicBudgetManager::new(100_000);
        let mut sizes = HashMap::new();
        sizes.insert(ContextCategory::CodeContext, 5000);
        sizes.insert(ContextCategory::ProjectMemory, 1000);
        
        let plan = manager.calculate_budget(&sizes);
        assert!(plan.allocations.contains_key(&ContextCategory::CodeContext));
    }
}

#[cfg(test)]
mod sandbox_tests {
    use voicecode_desktop::code_intelligence::{SandboxManager, SandboxConfig};
    use std::path::PathBuf;

    fn create_sandbox() -> SandboxManager {
        SandboxManager::new(PathBuf::from("."), SandboxConfig::default())
    }

    #[test]
    fn test_safe_command_analysis() {
        let sandbox = create_sandbox();
        let analysis = sandbox.analyze_command("ls -la");
        
        assert!(!analysis.blocked);
        assert!(analysis.side_effects.is_empty());
    }

    #[test]
    fn test_dangerous_command_blocked() {
        let sandbox = create_sandbox();
        let analysis = sandbox.analyze_command("rm -rf /");
        
        assert!(analysis.blocked);
        assert!(analysis.block_reason.is_some());
    }

    #[test]
    fn test_side_effect_detection() {
        let sandbox = create_sandbox();
        
        let rm_analysis = sandbox.analyze_command("rm file.txt");
        assert!(rm_analysis.side_effects.iter().any(|s| s.contains("Delete")));

        let git_analysis = sandbox.analyze_command("git push origin main");
        assert!(git_analysis.side_effects.iter().any(|s| s.contains("Push")));
    }

    #[test]
    fn test_install_command_detection() {
        let sandbox = create_sandbox();
        let analysis = sandbox.analyze_command("npm install lodash");
        
        assert!(analysis.side_effects.iter().any(|s| s.contains("Install")));
    }
}

#[cfg(test)]
mod prompt_engineering_tests {
    use voicecode_desktop::code_intelligence::{PromptEngineer, PromptType};
    use std::collections::HashMap;

    #[test]
    fn test_prompt_building() {
        let engineer = PromptEngineer::new();
        let mut vars = HashMap::new();
        vars.insert("task".to_string(), "create a validation function".to_string());
        
        let prompt = engineer.build_prompt(PromptType::CodeGeneration, &vars, None);
        
        assert!(!prompt.system.is_empty());
        assert!(!prompt.user.is_empty());
    }

    #[test]
    fn test_anti_hallucination_prompt() {
        let engineer = PromptEngineer::new();
        let prompt = engineer.anti_hallucination_prompt();
        
        assert!(prompt.contains("NEVER") || prompt.contains("invent"));
    }

    #[test]
    fn test_citation_prompt() {
        let engineer = PromptEngineer::new();
        let symbols = vec!["validateEmail".to_string(), "UserService".to_string()];
        let prompt = engineer.citation_prompt(&symbols);
        
        assert!(prompt.contains("validateEmail"));
        assert!(prompt.contains("UserService"));
    }
}

#[cfg(test)]
mod multi_repo_tests {
    use voicecode_desktop::code_intelligence::MultiRepoManager;

    #[test]
    fn test_multi_repo_creation() {
        let manager = MultiRepoManager::new();
        assert!(manager.get_repos().is_empty());
    }
}

#[cfg(test)]
mod voice_streaming_tests {
    use voicecode_desktop::code_intelligence::{VoiceStreamManager, StreamConfig};
    use voicecode_desktop::code_intelligence::voice_streaming::CancellationToken;

    #[test]
    fn test_stream_manager_creation() {
        let manager = VoiceStreamManager::new(StreamConfig::default());
        assert!(!manager.is_listening());
        assert!(!manager.is_processing());
    }

    #[test]
    fn test_cancellation_token() {
        let token = CancellationToken::new();
        assert!(!token.is_cancelled());
        
        token.cancel();
        assert!(token.is_cancelled());
        assert!(token.check().is_err());
    }

    #[tokio::test]
    async fn test_start_stop_listening() {
        let manager = VoiceStreamManager::new(StreamConfig::default());
        
        let session_id = manager.start_listening().await.unwrap();
        assert!(manager.is_listening());
        
        let result = manager.stop_listening().await.unwrap();
        assert!(!manager.is_listening());
        assert_eq!(result.session_id, session_id);
    }

    #[test]
    fn test_interrupt_keywords() {
        let config = StreamConfig::default();
        assert!(config.interrupt_keywords.contains(&"stop".to_string()));
        assert!(config.interrupt_keywords.contains(&"cancel".to_string()));
    }
}

#[cfg(test)]
mod recitation_tests {
    use voicecode_desktop::code_intelligence::{RecitationValidator, ASTEngine, SymbolTable};
    use std::sync::Arc;

    fn create_validator() -> RecitationValidator {
        RecitationValidator::new(
            Arc::new(SymbolTable::new()),
            Arc::new(ASTEngine::new()),
        )
    }

    #[test]
    fn test_builtin_recognition() {
        let validator = create_validator();
        
        // These should be recognized as builtins
        let response = "console.log('hello')";
        let result = validator.validate_response(response, None);
        
        // Console.log is a builtin, should not be flagged
        assert!(result.hallucinations.iter()
            .all(|h| h.invented_name != "console" && h.invented_name != "log"));
    }

    #[test]
    fn test_citation_prompt_generation() {
        let validator = create_validator();
        let symbols = vec!["myFunction".to_string()];
        let prompt = validator.generate_citation_prompt(&symbols);
        
        assert!(prompt.contains("myFunction"));
        assert!(prompt.contains("CITE") || prompt.contains("cite"));
    }
}

#[cfg(test)]
mod end_to_end_tests {
    use std::path::PathBuf;

    #[tokio::test]
    async fn test_voice_to_context_flow() {
        // Parse voice command
        let parser = voicecode_desktop::code_intelligence::VoiceGrammarParser::new();
        let command = parser.parse("create a function to validate email addresses");

        // Verify parsing
        assert!(matches!(command.action, voicecode_desktop::code_intelligence::VoiceAction::Create));

        // Build prompt
        let engineer = voicecode_desktop::code_intelligence::PromptEngineer::new();
        let mut vars = std::collections::HashMap::new();
        vars.insert("task".to_string(), command.raw_input.clone());

        let prompt = engineer.build_prompt(
            voicecode_desktop::code_intelligence::PromptType::CodeGeneration,
            &vars,
            None,
        );

        // Verify prompt was built
        assert!(!prompt.system.is_empty());
        assert!(prompt.user.contains("validate") || prompt.user.contains("email"));
    }

    #[tokio::test]
    async fn test_sandbox_before_execution() {
        let sandbox = voicecode_desktop::code_intelligence::SandboxManager::new(
            PathBuf::from("."),
            voicecode_desktop::code_intelligence::SandboxConfig::default(),
        );

        // Analyze command before execution
        let analysis = sandbox.analyze_command("npm test");

        // Should be allowed but detected as having side effects potentially
        assert!(!analysis.blocked);
    }
}

// Note: voice_to_code_integration tests are located in src/coding_agent.rs
// as lib tests (runs via `cargo test --release --lib`) to avoid the Windows
// DLL entrypoint issue that affects separate test binaries.
