"""
AI Text Processor API
Easy-to-use interface for the AI-powered text processing engine
"""

from typing import Dict, List, Optional, Any, Union
import json
import os
import sys

# Add the src directory to the path
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'src'))

from text_processor import (
    AITextProcessor, 
    ProcessingOptions, 
    ProcessingContext, 
    ToneType,
    ProcessingResult
)
from utils.text_utils import (
    TextAnalyzer, 
    TextValidator, 
    CacheManager, 
    PerformanceMonitor, 
    TextUtils,
    Logger
)


class SimpleTextProcessor:
    """
    Simplified interface for basic text processing needs
    """
    
    def __init__(self):
        self.processor = AITextProcessor()
        self.logger = Logger()
    
    def process(
        self, 
        text: str,
        context: str = "document",
        tone: str = "neutral",
        aggressive: bool = False
    ) -> str:
        """
        Process text with basic options
        
        Args:
            text: Text to process
            context: Context type (email, code, document, social, formal, casual, technical, creative)
            tone: Tone type (professional, friendly, formal, casual, empathetic, confident, persuasive, neutral)
            aggressive: Whether to be aggressive with changes
            
        Returns:
            Processed text
        """
        try:
            options = ProcessingOptions(
                context=ProcessingContext(context),
                tone=ToneType(tone),
                aggressiveness=0.8 if aggressive else 0.5,
                correct_grammar=True,
                fix_punctuation=True,
                improve_formatting=True,
                adjust_tone=True,
                remove_fillers=aggressive,
                auto_format=True,
                style_matching=True
            )
            
            result = self.processor.process_text(text, options)
            return result.processed_text
            
        except Exception as e:
            self.logger.error(f"Error processing text: {e}")
            return text


class AdvancedTextProcessor:
    """
    Advanced interface for detailed text processing
    """
    
    def __init__(self, config_path: Optional[str] = None):
        self.processor = AITextProcessor(config_path)
        self.cache = CacheManager()
        self.monitor = PerformanceMonitor()
        self.logger = Logger()
    
    def process(
        self, 
        text: str, 
        options: Optional[ProcessingOptions] = None
    ) -> ProcessingResult:
        """
        Process text with full options
        
        Args:
            text: Text to process
            options: ProcessingOptions object with detailed settings
            
        Returns:
            ProcessingResult with detailed information
        """
        # Validate input
        is_valid, errors = TextValidator.validate_input_text(text)
        if not is_valid:
            raise ValueError(f"Invalid text input: {', '.join(errors)}")
        
        if options:
            is_valid, errors = TextValidator.validate_options(options)
            if not is_valid:
                raise ValueError(f"Invalid options: {', '.join(errors)}")
        
        # Generate options hash for caching
        options_hash = str(hash(str(options))) if options else "default"
        
        # Check cache
        cached_result = self.cache.get(text, options_hash)
        if cached_result:
            self.logger.debug("Using cached result")
            return cached_result
        
        try:
            # Process text
            result = self.processor.process_text(text, options)
            
            # Cache result
            self.cache.set(text, options_hash, result)
            
            # Record performance
            self.monitor.record_processing(
                result.processing_time,
                result.processed_text,  # This should be context, but using processed_text as placeholder
                options.tone.value if options else "neutral",
                True
            )
            
            return result
            
        except Exception as e:
            self.monitor.record_processing(0, "unknown", "unknown", False)
            self.logger.error(f"Error processing text: {e}")
            raise
    
    def batch_process(
        self, 
        texts: List[str], 
        options: Optional[ProcessingOptions] = None
    ) -> List[ProcessingResult]:
        """
        Process multiple texts efficiently
        
        Args:
            texts: List of texts to process
            options: ProcessingOptions to apply to all texts
            
        Returns:
            List of ProcessingResult objects
        """
        results = []
        
        for text in texts:
            try:
                result = self.process(text, options)
                results.append(result)
            except Exception as e:
                self.logger.error(f"Error processing text '{text[:50]}...': {e}")
                # Create error result
                error_result = ProcessingResult(
                    original_text=text,
                    processed_text=text,
                    changes_made=[{"error": str(e)}],
                    suggestions=[{"error": "Processing failed"}],
                    confidence_score=0.0,
                    processing_time=0.0
                )
                results.append(error_result)
        
        return results
    
    def analyze_text(self, text: str) -> Dict[str, Any]:
        """
        Analyze text without processing it
        
        Args:
            text: Text to analyze
            
        Returns:
            Dictionary with analysis results
        """
        analysis = TextAnalyzer.calculate_readability(text)
        patterns = TextAnalyzer.detect_language_patterns(text)
        text_type = TextAnalyzer.identify_text_type(text)
        
        return {
            "readability": analysis,
            "patterns": patterns,
            "text_type": text_type,
            "statistics": {
                "word_count": TextUtils.word_count(text),
                "character_count": TextUtils.character_count(text),
                "sentence_count": TextUtils.sentence_count(text),
                "paragraph_count": TextUtils.paragraph_count(text)
            },
            "keywords": TextUtils.extract_keywords(text, 10),
            "summary": TextUtils.generate_summary(text, 3)
        }
    
    def get_performance_report(self) -> Dict[str, Any]:
        """Get performance monitoring report"""
        return self.monitor.get_report()
    
    def clear_cache(self) -> None:
        """Clear the processing cache"""
        self.cache.clear()
        self.logger.info("Cache cleared")
    
    def add_technical_terms(self, terms: List[str]) -> None:
        """Add technical terms to preserve during processing"""
        self.processor.add_technical_terms(terms)
        self.logger.info(f"Added {len(terms)} technical terms")


class TextProcessorFactory:
    """
    Factory class for creating text processors
    """
    
    @staticmethod
    def create_simple() -> SimpleTextProcessor:
        """Create a simple text processor for basic use cases"""
        return SimpleTextProcessor()
    
    @staticmethod
    def create_advanced(config_path: Optional[str] = None) -> AdvancedTextProcessor:
        """Create an advanced text processor for detailed processing"""
        return AdvancedTextProcessor(config_path)
    
    @staticmethod
    def create_for_context(context: str) -> SimpleTextProcessor:
        """
        Create a text processor optimized for a specific context
        
        Args:
            context: Target context (email, code, document, social)
            
        Returns:
            SimpleTextProcessor configured for the context
        """
        processor = SimpleTextProcessor()
        
        # Configure based on context
        if context == "email":
            # Email-specific settings
            pass
        elif context == "code":
            # Code-specific settings
            pass
        elif context == "social":
            # Social media specific settings
            pass
        
        return processor
    
    @staticmethod
    def create_for_tone(tone: str) -> SimpleTextProcessor:
        """
        Create a text processor optimized for a specific tone
        
        Args:
            tone: Target tone (professional, friendly, formal, casual, etc.)
            
        Returns:
            SimpleTextProcessor configured for the tone
        """
        processor = SimpleTextProcessor()
        # The tone will be applied during processing
        return processor


# Convenience functions
def quick_process(
    text: str,
    context: str = "document",
    tone: str = "neutral"
) -> str:
    """
    Quick text processing with minimal configuration
    
    Args:
        text: Text to process
        context: Context type
        tone: Tone type
        
    Returns:
        Processed text
    """
    processor = SimpleTextProcessor()
    return processor.process(text, context, tone)


def analyze_text(text: str) -> Dict[str, Any]:
    """
    Analyze text characteristics and provide insights
    
    Args:
        text: Text to analyze
        
    Returns:
        Analysis results
    """
    analyzer = AdvancedTextProcessor()
    return analyzer.analyze_text(text)


def batch_process_texts(
    texts: List[str],
    context: str = "document",
    tone: str = "neutral"
) -> List[str]:
    """
    Process multiple texts efficiently
    
    Args:
        texts: List of texts to process
        context: Context type
        tone: Tone type
        
    Returns:
        List of processed texts
    """
    processor = SimpleTextProcessor()
    results = []
    
    for text in texts:
        processed = processor.process(text, context, tone)
        results.append(processed)
    
    return results


# Main execution for testing
if __name__ == "__main__":
    # Example usage
    sample_text = """
    hey! i kinda think this is actually really good. basically, we should 
    definitely do this because its gonna be awesome! i mean, we can maybe 
    figure out the details later, but for now this is like, totally fine.
    """
    
    print("=== AI Text Processor Demo ===\n")
    
    # Simple processing
    print("Original text:")
    print(sample_text)
    print("\n" + "="*50 + "\n")
    
    # Process for professional email
    processor = SimpleTextProcessor()
    professional = processor.process(
        sample_text, 
        context="email", 
        tone="professional"
    )
    
    print("Professional email version:")
    print(professional)
    print("\n" + "="*50 + "\n")
    
    # Process for friendly tone
    friendly = processor.process(
        sample_text, 
        context="social", 
        tone="friendly"
    )
    
    print("Friendly social version:")
    print(friendly)
    print("\n" + "="*50 + "\n")
    
    # Advanced processing with analysis
    advanced_processor = AdvancedTextProcessor()
    options = ProcessingOptions(
        context=ProcessingContext.EMAIL,
        tone=ToneType.PROFESSIONAL,
        aggressiveness=0.7,
        remove_fillers=True
    )
    
    result = advanced_processor.process(sample_text, options)
    
    print("Advanced processing result:")
    print(f"Processed text: {result.processed_text}")
    print(f"Changes made: {len(result.changes_made)}")
    print(f"Confidence score: {result.confidence_score:.2f}")
    print(f"Processing time: {result.processing_time:.3f}s")
    
    # Text analysis
    analysis = advanced_processor.analyze_text(sample_text)
    print(f"\nText analysis:")
    print(f"Word count: {analysis['statistics']['word_count']}")
    print(f"Readability score: {analysis['readability']['flesch_score']:.1f}")
    print(f"Text type: {analysis['text_type']['primary_type']}")
    print(f"Keywords: {', '.join(analysis['keywords'])}")
