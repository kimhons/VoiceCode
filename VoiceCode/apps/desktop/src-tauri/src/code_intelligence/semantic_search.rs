// Phase 2: Semantic Search Infrastructure
// Embedding generation and vector-based code search

use std::collections::HashMap;
use std::path::{Path, PathBuf};
use std::sync::Arc;
use serde::{Deserialize, Serialize};
use parking_lot::RwLock;

use super::chunker::{CodeChunk, ChunkType};

/// Embedding vector dimension
pub const EMBEDDING_DIM: usize = 384; // MiniLM default

/// A single embedding vector
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Embedding {
    pub id: String,
    pub vector: Vec<f32>,
    pub metadata: EmbeddingMetadata,
}

/// Metadata associated with an embedding
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EmbeddingMetadata {
    pub chunk_id: String,
    pub file_path: PathBuf,
    pub chunk_type: ChunkType,
    pub name: String,
    pub start_line: usize,
    pub end_line: usize,
    pub language: String,
    pub token_count: usize,
}

/// Configuration for the embedding service
#[derive(Debug, Clone)]
pub struct EmbeddingConfig {
    /// Model to use for embeddings
    pub model: EmbeddingModel,
    /// Batch size for processing
    pub batch_size: usize,
    /// Maximum concurrent requests
    pub max_concurrent: usize,
    /// Cache embeddings
    pub cache_enabled: bool,
    /// Normalize vectors
    pub normalize: bool,
}

impl Default for EmbeddingConfig {
    fn default() -> Self {
        Self {
            model: EmbeddingModel::Local,
            batch_size: 32,
            max_concurrent: 4,
            cache_enabled: true,
            normalize: true,
        }
    }
}

/// Embedding model options
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum EmbeddingModel {
    /// Local model (fastembed/onnx)
    Local,
    /// OpenAI text-embedding-3-small
    OpenAISmall,
    /// OpenAI text-embedding-3-large
    OpenAILarge,
    /// Cohere embed-v3
    Cohere,
    /// Voyage AI code embeddings
    Voyage,
}

impl EmbeddingModel {
    pub fn dimension(&self) -> usize {
        match self {
            EmbeddingModel::Local => 384,
            EmbeddingModel::OpenAISmall => 1536,
            EmbeddingModel::OpenAILarge => 3072,
            EmbeddingModel::Cohere => 1024,
            EmbeddingModel::Voyage => 1024,
        }
    }
}

/// Search result from vector search
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SearchResult {
    pub chunk_id: String,
    pub file_path: PathBuf,
    pub name: String,
    pub content: String,
    pub similarity: f32,
    pub chunk_type: ChunkType,
    pub start_line: usize,
    pub end_line: usize,
    pub language: String,
}

/// Embedding service for code search
pub struct EmbeddingService {
    config: EmbeddingConfig,
    embeddings: RwLock<HashMap<String, Embedding>>,
    chunk_content: RwLock<HashMap<String, String>>,
}

impl EmbeddingService {
    pub fn new(config: EmbeddingConfig) -> Self {
        Self {
            config,
            embeddings: RwLock::new(HashMap::new()),
            chunk_content: RwLock::new(HashMap::new()),
        }
    }

    /// Generate embeddings for a batch of chunks
    pub async fn embed_chunks(&self, chunks: &[CodeChunk]) -> Result<Vec<Embedding>, String> {
        let mut results = Vec::new();

        for batch in chunks.chunks(self.config.batch_size) {
            let batch_results = self.embed_batch(batch).await?;
            results.extend(batch_results);
        }

        // Store embeddings
        let mut embeddings = self.embeddings.write();
        let mut content = self.chunk_content.write();
        for (embedding, chunk) in results.iter().zip(chunks.iter()) {
            embeddings.insert(embedding.id.clone(), embedding.clone());
            content.insert(chunk.id.clone(), chunk.content.clone());
        }

        Ok(results)
    }

    /// Embed a single batch of chunks
    async fn embed_batch(&self, chunks: &[CodeChunk]) -> Result<Vec<Embedding>, String> {
        let texts: Vec<String> = chunks
            .iter()
            .map(|c| self.prepare_text_for_embedding(c))
            .collect();

        let vectors = self.generate_embeddings(&texts).await?;

        let embeddings: Vec<Embedding> = chunks
            .iter()
            .zip(vectors.into_iter())
            .map(|(chunk, vector)| {
                Embedding {
                    id: format!("emb_{}", chunk.id),
                    vector: if self.config.normalize {
                        normalize_vector(&vector)
                    } else {
                        vector
                    },
                    metadata: EmbeddingMetadata {
                        chunk_id: chunk.id.clone(),
                        file_path: chunk.file_path.clone(),
                        chunk_type: chunk.chunk_type.clone(),
                        name: chunk.name.clone(),
                        start_line: chunk.start_line,
                        end_line: chunk.end_line,
                        language: chunk.language.clone(),
                        token_count: chunk.token_count,
                    },
                }
            })
            .collect();

        Ok(embeddings)
    }

    /// Prepare text for embedding (add context)
    fn prepare_text_for_embedding(&self, chunk: &CodeChunk) -> String {
        let mut text = String::new();

        // Add type prefix for context
        text.push_str(&format!("[{}] ", format!("{:?}", chunk.chunk_type)));

        // Add name
        if !chunk.name.is_empty() {
            text.push_str(&chunk.name);
            text.push_str(": ");
        }

        // Add signature if available
        if let Some(ref sig) = chunk.signature {
            text.push_str(sig);
            text.push('\n');
        }

        // Add documentation if available
        if let Some(ref doc) = chunk.documentation {
            text.push_str(doc);
            text.push('\n');
        }

        // Add content
        text.push_str(&chunk.content);

        // Truncate to reasonable size
        if text.len() > 8000 {
            text.truncate(8000);
        }

        text
    }

    /// Generate embeddings using configured model
    async fn generate_embeddings(&self, texts: &[String]) -> Result<Vec<Vec<f32>>, String> {
        match self.config.model {
            EmbeddingModel::Local => self.generate_local_embeddings(texts).await,
            _ => self.generate_api_embeddings(texts).await,
        }
    }

    /// Generate embeddings using local model
    async fn generate_local_embeddings(&self, texts: &[String]) -> Result<Vec<Vec<f32>>, String> {
        // For now, use a simple TF-IDF based embedding
        // In production, use fastembed with ONNX runtime
        let embeddings: Vec<Vec<f32>> = texts
            .iter()
            .map(|text| self.simple_embedding(text))
            .collect();

        Ok(embeddings)
    }

    /// Simple embedding fallback (TF-IDF inspired)
    fn simple_embedding(&self, text: &str) -> Vec<f32> {
        let dim = self.config.model.dimension();
        let mut embedding = vec![0.0f32; dim];

        // Tokenize
        let tokens: Vec<&str> = text
            .split(|c: char| !c.is_alphanumeric() && c != '_')
            .filter(|s| !s.is_empty())
            .collect();

        if tokens.is_empty() {
            return embedding;
        }

        // Hash tokens to dimensions
        for token in &tokens {
            let hash = simple_hash(token) as usize;
            let idx = hash % dim;
            embedding[idx] += 1.0;
        }

        // Also add bigrams for context
        for window in tokens.windows(2) {
            let bigram = format!("{}_{}", window[0], window[1]);
            let hash = simple_hash(&bigram) as usize;
            let idx = hash % dim;
            embedding[idx] += 0.5;
        }

        // Normalize
        normalize_vector(&embedding)
    }

    /// Generate embeddings using API
    async fn generate_api_embeddings(&self, texts: &[String]) -> Result<Vec<Vec<f32>>, String> {
        // Placeholder for API-based embeddings
        // In production, implement OpenAI/Cohere/Voyage API calls
        Err("API embeddings not yet implemented. Use local model.".to_string())
    }

    /// Search for similar chunks
    pub async fn search(
        &self,
        query: &str,
        top_k: usize,
        filter: Option<SearchFilter>,
    ) -> Result<Vec<SearchResult>, String> {
        // Generate query embedding
        let query_embedding = self.simple_embedding(query);
        let query_embedding = if self.config.normalize {
            normalize_vector(&query_embedding)
        } else {
            query_embedding
        };

        // Score all embeddings
        let embeddings = self.embeddings.read();
        let content = self.chunk_content.read();

        let mut scored: Vec<(String, f32, &Embedding)> = embeddings
            .values()
            .filter(|emb| {
                if let Some(ref f) = filter {
                    self.matches_filter(emb, f)
                } else {
                    true
                }
            })
            .map(|emb| {
                let similarity = cosine_similarity(&query_embedding, &emb.vector);
                (emb.metadata.chunk_id.clone(), similarity, emb)
            })
            .collect();

        // Sort by similarity (descending)
        scored.sort_by(|a, b| b.1.partial_cmp(&a.1).unwrap_or(std::cmp::Ordering::Equal));

        // Take top_k
        let results: Vec<SearchResult> = scored
            .into_iter()
            .take(top_k)
            .filter_map(|(chunk_id, similarity, emb)| {
                let chunk_content = content.get(&chunk_id)?.clone();
                Some(SearchResult {
                    chunk_id,
                    file_path: emb.metadata.file_path.clone(),
                    name: emb.metadata.name.clone(),
                    content: chunk_content,
                    similarity,
                    chunk_type: emb.metadata.chunk_type.clone(),
                    start_line: emb.metadata.start_line,
                    end_line: emb.metadata.end_line,
                    language: emb.metadata.language.clone(),
                })
            })
            .collect();

        Ok(results)
    }

    /// Check if embedding matches filter
    fn matches_filter(&self, emb: &Embedding, filter: &SearchFilter) -> bool {
        if let Some(ref chunk_types) = filter.chunk_types {
            if !chunk_types.contains(&emb.metadata.chunk_type) {
                return false;
            }
        }

        if let Some(ref languages) = filter.languages {
            if !languages.contains(&emb.metadata.language) {
                return false;
            }
        }

        if let Some(ref file_patterns) = filter.file_patterns {
            let path_str = emb.metadata.file_path.to_string_lossy();
            if !file_patterns.iter().any(|p| path_str.contains(p)) {
                return false;
            }
        }

        if let Some(min_tokens) = filter.min_tokens {
            if emb.metadata.token_count < min_tokens {
                return false;
            }
        }

        true
    }

    /// Remove embeddings for a file
    pub fn remove_file(&self, file_path: &Path) {
        let mut embeddings = self.embeddings.write();
        let mut content = self.chunk_content.write();

        let to_remove: Vec<String> = embeddings
            .values()
            .filter(|e| e.metadata.file_path == file_path)
            .map(|e| e.id.clone())
            .collect();

        for id in &to_remove {
            embeddings.remove(id);
            // Also remove content by chunk_id
            if let Some(emb) = embeddings.get(id) {
                content.remove(&emb.metadata.chunk_id);
            }
        }
    }

    /// Get total embedding count
    pub fn count(&self) -> usize {
        self.embeddings.read().len()
    }

    /// Clear all embeddings
    pub fn clear(&self) {
        self.embeddings.write().clear();
        self.chunk_content.write().clear();
    }

    /// Get statistics
    pub fn stats(&self) -> EmbeddingStats {
        let embeddings = self.embeddings.read();

        let mut by_type: HashMap<ChunkType, usize> = HashMap::new();
        let mut by_language: HashMap<String, usize> = HashMap::new();

        for emb in embeddings.values() {
            *by_type.entry(emb.metadata.chunk_type.clone()).or_default() += 1;
            *by_language.entry(emb.metadata.language.clone()).or_default() += 1;
        }

        EmbeddingStats {
            total_embeddings: embeddings.len(),
            by_chunk_type: by_type,
            by_language,
            dimension: self.config.model.dimension(),
            model: format!("{:?}", self.config.model),
        }
    }
}

/// Search filter options
#[derive(Debug, Clone, Default)]
pub struct SearchFilter {
    pub chunk_types: Option<Vec<ChunkType>>,
    pub languages: Option<Vec<String>>,
    pub file_patterns: Option<Vec<String>>,
    pub min_tokens: Option<usize>,
}

impl SearchFilter {
    pub fn new() -> Self {
        Self::default()
    }

    pub fn chunk_types(mut self, types: Vec<ChunkType>) -> Self {
        self.chunk_types = Some(types);
        self
    }

    pub fn languages(mut self, langs: Vec<String>) -> Self {
        self.languages = Some(langs);
        self
    }

    pub fn file_patterns(mut self, patterns: Vec<String>) -> Self {
        self.file_patterns = Some(patterns);
        self
    }

    pub fn min_tokens(mut self, min: usize) -> Self {
        self.min_tokens = Some(min);
        self
    }
}

/// Embedding statistics
#[derive(Debug, Clone, Serialize)]
pub struct EmbeddingStats {
    pub total_embeddings: usize,
    pub by_chunk_type: HashMap<ChunkType, usize>,
    pub by_language: HashMap<String, usize>,
    pub dimension: usize,
    pub model: String,
}

/// Hybrid search combining keyword and semantic search
pub struct HybridSearcher {
    embedding_service: Arc<EmbeddingService>,
    keyword_weight: f32,
    semantic_weight: f32,
}

impl HybridSearcher {
    pub fn new(embedding_service: Arc<EmbeddingService>) -> Self {
        Self {
            embedding_service,
            keyword_weight: 0.3,
            semantic_weight: 0.7,
        }
    }

    pub fn with_weights(mut self, keyword: f32, semantic: f32) -> Self {
        let total = keyword + semantic;
        self.keyword_weight = keyword / total;
        self.semantic_weight = semantic / total;
        self
    }

    /// Perform hybrid search
    pub async fn search(
        &self,
        query: &str,
        top_k: usize,
        filter: Option<SearchFilter>,
    ) -> Result<Vec<SearchResult>, String> {
        // Get semantic results
        let mut semantic_results = self.embedding_service
            .search(query, top_k * 2, filter.clone())
            .await?;

        // Rerank with keyword matching
        for result in &mut semantic_results {
            let keyword_score = self.keyword_score(query, &result.content, &result.name);
            result.similarity =
                result.similarity * self.semantic_weight +
                keyword_score * self.keyword_weight;
        }

        // Re-sort by combined score
        semantic_results.sort_by(|a, b|
            b.similarity.partial_cmp(&a.similarity).unwrap_or(std::cmp::Ordering::Equal)
        );

        // Take top_k
        semantic_results.truncate(top_k);

        Ok(semantic_results)
    }

    /// Calculate keyword match score
    fn keyword_score(&self, query: &str, content: &str, name: &str) -> f32 {
        let query_lower = query.to_lowercase();
        let content_lower = content.to_lowercase();
        let name_lower = name.to_lowercase();

        let query_terms: Vec<&str> = query_lower
            .split(|c: char| !c.is_alphanumeric() && c != '_')
            .filter(|s| !s.is_empty())
            .collect();

        if query_terms.is_empty() {
            return 0.0;
        }

        let mut score = 0.0;
        let mut matches = 0;

        for term in &query_terms {
            // Exact match in name (highest value)
            if name_lower.contains(term) {
                score += 1.0;
                matches += 1;
            }
            // Match in content
            if content_lower.contains(term) {
                score += 0.5;
                matches += 1;
            }
        }

        if matches > 0 {
            score / (query_terms.len() as f32 * 1.5) // Normalize
        } else {
            0.0
        }
    }
}

/// Reranker for improving search results
pub struct Reranker {
    recency_weight: f32,
    type_weights: HashMap<ChunkType, f32>,
}

impl Reranker {
    pub fn new() -> Self {
        let mut type_weights = HashMap::new();
        type_weights.insert(ChunkType::Function, 1.0);
        type_weights.insert(ChunkType::Class, 0.95);
        type_weights.insert(ChunkType::Interface, 0.9);
        type_weights.insert(ChunkType::Test, 0.85);
        type_weights.insert(ChunkType::Documentation, 0.7);
        type_weights.insert(ChunkType::Imports, 0.4);
        type_weights.insert(ChunkType::Generic, 0.5);

        Self {
            recency_weight: 0.1,
            type_weights,
        }
    }

    /// Rerank results based on multiple signals
    pub fn rerank(&self, results: &mut [SearchResult], context: &RerankerContext) {
        for result in results.iter_mut() {
            let type_boost = self.type_weights
                .get(&result.chunk_type)
                .copied()
                .unwrap_or(0.5);

            // Boost if same file as current context
            let same_file_boost = if let Some(ref current_file) = context.current_file {
                if result.file_path == *current_file { 0.2 } else { 0.0 }
            } else {
                0.0
            };

            // Boost if name matches context symbols
            let symbol_boost = if context.referenced_symbols.iter().any(|s| result.name.contains(s)) {
                0.15
            } else {
                0.0
            };

            result.similarity = result.similarity * type_boost + same_file_boost + symbol_boost;
        }

        results.sort_by(|a, b|
            b.similarity.partial_cmp(&a.similarity).unwrap_or(std::cmp::Ordering::Equal)
        );
    }
}

/// Context for reranking
#[derive(Debug, Clone, Default)]
pub struct RerankerContext {
    pub current_file: Option<PathBuf>,
    pub referenced_symbols: Vec<String>,
    pub recent_files: Vec<PathBuf>,
}

// Utility functions

/// Calculate cosine similarity between two vectors
fn cosine_similarity(a: &[f32], b: &[f32]) -> f32 {
    if a.len() != b.len() || a.is_empty() {
        return 0.0;
    }

    let dot: f32 = a.iter().zip(b.iter()).map(|(x, y)| x * y).sum();
    let norm_a: f32 = a.iter().map(|x| x * x).sum::<f32>().sqrt();
    let norm_b: f32 = b.iter().map(|x| x * x).sum::<f32>().sqrt();

    if norm_a == 0.0 || norm_b == 0.0 {
        0.0
    } else {
        dot / (norm_a * norm_b)
    }
}

/// Normalize a vector to unit length
fn normalize_vector(v: &[f32]) -> Vec<f32> {
    let norm: f32 = v.iter().map(|x| x * x).sum::<f32>().sqrt();
    if norm == 0.0 {
        v.to_vec()
    } else {
        v.iter().map(|x| x / norm).collect()
    }
}

/// Simple string hash function
fn simple_hash(s: &str) -> u64 {
    let mut hash: u64 = 5381;
    for c in s.bytes() {
        hash = ((hash << 5).wrapping_add(hash)).wrapping_add(c as u64);
    }
    hash
}

// Tauri commands

#[tauri::command]
pub async fn semantic_search(
    query: String,
    top_k: usize,
    chunk_types: Option<Vec<String>>,
    languages: Option<Vec<String>>,
) -> Result<Vec<SearchResult>, String> {
    // This would use the actual EmbeddingService instance
    // For now, return placeholder
    Err("Semantic search not initialized. Initialize code intelligence first.".to_string())
}

#[tauri::command]
pub async fn get_embedding_stats() -> Result<EmbeddingStats, String> {
    Err("Embedding service not initialized.".to_string())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_cosine_similarity() {
        let a = vec![1.0, 0.0, 0.0];
        let b = vec![1.0, 0.0, 0.0];
        assert!((cosine_similarity(&a, &b) - 1.0).abs() < 0.001);

        let c = vec![0.0, 1.0, 0.0];
        assert!((cosine_similarity(&a, &c)).abs() < 0.001);
    }

    #[test]
    fn test_normalize_vector() {
        let v = vec![3.0, 4.0];
        let normalized = normalize_vector(&v);
        let norm: f32 = normalized.iter().map(|x| x * x).sum::<f32>().sqrt();
        assert!((norm - 1.0).abs() < 0.001);
    }

    #[test]
    fn test_simple_hash() {
        let hash1 = simple_hash("hello");
        let hash2 = simple_hash("hello");
        let hash3 = simple_hash("world");

        assert_eq!(hash1, hash2);
        assert_ne!(hash1, hash3);
    }

    #[test]
    fn test_embedding_model_dimension() {
        assert_eq!(EmbeddingModel::Local.dimension(), 384);
        assert_eq!(EmbeddingModel::OpenAISmall.dimension(), 1536);
    }
}
