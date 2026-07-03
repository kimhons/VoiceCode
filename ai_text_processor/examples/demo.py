"""
Example usage of AI Text Processor
Demonstrates various features and use cases
"""

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'src'))

from api import (
    SimpleTextProcessor, 
    AdvancedTextProcessor, 
    TextProcessorFactory,
    quick_process,
    analyze_text,
    batch_process_texts
)
from text_processor import ProcessingOptions, ProcessingContext, ToneType
import time


def demo_basic_processing():
    """Demonstrate basic text processing"""
    print("=== BASIC TEXT PROCESSING DEMO ===\n")
    
    # Sample texts for different contexts
    samples = {
        "casual_email": """
        hey john! so like, i was thinking about that project and i kinda feel 
        like we should maybe change direction a bit. basically, the current 
        approach is actually really confusing and we gotta make it simpler. 
        what do u think?
        """,
        
        "informal_note": """
        This is really good actually! I basically think we should definitely 
        do this because its gonna be awesome! I mean, we can maybe figure 
        out the details later but for now this is like totally fine.
        """,
        
        "code_comment": """
        // this function does something important
        // it basically processes data and returns results
        // we should probably make this better
        function processData(data) {
            // do stuff with data
            return processed;
        }
        """,
        
        "social_post": """
        Just finished an amazing project! 🔥 Really excited about this new 
        approach. It's like, totally game-changing! Who else is working on 
        something cool rn? #innovation #excited
        """
    }
    
    processor = SimpleTextProcessor()
    
    for context, text in samples.items():
        print(f"--- {context.upper().replace('_', ' ')} ---")
        print("Original:")
        print(text.strip())
        
        # Process for different contexts and tones
        if "email" in context:
            processed = processor.process(text, "email", "professional")
        elif "code" in context:
            processed = processor.process(text, "code", "technical")
        else:
            processed = processor.process(text, "document", "professional")
        
        print("\nProcessed:")
        print(processed.strip())
        print("\n" + "="*60 + "\n")


def demo_advanced_processing():
    """Demonstrate advanced text processing with detailed options"""
    print("=== ADVANCED PROCESSING DEMO ===\n")
    
    sample_text = """
    Dear Team,
    
    I basically wanted to touch base about the upcoming deadline. 
    We're actually making great progress, but I kinda think we should 
    maybe reassess our timeline. The current approach is really complex 
    and we gotta simplify it.
    
    Can we schedule a meeting this week to discuss?
    
    Thanks!
    """
    
    # Create advanced processor
    processor = AdvancedTextProcessor()
    
    # Define different processing options
    scenarios = [
        {
            "name": "Professional Email",
            "options": ProcessingOptions(
                context=ProcessingContext.EMAIL,
                tone=ToneType.PROFESSIONAL,
                aggressiveness=0.6,
                remove_fillers=True,
                adjust_tone=True
            )
        },
        {
            "name": "Friendly Email",
            "options": ProcessingOptions(
                context=ProcessingContext.EMAIL,
                tone=ToneType.FRIENDLY,
                aggressiveness=0.4,
                remove_fillers=False,
                adjust_tone=True
            )
        },
        {
            "name": "Formal Document",
            "options": ProcessingOptions(
                context=ProcessingContext.DOCUMENT,
                tone=ToneType.FORMAL,
                aggressiveness=0.8,
                remove_fillers=True,
                correct_grammar=True,
                improve_formatting=True
            )
        }
    ]
    
    for scenario in scenarios:
        print(f"--- {scenario['name']} ---")
        print("Original:")
        print(sample_text.strip())
        
        start_time = time.time()
        result = processor.process(sample_text, scenario['options'])
        processing_time = time.time() - start_time
        
        print(f"\nProcessed (confidence: {result.confidence_score:.2f}):")
        print(result.processed_text.strip())
        
        print(f"\nChanges made ({len(result.changes_made)}):")
        for i, change in enumerate(result.changes_made[:5], 1):  # Show first 5 changes
            change_type = change.get('type', 'unknown')
            if change_type == 'filler_removal':
                print(f"  {i}. Removed filler word: '{change.get('removed', '')}'")
            elif change_type == 'grammar':
                print(f"  {i}. Grammar: '{change.get('original', '')}' → '{change.get('corrected', '')}'")
            elif change_type == 'tone':
                print(f"  {i}. Tone adjustment: '{change.get('original', '')}' → '{change.get('replaced_with', '')}'")
            elif change_type == 'punctuation':
                print(f"  {i}. Punctuation: {change.get('action', '')}")
        
        if len(result.changes_made) > 5:
            print(f"  ... and {len(result.changes_made) - 5} more changes")
        
        print(f"\nProcessing time: {processing_time:.3f}s")
        print("="*60 + "\n")


def demo_batch_processing():
    """Demonstrate batch processing"""
    print("=== BATCH PROCESSING DEMO ===\n")
    
    texts = [
        "I basically think this is really good actually!",
        "We should maybe change the approach kinda.",
        "This is gonna be awesome! Like, totally!",
        "I mean, we can figure it out later maybe.",
        "This is actually quite good really!"
    ]
    
    # Batch process with simple processor
    print("Processing 5 similar texts...")
    processed_texts = batch_process_texts(texts, "document", "professional")
    
    print("\nResults:")
    for i, (original, processed) in enumerate(zip(texts, processed_texts), 1):
        print(f"\n{i}. Original: {original}")
        print(f"   Processed: {processed}")
    
    # Advanced batch processing
    processor = AdvancedTextProcessor()
    options = ProcessingOptions(
        context=ProcessingContext.DOCUMENT,
        tone=ToneType.PROFESSIONAL,
        remove_fillers=True,
        aggressiveness=0.7
    )
    
    print(f"\n\nAdvanced batch processing with detailed results:")
    results = processor.batch_process(texts, options)
    
    for i, result in enumerate(results, 1):
        print(f"\n{i}. Confidence: {result.confidence_score:.2f}")
        print(f"   Changes: {len(result.changes_made)}")


def demo_text_analysis():
    """Demonstrate text analysis features"""
    print("=== TEXT ANALYSIS DEMO ===\n")
    
    sample_text = """
    Artificial intelligence is transforming the way we work and live. 
    Machine learning algorithms can now process vast amounts of data 
    to identify patterns and make predictions. However, we must consider 
    the ethical implications of these technologies. Therefore, it's 
    crucial to develop AI systems responsibly.
    """
    
    print("Analyzing sample text...")
    print(sample_text.strip())
    
    analysis = analyze_text(sample_text)
    
    print("\n" + "="*50)
    print("ANALYSIS RESULTS:")
    print("="*50)
    
    # Readability metrics
    readability = analysis['readability']
    print(f"\nREADABILITY:")
    print(f"  Flesch Score: {readability['flesch_score']:.1f}/100")
    print(f"  Avg Sentence Length: {readability['avg_sentence_length']:.1f} words")
    print(f"  Avg Syllables/Word: {readability['avg_syllables_per_word']:.2f}")
    
    # Text statistics
    stats = analysis['statistics']
    print(f"\nSTATISTICS:")
    print(f"  Words: {stats['word_count']}")
    print(f"  Characters: {stats['character_count']}")
    print(f"  Sentences: {stats['sentence_count']}")
    print(f"  Paragraphs: {stats['paragraph_count']}")
    
    # Text type detection
    text_type = analysis['text_type']
    print(f"\nTEXT TYPE DETECTION:")
    print(f"  Primary Type: {text_type['primary_type']}")
    print(f"  Confidence: {text_type['confidence']:.2f}")
    
    # Patterns detected
    patterns = analysis['patterns']
    print(f"\nPATTERNS:")
    print(f"  Questions: {patterns['patterns']['questions']}")
    print(f"  Exclamations: {patterns['patterns']['exclamations']}")
    print(f"  Contractions: {patterns['patterns']['contractions']}")
    
    # Keywords
    keywords = analysis['keywords']
    print(f"\nKEYWORDS:")
    print(f"  {', '.join(keywords)}")
    
    # Generated summary
    summary = analysis['summary']
    print(f"\nAUTO-GENERATED SUMMARY:")
    print(f"  {summary}")


def demo_context_specific():
    """Demonstrate context-specific processing"""
    print("=== CONTEXT-SPECIFIC PROCESSING DEMO ===\n")
    
    # Same content, different contexts
    content = """
    The system is experiencing issues with data processing. 
    We need to fix the database connection and update the API endpoints. 
    This requires immediate attention from the development team.
    """
    
    contexts = [
        ("email", "professional"),
        ("code", "technical"),
        ("document", "formal"),
        ("social", "casual")
    ]
    
    processor = SimpleTextProcessor()
    
    for context, tone in contexts:
        print(f"--- {context.upper()} CONTEXT ({tone} tone) ---")
        print("Original:")
        print(content.strip())
        
        processed = processor.process(content, context, tone)
        
        print(f"\nProcessed for {context}:")
        print(processed.strip())
        print("\n" + "="*60 + "\n")


def demo_performance_monitoring():
    """Demonstrate performance monitoring"""
    print("=== PERFORMANCE MONITORING DEMO ===\n")
    
    processor = AdvancedTextProcessor()
    
    # Process multiple texts to generate metrics
    sample_texts = [
        "This is a sample text for testing.",
        "Another example with different content.",
        "Yet another text to process.",
        "More content for performance testing.",
        "Final sample text for the demo."
    ] * 3  # Process each text 3 times
    
    print(f"Processing {len(sample_texts)} texts...")
    
    start_time = time.time()
    for text in sample_texts:
        result = processor.process(
            text, 
            ProcessingOptions(
                context=ProcessingContext.DOCUMENT,
                tone=ToneType.PROFESSIONAL,
                aggressiveness=0.5
            )
        )
    total_time = time.time() - start_time
    
    print(f"Total processing time: {total_time:.3f}s")
    print(f"Average time per text: {total_time/len(sample_texts):.3f}s")
    
    # Get performance report
    report = processor.get_performance_report()
    
    print("\n" + "="*40)
    print("PERFORMANCE REPORT:")
    print("="*40)
    print(f"Total processed: {report['total_processed']}")
    print(f"Total time: {report['total_time_seconds']}s")
    print(f"Average time: {report['average_time_seconds']}s/text")
    print(f"Error rate: {report['error_rate']:.1%}")
    
    # Cache statistics
    print(f"\nCACHE STATUS:")
    cache_stats = processor.cache.get_stats()
    print(f"  Size: {cache_stats['size']}/{cache_stats['max_size']}")


if __name__ == "__main__":
    print("AI Text Processor - Complete Demo")
    print("=" * 50)
    print()
    
    try:
        demo_basic_processing()
        print("\n" * 2)
        
        demo_advanced_processing()
        print("\n" * 2)
        
        demo_batch_processing()
        print("\n" * 2)
        
        demo_text_analysis()
        print("\n" * 2)
        
        demo_context_specific()
        print("\n" * 2)
        
        demo_performance_monitoring()
        
    except Exception as e:
        print(f"Error in demo: {e}")
        import traceback
        traceback.print_exc()
