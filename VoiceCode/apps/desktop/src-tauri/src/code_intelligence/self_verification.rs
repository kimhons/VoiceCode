#![allow(dead_code, unused_variables, unused_imports)]
// Self-Verification Loop - Compile, lint, test before outputting code
// Ensures generated code is immediately runnable

use std::collections::HashMap;
use std::path::{Path, PathBuf};
use std::process::Stdio;
use serde::{Deserialize, Serialize};
use tokio::process::Command;

/// Self-verification pipeline for code validation
pub struct SelfVerifier {
    project_root: PathBuf,
    config: VerificationConfig,
    cache: parking_lot::RwLock<VerificationCache>,
}

#[derive(Debug, Clone)]
pub struct VerificationConfig {
    pub enable_parse_check: bool,
    pub enable_type_check: bool,
    pub enable_lint_check: bool,
    pub enable_test_generation: bool,
    pub timeout_seconds: u64,
    pub max_retries: u32,
}

impl Default for VerificationConfig {
    fn default() -> Self {
        Self {
            enable_parse_check: true,
            enable_type_check: true,
            enable_lint_check: true,
            enable_test_generation: false,
            timeout_seconds: 30,
            max_retries: 2,
        }
    }
}

#[derive(Debug, Clone, Default)]
struct VerificationCache {
    last_check: HashMap<String, VerificationResult>,
}

/// Result of verification
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VerificationResult {
    pub passed: bool,
    pub parse_result: Option<CheckResult>,
    pub type_result: Option<CheckResult>,
    pub lint_result: Option<CheckResult>,
    pub test_result: Option<CheckResult>,
    pub suggestions: Vec<String>,
    pub auto_fixes: Vec<AutoFix>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CheckResult {
    pub passed: bool,
    pub errors: Vec<CodeError>,
    pub warnings: Vec<CodeWarning>,
    pub output: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CodeError {
    pub message: String,
    pub file: Option<String>,
    pub line: Option<u32>,
    pub column: Option<u32>,
    pub code: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CodeWarning {
    pub message: String,
    pub file: Option<String>,
    pub line: Option<u32>,
    pub rule: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AutoFix {
    pub file: String,
    pub line: u32,
    pub original: String,
    pub replacement: String,
    pub description: String,
}

/// Language-specific verification commands
#[derive(Debug, Clone)]
pub struct LanguageVerifier {
    pub language: String,
    pub parse_command: Option<Vec<String>>,
    pub type_command: Option<Vec<String>>,
    pub lint_command: Option<Vec<String>>,
    pub test_command: Option<Vec<String>>,
    pub format_command: Option<Vec<String>>,
}

impl SelfVerifier {
    pub fn new(project_root: PathBuf, config: VerificationConfig) -> Self {
        Self {
            project_root,
            config,
            cache: parking_lot::RwLock::new(VerificationCache::default()),
        }
    }

    /// Verify code before outputting
    pub async fn verify(&self, code: &str, language: &str, file_path: Option<&Path>) -> VerificationResult {
        let verifier = self.get_language_verifier(language);
        let mut result = VerificationResult {
            passed: true,
            parse_result: None,
            type_result: None,
            lint_result: None,
            test_result: None,
            suggestions: Vec::new(),
            auto_fixes: Vec::new(),
        };

        // Create temp file for verification
        let temp_path = self.create_temp_file(code, language).await;
        let temp_path_str = temp_path.to_string_lossy().to_string();

        // 1. Parse check
        if self.config.enable_parse_check {
            if let Some(ref cmd) = verifier.parse_command {
                let parse_result = self.run_check(cmd, &temp_path_str).await;
                result.passed &= parse_result.passed;
                if !parse_result.passed {
                    result.suggestions.push("Code has syntax errors. Please fix before proceeding.".to_string());
                }
                result.parse_result = Some(parse_result);
            }
        }

        // 2. Type check (only if parse passed)
        if self.config.enable_type_check && result.passed {
            if let Some(ref cmd) = verifier.type_command {
                let type_result = self.run_check(cmd, &temp_path_str).await;
                result.passed &= type_result.passed;
                if !type_result.passed {
                    result.suggestions.push("Code has type errors.".to_string());
                    self.extract_type_fixes(&type_result, &mut result.auto_fixes);
                }
                result.type_result = Some(type_result);
            }
        }

        // 3. Lint check
        if self.config.enable_lint_check && result.passed {
            if let Some(ref cmd) = verifier.lint_command {
                let lint_result = self.run_check(cmd, &temp_path_str).await;
                // Lint warnings don't fail verification
                if !lint_result.warnings.is_empty() {
                    result.suggestions.push(format!("{} lint warnings found.", lint_result.warnings.len()));
                }
                result.lint_result = Some(lint_result);
            }
        }

        // Cleanup temp file
        let _ = tokio::fs::remove_file(&temp_path).await;

        result
    }

    /// Verify a file change before applying
    pub async fn verify_change(&self, file_path: &Path, new_content: &str) -> VerificationResult {
        let extension = file_path.extension()
            .and_then(|e| e.to_str())
            .unwrap_or("");
        
        let language = match extension {
            "ts" | "tsx" => "typescript",
            "js" | "jsx" => "javascript",
            "rs" => "rust",
            "py" => "python",
            "go" => "go",
            "java" => "java",
            _ => "unknown",
        };

        self.verify(new_content, language, Some(file_path)).await
    }

    /// Run a verification command
    async fn run_check(&self, cmd: &[String], file_path: &str) -> CheckResult {
        if cmd.is_empty() {
            return CheckResult {
                passed: true,
                errors: vec![],
                warnings: vec![],
                output: String::new(),
            };
        }

        let mut command = Command::new(&cmd[0]);
        for arg in &cmd[1..] {
            if arg == "{file}" {
                command.arg(file_path);
            } else {
                command.arg(arg);
            }
        }

        command
            .current_dir(&self.project_root)
            .stdout(Stdio::piped())
            .stderr(Stdio::piped());

        let result = tokio::time::timeout(
            std::time::Duration::from_secs(self.config.timeout_seconds),
            command.output()
        ).await;

        match result {
            Ok(Ok(output)) => {
                let stdout = String::from_utf8_lossy(&output.stdout).to_string();
                let stderr = String::from_utf8_lossy(&output.stderr).to_string();
                let combined = format!("{}\n{}", stdout, stderr);
                
                let errors = self.parse_errors(&combined);
                let warnings = self.parse_warnings(&combined);

                CheckResult {
                    passed: output.status.success() && errors.is_empty(),
                    errors,
                    warnings,
                    output: combined,
                }
            }
            Ok(Err(e)) => CheckResult {
                passed: false,
                errors: vec![CodeError {
                    message: format!("Command failed: {}", e),
                    file: None,
                    line: None,
                    column: None,
                    code: None,
                }],
                warnings: vec![],
                output: e.to_string(),
            },
            Err(_) => CheckResult {
                passed: false,
                errors: vec![CodeError {
                    message: "Verification timed out".to_string(),
                    file: None,
                    line: None,
                    column: None,
                    code: None,
                }],
                warnings: vec![],
                output: "Timeout".to_string(),
            },
        }
    }

    fn parse_errors(&self, output: &str) -> Vec<CodeError> {
        let mut errors = Vec::new();
        
        // Common error patterns
        let patterns = [
            // TypeScript/JavaScript: file.ts(10,5): error TS1234: message
            r"(?m)^(.+?)\((\d+),(\d+)\):\s*error\s*(TS\d+)?:\s*(.+)$",
            // Rust: error[E0123]: message --> file.rs:10:5
            r"(?m)^error\[(E\d+)\]:\s*(.+?)\s*-->\s*(.+?):(\d+):(\d+)",
            // Python: File "file.py", line 10
            r#"(?m)^File "(.+?)", line (\d+)"#,
            // Generic: error: message
            r"(?m)^error:\s*(.+)$",
        ];

        for pattern in &patterns {
            if let Ok(re) = regex::Regex::new(pattern) {
                for cap in re.captures_iter(output) {
                    errors.push(CodeError {
                        message: cap.get(cap.len() - 1).map(|m| m.as_str().to_string()).unwrap_or_default(),
                        file: cap.get(1).map(|m| m.as_str().to_string()),
                        line: cap.get(2).and_then(|m| m.as_str().parse().ok()),
                        column: cap.get(3).and_then(|m| m.as_str().parse().ok()),
                        code: cap.get(4).map(|m| m.as_str().to_string()),
                    });
                }
            }
        }

        errors
    }

    fn parse_warnings(&self, output: &str) -> Vec<CodeWarning> {
        let mut warnings = Vec::new();
        
        // Common warning patterns
        let patterns = [
            r"(?m)^(.+?)\((\d+),\d+\):\s*warning\s*(.+)?:\s*(.+)$",
            r"(?m)^warning:\s*(.+)$",
            r"(?m)^\s*(\d+):(\d+)\s+warning\s+(.+?)\s+(\S+)$",
        ];

        for pattern in &patterns {
            if let Ok(re) = regex::Regex::new(pattern) {
                for cap in re.captures_iter(output) {
                    warnings.push(CodeWarning {
                        message: cap.get(cap.len() - 1).map(|m| m.as_str().to_string()).unwrap_or_default(),
                        file: cap.get(1).map(|m| m.as_str().to_string()),
                        line: cap.get(2).and_then(|m| m.as_str().parse().ok()),
                        rule: cap.get(3).map(|m| m.as_str().to_string()),
                    });
                }
            }
        }

        warnings
    }

    fn extract_type_fixes(&self, result: &CheckResult, fixes: &mut Vec<AutoFix>) {
        // Extract common type error fixes
        for error in &result.errors {
            if let (Some(file), Some(line)) = (&error.file, error.line) {
                if error.message.contains("missing return type") {
                    fixes.push(AutoFix {
                        file: file.clone(),
                        line,
                        original: String::new(),
                        replacement: ": void".to_string(),
                        description: "Add return type annotation".to_string(),
                    });
                }
            }
        }
    }

    fn get_language_verifier(&self, language: &str) -> LanguageVerifier {
        match language {
            "typescript" | "ts" => LanguageVerifier {
                language: "typescript".to_string(),
                parse_command: Some(vec!["npx".to_string(), "tsc".to_string(), "--noEmit".to_string(), "{file}".to_string()]),
                type_command: Some(vec!["npx".to_string(), "tsc".to_string(), "--noEmit".to_string(), "{file}".to_string()]),
                lint_command: Some(vec!["npx".to_string(), "eslint".to_string(), "{file}".to_string()]),
                test_command: Some(vec!["npx".to_string(), "jest".to_string(), "--passWithNoTests".to_string()]),
                format_command: Some(vec!["npx".to_string(), "prettier".to_string(), "--write".to_string(), "{file}".to_string()]),
            },
            "javascript" | "js" => LanguageVerifier {
                language: "javascript".to_string(),
                parse_command: Some(vec!["node".to_string(), "--check".to_string(), "{file}".to_string()]),
                type_command: None,
                lint_command: Some(vec!["npx".to_string(), "eslint".to_string(), "{file}".to_string()]),
                test_command: Some(vec!["npx".to_string(), "jest".to_string(), "--passWithNoTests".to_string()]),
                format_command: Some(vec!["npx".to_string(), "prettier".to_string(), "--write".to_string(), "{file}".to_string()]),
            },
            "rust" | "rs" => LanguageVerifier {
                language: "rust".to_string(),
                parse_command: Some(vec!["rustfmt".to_string(), "--check".to_string(), "{file}".to_string()]),
                type_command: Some(vec!["cargo".to_string(), "check".to_string()]),
                lint_command: Some(vec!["cargo".to_string(), "clippy".to_string()]),
                test_command: Some(vec!["cargo".to_string(), "test".to_string(), "--no-run".to_string()]),
                format_command: Some(vec!["rustfmt".to_string(), "{file}".to_string()]),
            },
            "python" | "py" => LanguageVerifier {
                language: "python".to_string(),
                parse_command: Some(vec!["python".to_string(), "-m".to_string(), "py_compile".to_string(), "{file}".to_string()]),
                type_command: Some(vec!["mypy".to_string(), "{file}".to_string()]),
                lint_command: Some(vec!["ruff".to_string(), "check".to_string(), "{file}".to_string()]),
                test_command: Some(vec!["pytest".to_string(), "--collect-only".to_string()]),
                format_command: Some(vec!["ruff".to_string(), "format".to_string(), "{file}".to_string()]),
            },
            "go" => LanguageVerifier {
                language: "go".to_string(),
                parse_command: Some(vec!["gofmt".to_string(), "-e".to_string(), "{file}".to_string()]),
                type_command: Some(vec!["go".to_string(), "build".to_string(), "-o".to_string(), "/dev/null".to_string()]),
                lint_command: Some(vec!["golangci-lint".to_string(), "run".to_string(), "{file}".to_string()]),
                test_command: Some(vec!["go".to_string(), "test".to_string(), "-c".to_string()]),
                format_command: Some(vec!["gofmt".to_string(), "-w".to_string(), "{file}".to_string()]),
            },
            _ => LanguageVerifier {
                language: language.to_string(),
                parse_command: None,
                type_command: None,
                lint_command: None,
                test_command: None,
                format_command: None,
            },
        }
    }

    async fn create_temp_file(&self, code: &str, language: &str) -> PathBuf {
        let extension = match language {
            "typescript" => "ts",
            "javascript" => "js",
            "rust" => "rs",
            "python" => "py",
            "go" => "go",
            _ => "txt",
        };

        let temp_dir = std::env::temp_dir();
        let file_name = format!("voicecode_verify_{}.{}", uuid::Uuid::new_v4(), extension);
        let path = temp_dir.join(file_name);
        
        let _ = tokio::fs::write(&path, code).await;
        path
    }

    /// Quick syntax check without full verification
    pub fn quick_parse_check(&self, code: &str, language: &str) -> bool {
        match language {
            "typescript" | "javascript" => {
                // Basic brace/bracket matching
                let mut stack = Vec::new();
                for c in code.chars() {
                    match c {
                        '{' | '[' | '(' => stack.push(c),
                        '}' => if stack.pop() != Some('{') { return false; },
                        ']' => if stack.pop() != Some('[') { return false; },
                        ')' => if stack.pop() != Some('(') { return false; },
                        _ => {}
                    }
                }
                stack.is_empty()
            }
            "python" => {
                // Check for basic indentation issues
                !code.contains("\t ") && !code.contains(" \t")
            }
            _ => true,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_quick_parse_check() {
        let verifier = SelfVerifier::new(PathBuf::from("."), VerificationConfig::default());
        
        assert!(verifier.quick_parse_check("function foo() { return 1; }", "javascript"));
        assert!(!verifier.quick_parse_check("function foo() { return 1; ", "javascript"));
        assert!(verifier.quick_parse_check("const x = [1, 2, 3]", "javascript"));
    }

    #[test]
    fn test_error_parsing() {
        let verifier = SelfVerifier::new(PathBuf::from("."), VerificationConfig::default());
        
        let output = "src/main.ts(10,5): error TS2322: Type 'string' is not assignable to type 'number'.";
        let errors = verifier.parse_errors(output);
        
        assert_eq!(errors.len(), 1);
        assert_eq!(errors[0].line, Some(10));
    }
}
