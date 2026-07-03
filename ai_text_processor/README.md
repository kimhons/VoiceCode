# AI Text Processing Module

A comprehensive AI-powered text processing engine that handles grammar correction, punctuation, formatting, tone adjustment, and context-aware editing with smart text cleanup features.

## Features

### Core Processing Features
- **Grammar Correction**: Automatic detection and correction of common grammar mistakes
- **Punctuation Fixes**: Smart punctuation correction and spacing
- **Formatting Improvements**: Automatic text formatting based on context
- **Tone Adjustment**: Adjust text tone for professional, friendly, formal, casual, empathetic, confident, or persuasive writing
- **Context-Aware Editing**: Processing adapted for email, code, documents, social media, and more

### Smart Text Cleanup
- **Filler Word Removal**: Intelligent removal of unnecessary words like "actually," "basically," "really"
- **Auto-formatting**: Automatic formatting based on content type
- **Style Matching**: Adapts writing style to match specific contexts

### Advanced Features
- **Batch Processing**: Process multiple texts efficiently
- **Text Analysis**: Comprehensive analysis including readability scores, keywords, and text type detection
- **Performance Monitoring**: Track processing metrics and performance
- **Caching**: Intelligent caching for improved performance
- **Configuration**: Customizable processing rules and options

## Quick Start

### Basic Usage

```python
from ai_text_processor.api import SimpleTextProcessor

# Create a simple processor
processor = SimpleTextProcessor()

# Process text
text = "hey! i kinda think this is actually really good."
result = processor.process(text, context="email", tone="professional")

print(result)
# Output: "Hello! I think this is very good."
```

### Advanced Usage

```python
from ai_text_processor.src.api import AdvancedTextProcessor
from ai_text_processor.src.text_processor import ProcessingOptions, ProcessingContext, ToneType

# Create advanced processor
processor = AdvancedTextProcessor()

# Define processing options
options = ProcessingOptions(
    context=ProcessingContext.EMAIL,
    tone=ToneType.PROFESSIONAL,
    aggressiveness=0.7,
    remove_fillers=True,
    correct_grammar=True,
    adjust_tone=True
)

# Process text
text = "hey john! so like, i was thinking about that project..."
result = processor.process(text, options)

print(result.processed_text)
print(f"Changes made: {len(result.changes_made)}")
print(f"Confidence: {result.confidence_score:.2f}")
```

## API Reference

### SimpleTextProcessor

Basic text processor for simple use cases.

#### Methods

- `process(text, context="document", tone="neutral", aggressive=False)`
  - Process text with basic options
  - `context`: email, code, document, social, formal, casual, technical, creative
  - `tone`: professional, friendly, formal, casual, empathetic, confident, persuasive, neutral
  - `aggressive`: Apply more aggressive changes

### AdvancedTextProcessor

Full-featured processor with detailed control and analysis.

#### Methods

- `process(text, options=None)`
  - Process text with detailed ProcessingOptions
  - Returns ProcessingResult with detailed information

- `batch_process(texts, options=None)`
  - Process multiple texts efficiently
  - Returns list of ProcessingResult objects

- `analyze_text(text)`
  - Analyze text characteristics
  - Returns comprehensive analysis including readability, patterns, and statistics

- `get_performance_report()`
  - Get performance metrics and statistics

### Convenience Functions

```python
from ai_text_processor.src.api import quick_process, analyze_text, batch_process_texts

# Quick processing
result = quick_process("Your text here", "email", "professional")

# Text analysis
analysis = analyze_text("Your text here")

# Batch processing
texts = ["Text 1", "Text 2", "Text 3"]
results = batch_process_texts(texts, "document", "professional")
```

## Processing Contexts

The module supports different contexts for specialized processing:

- **EMAIL**: Formal email format with appropriate greetings and closings
- **CODE**: Preserve code structure and add helpful comments
- **DOCUMENT**: Professional document formatting
- **SOCIAL**: Social media appropriate formatting
- **FORMAL**: Academic or business formal writing
- **CASUAL**: Conversational, informal tone
- **TECHNICAL**: Technical documentation style
- **CREATIVE**: Creative writing optimization

## Tone Adjustment

Adjust text tone for different communication styles:

- **PROFESSIONAL**: Business-appropriate language
- **FRIENDLY**: Warm, approachable tone
- **FORMAL**: Academic or official writing
- **CASUAL**: Conversational and relaxed
- **EMPATHETIC**: Understanding and supportive
- **CONFIDENT**: Strong, assured language
- **PERSUASIVE**: Convincing and compelling
- **NEUTRAL**: Balanced, objective tone

## ProcessingOptions

Fine-grained control over processing:

```python
options = ProcessingOptions(
    context=ProcessingContext.EMAIL,
    tone=ToneType.PROFESSIONAL,
    correct_grammar=True,      # Enable grammar correction
    fix_punctuation=True,      # Enable punctuation fixes
    improve_formatting=True,   # Enable formatting improvements
    adjust_tone=True,         # Enable tone adjustment
    remove_fillers=True,      # Enable filler word removal
    auto_format=True,         # Enable automatic formatting
    style_matching=True,      # Enable style matching
    aggressiveness=0.7,       # Processing aggressiveness (0.0-1.0)
    preserve_specifics=True   # Preserve technical terms and proper nouns
)
```

## Text Analysis

Comprehensive text analysis capabilities:

```python
analysis = processor.analyze_text(text)

# Readability metrics
readability = analysis['readability']
print(f"Flesch Score: {readability['flesch_score']}")
print(f"Avg Sentence Length: {readability['avg_sentence_length']}")

# Text statistics
stats = analysis['statistics']
print(f"Word Count: {stats['word_count']}")
print(f"Sentence Count: {stats['sentence_count']}")

# Keywords and summary
keywords = analysis['keywords']
summary = analysis['summary']
```

## Examples

### Email Processing

```python
processor = SimpleTextProcessor()

email_text = """
hey team! so like, i was thinking about the deadline and i kinda 
feel we should maybe push it back a bit. basically, the current 
approach is actually really complex and we gotta simplify it.
"""

# Convert to professional email
professional_email = processor.process(email_text, "email", "professional")
print(professional_email)
```

### Code Comment Processing

```python
code_comment = """
// this function does something important
// it basically processes data and returns results
// we should probably make this better
function processData(data) {
    // do stuff with data
    return processed;
}
"""

# Improve code comments
improved_comments = processor.process(code_comment, "code", "technical")
```

### Batch Processing

```python
texts = [
    "I basically think this is really good actually!",
    "We should maybe change the approach kinda.",
    "This is gonna be awesome! Like, totally!"
]

# Process all texts with same settings
processor = SimpleTextProcessor()
results = [processor.process(text, "document", "professional") for text in texts]

# Or use batch function
from api import batch_process_texts
results = batch_process_texts(texts, "document", "professional")
```

### Text Analysis

```python
processor = AdvancedTextProcessor()

text = """
Artificial intelligence is transforming the way we work and live. 
Machine learning algorithms can now process vast amounts of data 
to identify patterns and make predictions.
"""

analysis = processor.analyze_text(text)

print("Readability Score:", analysis['readability']['flesch_score'])
print("Text Type:", analysis['text_type']['primary_type'])
print("Keywords:", ', '.join(analysis['keywords']))
```

## Configuration

### Custom Configuration

Create custom configuration files:

```python
from ai_text_processor.config.config import DEFAULT_CONFIG, save_config

# Modify default configuration
config = DEFAULT_CONFIG.copy()
config['grammar_rules']['common_mistakes']['its/ite']['enabled'] = True

# Save configuration
save_config(config, 'my_config.json')

# Load in processor
processor = AdvancedTextProcessor('my_config.json')
```

### Adding Technical Terms

Preserve technical terms during processing:

```python
processor = AdvancedTextProcessor()
processor.add_technical_terms(['API', 'JSON', 'Python', 'JavaScript'])

text = "The API endpoint returns JSON data."
result = processor.process(text)
# "API" and "JSON" will be preserved
```

## Performance

### Performance Monitoring

```python
processor = AdvancedTextProcessor()

# Process some texts
for text in texts:
    processor.process(text)

# Get performance report
report = processor.get_performance_report()
print(f"Total processed: {report['total_processed']}")
print(f"Average time: {report['average_time_seconds']}s")
print(f"Error rate: {report['error_rate']:.1%}")
```

### Caching

The processor includes intelligent caching:

```python
processor = AdvancedTextProcessor()

# First call - processes and caches
result1 = processor.process("Test text")

# Second call - uses cached result
result2 = processor.process("Test text")

# Clear cache when needed
processor.clear_cache()

# Check cache statistics
stats = processor.cache.get_stats()
print(f"Cache size: {stats['size']}/{stats['max_size']}")
```

## Running Tests

```bash
# Run all tests
cd /workspace/ai_text_processor
python -m tests.test_all

# Run specific test class
python -m unittest tests.test_all.TestSimpleProcessor

# Run with verbose output
python -m unittest tests.test_all -v
```

## Running Examples

```bash
# Run comprehensive demo
cd /workspace/ai_text_processor
python examples/demo.py

# This will demonstrate all features:
# - Basic processing
# - Advanced processing
# - Batch processing
# - Text analysis
# - Context-specific processing
# - Performance monitoring
```

## Architecture

### Core Components

1. **AITextProcessor**: Main processing engine
2. **GrammarProcessor**: Grammar correction
3. **PunctuationProcessor**: Punctuation fixes
4. **FormattingProcessor**: Formatting improvements
5. **ToneProcessor**: Tone adjustment
6. **FillerWordRemover**: Filler word removal
7. **AutoFormatter**: Automatic formatting
8. **StyleMatcher**: Style adaptation
9. **ContextAnalyzer**: Context analysis

### Utilities

1. **TextAnalyzer**: Advanced text analysis
2. **TextValidator**: Input validation
3. **CacheManager**: Caching system
4. **PerformanceMonitor**: Performance tracking
5. **TextUtils**: General text utilities

## Error Handling

The module includes comprehensive error handling:

```python
try:
    result = processor.process(text)
except ValueError as e:
    print(f"Invalid input: {e}")
except Exception as e:
    print(f"Processing error: {e}")
```

## Limitations

- Maximum text length: 10,000 characters
- Processing time depends on text complexity
- Some context-specific features are heuristic-based
- Grammar correction is conservative to avoid over-correction

## Future Enhancements

- Machine learning-based grammar correction
- More sophisticated context detection
- Multi-language support
- Advanced style transfer
- Real-time collaborative editing
- Integration with popular writing platforms

## License

This module is designed for educational and development purposes.
