"""
Utility functions for AI Text Processor
Provides helper functions for text analysis, validation, and processing
"""

import re
import time
import hashlib
from typing import List, Dict, Any, Optional, Tuple, Set
from collections import Counter
import logging


class TextAnalyzer:
    """Advanced text analysis utilities"""
    
    @staticmethod
    def count_syllables(word: str) -> int:
        """Count syllables in a word (approximate)"""
        word = word.lower()
        vowels = 'aeiouy'
        syllable_count = 0
        previous_was_vowel = False
        
        for char in word:
            if char in vowels:
                if not previous_was_vowel:
                    syllable_count += 1
                previous_was_vowel = True
            else:
                previous_was_vowel = False
        
        # Handle silent 'e'
        if word.endswith('e') and syllable_count > 1:
            syllable_count -= 1
        
        return max(syllable_count, 1)
    
    @staticmethod
    def calculate_readability(text: str) -> Dict[str, float]:
        """Calculate readability metrics"""
        sentences = re.split(r'[.!?]+', text)
        sentences = [s.strip() for s in sentences if s.strip()]
        
        words = re.findall(r'\b\w+\b', text.lower())
        word_count = len(words)
        sentence_count = len(sentences)
        
        if word_count == 0 or sentence_count == 0:
            return {
                "flesch_score": 0.0,
                "avg_sentence_length": 0.0,
                "avg_syllables_per_word": 0.0
            }
        
        # Calculate syllables
        total_syllables = sum(TextAnalyzer.count_syllables(word) for word in words)
        
        # Flesch Reading Ease Score
        avg_sentence_length = word_count / sentence_count
        avg_syllables_per_word = total_syllables / word_count
        flesch_score = 206.835 - 1.015 * avg_sentence_length - 84.6 * avg_syllables_per_word
        
        return {
            "flesch_score": max(0, min(100, flesch_score)),
            "avg_sentence_length": avg_sentence_length,
            "avg_syllables_per_word": avg_syllables_per_word,
            "total_words": word_count,
            "total_sentences": sentence_count,
            "total_syllables": total_syllables
        }
    
    @staticmethod
    def detect_language_patterns(text: str) -> Dict[str, Any]:
        """Detect language patterns and characteristics"""
        words = re.findall(r'\b\w+\b', text.lower())
        
        # Common patterns
        patterns = {
            "questions": len(re.findall(r'\?', text)),
            "exclamations": len(re.findall(r'!', text)),
            "contractions": len(re.findall(r'\w+\'\w+', text)),
            "numbers": len(re.findall(r'\d+', text)),
            "urls": len(re.findall(r'http[s]?://\S+', text)),
            "emails": len(re.findall(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b', text)),
            "capitalized_words": len(re.findall(r'\b[A-Z][a-z]+\b', text)),
            "all_caps_words": len(re.findall(r'\b[A-Z]{2,}\b', text))
        }
        
        # Common word analysis
        word_freq = Counter(words)
        common_words = set(word_freq.most_common(20))
        
        # Sentiment indicators
        positive_words = {'good', 'great', 'excellent', 'amazing', 'wonderful', 'fantastic', 'awesome'}
        negative_words = {'bad', 'terrible', 'awful', 'horrible', 'disgusting', 'hate', 'dislike'}
        
        positive_count = sum(1 for word in words if word in positive_words)
        negative_count = sum(1 for word in words if word in negative_words)
        
        return {
            "patterns": patterns,
            "most_common_words": dict(common_words),
            "sentiment": {
                "positive": positive_count,
                "negative": negative_count,
                "score": positive_count - negative_count
            },
            "complexity": {
                "unique_words": len(set(words)),
                "vocabulary_richness": len(set(words)) / len(words) if words else 0,
                "word_frequency_distribution": dict(word_freq.most_common(10))
            }
        }
    
    @staticmethod
    def identify_text_type(text: str) -> Dict[str, Any]:
        """Identify the type of text based on content"""
        text_lower = text.lower()
        
        # Scoring system for different text types
        scores = {
            "email": 0,
            "code": 0,
            "document": 0,
            "social": 0,
            "technical": 0,
            "creative": 0
        }
        
        # Email indicators
        if any(word in text_lower for word in ['dear', 'hello', 'best regards', 'sincerely']):
            scores["email"] += 2
        if '@' in text and len(re.findall(r'\S+@\S+', text)) > 0:
            scores["email"] += 3
        
        # Code indicators
        if any(char in text for char in ['{', '}', '(', ')', ';', '=']):
            scores["code"] += 2
        if re.search(r'\b(def|function|class|import|if|for|while)\b', text_lower):
            scores["code"] += 3
        
        # Document indicators
        if len(text.split('\n\n')) > 2:  # Multiple paragraphs
            scores["document"] += 1
        if any(word in text_lower for word in ['therefore', 'furthermore', 'however']):
            scores["document"] += 2
        
        # Social media indicators
        if '#' in text or '@' in text:
            scores["social"] += 2
        if len(text) < 200 and ('!' in text or '?' in text):
            scores["social"] += 1
        
        # Technical indicators
        tech_terms = {'api', 'database', 'server', 'client', 'protocol', 'algorithm'}
        if any(term in text_lower for term in tech_terms):
            scores["technical"] += 2
        
        # Creative indicators
        if any(word in text_lower for word in ['story', 'poem', 'novel', 'metaphor']):
            scores["creative"] += 2
        if len(re.findall(r'[.!?].*[.!?]', text)) > 2:  # Complex sentence structure
            scores["creative"] += 1
        
        # Determine primary type
        primary_type = max(scores, key=scores.get)
        confidence = scores[primary_type] / sum(scores.values()) if sum(scores.values()) > 0 else 0
        
        return {
            "primary_type": primary_type,
            "confidence": min(confidence, 1.0),
            "scores": scores
        }


class TextValidator:
    """Text validation utilities"""
    
    @staticmethod
    def validate_input_text(text: str) -> Tuple[bool, List[str]]:
        """Validate input text for processing"""
        errors = []
        
        if not text or not text.strip():
            errors.append("Text is empty or whitespace only")
            return False, errors
        
        if len(text) > 10000:  # Arbitrary limit
            errors.append("Text too long (max 10,000 characters)")
            return False, errors
        
        if len(text.split()) < 1:
            errors.append("Text contains no words")
            return False, errors
        
        # Check for suspicious content
        suspicious_patterns = [
            (r'<script', "Potentially unsafe HTML content"),
            (r'javascript:', "Potentially unsafe JavaScript"),
            (r'on\w+\s*=', "Potentially unsafe event handlers")
        ]
        
        for pattern, message in suspicious_patterns:
            if re.search(pattern, text, re.IGNORECASE):
                errors.append(message)
        
        return len(errors) == 0, errors
    
    @staticmethod
    def validate_options(options) -> Tuple[bool, List[str]]:
        """Validate processing options"""
        errors = []
        
        if not hasattr(options, 'context'):
            errors.append("Options missing context")
        if not hasattr(options, 'tone'):
            errors.append("Options missing tone")
        
        if hasattr(options, 'aggressiveness'):
            if not 0.0 <= options.aggressiveness <= 1.0:
                errors.append("Aggressiveness must be between 0.0 and 1.0")
        
        return len(errors) == 0, errors


class CacheManager:
    """Simple caching system for processed text"""
    
    def __init__(self, max_size: int = 1000, ttl: int = 3600):
        self.cache = {}
        self.max_size = max_size
        self.ttl = ttl
        self.access_times = {}
    
    def _generate_key(self, text: str, options_hash: str) -> str:
        """Generate cache key"""
        return hashlib.md5((text + options_hash).encode()).hexdigest()
    
    def _is_expired(self, timestamp: float) -> bool:
        """Check if cache entry is expired"""
        return time.time() - timestamp > self.ttl
    
    def get(self, text: str, options_hash: str) -> Optional[Any]:
        """Get cached result"""
        key = self._generate_key(text, options_hash)
        
        if key in self.cache:
            if self._is_expired(self.access_times[key]):
                self._remove(key)
                return None
            
            # Update access time
            self.access_times[key] = time.time()
            return self.cache[key]
        
        return None
    
    def set(self, text: str, options_hash: str, result: Any) -> None:
        """Cache result"""
        key = self._generate_key(text, options_hash)
        
        # Remove oldest entries if cache is full
        if len(self.cache) >= self.max_size:
            self._evict_oldest()
        
        self.cache[key] = result
        self.access_times[key] = time.time()
    
    def _remove(self, key: str) -> None:
        """Remove cache entry"""
        self.cache.pop(key, None)
        self.access_times.pop(key, None)
    
    def _evict_oldest(self) -> None:
        """Remove oldest accessed entry"""
        if not self.access_times:
            return
        
        oldest_key = min(self.access_times, key=self.access_times.get)
        self._remove(oldest_key)
    
    def clear(self) -> None:
        """Clear all cache entries"""
        self.cache.clear()
        self.access_times.clear()
    
    def get_stats(self) -> Dict[str, Any]:
        """Get cache statistics"""
        return {
            "size": len(self.cache),
            "max_size": self.max_size,
            "hit_ratio": getattr(self, '_hit_ratio', 0.0),
            "entries": len(self.cache)
        }


class PerformanceMonitor:
    """Monitor processing performance"""
    
    def __init__(self):
        self.metrics = {
            "total_processed": 0,
            "total_time": 0.0,
            "average_time": 0.0,
            "errors": 0,
            "context_usage": {},
            "tone_usage": {}
        }
    
    def record_processing(
        self, 
        processing_time: float, 
        context: str, 
        tone: str, 
        success: bool = True
    ) -> None:
        """Record processing metrics"""
        self.metrics["total_processed"] += 1
        self.metrics["total_time"] += processing_time
        self.metrics["average_time"] = (
            self.metrics["total_time"] / self.metrics["total_processed"]
        )
        
        if not success:
            self.metrics["errors"] += 1
        
        # Track context usage
        self.metrics["context_usage"][context] = (
            self.metrics["context_usage"].get(context, 0) + 1
        )
        
        # Track tone usage
        self.metrics["tone_usage"][tone] = (
            self.metrics["tone_usage"].get(tone, 0) + 1
        )
    
    def get_report(self) -> Dict[str, Any]:
        """Get performance report"""
        error_rate = (
            self.metrics["errors"] / self.metrics["total_processed"]
            if self.metrics["total_processed"] > 0 else 0
        )
        
        return {
            "total_processed": self.metrics["total_processed"],
            "total_time_seconds": round(self.metrics["total_time"], 2),
            "average_time_seconds": round(self.metrics["average_time"], 3),
            "error_rate": round(error_rate, 3),
            "most_used_context": max(
                self.metrics["context_usage"], 
                key=self.metrics["context_usage"].get, 
                default="none"
            ),
            "most_used_tone": max(
                self.metrics["tone_usage"], 
                key=self.metrics["tone_usage"].get, 
                default="none"
            ),
            "context_breakdown": self.metrics["context_usage"],
            "tone_breakdown": self.metrics["tone_usage"]
        }
    
    def reset(self) -> None:
        """Reset metrics"""
        for key in self.metrics:
            if isinstance(self.metrics[key], (int, float)):
                self.metrics[key] = 0
            elif isinstance(self.metrics[key], dict):
                self.metrics[key] = {}


class TextUtils:
    """General text utilities"""
    
    @staticmethod
    def clean_text(text: str) -> str:
        """Clean text for processing"""
        # Remove extra whitespace
        text = re.sub(r'\s+', ' ', text)
        
        # Remove control characters except newlines and tabs
        text = ''.join(char for char in text if char.isprintable() or char in '\n\t')
        
        return text.strip()
    
    @staticmethod
    def truncate_text(text: str, max_length: int, suffix: str = "...") -> str:
        """Truncate text to specified length"""
        if len(text) <= max_length:
            return text
        
        if max_length <= len(suffix):
            return text[:max_length]
        
        return text[:max_length - len(suffix)] + suffix
    
    @staticmethod
    def word_count(text: str) -> int:
        """Count words in text"""
        return len(re.findall(r'\b\w+\b', text))
    
    @staticmethod
    def character_count(text: str, include_spaces: bool = True) -> int:
        """Count characters in text"""
        if include_spaces:
            return len(text)
        return len(text.replace(' ', ''))
    
    @staticmethod
    def sentence_count(text: str) -> int:
        """Count sentences in text"""
        return len(re.findall(r'[.!?]+', text))
    
    @staticmethod
    def paragraph_count(text: str) -> int:
        """Count paragraphs in text"""
        return len([p for p in text.split('\n\n') if p.strip()])
    
    @staticmethod
    def extract_keywords(text: str, max_keywords: int = 10) -> List[str]:
        """Extract keywords from text"""
        # Simple keyword extraction based on frequency
        words = re.findall(r'\b\w+\b', text.lower())
        
        # Remove common stop words
        stop_words = {
            'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
            'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'have',
            'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should',
            'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they'
        }
        
        filtered_words = [word for word in words if word not in stop_words and len(word) > 2]
        word_freq = Counter(filtered_words)
        
        return [word for word, freq in word_freq.most_common(max_keywords)]
    
    @staticmethod
    def generate_summary(text: str, max_sentences: int = 3) -> str:
        """Generate a simple summary of text"""
        sentences = re.split(r'[.!?]+', text)
        sentences = [s.strip() for s in sentences if s.strip()]
        
        if len(sentences) <= max_sentences:
            return text
        
        # Simple scoring based on sentence length and position
        scored_sentences = []
        for i, sentence in enumerate(sentences):
            score = len(sentence.split())  # Length score
            score += (len(sentences) - i) * 0.5  # Position score
            scored_sentences.append((score, sentence))
        
        # Sort by score and take top sentences
        top_sentences = sorted(scored_sentences, reverse=True)[:max_sentences]
        top_sentences.sort(key=lambda x: sentences.index(x[1]))  # Maintain original order
        
        return '. '.join(sentence for _, sentence in top_sentences) + '.'


class Logger:
    """Simple logging wrapper"""
    
    def __init__(self, name: str = "AITextProcessor"):
        self.logger = logging.getLogger(name)
        self.logger.setLevel(logging.INFO)
        
        if not self.logger.handlers:
            handler = logging.StreamHandler()
            formatter = logging.Formatter(
                '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
            )
            handler.setFormatter(formatter)
            self.logger.addHandler(handler)
    
    def info(self, message: str) -> None:
        self.logger.info(message)
    
    def warning(self, message: str) -> None:
        self.logger.warning(message)
    
    def error(self, message: str) -> None:
        self.logger.error(message)
    
    def debug(self, message: str) -> None:
        self.logger.debug(message)
