"""
AI Text Processing Module
A comprehensive AI-powered text processing engine
"""

__version__ = "1.0.0"
__author__ = "AI Text Processor Team"
__description__ = "AI-powered text processing engine for grammar correction, punctuation, formatting, tone adjustment, and context-aware editing"

# Main exports
from .src.text_processor import (
    AITextProcessor,
    ProcessingOptions,
    ProcessingContext,
    ToneType,
    ProcessingResult
)

from .src.api import (
    SimpleTextProcessor,
    AdvancedTextProcessor,
    TextProcessorFactory,
    quick_process,
    analyze_text,
    batch_process_texts
)

from .utils.text_utils import (
    TextAnalyzer,
    TextValidator,
    CacheManager,
    PerformanceMonitor,
    TextUtils
)

# Convenience imports
__all__ = [
    # Main classes
    'AITextProcessor',
    'ProcessingOptions',
    'ProcessingContext',
    'ToneType',
    'ProcessingResult',
    
    # API classes
    'SimpleTextProcessor',
    'AdvancedTextProcessor',
    'TextProcessorFactory',
    
    # Convenience functions
    'quick_process',
    'analyze_text',
    'batch_process_texts',
    
    # Utilities
    'TextAnalyzer',
    'TextValidator',
    'CacheManager',
    'PerformanceMonitor',
    'TextUtils',
    
    # Metadata
    '__version__',
    '__author__',
    '__description__'
]

# Module-level convenience function
def get_processor(kind="simple"):
    """
    Get a text processor instance
    
    Args:
        kind: Type of processor ('simple' or 'advanced')
    
    Returns:
        TextProcessor instance
    """
    if kind == "simple":
        return SimpleTextProcessor()
    elif kind == "advanced":
        return AdvancedTextProcessor()
    else:
        raise ValueError(f"Unknown processor kind: {kind}. Use 'simple' or 'advanced'")

# Quick start function
def process_text(text, context="document", tone="neutral", **kwargs):
    """
    Quick text processing function
    
    Args:
        text: Text to process
        context: Processing context
        tone: Tone adjustment
        **kwargs: Additional options
    
    Returns:
        Processed text string
    """
    processor = SimpleTextProcessor()
    aggressive = kwargs.get('aggressive', False)
    return processor.process(text, context, tone, aggressive)

# Text analysis convenience function
def analyze(text):
    """
    Quick text analysis
    
    Args:
        text: Text to analyze
    
    Returns:
        Analysis dictionary
    """
    return analyze_text(text)
