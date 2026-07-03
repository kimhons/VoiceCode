#![allow(dead_code, unused_variables, unused_imports)]
// Non-Coder Experience: Templates and Guided Wizards
// Provides user-friendly interfaces for non-technical users
// Includes project templates, step-by-step wizards, and natural language workflows

use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::path::PathBuf;
use std::sync::Arc;
use tokio::sync::RwLock;

// ============================================================================
// Project Templates
// ============================================================================

/// Categories of project templates
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum TemplateCategory {
    WebApp,
    Api,
    Script,
    DataProcessing,
    Automation,
    Documentation,
    Mobile,
    Desktop,
    CLI,
    Library,
    Game,
    AI,
    DevOps,
    Other,
}

impl TemplateCategory {
    pub fn display_name(&self) -> &'static str {
        match self {
            TemplateCategory::WebApp => "Web Application",
            TemplateCategory::Api => "API / Backend",
            TemplateCategory::Script => "Script / Utility",
            TemplateCategory::DataProcessing => "Data Processing",
            TemplateCategory::Automation => "Automation",
            TemplateCategory::Documentation => "Documentation",
            TemplateCategory::Mobile => "Mobile App",
            TemplateCategory::Desktop => "Desktop App",
            TemplateCategory::CLI => "Command Line Tool",
            TemplateCategory::Library => "Library / Package",
            TemplateCategory::Game => "Game",
            TemplateCategory::AI => "AI / Machine Learning",
            TemplateCategory::DevOps => "DevOps / Infrastructure",
            TemplateCategory::Other => "Other",
        }
    }

    pub fn icon(&self) -> &'static str {
        match self {
            TemplateCategory::WebApp => "🌐",
            TemplateCategory::Api => "🔌",
            TemplateCategory::Script => "📜",
            TemplateCategory::DataProcessing => "📊",
            TemplateCategory::Automation => "🤖",
            TemplateCategory::Documentation => "📝",
            TemplateCategory::Mobile => "📱",
            TemplateCategory::Desktop => "🖥️",
            TemplateCategory::CLI => "⌨️",
            TemplateCategory::Library => "📦",
            TemplateCategory::Game => "🎮",
            TemplateCategory::AI => "🧠",
            TemplateCategory::DevOps => "⚙️",
            TemplateCategory::Other => "📁",
        }
    }
}

/// Project template definition
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProjectTemplate {
    /// Unique identifier
    pub id: String,
    /// Display name
    pub name: String,
    /// Short description
    pub description: String,
    /// Detailed explanation for non-coders
    pub explanation: String,
    /// Category
    pub category: TemplateCategory,
    /// Tags for search
    pub tags: Vec<String>,
    /// Difficulty level (1-5)
    pub difficulty: u8,
    /// Estimated completion time in minutes
    pub estimated_time: u32,
    /// Required inputs from user
    pub inputs: Vec<TemplateInput>,
    /// Files to generate
    pub files: Vec<TemplateFile>,
    /// Post-generation steps
    pub post_steps: Vec<PostStep>,
    /// Example use cases
    pub examples: Vec<String>,
    /// Prerequisites
    pub prerequisites: Vec<String>,
    /// Technologies used
    pub technologies: Vec<String>,
    /// Whether this template is popular
    pub popular: bool,
    /// User rating (1-5)
    pub rating: Option<f32>,
    /// Number of times used
    pub usage_count: u64,
}

/// Input required from user
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TemplateInput {
    /// Input identifier
    pub id: String,
    /// Display label
    pub label: String,
    /// Help text for non-coders
    pub help: String,
    /// Input type
    pub input_type: InputType,
    /// Default value
    pub default: Option<String>,
    /// Whether required
    pub required: bool,
    /// Validation rules
    pub validation: Option<ValidationRule>,
    /// Examples of valid values
    pub examples: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum InputType {
    Text,
    Number,
    Boolean,
    Select { options: Vec<SelectOption> },
    MultiSelect { options: Vec<SelectOption> },
    FilePath,
    DirectoryPath,
    Password,
    Email,
    Url,
    Code { language: String },
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SelectOption {
    pub value: String,
    pub label: String,
    pub description: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ValidationRule {
    pub pattern: Option<String>,
    pub min_length: Option<usize>,
    pub max_length: Option<usize>,
    pub min_value: Option<f64>,
    pub max_value: Option<f64>,
    pub custom_message: Option<String>,
}

/// File to generate from template
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TemplateFile {
    /// Relative path (supports {{variables}})
    pub path: String,
    /// File content template
    pub content: String,
    /// Whether to overwrite if exists
    pub overwrite: bool,
    /// Conditions for generation
    pub condition: Option<String>,
}

/// Post-generation step
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PostStep {
    /// Step description
    pub description: String,
    /// Command to run (optional)
    pub command: Option<String>,
    /// Manual instruction (for non-coders)
    pub manual_instruction: String,
    /// Whether step is optional
    pub optional: bool,
}

// ============================================================================
// Built-in Templates
// ============================================================================

/// Built-in template library
pub struct TemplateLibrary {
    templates: RwLock<HashMap<String, ProjectTemplate>>,
}

impl TemplateLibrary {
    pub fn new() -> Self {
        let library = Self {
            templates: RwLock::new(HashMap::new()),
        };
        library
    }

    pub async fn load_defaults(&self) {
        // Add built-in templates
        let defaults = vec![
            Self::simple_script_template(),
            Self::web_api_template(),
            Self::static_website_template(),
            Self::data_analysis_template(),
            Self::automation_bot_template(),
            Self::documentation_template(),
            Self::cli_tool_template(),
            Self::crud_app_template(),
        ];

        let mut templates = self.templates.write().await;
        for template in defaults {
            templates.insert(template.id.clone(), template);
        }
    }

    /// Get all templates
    pub async fn get_all(&self) -> Vec<ProjectTemplate> {
        self.templates.read().await.values().cloned().collect()
    }

    /// Get templates by category
    pub async fn get_by_category(&self, category: TemplateCategory) -> Vec<ProjectTemplate> {
        self.templates
            .read()
            .await
            .values()
            .filter(|t| t.category == category)
            .cloned()
            .collect()
    }

    /// Search templates
    pub async fn search(&self, query: &str) -> Vec<ProjectTemplate> {
        let query_lower = query.to_lowercase();
        self.templates
            .read()
            .await
            .values()
            .filter(|t| {
                t.name.to_lowercase().contains(&query_lower)
                    || t.description.to_lowercase().contains(&query_lower)
                    || t.tags
                        .iter()
                        .any(|tag| tag.to_lowercase().contains(&query_lower))
            })
            .cloned()
            .collect()
    }

    /// Get popular templates
    pub async fn get_popular(&self) -> Vec<ProjectTemplate> {
        let mut templates: Vec<_> = self
            .templates
            .read()
            .await
            .values()
            .filter(|t| t.popular)
            .cloned()
            .collect();
        templates.sort_by(|a, b| b.usage_count.cmp(&a.usage_count));
        templates
    }

    /// Get template by ID
    pub async fn get(&self, id: &str) -> Option<ProjectTemplate> {
        self.templates.read().await.get(id).cloned()
    }

    /// Add custom template
    pub async fn add(&self, template: ProjectTemplate) {
        self.templates
            .write()
            .await
            .insert(template.id.clone(), template);
    }

    // Built-in template definitions

    fn simple_script_template() -> ProjectTemplate {
        ProjectTemplate {
            id: "simple-script".to_string(),
            name: "Simple Script".to_string(),
            description: "A basic script to automate a simple task".to_string(),
            explanation: "This creates a single file that runs a sequence of commands. \
                         Perfect for tasks you do repeatedly, like renaming files, \
                         organizing folders, or processing data."
                .to_string(),
            category: TemplateCategory::Script,
            tags: vec![
                "beginner".to_string(),
                "automation".to_string(),
                "quick".to_string(),
            ],
            difficulty: 1,
            estimated_time: 5,
            inputs: vec![
                TemplateInput {
                    id: "script_name".to_string(),
                    label: "Script Name".to_string(),
                    help: "What do you want to call this script? Use simple words, no spaces."
                        .to_string(),
                    input_type: InputType::Text,
                    default: Some("my_script".to_string()),
                    required: true,
                    validation: Some(ValidationRule {
                        pattern: Some(r"^[a-z][a-z0-9_]*$".to_string()),
                        min_length: Some(3),
                        max_length: Some(50),
                        min_value: None,
                        max_value: None,
                        custom_message: Some(
                            "Use lowercase letters, numbers, and underscores only".to_string(),
                        ),
                    }),
                    examples: vec!["file_organizer".to_string(), "backup_photos".to_string()],
                },
                TemplateInput {
                    id: "task_description".to_string(),
                    label: "What should this script do?".to_string(),
                    help: "Describe the task in plain English. Be as specific as possible!"
                        .to_string(),
                    input_type: InputType::Text,
                    default: None,
                    required: true,
                    validation: Some(ValidationRule {
                        pattern: None,
                        min_length: Some(10),
                        max_length: Some(500),
                        min_value: None,
                        max_value: None,
                        custom_message: Some(
                            "Please provide more detail about what the script should do"
                                .to_string(),
                        ),
                    }),
                    examples: vec![
                        "Rename all .jpg files in a folder to include today's date".to_string(),
                        "Move all PDF files older than 30 days to an archive folder".to_string(),
                    ],
                },
                TemplateInput {
                    id: "language".to_string(),
                    label: "Programming Language".to_string(),
                    help: "Don't worry if you're unsure - Python is great for beginners!"
                        .to_string(),
                    input_type: InputType::Select {
                        options: vec![
                            SelectOption {
                                value: "python".to_string(),
                                label: "Python (Recommended for beginners)".to_string(),
                                description: Some(
                                    "Easy to read and write, lots of helpful tools".to_string(),
                                ),
                            },
                            SelectOption {
                                value: "javascript".to_string(),
                                label: "JavaScript / Node.js".to_string(),
                                description: Some(
                                    "Good if you want to work with web stuff later".to_string(),
                                ),
                            },
                            SelectOption {
                                value: "bash".to_string(),
                                label: "Bash (Shell Script)".to_string(),
                                description: Some(
                                    "Built into Mac/Linux, very fast for file operations"
                                        .to_string(),
                                ),
                            },
                        ],
                    },
                    default: Some("python".to_string()),
                    required: true,
                    validation: None,
                    examples: vec![],
                },
            ],
            files: vec![TemplateFile {
                path: "{{script_name}}.py".to_string(),
                content: r#"#!/usr/bin/env python3
"""
{{script_name}}
Generated by VoiceCode

Task: {{task_description}}
"""

import os
import sys
from pathlib import Path

def main():
    # Your script logic goes here
    # The AI will fill this in based on your task description
    print("Hello! This script will: {{task_description}}")

    # TODO: Implement the task
    pass

if __name__ == "__main__":
    main()
"#
                .to_string(),
                overwrite: false,
                condition: Some("language == 'python'".to_string()),
            }],
            post_steps: vec![PostStep {
                description: "Run the script".to_string(),
                command: Some("python {{script_name}}.py".to_string()),
                manual_instruction:
                    "Open a terminal in this folder and type: python {{script_name}}.py".to_string(),
                optional: false,
            }],
            examples: vec![
                "File organizer that sorts photos by date".to_string(),
                "Backup script that copies important files".to_string(),
                "Data cleaner that removes duplicates".to_string(),
            ],
            prerequisites: vec![],
            technologies: vec!["Python".to_string()],
            popular: true,
            rating: Some(4.8),
            usage_count: 15000,
        }
    }

    fn web_api_template() -> ProjectTemplate {
        ProjectTemplate {
            id: "web-api".to_string(),
            name: "REST API".to_string(),
            description: "Create a web API that other apps can talk to".to_string(),
            explanation: "An API is like a waiter in a restaurant - it takes requests from apps, \
                         gets what they need, and sends back responses. This template creates \
                         a simple API that you can customize.".to_string(),
            category: TemplateCategory::Api,
            tags: vec!["backend".to_string(), "api".to_string(), "rest".to_string(), "web".to_string()],
            difficulty: 2,
            estimated_time: 15,
            inputs: vec![
                TemplateInput {
                    id: "project_name".to_string(),
                    label: "Project Name".to_string(),
                    help: "A short name for your project (e.g., 'my-app-api')".to_string(),
                    input_type: InputType::Text,
                    default: Some("my-api".to_string()),
                    required: true,
                    validation: None,
                    examples: vec!["todo-api".to_string(), "weather-service".to_string()],
                },
                TemplateInput {
                    id: "resources".to_string(),
                    label: "What things will your API manage?".to_string(),
                    help: "Think of the main 'things' your API will work with (e.g., users, products, posts)".to_string(),
                    input_type: InputType::Text,
                    default: Some("items".to_string()),
                    required: true,
                    validation: None,
                    examples: vec!["users, posts, comments".to_string(), "products, orders".to_string()],
                },
                TemplateInput {
                    id: "framework".to_string(),
                    label: "Framework".to_string(),
                    help: "A framework provides building blocks. FastAPI is great for beginners!".to_string(),
                    input_type: InputType::Select {
                        options: vec![
                            SelectOption {
                                value: "fastapi".to_string(),
                                label: "FastAPI (Python) - Recommended".to_string(),
                                description: Some("Modern, fast, easy to learn".to_string()),
                            },
                            SelectOption {
                                value: "express".to_string(),
                                label: "Express (JavaScript)".to_string(),
                                description: Some("Popular, lots of tutorials available".to_string()),
                            },
                            SelectOption {
                                value: "actix".to_string(),
                                label: "Actix (Rust)".to_string(),
                                description: Some("Very fast, but harder to learn".to_string()),
                            },
                        ],
                    },
                    default: Some("fastapi".to_string()),
                    required: true,
                    validation: None,
                    examples: vec![],
                },
            ],
            files: vec![],
            post_steps: vec![
                PostStep {
                    description: "Install dependencies".to_string(),
                    command: Some("pip install -r requirements.txt".to_string()),
                    manual_instruction: "Run 'pip install -r requirements.txt' to install required packages".to_string(),
                    optional: false,
                },
                PostStep {
                    description: "Start the server".to_string(),
                    command: Some("uvicorn main:app --reload".to_string()),
                    manual_instruction: "Run 'uvicorn main:app --reload' to start your API".to_string(),
                    optional: false,
                },
            ],
            examples: vec![
                "Todo list API".to_string(),
                "User management system".to_string(),
                "Product catalog".to_string(),
            ],
            prerequisites: vec!["Python 3.8+".to_string()],
            technologies: vec!["Python".to_string(), "FastAPI".to_string(), "SQLite".to_string()],
            popular: true,
            rating: Some(4.7),
            usage_count: 12000,
        }
    }

    fn static_website_template() -> ProjectTemplate {
        ProjectTemplate {
            id: "static-website".to_string(),
            name: "Static Website".to_string(),
            description: "A simple website with pages, images, and styling".to_string(),
            explanation: "A static website is like a digital brochure - it shows information \
                         but doesn't require a database or complex server. Great for portfolios, \
                         landing pages, or informational sites."
                .to_string(),
            category: TemplateCategory::WebApp,
            tags: vec![
                "website".to_string(),
                "html".to_string(),
                "css".to_string(),
                "beginner".to_string(),
            ],
            difficulty: 1,
            estimated_time: 10,
            inputs: vec![
                TemplateInput {
                    id: "site_name".to_string(),
                    label: "Website Name".to_string(),
                    help: "The name that will appear in the browser tab".to_string(),
                    input_type: InputType::Text,
                    default: Some("My Website".to_string()),
                    required: true,
                    validation: None,
                    examples: vec!["Jane's Portfolio".to_string(), "ABC Company".to_string()],
                },
                TemplateInput {
                    id: "pages".to_string(),
                    label: "What pages do you need?".to_string(),
                    help: "List the pages you want, separated by commas".to_string(),
                    input_type: InputType::Text,
                    default: Some("Home, About, Contact".to_string()),
                    required: true,
                    validation: None,
                    examples: vec!["Home, Services, Portfolio, Contact".to_string()],
                },
                TemplateInput {
                    id: "style".to_string(),
                    label: "Visual Style".to_string(),
                    help: "Pick a style that matches your brand".to_string(),
                    input_type: InputType::Select {
                        options: vec![
                            SelectOption {
                                value: "modern".to_string(),
                                label: "Modern & Clean".to_string(),
                                description: Some(
                                    "Minimalist design with lots of white space".to_string(),
                                ),
                            },
                            SelectOption {
                                value: "colorful".to_string(),
                                label: "Colorful & Bold".to_string(),
                                description: Some("Vibrant colors and dynamic layouts".to_string()),
                            },
                            SelectOption {
                                value: "professional".to_string(),
                                label: "Professional & Corporate".to_string(),
                                description: Some("Classic business look".to_string()),
                            },
                        ],
                    },
                    default: Some("modern".to_string()),
                    required: true,
                    validation: None,
                    examples: vec![],
                },
            ],
            files: vec![],
            post_steps: vec![PostStep {
                description: "Preview your website".to_string(),
                command: Some("open index.html".to_string()),
                manual_instruction: "Double-click index.html to open it in your browser"
                    .to_string(),
                optional: false,
            }],
            examples: vec![
                "Personal portfolio".to_string(),
                "Small business landing page".to_string(),
                "Event announcement site".to_string(),
            ],
            prerequisites: vec![],
            technologies: vec![
                "HTML".to_string(),
                "CSS".to_string(),
                "JavaScript".to_string(),
            ],
            popular: true,
            rating: Some(4.9),
            usage_count: 25000,
        }
    }

    fn data_analysis_template() -> ProjectTemplate {
        ProjectTemplate {
            id: "data-analysis".to_string(),
            name: "Data Analysis".to_string(),
            description: "Analyze data and create visualizations".to_string(),
            explanation: "This helps you make sense of data - spreadsheets, CSVs, or databases. \
                         You'll be able to find patterns, create charts, and generate reports."
                .to_string(),
            category: TemplateCategory::DataProcessing,
            tags: vec![
                "data".to_string(),
                "analysis".to_string(),
                "visualization".to_string(),
                "pandas".to_string(),
            ],
            difficulty: 2,
            estimated_time: 20,
            inputs: vec![
                TemplateInput {
                    id: "project_name".to_string(),
                    label: "Project Name".to_string(),
                    help: "A name for this analysis project".to_string(),
                    input_type: InputType::Text,
                    default: Some("data_analysis".to_string()),
                    required: true,
                    validation: None,
                    examples: vec!["sales_analysis".to_string(), "survey_results".to_string()],
                },
                TemplateInput {
                    id: "data_source".to_string(),
                    label: "Where is your data?".to_string(),
                    help: "Describe what kind of data you'll be analyzing".to_string(),
                    input_type: InputType::Text,
                    default: None,
                    required: true,
                    validation: None,
                    examples: vec![
                        "A CSV file with sales data".to_string(),
                        "An Excel spreadsheet with survey responses".to_string(),
                    ],
                },
                TemplateInput {
                    id: "analysis_goals".to_string(),
                    label: "What do you want to learn?".to_string(),
                    help: "What questions are you trying to answer with this data?".to_string(),
                    input_type: InputType::Text,
                    default: None,
                    required: true,
                    validation: None,
                    examples: vec![
                        "Which products sell best? When are peak sales times?".to_string(),
                        "What are the most common survey responses?".to_string(),
                    ],
                },
            ],
            files: vec![],
            post_steps: vec![
                PostStep {
                    description: "Install analysis tools".to_string(),
                    command: Some("pip install pandas matplotlib seaborn".to_string()),
                    manual_instruction: "Install the data analysis tools with pip".to_string(),
                    optional: false,
                },
                PostStep {
                    description: "Open in Jupyter".to_string(),
                    command: Some("jupyter notebook analysis.ipynb".to_string()),
                    manual_instruction: "Open the notebook to interact with your analysis"
                        .to_string(),
                    optional: false,
                },
            ],
            examples: vec![
                "Sales performance analysis".to_string(),
                "Customer survey insights".to_string(),
                "Website traffic analysis".to_string(),
            ],
            prerequisites: vec!["Python 3.8+".to_string()],
            technologies: vec![
                "Python".to_string(),
                "Pandas".to_string(),
                "Matplotlib".to_string(),
            ],
            popular: true,
            rating: Some(4.6),
            usage_count: 18000,
        }
    }

    fn automation_bot_template() -> ProjectTemplate {
        ProjectTemplate {
            id: "automation-bot".to_string(),
            name: "Automation Bot".to_string(),
            description: "A bot that performs repetitive tasks automatically".to_string(),
            explanation:
                "Imagine having a helper that does boring tasks for you - sending emails, \
                         updating spreadsheets, posting to social media. That's what this creates!"
                    .to_string(),
            category: TemplateCategory::Automation,
            tags: vec![
                "automation".to_string(),
                "bot".to_string(),
                "scheduling".to_string(),
            ],
            difficulty: 3,
            estimated_time: 30,
            inputs: vec![
                TemplateInput {
                    id: "bot_name".to_string(),
                    label: "Bot Name".to_string(),
                    help: "Give your bot a name!".to_string(),
                    input_type: InputType::Text,
                    default: Some("my_bot".to_string()),
                    required: true,
                    validation: None,
                    examples: vec!["email_bot".to_string(), "social_poster".to_string()],
                },
                TemplateInput {
                    id: "task_description".to_string(),
                    label: "What should the bot do?".to_string(),
                    help: "Describe the task in detail. What triggers it? What should happen?"
                        .to_string(),
                    input_type: InputType::Text,
                    default: None,
                    required: true,
                    validation: None,
                    examples: vec![
                        "Every morning, check my email and summarize unread messages".to_string(),
                        "When a new file is added to a folder, back it up to cloud storage"
                            .to_string(),
                    ],
                },
                TemplateInput {
                    id: "schedule".to_string(),
                    label: "When should it run?".to_string(),
                    help: "How often should the bot check for work?".to_string(),
                    input_type: InputType::Select {
                        options: vec![
                            SelectOption {
                                value: "continuous".to_string(),
                                label: "All the time (watches for changes)".to_string(),
                                description: None,
                            },
                            SelectOption {
                                value: "hourly".to_string(),
                                label: "Every hour".to_string(),
                                description: None,
                            },
                            SelectOption {
                                value: "daily".to_string(),
                                label: "Once a day".to_string(),
                                description: None,
                            },
                            SelectOption {
                                value: "weekly".to_string(),
                                label: "Once a week".to_string(),
                                description: None,
                            },
                        ],
                    },
                    default: Some("daily".to_string()),
                    required: true,
                    validation: None,
                    examples: vec![],
                },
            ],
            files: vec![],
            post_steps: vec![],
            examples: vec![
                "Email notification bot".to_string(),
                "File backup automation".to_string(),
                "Social media scheduler".to_string(),
            ],
            prerequisites: vec![],
            technologies: vec!["Python".to_string()],
            popular: true,
            rating: Some(4.5),
            usage_count: 10000,
        }
    }

    fn documentation_template() -> ProjectTemplate {
        ProjectTemplate {
            id: "documentation".to_string(),
            name: "Documentation Site".to_string(),
            description: "Create beautiful documentation for your project".to_string(),
            explanation: "Good documentation helps people understand and use your project. \
                         This creates a professional docs site that's easy to update."
                .to_string(),
            category: TemplateCategory::Documentation,
            tags: vec![
                "docs".to_string(),
                "documentation".to_string(),
                "markdown".to_string(),
            ],
            difficulty: 1,
            estimated_time: 15,
            inputs: vec![
                TemplateInput {
                    id: "project_name".to_string(),
                    label: "Project Name".to_string(),
                    help: "What project is this documentation for?".to_string(),
                    input_type: InputType::Text,
                    default: Some("My Project".to_string()),
                    required: true,
                    validation: None,
                    examples: vec![],
                },
                TemplateInput {
                    id: "sections".to_string(),
                    label: "What sections do you need?".to_string(),
                    help: "List the main sections of your documentation".to_string(),
                    input_type: InputType::Text,
                    default: Some(
                        "Getting Started, Installation, Usage, API Reference".to_string(),
                    ),
                    required: true,
                    validation: None,
                    examples: vec![],
                },
            ],
            files: vec![],
            post_steps: vec![],
            examples: vec![
                "Software documentation".to_string(),
                "API reference".to_string(),
                "User guide".to_string(),
            ],
            prerequisites: vec![],
            technologies: vec!["Markdown".to_string(), "MkDocs".to_string()],
            popular: false,
            rating: Some(4.4),
            usage_count: 5000,
        }
    }

    fn cli_tool_template() -> ProjectTemplate {
        ProjectTemplate {
            id: "cli-tool".to_string(),
            name: "Command Line Tool".to_string(),
            description: "A tool you run from the terminal".to_string(),
            explanation: "Command line tools are powerful programs that run in the terminal. \
                         They're great for tasks you need to automate or run on servers."
                .to_string(),
            category: TemplateCategory::CLI,
            tags: vec![
                "cli".to_string(),
                "terminal".to_string(),
                "tool".to_string(),
            ],
            difficulty: 2,
            estimated_time: 20,
            inputs: vec![
                TemplateInput {
                    id: "tool_name".to_string(),
                    label: "Tool Name".to_string(),
                    help: "What command will users type to run your tool?".to_string(),
                    input_type: InputType::Text,
                    default: Some("mytool".to_string()),
                    required: true,
                    validation: None,
                    examples: vec!["filesorter".to_string(), "dataconv".to_string()],
                },
                TemplateInput {
                    id: "purpose".to_string(),
                    label: "What does it do?".to_string(),
                    help: "Describe what your tool helps people accomplish".to_string(),
                    input_type: InputType::Text,
                    default: None,
                    required: true,
                    validation: None,
                    examples: vec![
                        "Converts files between different formats".to_string(),
                        "Manages project tasks from the terminal".to_string(),
                    ],
                },
            ],
            files: vec![],
            post_steps: vec![],
            examples: vec![
                "File converter".to_string(),
                "Project manager".to_string(),
                "System monitor".to_string(),
            ],
            prerequisites: vec![],
            technologies: vec!["Python".to_string(), "Click".to_string()],
            popular: false,
            rating: Some(4.3),
            usage_count: 7000,
        }
    }

    fn crud_app_template() -> ProjectTemplate {
        ProjectTemplate {
            id: "crud-app".to_string(),
            name: "Database Application".to_string(),
            description: "An app that stores, retrieves, and manages data".to_string(),
            explanation: "CRUD stands for Create, Read, Update, Delete - the four basic operations \
                         for working with data. This creates an app where you can manage a database \
                         of anything: customers, products, tasks, etc.".to_string(),
            category: TemplateCategory::WebApp,
            tags: vec!["crud".to_string(), "database".to_string(), "fullstack".to_string()],
            difficulty: 3,
            estimated_time: 45,
            inputs: vec![
                TemplateInput {
                    id: "app_name".to_string(),
                    label: "Application Name".to_string(),
                    help: "What's this app called?".to_string(),
                    input_type: InputType::Text,
                    default: Some("my_app".to_string()),
                    required: true,
                    validation: None,
                    examples: vec!["inventory_manager".to_string(), "contact_book".to_string()],
                },
                TemplateInput {
                    id: "data_type".to_string(),
                    label: "What will you store?".to_string(),
                    help: "Describe what kind of information the app will manage".to_string(),
                    input_type: InputType::Text,
                    default: None,
                    required: true,
                    validation: None,
                    examples: vec![
                        "Customer information: name, email, phone, address".to_string(),
                        "Product inventory: name, price, quantity, category".to_string(),
                    ],
                },
            ],
            files: vec![],
            post_steps: vec![],
            examples: vec![
                "Customer management".to_string(),
                "Inventory tracking".to_string(),
                "Task management".to_string(),
            ],
            prerequisites: vec!["Python 3.8+".to_string(), "Node.js 18+".to_string()],
            technologies: vec!["Python".to_string(), "FastAPI".to_string(), "React".to_string(), "SQLite".to_string()],
            popular: true,
            rating: Some(4.6),
            usage_count: 14000,
        }
    }
}

impl Default for TemplateLibrary {
    fn default() -> Self {
        Self::new()
    }
}

// ============================================================================
// Guided Wizard
// ============================================================================

/// Step-by-step wizard for project creation
pub struct ProjectWizard {
    template_library: Arc<TemplateLibrary>,
    current_step: RwLock<usize>,
    collected_inputs: RwLock<HashMap<String, String>>,
    selected_template: RwLock<Option<String>>,
}

impl ProjectWizard {
    pub fn new(library: Arc<TemplateLibrary>) -> Self {
        Self {
            template_library: library,
            current_step: RwLock::new(0),
            collected_inputs: RwLock::new(HashMap::new()),
            selected_template: RwLock::new(None),
        }
    }

    /// Start the wizard
    pub async fn start(&self) -> WizardState {
        *self.current_step.write().await = 0;
        self.collected_inputs.write().await.clear();
        *self.selected_template.write().await = None;

        WizardState {
            step: WizardStep::SelectCategory,
            prompt: "What would you like to create today?".to_string(),
            options: self.get_category_options(),
            help_text: Some(
                "Choose a category that best matches what you want to build.".to_string(),
            ),
            progress: 0.0,
            can_go_back: false,
        }
    }

    /// Process user input and advance wizard
    pub async fn process_input(&self, input: &str) -> WizardState {
        let step = *self.current_step.read().await;

        match step {
            0 => self.handle_category_selection(input).await,
            1 => self.handle_template_selection(input).await,
            _ => self.handle_input_collection(input).await,
        }
    }

    /// Go back to previous step
    pub async fn go_back(&self) -> Option<WizardState> {
        let step = *self.current_step.read().await;
        if step == 0 {
            return None;
        }

        *self.current_step.write().await = step - 1;
        Some(self.get_current_state().await)
    }

    async fn handle_category_selection(&self, input: &str) -> WizardState {
        // Parse category from input
        let category = self.parse_category(input);

        let templates = self.template_library.get_by_category(category).await;

        *self.current_step.write().await = 1;

        WizardState {
            step: WizardStep::SelectTemplate,
            prompt: format!(
                "Great choice! Here are some {} templates:",
                category.display_name()
            ),
            options: templates
                .iter()
                .map(|t| WizardOption {
                    value: t.id.clone(),
                    label: t.name.clone(),
                    description: Some(t.description.clone()),
                    icon: Some(category.icon().to_string()),
                })
                .collect(),
            help_text: Some(
                "Pick a template to start with. You can customize it later!".to_string(),
            ),
            progress: 0.2,
            can_go_back: true,
        }
    }

    async fn handle_template_selection(&self, template_id: &str) -> WizardState {
        *self.selected_template.write().await = Some(template_id.to_string());

        if let Some(template) = self.template_library.get(template_id).await {
            if template.inputs.is_empty() {
                // No inputs needed, go to confirmation
                return self.get_confirmation_state(&template).await;
            }

            *self.current_step.write().await = 2;
            self.get_input_state(&template, 0).await
        } else {
            self.get_error_state("Template not found").await
        }
    }

    async fn handle_input_collection(&self, value: &str) -> WizardState {
        let template_id = self.selected_template.read().await.clone();
        let template_id = template_id.unwrap_or_default();

        if let Some(template) = self.template_library.get(&template_id).await {
            let current_input_idx = *self.current_step.read().await - 2;

            if current_input_idx < template.inputs.len() {
                let input = &template.inputs[current_input_idx];

                // Validate input
                if let Err(error) = self.validate_input(input, value) {
                    return WizardState {
                        step: WizardStep::CollectInputs,
                        prompt: format!("Oops! {}\n\nPlease try again: {}", error, input.label),
                        options: vec![],
                        help_text: Some(input.help.clone()),
                        progress: self.calculate_progress(current_input_idx, template.inputs.len()),
                        can_go_back: true,
                    };
                }

                // Store valid input
                self.collected_inputs
                    .write()
                    .await
                    .insert(input.id.clone(), value.to_string());

                // Move to next input or confirmation
                if current_input_idx + 1 < template.inputs.len() {
                    *self.current_step.write().await += 1;
                    return self.get_input_state(&template, current_input_idx + 1).await;
                } else {
                    return self.get_confirmation_state(&template).await;
                }
            }
        }

        self.get_error_state("Invalid state").await
    }

    fn validate_input(&self, input: &TemplateInput, value: &str) -> Result<(), String> {
        if input.required && value.trim().is_empty() {
            return Err("This field is required.".to_string());
        }

        if let Some(ref validation) = input.validation {
            if let Some(min_len) = validation.min_length {
                if value.len() < min_len {
                    return Err(validation
                        .custom_message
                        .clone()
                        .unwrap_or_else(|| format!("Must be at least {} characters", min_len)));
                }
            }
            if let Some(max_len) = validation.max_length {
                if value.len() > max_len {
                    return Err(validation
                        .custom_message
                        .clone()
                        .unwrap_or_else(|| format!("Must be at most {} characters", max_len)));
                }
            }
            if let Some(ref pattern) = validation.pattern {
                if let Ok(regex) = regex::Regex::new(pattern) {
                    if !regex.is_match(value) {
                        return Err(validation
                            .custom_message
                            .clone()
                            .unwrap_or_else(|| "Invalid format".to_string()));
                    }
                }
            }
        }

        Ok(())
    }

    async fn get_input_state(&self, template: &ProjectTemplate, idx: usize) -> WizardState {
        let input = &template.inputs[idx];

        let options = match &input.input_type {
            InputType::Select { options } | InputType::MultiSelect { options } => options
                .iter()
                .map(|o| WizardOption {
                    value: o.value.clone(),
                    label: o.label.clone(),
                    description: o.description.clone(),
                    icon: None,
                })
                .collect(),
            InputType::Boolean => vec![
                WizardOption {
                    value: "true".to_string(),
                    label: "Yes".to_string(),
                    description: None,
                    icon: None,
                },
                WizardOption {
                    value: "false".to_string(),
                    label: "No".to_string(),
                    description: None,
                    icon: None,
                },
            ],
            _ => vec![],
        };

        let examples_hint = if !input.examples.is_empty() {
            format!("\n\nExamples: {}", input.examples.join(", "))
        } else {
            String::new()
        };

        WizardState {
            step: WizardStep::CollectInputs,
            prompt: format!("{}{}", input.label, examples_hint),
            options,
            help_text: Some(input.help.clone()),
            progress: self.calculate_progress(idx, template.inputs.len()),
            can_go_back: true,
        }
    }

    async fn get_confirmation_state(&self, template: &ProjectTemplate) -> WizardState {
        let inputs = self.collected_inputs.read().await;

        let summary = template
            .inputs
            .iter()
            .filter_map(|i| inputs.get(&i.id).map(|v| format!("• {}: {}", i.label, v)))
            .collect::<Vec<_>>()
            .join("\n");

        WizardState {
            step: WizardStep::Confirm,
            prompt: format!(
                "Ready to create your {}!\n\nHere's what we'll use:\n{}\n\nShould I create this for you?",
                template.name,
                summary
            ),
            options: vec![
                WizardOption { value: "yes".to_string(), label: "Yes, create it!".to_string(), description: None, icon: Some("✓".to_string()) },
                WizardOption { value: "no".to_string(), label: "No, let me change something".to_string(), description: None, icon: Some("✗".to_string()) },
            ],
            help_text: Some("Review the settings above and confirm when ready.".to_string()),
            progress: 0.9,
            can_go_back: true,
        }
    }

    async fn get_error_state(&self, message: &str) -> WizardState {
        WizardState {
            step: WizardStep::Error,
            prompt: format!("Something went wrong: {}", message),
            options: vec![],
            help_text: Some("Please try again or start over.".to_string()),
            progress: 0.0,
            can_go_back: true,
        }
    }

    async fn get_current_state(&self) -> WizardState {
        let step = *self.current_step.read().await;

        match step {
            0 => self.start().await,
            1 => {
                // Re-show template selection
                WizardState {
                    step: WizardStep::SelectTemplate,
                    prompt: "Select a template:".to_string(),
                    options: vec![],
                    help_text: None,
                    progress: 0.2,
                    can_go_back: true,
                }
            }
            _ => {
                // Re-show current input
                if let Some(template_id) = self.selected_template.read().await.clone() {
                    if let Some(template) = self.template_library.get(&template_id).await {
                        return self.get_input_state(&template, step - 2).await;
                    }
                }
                self.get_error_state("Invalid state").await
            }
        }
    }

    fn get_category_options(&self) -> Vec<WizardOption> {
        vec![
            TemplateCategory::WebApp,
            TemplateCategory::Api,
            TemplateCategory::Script,
            TemplateCategory::DataProcessing,
            TemplateCategory::Automation,
            TemplateCategory::CLI,
            TemplateCategory::Documentation,
        ]
        .into_iter()
        .map(|c| WizardOption {
            value: format!("{:?}", c).to_lowercase(),
            label: c.display_name().to_string(),
            description: None,
            icon: Some(c.icon().to_string()),
        })
        .collect()
    }

    fn parse_category(&self, input: &str) -> TemplateCategory {
        let input_lower = input.to_lowercase();
        if input_lower.contains("web") || input_lower.contains("website") {
            TemplateCategory::WebApp
        } else if input_lower.contains("api") || input_lower.contains("backend") {
            TemplateCategory::Api
        } else if input_lower.contains("script") {
            TemplateCategory::Script
        } else if input_lower.contains("data") {
            TemplateCategory::DataProcessing
        } else if input_lower.contains("auto") || input_lower.contains("bot") {
            TemplateCategory::Automation
        } else if input_lower.contains("doc") {
            TemplateCategory::Documentation
        } else if input_lower.contains("cli") || input_lower.contains("command") {
            TemplateCategory::CLI
        } else {
            TemplateCategory::Other
        }
    }

    fn calculate_progress(&self, current: usize, total: usize) -> f32 {
        if total == 0 {
            0.5
        } else {
            0.3 + (0.5 * (current as f32 / total as f32))
        }
    }

    /// Generate project from collected inputs
    pub async fn generate(&self, output_dir: &PathBuf) -> Result<GenerationResult, String> {
        let template_id = self
            .selected_template
            .read()
            .await
            .clone()
            .ok_or("No template selected")?;

        let template = self
            .template_library
            .get(&template_id)
            .await
            .ok_or("Template not found")?;

        let inputs = self.collected_inputs.read().await.clone();

        // Generate files
        let mut generated_files = Vec::new();

        for file_template in &template.files {
            // Check condition
            if let Some(ref condition) = file_template.condition {
                if !self.evaluate_condition(condition, &inputs) {
                    continue;
                }
            }

            // Expand path
            let path = self.expand_template(&file_template.path, &inputs);
            let full_path = output_dir.join(&path);

            // Expand content
            let content = self.expand_template(&file_template.content, &inputs);

            // Check if file exists
            if full_path.exists() && !file_template.overwrite {
                continue;
            }

            // Create parent directories
            if let Some(parent) = full_path.parent() {
                std::fs::create_dir_all(parent).map_err(|e| e.to_string())?;
            }

            // Write file
            std::fs::write(&full_path, &content).map_err(|e| e.to_string())?;
            generated_files.push(full_path);
        }

        Ok(GenerationResult {
            template_name: template.name.clone(),
            files_created: generated_files,
            post_steps: template.post_steps.clone(),
            estimated_time: template.estimated_time,
        })
    }

    fn expand_template(&self, template: &str, inputs: &HashMap<String, String>) -> String {
        let mut result = template.to_string();
        for (key, value) in inputs {
            result = result.replace(&format!("{{{{{}}}}}", key), value);
        }
        result
    }

    fn evaluate_condition(&self, condition: &str, inputs: &HashMap<String, String>) -> bool {
        // Simple condition evaluation: "key == 'value'"
        if let Some((key, value)) = condition.split_once("==") {
            let key = key.trim();
            let expected = value.trim().trim_matches('\'').trim_matches('"');
            if let Some(actual) = inputs.get(key) {
                return actual == expected;
            }
        }
        true
    }
}

/// Wizard state at each step
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WizardState {
    pub step: WizardStep,
    pub prompt: String,
    pub options: Vec<WizardOption>,
    pub help_text: Option<String>,
    pub progress: f32,
    pub can_go_back: bool,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum WizardStep {
    SelectCategory,
    SelectTemplate,
    CollectInputs,
    Confirm,
    Generating,
    Complete,
    Error,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WizardOption {
    pub value: String,
    pub label: String,
    pub description: Option<String>,
    pub icon: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GenerationResult {
    pub template_name: String,
    pub files_created: Vec<PathBuf>,
    pub post_steps: Vec<PostStep>,
    pub estimated_time: u32,
}

// ============================================================================
// Progress Tracker
// ============================================================================

/// Tracks user progress through tasks and learning
pub struct ProgressTracker {
    /// Completed templates
    completed_templates: RwLock<Vec<CompletedTemplate>>,
    /// Active projects
    active_projects: RwLock<Vec<ActiveProject>>,
    /// User skills/achievements
    achievements: RwLock<Vec<Achievement>>,
    /// Usage statistics
    stats: RwLock<UsageStats>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CompletedTemplate {
    pub template_id: String,
    pub project_name: String,
    pub completed_at: u64,
    pub time_taken_minutes: u32,
    pub rating: Option<u8>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ActiveProject {
    pub id: String,
    pub name: String,
    pub template_id: Option<String>,
    pub created_at: u64,
    pub last_updated: u64,
    pub completion_percentage: f32,
    pub current_step: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Achievement {
    pub id: String,
    pub name: String,
    pub description: String,
    pub icon: String,
    pub earned_at: u64,
}

#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct UsageStats {
    pub total_projects_created: u64,
    pub total_commands_run: u64,
    pub favorite_category: Option<TemplateCategory>,
    pub streak_days: u32,
    pub last_active: u64,
}

impl ProgressTracker {
    pub fn new() -> Self {
        Self {
            completed_templates: RwLock::new(Vec::new()),
            active_projects: RwLock::new(Vec::new()),
            achievements: RwLock::new(Vec::new()),
            stats: RwLock::new(UsageStats::default()),
        }
    }

    /// Record template completion
    pub async fn record_completion(
        &self,
        template_id: &str,
        project_name: &str,
        time_minutes: u32,
    ) {
        let completion = CompletedTemplate {
            template_id: template_id.to_string(),
            project_name: project_name.to_string(),
            completed_at: std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap()
                .as_secs(),
            time_taken_minutes: time_minutes,
            rating: None,
        };

        self.completed_templates.write().await.push(completion);

        let mut stats = self.stats.write().await;
        stats.total_projects_created += 1;

        // Check for achievements
        self.check_achievements().await;
    }

    /// Check and award achievements
    async fn check_achievements(&self) {
        let completed = self.completed_templates.read().await;
        let mut achievements = self.achievements.write().await;

        // First project achievement
        if completed.len() == 1 && !achievements.iter().any(|a| a.id == "first_project") {
            achievements.push(Achievement {
                id: "first_project".to_string(),
                name: "Hello World!".to_string(),
                description: "Created your first project".to_string(),
                icon: "🎉".to_string(),
                earned_at: std::time::SystemTime::now()
                    .duration_since(std::time::UNIX_EPOCH)
                    .unwrap()
                    .as_secs(),
            });
        }

        // 5 projects achievement
        if completed.len() >= 5 && !achievements.iter().any(|a| a.id == "five_projects") {
            achievements.push(Achievement {
                id: "five_projects".to_string(),
                name: "Getting Started".to_string(),
                description: "Created 5 projects".to_string(),
                icon: "⭐".to_string(),
                earned_at: std::time::SystemTime::now()
                    .duration_since(std::time::UNIX_EPOCH)
                    .unwrap()
                    .as_secs(),
            });
        }
    }

    /// Get user stats
    pub async fn get_stats(&self) -> UsageStats {
        self.stats.read().await.clone()
    }

    /// Get achievements
    pub async fn get_achievements(&self) -> Vec<Achievement> {
        self.achievements.read().await.clone()
    }
}

impl Default for ProgressTracker {
    fn default() -> Self {
        Self::new()
    }
}

// ============================================================================
// Tests
// ============================================================================

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_template_category_display() {
        assert_eq!(TemplateCategory::WebApp.display_name(), "Web Application");
        assert_eq!(TemplateCategory::Api.icon(), "🔌");
    }

    #[tokio::test]
    async fn test_template_library() {
        let library = TemplateLibrary::new();
        library.load_defaults().await;

        let all = library.get_all().await;
        assert!(!all.is_empty());

        let popular = library.get_popular().await;
        assert!(!popular.is_empty());
    }

    #[tokio::test]
    async fn test_wizard_start() {
        let library = Arc::new(TemplateLibrary::new());
        library.load_defaults().await;

        let wizard = ProjectWizard::new(library);
        let state = wizard.start().await;

        assert_eq!(state.step, WizardStep::SelectCategory);
        assert!(!state.options.is_empty());
        assert_eq!(state.progress, 0.0);
    }

    #[tokio::test]
    async fn test_progress_tracker() {
        let tracker = ProgressTracker::new();

        tracker
            .record_completion("simple-script", "my_script", 10)
            .await;

        let stats = tracker.get_stats().await;
        assert_eq!(stats.total_projects_created, 1);

        let achievements = tracker.get_achievements().await;
        assert!(achievements.iter().any(|a| a.id == "first_project"));
    }
}
