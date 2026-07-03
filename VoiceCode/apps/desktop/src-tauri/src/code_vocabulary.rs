#![allow(dead_code, unused_variables, unused_imports)]
// Phase 1.3: Code-Optimized Vocabulary
// Specialized vocabulary for developer workflows - matching AquaVoice Avalon's 97.3% accuracy

use std::collections::{HashMap, HashSet};
use std::sync::Arc;
use serde::{Deserialize, Serialize};
use tokio::sync::RwLock;
use once_cell::sync::Lazy;

/// Global code vocabulary instance
static CODE_VOCABULARY: Lazy<Arc<CodeVocabulary>> = Lazy::new(|| {
    Arc::new(CodeVocabulary::new())
});

pub fn get_code_vocabulary() -> Arc<CodeVocabulary> {
    CODE_VOCABULARY.clone()
}

/// Vocabulary category for organization
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum VocabularyCategory {
    /// Programming languages
    Languages,
    /// Frameworks and libraries
    Frameworks,
    /// CLI tools and commands
    CliTools,
    /// AI/ML model names
    AiModels,
    /// Cloud services
    CloudServices,
    /// Database technologies
    Databases,
    /// DevOps tools
    DevOps,
    /// Code syntax elements
    Syntax,
    /// Common abbreviations
    Abbreviations,
    /// Custom user terms
    Custom,
}

/// A vocabulary term with metadata
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VocabularyTerm {
    /// The correct spelling/casing
    pub term: String,
    /// Alternative pronunciations/spellings that should map to this term
    pub aliases: Vec<String>,
    /// Phonetic hints for recognition
    pub phonetic: Option<String>,
    /// Category
    pub category: VocabularyCategory,
    /// Weight for prioritization (higher = more likely)
    pub weight: f32,
    /// Is this a user-defined custom term?
    pub is_custom: bool,
    /// Context hints (e.g., "appears after 'import'")
    pub context_hints: Vec<String>,
}

impl VocabularyTerm {
    pub fn new(term: &str, category: VocabularyCategory) -> Self {
        Self {
            term: term.to_string(),
            aliases: Vec::new(),
            phonetic: None,
            category,
            weight: 1.0,
            is_custom: false,
            context_hints: Vec::new(),
        }
    }

    pub fn with_aliases(mut self, aliases: Vec<&str>) -> Self {
        self.aliases = aliases.into_iter().map(|s| s.to_string()).collect();
        self
    }

    pub fn with_phonetic(mut self, phonetic: &str) -> Self {
        self.phonetic = Some(phonetic.to_string());
        self
    }

    pub fn with_weight(mut self, weight: f32) -> Self {
        self.weight = weight;
        self
    }

    pub fn custom(mut self) -> Self {
        self.is_custom = true;
        self
    }
}

/// Code vocabulary manager
pub struct CodeVocabulary {
    /// All vocabulary terms indexed by normalized form
    terms: RwLock<HashMap<String, VocabularyTerm>>,
    /// Alias to term mapping
    alias_map: RwLock<HashMap<String, String>>,
    /// Terms by category
    category_index: RwLock<HashMap<VocabularyCategory, HashSet<String>>>,
    /// Common misrecognitions to correct spelling
    corrections: RwLock<HashMap<String, String>>,
}

impl CodeVocabulary {
    pub fn new() -> Self {
        let vocab = Self {
            terms: RwLock::new(HashMap::new()),
            alias_map: RwLock::new(HashMap::new()),
            category_index: RwLock::new(HashMap::new()),
            corrections: RwLock::new(HashMap::new()),
        };

        // Initialize with default vocabulary in a blocking context
        // In production, this would be async
        vocab
    }

    /// Initialize default vocabulary (called once at startup)
    pub async fn initialize(&self) {
        self.load_programming_languages().await;
        self.load_frameworks().await;
        self.load_cli_tools().await;
        self.load_ai_models().await;
        self.load_cloud_services().await;
        self.load_databases().await;
        self.load_devops().await;
        self.load_syntax().await;
        self.load_common_corrections().await;

        tracing::info!("Code vocabulary initialized with {} terms",
            self.terms.read().await.len());
    }

    /// Add a term to the vocabulary
    pub async fn add_term(&self, term: VocabularyTerm) {
        let normalized = term.term.to_lowercase();

        // Add to main terms
        {
            let mut terms = self.terms.write().await;
            terms.insert(normalized.clone(), term.clone());
        }

        // Add aliases
        {
            let mut alias_map = self.alias_map.write().await;
            for alias in &term.aliases {
                alias_map.insert(alias.to_lowercase(), normalized.clone());
            }
        }

        // Add to category index
        {
            let mut category_index = self.category_index.write().await;
            category_index
                .entry(term.category)
                .or_insert_with(HashSet::new)
                .insert(normalized);
        }
    }

    /// Look up a term (checks both direct terms and aliases)
    pub async fn lookup(&self, input: &str) -> Option<VocabularyTerm> {
        let normalized = input.to_lowercase();

        // Check direct terms first
        {
            let terms = self.terms.read().await;
            if let Some(term) = terms.get(&normalized) {
                return Some(term.clone());
            }
        }

        // Check aliases
        {
            let alias_map = self.alias_map.read().await;
            if let Some(term_key) = alias_map.get(&normalized) {
                let terms = self.terms.read().await;
                if let Some(term) = terms.get(term_key) {
                    return Some(term.clone());
                }
            }
        }

        None
    }

    /// Correct a misrecognized term
    pub async fn correct(&self, input: &str) -> String {
        let normalized = input.to_lowercase();

        // Check corrections map
        {
            let corrections = self.corrections.read().await;
            if let Some(corrected) = corrections.get(&normalized) {
                return corrected.clone();
            }
        }

        // Check if we have a matching term
        if let Some(term) = self.lookup(input).await {
            return term.term;
        }

        // Return original if no correction found
        input.to_string()
    }

    /// Add a correction mapping
    pub async fn add_correction(&self, from: &str, to: &str) {
        let mut corrections = self.corrections.write().await;
        corrections.insert(from.to_lowercase(), to.to_string());
    }

    /// Get all terms in a category
    pub async fn get_by_category(&self, category: VocabularyCategory) -> Vec<VocabularyTerm> {
        let category_index = self.category_index.read().await;
        let terms = self.terms.read().await;

        category_index
            .get(&category)
            .map(|keys| {
                keys.iter()
                    .filter_map(|key| terms.get(key).cloned())
                    .collect()
            })
            .unwrap_or_default()
    }

    /// Get custom user terms
    pub async fn get_custom_terms(&self) -> Vec<VocabularyTerm> {
        let terms = self.terms.read().await;
        terms.values().filter(|t| t.is_custom).cloned().collect()
    }

    /// Remove a custom term
    pub async fn remove_custom_term(&self, term: &str) -> bool {
        let normalized = term.to_lowercase();
        let mut terms = self.terms.write().await;

        if let Some(existing) = terms.get(&normalized) {
            if existing.is_custom {
                terms.remove(&normalized);
                return true;
            }
        }
        false
    }

    /// Process text and apply vocabulary corrections
    pub async fn process_text(&self, text: &str) -> ProcessedText {
        let words: Vec<&str> = text.split_whitespace().collect();
        let mut corrected_words = Vec::new();
        let mut corrections_made = Vec::new();

        for word in words {
            let corrected = self.correct(word).await;
            if corrected != word {
                corrections_made.push(CorrectionRecord {
                    original: word.to_string(),
                    corrected: corrected.clone(),
                    position: corrected_words.len(),
                });
            }
            corrected_words.push(corrected);
        }

        ProcessedText {
            original: text.to_string(),
            corrected: corrected_words.join(" "),
            corrections: corrections_made,
        }
    }

    /// Export vocabulary for STT service prompt
    pub async fn export_for_stt(&self) -> Vec<String> {
        let terms = self.terms.read().await;
        terms.values().map(|t| t.term.clone()).collect()
    }

    // Load vocabulary categories

    async fn load_programming_languages(&self) {
        let languages = vec![
            ("JavaScript", vec!["java script", "js"]),
            ("TypeScript", vec!["type script", "ts"]),
            ("Python", vec!["python3", "py"]),
            ("Rust", vec![]),
            ("Go", vec!["golang"]),
            ("Java", vec![]),
            ("C++", vec!["c plus plus", "cpp"]),
            ("C#", vec!["c sharp", "csharp"]),
            ("Ruby", vec![]),
            ("PHP", vec![]),
            ("Swift", vec![]),
            ("Kotlin", vec![]),
            ("Scala", vec![]),
            ("Haskell", vec![]),
            ("Elixir", vec![]),
            ("Clojure", vec![]),
            ("R", vec!["rlang"]),
            ("Julia", vec![]),
            ("Dart", vec![]),
            ("Lua", vec![]),
            ("Perl", vec![]),
            ("Bash", vec!["shell"]),
            ("PowerShell", vec!["power shell", "pwsh"]),
            ("SQL", vec!["sequel"]),
            ("GraphQL", vec!["graph ql"]),
            ("HTML", vec!["h t m l"]),
            ("CSS", vec!["c s s"]),
            ("SASS", vec![]),
            ("SCSS", vec![]),
            ("YAML", vec!["yml"]),
            ("JSON", vec!["jason"]),
            ("XML", vec![]),
            ("Markdown", vec!["md"]),
        ];

        for (lang, aliases) in languages {
            self.add_term(
                VocabularyTerm::new(lang, VocabularyCategory::Languages)
                    .with_aliases(aliases)
                    .with_weight(1.5)
            ).await;
        }
    }

    async fn load_frameworks(&self) {
        let frameworks = vec![
            ("React", vec!["react js", "reactjs"]),
            ("Vue", vec!["vue js", "vuejs", "view"]),
            ("Angular", vec!["angular js"]),
            ("Svelte", vec!["svelt"]),
            ("Next.js", vec!["next js", "nextjs", "next"]),
            ("Nuxt", vec!["nuxt js", "nuxtjs"]),
            ("Remix", vec![]),
            ("Astro", vec![]),
            ("Express", vec!["express js"]),
            ("Fastify", vec![]),
            ("NestJS", vec!["nest js", "nest"]),
            ("Django", vec!["jango"]),
            ("Flask", vec![]),
            ("FastAPI", vec!["fast api", "fast a p i"]),
            ("Rails", vec!["ruby on rails", "ror"]),
            ("Spring", vec!["spring boot"]),
            ("Laravel", vec![]),
            ("Symfony", vec![]),
            ("Phoenix", vec![]),
            ("Gin", vec![]),
            ("Echo", vec![]),
            ("Actix", vec!["actix web"]),
            ("Axum", vec![]),
            ("Rocket", vec![]),
            ("Tauri", vec!["tori", "towri"]),
            ("Electron", vec![]),
            ("Flutter", vec![]),
            ("React Native", vec!["react native", "rn"]),
            ("Expo", vec![]),
            ("SwiftUI", vec!["swift ui", "swift you i"]),
            ("Jetpack Compose", vec!["jetpack"]),
            ("TailwindCSS", vec!["tailwind", "tailwind css"]),
            ("Bootstrap", vec![]),
            ("Material UI", vec!["material", "mui"]),
            ("Chakra UI", vec!["chakra"]),
            ("Radix", vec!["radix ui"]),
            ("shadcn", vec!["shad cn", "shadow cn", "shad c n"]),
            ("Prisma", vec![]),
            ("Drizzle", vec![]),
            ("TypeORM", vec!["type orm"]),
            ("Sequelize", vec![]),
            ("Mongoose", vec![]),
            ("Redux", vec!["redux toolkit", "rtk"]),
            ("Zustand", vec![]),
            ("Jotai", vec![]),
            ("Recoil", vec![]),
            ("MobX", vec!["mob x"]),
            ("TanStack Query", vec!["react query", "tan stack"]),
            ("SWR", vec!["s w r"]),
            ("tRPC", vec!["t rpc", "trpc"]),
            ("Zod", vec![]),
            ("Yup", vec![]),
            ("Vite", vec!["veet", "vight"]),
            ("Webpack", vec!["web pack"]),
            ("Rollup", vec!["roll up"]),
            ("esbuild", vec!["e s build", "es build"]),
            ("Turbopack", vec!["turbo pack"]),
            ("Bun", vec!["bun js"]),
            ("Deno", vec!["deeno"]),
            ("Jest", vec![]),
            ("Vitest", vec!["vi test"]),
            ("Playwright", vec!["play wright"]),
            ("Cypress", vec![]),
            ("Testing Library", vec!["rtl"]),
            ("Storybook", vec!["story book"]),
            ("Chromatic", vec![]),
        ];

        for (framework, aliases) in frameworks {
            self.add_term(
                VocabularyTerm::new(framework, VocabularyCategory::Frameworks)
                    .with_aliases(aliases)
                    .with_weight(1.5)
            ).await;
        }
    }

    async fn load_cli_tools(&self) {
        let tools = vec![
            ("npm", vec!["n p m"]),
            ("yarn", vec!["yarn package"]),
            ("pnpm", vec!["p n p m", "pee npm"]),
            ("npx", vec!["n p x"]),
            ("pip", vec!["pip install"]),
            ("pip3", vec!["pip 3"]),
            ("cargo", vec![]),
            ("rustup", vec!["rust up"]),
            ("go", vec!["go lang"]),
            ("dotnet", vec!["dot net", ".net"]),
            ("gradle", vec![]),
            ("maven", vec!["mvn"]),
            ("composer", vec![]),
            ("gem", vec!["ruby gem"]),
            ("brew", vec!["homebrew", "home brew"]),
            ("apt", vec!["apt get", "apt-get"]),
            ("yum", vec![]),
            ("pacman", vec![]),
            ("choco", vec!["chocolatey"]),
            ("scoop", vec![]),
            ("git", vec!["get", "guit"]),
            ("gh", vec!["github cli"]),
            ("docker", vec!["docker container"]),
            ("docker-compose", vec!["docker compose"]),
            ("podman", vec![]),
            ("kubectl", vec!["cube cuttle", "cube ctl", "kube ctl", "kube control"]),
            ("helm", vec![]),
            ("terraform", vec!["terra form"]),
            ("ansible", vec![]),
            ("pulumi", vec![]),
            ("aws", vec!["a w s", "amazon"]),
            ("gcloud", vec!["g cloud", "google cloud"]),
            ("az", vec!["azure cli"]),
            ("vercel", vec!["vercell", "versel"]),
            ("netlify", vec!["net li fy"]),
            ("fly", vec!["fly io", "fly.io"]),
            ("railway", vec![]),
            ("heroku", vec!["hero ku"]),
            ("supabase", vec!["supa base", "super base"]),
            ("firebase", vec!["fire base"]),
            ("curl", vec!["c url"]),
            ("wget", vec!["w get"]),
            ("httpie", vec!["http ie"]),
            ("jq", vec!["j q"]),
            ("yq", vec!["y q"]),
            ("sed", vec!["s e d"]),
            ("awk", vec![]),
            ("grep", vec!["g rep"]),
            ("ripgrep", vec!["rg", "rip grep"]),
            ("fd", vec!["f d"]),
            ("fzf", vec!["f z f"]),
            ("tmux", vec!["t mux"]),
            ("vim", vec!["vi improved"]),
            ("neovim", vec!["nvim", "neo vim"]),
            ("emacs", vec!["e macs"]),
            ("code", vec!["vs code", "vscode"]),
            ("cursor", vec![]),
            ("zed", vec![]),
        ];

        for (tool, aliases) in tools {
            self.add_term(
                VocabularyTerm::new(tool, VocabularyCategory::CliTools)
                    .with_aliases(aliases)
                    .with_weight(2.0) // High weight for CLI tools
            ).await;
        }
    }

    async fn load_ai_models(&self) {
        let models = vec![
            // OpenAI
            ("GPT-4", vec!["gpt 4", "gpt four", "g p t 4"]),
            ("GPT-4o", vec!["gpt 4 o", "gpt four o", "g p t 4 o", "gpt 4 oh"]),
            ("GPT-4o-mini", vec!["gpt 4 o mini", "gpt four o mini"]),
            ("GPT-5", vec!["gpt 5", "gpt five", "g p t 5"]),
            ("o1", vec!["o 1", "oh one", "o one"]),
            ("o1-mini", vec!["o 1 mini", "oh one mini"]),
            ("o1-pro", vec!["o 1 pro", "oh one pro"]),
            ("o3", vec!["o 3", "oh three"]),
            ("o3-mini", vec!["o 3 mini", "oh three mini"]),
            ("DALL-E", vec!["dall e", "dolly", "dali"]),
            ("DALL-E 3", vec!["dall e 3", "dolly 3"]),
            ("Whisper", vec![]),
            ("Codex", vec!["co dex"]),
            // Anthropic
            ("Claude", vec!["claud", "cloud"]),
            ("Claude 3", vec!["claude three"]),
            ("Claude 3.5", vec!["claude 3 point 5", "claude three point five"]),
            ("Claude 4", vec!["claude four"]),
            ("Claude 4.5 Sonnet", vec!["claude 4 point 5 sonnet"]),
            ("Claude Opus", vec!["claude opus"]),
            ("Claude Sonnet", vec!["claude sonnet"]),
            ("Claude Haiku", vec!["claude haiku", "claude hi ku"]),
            ("Claude Code", vec!["claude code", "claud code"]),
            // Google
            ("Gemini", vec!["gemeni", "jemini"]),
            ("Gemini Pro", vec!["gemini pro"]),
            ("Gemini Ultra", vec!["gemini ultra"]),
            ("Gemini 2.0", vec!["gemini 2", "gemini two"]),
            ("Gemini 2.5 Flash", vec!["gemini 2 point 5 flash"]),
            ("PaLM", vec!["palm 2", "p a l m"]),
            ("Bard", vec![]),
            // Meta
            ("LLaMA", vec!["llama", "lama", "l l a m a"]),
            ("LLaMA 2", vec!["llama 2", "llama two"]),
            ("LLaMA 3", vec!["llama 3", "llama three"]),
            ("LLaMA 3.1", vec!["llama 3 point 1"]),
            ("LLaMA 3.2", vec!["llama 3 point 2"]),
            ("LLaMA 4", vec!["llama 4", "llama four"]),
            ("Code LLaMA", vec!["code llama"]),
            // Mistral
            ("Mistral", vec!["mistral ai"]),
            ("Mixtral", vec!["mix tral"]),
            ("Mistral Large", vec!["mistral large"]),
            ("Pixtral", vec!["pix tral"]),
            // Cohere
            ("Command", vec!["cohere command"]),
            ("Command R", vec!["command r"]),
            ("Command R+", vec!["command r plus"]),
            // Others
            ("Stable Diffusion", vec!["stable diffusion", "sd"]),
            ("SDXL", vec!["s d x l", "sd xl"]),
            ("Midjourney", vec!["mid journey"]),
            ("Flux", vec![]),
            ("Sora", vec![]),
            ("ElevenLabs", vec!["eleven labs", "11 labs"]),
            ("Deepgram", vec!["deep gram"]),
            ("AssemblyAI", vec!["assembly ai", "assembly a i"]),
            ("Whisper.cpp", vec!["whisper cpp"]),
            ("Ollama", vec!["o llama"]),
            ("LMStudio", vec!["l m studio", "lm studio"]),
            ("LocalAI", vec!["local ai", "local a i"]),
            ("vLLM", vec!["v l l m", "v llm"]),
            ("TensorRT-LLM", vec!["tensor rt llm"]),
            ("PyTorch", vec!["pie torch", "py torch", "high torch"]),
            ("TensorFlow", vec!["tensor flow"]),
            ("JAX", vec!["jax"]),
            ("Hugging Face", vec!["hugging face", "huggingface", "hf"]),
            ("Transformers", vec![]),
            ("LangChain", vec!["lang chain"]),
            ("LlamaIndex", vec!["llama index"]),
            ("AutoGPT", vec!["auto gpt", "auto g p t"]),
            ("CrewAI", vec!["crew ai", "crew a i"]),
            ("Copilot", vec!["co pilot", "github copilot"]),
            ("Cursor", vec![]),
            ("Codeium", vec!["code ium"]),
            ("Tabnine", vec!["tab nine"]),
            ("Replit", vec!["rep lit"]),
        ];

        for (model, aliases) in models {
            self.add_term(
                VocabularyTerm::new(model, VocabularyCategory::AiModels)
                    .with_aliases(aliases)
                    .with_weight(2.5) // Very high weight for AI models - critical for accuracy
            ).await;
        }
    }

    async fn load_cloud_services(&self) {
        let services = vec![
            ("AWS", vec!["a w s", "amazon web services"]),
            ("EC2", vec!["e c 2", "e c two"]),
            ("S3", vec!["s 3", "s three"]),
            ("Lambda", vec!["aws lambda"]),
            ("DynamoDB", vec!["dynamo db", "dynamo d b"]),
            ("RDS", vec!["r d s"]),
            ("ECS", vec!["e c s"]),
            ("EKS", vec!["e k s"]),
            ("CloudFront", vec!["cloud front"]),
            ("Route 53", vec!["route 53", "route fifty three"]),
            ("IAM", vec!["i a m"]),
            ("SQS", vec!["s q s"]),
            ("SNS", vec!["s n s"]),
            ("Cognito", vec!["cog nito"]),
            ("Amplify", vec!["aws amplify"]),
            ("Azure", vec!["microsoft azure"]),
            ("Azure Functions", vec!["azure functions"]),
            ("Azure DevOps", vec!["azure dev ops"]),
            ("CosmosDB", vec!["cosmos db", "cosmos d b"]),
            ("GCP", vec!["g c p", "google cloud platform"]),
            ("Cloud Run", vec!["google cloud run"]),
            ("Cloud Functions", vec!["google cloud functions"]),
            ("BigQuery", vec!["big query"]),
            ("Firestore", vec!["fire store"]),
            ("Cloud Storage", vec!["gcs"]),
            ("Vercel", vec!["vercell"]),
            ("Netlify", vec!["net li fy"]),
            ("Cloudflare", vec!["cloud flare", "cf"]),
            ("Cloudflare Workers", vec!["cf workers"]),
            ("Cloudflare Pages", vec!["cf pages"]),
            ("DigitalOcean", vec!["digital ocean", "do"]),
            ("Linode", vec!["lin ode"]),
            ("Vultr", vec!["vul ter"]),
            ("Hetzner", vec!["hetz ner"]),
            ("Fly.io", vec!["fly io", "fly dot io"]),
            ("Railway", vec!["railway app"]),
            ("Render", vec!["render com"]),
            ("Supabase", vec!["supa base", "super base"]),
            ("Firebase", vec!["fire base", "google firebase"]),
            ("MongoDB Atlas", vec!["mongo atlas", "mongo d b atlas"]),
            ("PlanetScale", vec!["planet scale"]),
            ("Neon", vec!["neon db", "neon database"]),
            ("Upstash", vec!["up stash"]),
            ("Redis Cloud", vec!["redis labs"]),
            ("Algolia", vec!["al go lia"]),
            ("Elasticsearch", vec!["elastic search", "e s"]),
            ("Pinecone", vec!["pine cone"]),
            ("Weaviate", vec!["weave i ate"]),
            ("Qdrant", vec!["q drant"]),
            ("Milvus", vec!["mil vus"]),
            ("Auth0", vec!["auth zero", "auth oh"]),
            ("Clerk", vec![]),
            ("Okta", vec!["ok ta"]),
            ("Stripe", vec![]),
            ("Twilio", vec!["twil io"]),
            ("SendGrid", vec!["send grid"]),
            ("Mailgun", vec!["mail gun"]),
            ("Resend", vec!["re send"]),
            ("Segment", vec![]),
            ("Mixpanel", vec!["mix panel"]),
            ("PostHog", vec!["post hog"]),
            ("Datadog", vec!["data dog"]),
            ("New Relic", vec!["new relic"]),
            ("Sentry", vec![]),
            ("LogRocket", vec!["log rocket"]),
            ("LaunchDarkly", vec!["launch darkly"]),
        ];

        for (service, aliases) in services {
            self.add_term(
                VocabularyTerm::new(service, VocabularyCategory::CloudServices)
                    .with_aliases(aliases)
                    .with_weight(1.5)
            ).await;
        }
    }

    async fn load_databases(&self) {
        let databases = vec![
            ("PostgreSQL", vec!["postgres", "post gres", "postgre sql"]),
            ("MySQL", vec!["my sql", "my sequel"]),
            ("MariaDB", vec!["maria db", "maria d b"]),
            ("SQLite", vec!["sql lite", "sq lite"]),
            ("MongoDB", vec!["mongo", "mongo db", "mongo d b"]),
            ("Redis", vec!["red is"]),
            ("Memcached", vec!["mem cache", "mem cached"]),
            ("Elasticsearch", vec!["elastic", "elastic search"]),
            ("Cassandra", vec!["cass andra"]),
            ("CockroachDB", vec!["cockroach", "cockroach db"]),
            ("TiDB", vec!["ti db", "ti d b"]),
            ("ClickHouse", vec!["click house"]),
            ("DuckDB", vec!["duck db", "duck d b"]),
            ("Neo4j", vec!["neo 4 j", "neo four j"]),
            ("ArangoDB", vec!["arango db"]),
            ("InfluxDB", vec!["influx db", "influx d b"]),
            ("TimescaleDB", vec!["time scale db"]),
            ("Supabase", vec!["supa base"]),
            ("FaunaDB", vec!["fauna db", "fauna"]),
            ("PlanetScale", vec!["planet scale"]),
            ("Neon", vec!["neon db"]),
            ("Turso", vec!["turso db"]),
            ("libSQL", vec!["lib sql"]),
            ("Prisma", vec![]),
            ("Drizzle", vec!["drizzle orm"]),
        ];

        for (db, aliases) in databases {
            self.add_term(
                VocabularyTerm::new(db, VocabularyCategory::Databases)
                    .with_aliases(aliases)
                    .with_weight(1.5)
            ).await;
        }
    }

    async fn load_devops(&self) {
        let devops = vec![
            ("Docker", vec!["docker container"]),
            ("Kubernetes", vec!["k8s", "kube", "cube er netties"]),
            ("Terraform", vec!["terra form"]),
            ("Ansible", vec!["an sible"]),
            ("Pulumi", vec!["pu lumi"]),
            ("Helm", vec!["helm chart"]),
            ("ArgoCD", vec!["argo cd", "argo c d"]),
            ("Jenkins", vec!["jenk ins"]),
            ("GitHub Actions", vec!["github actions", "gh actions"]),
            ("GitLab CI", vec!["gitlab ci", "git lab c i"]),
            ("CircleCI", vec!["circle ci", "circle c i"]),
            ("Travis CI", vec!["travis", "travis c i"]),
            ("Drone", vec!["drone ci"]),
            ("Buildkite", vec!["build kite"]),
            ("Tekton", vec!["tek ton"]),
            ("Prometheus", vec!["pro metheus"]),
            ("Grafana", vec!["gra fana"]),
            ("Loki", vec!["loki logs"]),
            ("Jaeger", vec!["jae ger"]),
            ("Zipkin", vec!["zip kin"]),
            ("OpenTelemetry", vec!["open telemetry", "otel"]),
            ("Nginx", vec!["engine x", "n ginx"]),
            ("Caddy", vec!["caddy server"]),
            ("Traefik", vec!["tray fik"]),
            ("HAProxy", vec!["h a proxy", "ha proxy"]),
            ("Envoy", vec!["en voy"]),
            ("Istio", vec!["is tio"]),
            ("Linkerd", vec!["linker d"]),
            ("Consul", vec!["con sul"]),
            ("Vault", vec!["hashi vault", "hashicorp vault"]),
            ("Packer", vec!["hash packer"]),
            ("Vagrant", vec!["vag rant"]),
        ];

        for (tool, aliases) in devops {
            self.add_term(
                VocabularyTerm::new(tool, VocabularyCategory::DevOps)
                    .with_aliases(aliases)
                    .with_weight(1.5)
            ).await;
        }
    }

    async fn load_syntax(&self) {
        let syntax = vec![
            // Common code patterns
            ("async", vec!["a sync"]),
            ("await", vec!["a wait"]),
            ("const", vec!["constant"]),
            ("let", vec![]),
            ("var", vec!["variable"]),
            ("function", vec!["func"]),
            ("return", vec![]),
            ("import", vec![]),
            ("export", vec![]),
            ("default", vec![]),
            ("class", vec![]),
            ("interface", vec!["inter face"]),
            ("type", vec!["type alias"]),
            ("enum", vec!["e num", "enumeration"]),
            ("struct", vec![]),
            ("impl", vec!["implementation"]),
            ("trait", vec![]),
            ("pub", vec!["public"]),
            ("private", vec!["priv"]),
            ("protected", vec![]),
            ("static", vec![]),
            ("readonly", vec!["read only"]),
            ("abstract", vec![]),
            ("extends", vec![]),
            ("implements", vec![]),
            ("super", vec![]),
            ("this", vec![]),
            ("self", vec![]),
            ("null", vec!["nil"]),
            ("undefined", vec![]),
            ("void", vec![]),
            ("boolean", vec!["bool"]),
            ("string", vec!["str"]),
            ("number", vec!["num"]),
            ("integer", vec!["int"]),
            ("float", vec!["f32", "f64"]),
            ("double", vec![]),
            ("array", vec!["arr"]),
            ("object", vec!["obj"]),
            ("map", vec!["hashmap", "hash map"]),
            ("set", vec!["hashset"]),
            ("vector", vec!["vec"]),
            ("tuple", vec![]),
            ("option", vec!["optional"]),
            ("result", vec![]),
            ("promise", vec![]),
            ("observable", vec![]),
            ("callback", vec!["call back"]),
            ("lambda", vec!["arrow function"]),
            ("closure", vec![]),
            ("generic", vec!["generics"]),
            ("template", vec![]),
            ("decorator", vec!["@ decorator"]),
            ("annotation", vec!["@ annotation"]),
            ("middleware", vec!["middle ware"]),
            ("handler", vec![]),
            ("controller", vec![]),
            ("service", vec![]),
            ("repository", vec!["repo"]),
            ("model", vec![]),
            ("schema", vec![]),
            ("mutation", vec![]),
            ("query", vec![]),
            ("subscription", vec![]),
            ("resolver", vec![]),
            // Naming conventions
            ("camelCase", vec!["camel case"]),
            ("PascalCase", vec!["pascal case"]),
            ("snake_case", vec!["snake case"]),
            ("kebab-case", vec!["kebab case"]),
            ("SCREAMING_SNAKE_CASE", vec!["screaming snake case", "constant case"]),
        ];

        for (term, aliases) in syntax {
            self.add_term(
                VocabularyTerm::new(term, VocabularyCategory::Syntax)
                    .with_aliases(aliases)
                    .with_weight(1.0)
            ).await;
        }
    }

    async fn load_common_corrections(&self) {
        // Common misrecognitions mapped to correct terms
        // Based on AquaVoice's examples of what other STT systems get wrong
        let corrections = vec![
            // AI Models
            ("high torch", "PyTorch"),
            ("pie torch", "PyTorch"),
            ("cube cuttle", "kubectl"),
            ("kube cuttle", "kubectl"),
            ("c sharp c", "zshrc"),
            ("z sh r c", "zshrc"),
            ("bash r c", "bashrc"),
            ("dot bash r c", ".bashrc"),
            ("dot z sh r c", ".zshrc"),
            // Common tools
            ("get", "git"),
            ("guit", "git"),
            ("get hub", "GitHub"),
            ("jason", "JSON"),
            ("sequel", "SQL"),
            // Frameworks
            ("veet", "Vite"),
            ("next js", "Next.js"),
            ("react js", "React"),
            ("view js", "Vue"),
            // Cloud
            ("super base", "Supabase"),
            ("supa base", "Supabase"),
            // Commands
            ("cd", "cd"),
            ("ls", "ls"),
            ("mkdir", "mkdir"),
            ("rm", "rm"),
            ("mv", "mv"),
            ("cp", "cp"),
        ];

        for (from, to) in corrections {
            self.add_correction(from, to).await;
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProcessedText {
    pub original: String,
    pub corrected: String,
    pub corrections: Vec<CorrectionRecord>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CorrectionRecord {
    pub original: String,
    pub corrected: String,
    pub position: usize,
}

// Tauri commands

#[tauri::command]
pub async fn initialize_code_vocabulary() -> Result<(), String> {
    get_code_vocabulary().initialize().await;
    Ok(())
}

#[tauri::command]
pub async fn lookup_vocabulary_term(term: String) -> Result<Option<VocabularyTerm>, String> {
    Ok(get_code_vocabulary().lookup(&term).await)
}

#[tauri::command]
pub async fn correct_code_text(text: String) -> Result<String, String> {
    Ok(get_code_vocabulary().correct(&text).await)
}

#[tauri::command]
pub async fn process_code_text(text: String) -> Result<ProcessedText, String> {
    Ok(get_code_vocabulary().process_text(&text).await)
}

#[tauri::command]
pub async fn add_custom_term(
    term: String,
    aliases: Vec<String>,
    category: String,
) -> Result<(), String> {
    let cat = match category.as_str() {
        "languages" => VocabularyCategory::Languages,
        "frameworks" => VocabularyCategory::Frameworks,
        "cli_tools" => VocabularyCategory::CliTools,
        "ai_models" => VocabularyCategory::AiModels,
        "cloud_services" => VocabularyCategory::CloudServices,
        "databases" => VocabularyCategory::Databases,
        "devops" => VocabularyCategory::DevOps,
        "syntax" => VocabularyCategory::Syntax,
        _ => VocabularyCategory::Custom,
    };

    let vocab_term = VocabularyTerm::new(&term, cat)
        .with_aliases(aliases.iter().map(|s| s.as_str()).collect())
        .custom();

    get_code_vocabulary().add_term(vocab_term).await;
    Ok(())
}

#[tauri::command]
pub async fn remove_custom_term(term: String) -> Result<bool, String> {
    Ok(get_code_vocabulary().remove_custom_term(&term).await)
}

#[tauri::command]
pub async fn get_custom_terms() -> Result<Vec<VocabularyTerm>, String> {
    Ok(get_code_vocabulary().get_custom_terms().await)
}

#[tauri::command]
pub async fn export_vocabulary_for_stt() -> Result<Vec<String>, String> {
    Ok(get_code_vocabulary().export_for_stt().await)
}

#[tauri::command]
pub async fn add_vocabulary_correction(from: String, to: String) -> Result<(), String> {
    get_code_vocabulary().add_correction(&from, &to).await;
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_vocabulary_lookup() {
        let vocab = CodeVocabulary::new();
        vocab.initialize().await;

        // Test direct lookup
        let result = vocab.lookup("React").await;
        assert!(result.is_some());

        // Test alias lookup
        let result = vocab.lookup("reactjs").await;
        assert!(result.is_some());
    }

    #[tokio::test]
    async fn test_vocabulary_correction() {
        let vocab = CodeVocabulary::new();
        vocab.initialize().await;

        // Test correction
        let corrected = vocab.correct("high torch").await;
        assert_eq!(corrected, "PyTorch");

        let corrected = vocab.correct("cube cuttle").await;
        assert_eq!(corrected, "kubectl");
    }

    #[tokio::test]
    async fn test_custom_terms() {
        let vocab = CodeVocabulary::new();

        // Add custom term
        let custom = VocabularyTerm::new("MyCustomTool", VocabularyCategory::Custom)
            .with_aliases(vec!["mct", "my custom tool"])
            .custom();

        vocab.add_term(custom).await;

        // Verify it can be looked up
        let result = vocab.lookup("mct").await;
        assert!(result.is_some());
        assert!(result.unwrap().is_custom);
    }
}
