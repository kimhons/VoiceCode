"""
Comprehensive tests for AI Text Processor
Tests all major functionality and edge cases
"""

import unittest
import sys
import os
import time

# Add src directory to path
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'src'))

from api import SimpleTextProcessor, AdvancedTextProcessor, quick_process
from text_processor import (
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
    TextUtils
)


class TestSimpleProcessor(unittest.TestCase):
    """Test basic text processing functionality"""
    
    def setUp(self):
        self.processor = SimpleTextProcessor()
    
    def test_basic_processing(self):
        """Test basic text processing"""
        text = "This is a test sentence."
        result = self.processor.process(text)
        self.assertIsInstance(result, str)
        self.assertGreater(len(result), 0)
    
    def test_filler_word_removal(self):
        """Test filler word removal"""
        text = "I basically think this is actually really good."
        result = self.processor.process(text, aggressive=True)
        
        # Should remove some filler words
        self.assertNotIn("basically", result.lower())
        self.assertNotIn("actually", result.lower())
    
    def test_grammar_correction(self):
        """Test grammar correction"""
        text = "Its a nice day and your going to love it."
        result = self.processor.process(text)
        
        # Should correct its/you're
        self.assertIn("it's", result.lower() or "its" in result.lower())
    
    def test_tone_adjustment(self):
        """Test tone adjustment"""
        text = "Hey, this is cool!"
        
        # Professional tone
        professional = self.processor.process(text, tone="professional")
        self.assertNotIn("cool", professional.lower())
        
        # Friendly tone
        friendly = self.processor.process(text, tone="friendly")
        self.assertIsInstance(friendly, str)
    
    def test_context_processing(self):
        """Test different context processing"""
        text = "This needs to be formatted properly."
        
        contexts = ["email", "code", "document", "social"]
        for context in contexts:
            result = self.processor.process(text, context=context)
            self.assertIsInstance(result, str)
            self.assertGreater(len(result), 0)
    
    def test_empty_text(self):
        """Test handling of empty text"""
        result = self.processor.process("")
        self.assertEqual(result, "")
        
        result = self.processor.process("   ")
        self.assertEqual(result.strip(), "")
    
    def test_long_text(self):
        """Test handling of long text"""
        long_text = "This is a test sentence. " * 100
        result = self.processor.process(long_text)
        self.assertIsInstance(result, str)
        self.assertGreater(len(result), 0)
    
    def test_special_characters(self):
        """Test handling of special characters"""
        text = "Hello @user! Check out this link: http://example.com"
        result = self.processor.process(text)
        self.assertIsInstance(result, str)
        self.assertIn("http://example.com", result)


class TestAdvancedProcessor(unittest.TestCase):
    """Test advanced text processing functionality"""
    
    def setUp(self):
        self.processor = AdvancedTextProcessor()
    
    def test_processing_result_structure(self):
        """Test that ProcessingResult has correct structure"""
        text = "This is a test."
        result = self.processor.process(text)
        
        self.assertIsInstance(result, ProcessingResult)
        self.assertEqual(result.original_text, text)
        self.assertIsInstance(result.processed_text, str)
        self.assertIsInstance(result.changes_made, list)
        self.assertIsInstance(result.suggestions, list)
        self.assertIsInstance(result.confidence_score, float)
        self.assertIsInstance(result.processing_time, float)
    
    def test_processing_options(self):
        """Test different processing options"""
        text = "This is a test sentence."
        
        options = ProcessingOptions(
            context=ProcessingContext.EMAIL,
            tone=ToneType.PROFESSIONAL,
            aggressiveness=0.8,
            remove_fillers=True,
            correct_grammar=True
        )
        
        result = self.processor.process(text, options)
        self.assertIsInstance(result, ProcessingResult)
        self.assertEqual(result.original_text, text)
    
    def test_batch_processing(self):
        """Test batch processing"""
        texts = [
            "First test sentence.",
            "Second test sentence.",
            "Third test sentence."
        ]
        
        results = self.processor.batch_process(texts)
        
        self.assertEqual(len(results), 3)
        for result in results:
            self.assertIsInstance(result, ProcessingResult)
    
    def test_text_analysis(self):
        """Test text analysis functionality"""
        text = "This is a sample text for analysis. It contains multiple sentences."
        
        analysis = self.processor.analyze_text(text)
        
        self.assertIn('readability', analysis)
        self.assertIn('patterns', analysis)
        self.assertIn('text_type', analysis)
        self.assertIn('statistics', analysis)
        self.assertIn('keywords', analysis)
        self.assertIn('summary', analysis)
        
        # Check specific metrics
        self.assertIn('flesch_score', analysis['readability'])
        self.assertIn('word_count', analysis['statistics'])
        self.assertIn('primary_type', analysis['text_type'])
    
    def test_technical_terms(self):
        """Test technical terms preservation"""
        text = "The API endpoint returns JSON data."
        self.processor.add_technical_terms(["API", "JSON"])
        
        result = self.processor.process(text)
        self.assertIsInstance(result, ProcessingResult)
    
    def test_performance_monitoring(self):
        """Test performance monitoring"""
        # Process some text
        text = "Test text for performance monitoring."
        self.processor.process(text)
        
        # Get performance report
        report = self.processor.get_performance_report()
        
        self.assertIn('total_processed', report)
        self.assertIn('average_time_seconds', report)
        self.assertIn('error_rate', report)
        self.assertGreaterEqual(report['total_processed'], 0)
    
    def test_cache_functionality(self):
        """Test caching"""
        text = "Test text for caching."
        
        # First call - should not be cached
        result1 = self.processor.process(text)
        
        # Second call - should be cached
        result2 = self.processor.process(text)
        
        self.assertEqual(result1.processed_text, result2.processed_text)
        
        # Clear cache
        self.processor.clear_cache()
        
        # Check cache stats
        stats = self.processor.cache.get_stats()
        self.assertIn('size', stats)
    
    def test_error_handling(self):
        """Test error handling"""
        # Test with invalid text
        with self.assertRaises(ValueError):
            self.processor.process("")
        
        # Test with invalid options
        with self.assertRaises(ValueError):
            # This would require creating invalid options
            pass


class TestTextAnalyzer(unittest.TestCase):
    """Test text analysis utilities"""
    
    def test_readability_calculation(self):
        """Test readability score calculation"""
        text = "This is a simple sentence. It has multiple sentences."
        
        analysis = TextAnalyzer.calculate_readability(text)
        
        self.assertIn('flesch_score', analysis)
        self.assertIn('avg_sentence_length', analysis)
        self.assertIn('avg_syllables_per_word', analysis)
        self.assertIsInstance(analysis['flesch_score'], float)
        self.assertGreaterEqual(analysis['flesch_score'], 0)
        self.assertLessEqual(analysis['flesch_score'], 100)
    
    def test_language_pattern_detection(self):
        """Test language pattern detection"""
        text = "This is a test? Yes! It has questions and exclamations."
        
        patterns = TextAnalyzer.detect_language_patterns(text)
        
        self.assertIn('patterns', patterns)
        self.assertIn('sentiment', patterns)
        self.assertIn('complexity', patterns)
        
        self.assertGreater(patterns['patterns']['questions'], 0)
        self.assertGreater(patterns['patterns']['exclamations'], 0)
    
    def test_text_type_identification(self):
        """Test text type identification"""
        texts = {
            "email": "Dear Team, Please review the attached document. Best regards.",
            "code": "function test() { return true; }",
            "social": "Hey! Check this out! #awesome"
        }
        
        for expected_type, text in texts.items():
            result = TextAnalyzer.identify_text_type(text)
            self.assertIn('primary_type', result)
            self.assertIn('confidence', result)
            self.assertIn('scores', result)
            self.assertEqual(result['primary_type'], expected_type)
    
    def test_syllable_counting(self):
        """Test syllable counting"""
        self.assertGreater(TextAnalyzer.count_syllables("hello"), 0)
        self.assertGreater(TextAnalyzer.count_syllables("beautiful"), 0)
        self.assertEqual(TextAnalyzer.count_syllables("a"), 1)


class TestTextValidator(unittest.TestCase):
    """Test text validation utilities"""
    
    def test_valid_text(self):
        """Test validation of valid text"""
        text = "This is a valid text for processing."
        is_valid, errors = TextValidator.validate_input_text(text)
        self.assertTrue(is_valid)
        self.assertEqual(len(errors), 0)
    
    def test_empty_text(self):
        """Test validation of empty text"""
        text = ""
        is_valid, errors = TextValidator.validate_input_text(text)
        self.assertFalse(is_valid)
        self.assertGreater(len(errors), 0)
    
    def test_whitespace_only(self):
        """Test validation of whitespace-only text"""
        text = "   \n\t   "
        is_valid, errors = TextValidator.validate_input_text(text)
        self.assertFalse(is_valid)
        self.assertGreater(len(errors), 0)
    
    def test_oversized_text(self):
        """Test validation of oversized text"""
        text = "a" * 15000  # Exceed the 10k limit
        is_valid, errors = TextValidator.validate_input_text(text)
        self.assertFalse(is_valid)
        self.assertTrue(any("too long" in error.lower() for error in errors))
    
    def test_suspicious_content(self):
        """Test validation of suspicious content"""
        text = "<script>alert('test')</script>"
        is_valid, errors = TextValidator.validate_input_text(text)
        self.assertFalse(is_valid)
        self.assertTrue(any("unsafe" in error.lower() for error in errors))


class TestTextUtils(unittest.TestCase):
    """Test text utility functions"""
    
    def test_text_cleaning(self):
        """Test text cleaning"""
        dirty_text = "  This   is   dirty    text.  "
        clean_text = TextUtils.clean_text(dirty_text)
        
        self.assertNotIn("  ", clean_text)  # No multiple spaces
        self.assertEqual(clean_text.strip(), clean_text)
    
    def test_word_counting(self):
        """Test word counting"""
        text = "This is a test sentence."
        count = TextUtils.word_count(text)
        self.assertEqual(count, 5)
    
    def test_character_counting(self):
        """Test character counting"""
        text = "Hello!"
        
        with_spaces = TextUtils.character_count(text, include_spaces=True)
        without_spaces = TextUtils.character_count(text, include_spaces=False)
        
        self.assertEqual(with_spaces, 6)
        self.assertEqual(without_spaces, 5)
    
    def test_sentence_counting(self):
        """Test sentence counting"""
        text = "First sentence. Second sentence! Third sentence?"
        count = TextUtils.sentence_count(text)
        self.assertEqual(count, 3)
    
    def test_paragraph_counting(self):
        """Test paragraph counting"""
        text = "First paragraph.\n\nSecond paragraph.\n\nThird paragraph."
        count = TextUtils.paragraph_count(text)
        self.assertEqual(count, 3)
    
    def test_keyword_extraction(self):
        """Test keyword extraction"""
        text = "The quick brown fox jumps over the lazy dog."
        keywords = TextUtils.extract_keywords(text, 3)
        
        self.assertLessEqual(len(keywords), 3)
        self.assertIn("fox", keywords or "jumps" in keywords or "dog" in keywords)
    
    def test_summary_generation(self):
        """Test summary generation"""
        text = "First sentence. Second sentence. Third sentence. Fourth sentence. Fifth sentence."
        summary = TextUtils.generate_summary(text, 2)
        
        self.assertLessEqual(len(summary.split('. ')), 3)  # Allow for final period
        self.assertIn(".", summary)
    
    def test_text_truncation(self):
        """Test text truncation"""
        text = "This is a long text that should be truncated."
        truncated = TextUtils.truncate_text(text, 20, "...")
        
        self.assertLessEqual(len(truncated), 23)  # 20 + 3 for "..."
        self.assertTrue(truncated.endswith("..."))


class TestConvenienceFunctions(unittest.TestCase):
    """Test convenience functions"""
    
    def test_quick_process(self):
        """Test quick_process function"""
        text = "This is a test."
        result = quick_process(text)
        self.assertIsInstance(result, str)
        self.assertGreater(len(result), 0)
    
    def test_quick_process_with_options(self):
        """Test quick_process with different options"""
        text = "This is a test."
        
        result1 = quick_process(text, "email", "professional")
        result2 = quick_process(text, "social", "friendly")
        
        self.assertIsInstance(result1, str)
        self.assertIsInstance(result2, str)
    
    def test_analyze_text(self):
        """Test analyze_text function"""
        text = "This is a sample text for analysis."
        analysis = analyze_text(text)
        
        self.assertIsInstance(analysis, dict)
        self.assertIn('readability', analysis)
        self.assertIn('statistics', analysis)
    
    def test_batch_process_texts(self):
        """Test batch_process_texts function"""
        texts = [
            "First text.",
            "Second text.",
            "Third text."
        ]
        
        results = batch_process_texts(texts)
        
        self.assertEqual(len(results), 3)
        for result in results:
            self.assertIsInstance(result, str)
    
    def test_batch_process_texts_with_options(self):
        """Test batch_process_texts with different options"""
        texts = ["Test text."]
        results = batch_process_texts(texts, "email", "professional")
        
        self.assertEqual(len(results), 1)
        self.assertIsInstance(results[0], str)


class TestFactory(unittest.TestCase):
    """Test factory functions"""
    
    def test_simple_factory(self):
        """Test simple processor factory"""
        from api import TextProcessorFactory
        
        processor = TextProcessorFactory.create_simple()
        self.assertIsInstance(processor, SimpleTextProcessor)
        
        result = processor.process("Test text.")
        self.assertIsInstance(result, str)
    
    def test_advanced_factory(self):
        """Test advanced processor factory"""
        from api import TextProcessorFactory
        
        processor = TextProcessorFactory.create_advanced()
        self.assertIsInstance(processor, AdvancedTextProcessor)
        
        result = processor.process("Test text.")
        self.assertIsInstance(result.processed_text, str)


class TestPerformance(unittest.TestCase):
    """Test performance characteristics"""
    
    def test_processing_speed(self):
        """Test that processing completes in reasonable time"""
        processor = SimpleTextProcessor()
        text = "This is a test sentence for performance testing." * 10
        
        start_time = time.time()
        result = processor.process(text)
        processing_time = time.time() - start_time
        
        # Should complete within 5 seconds for this text length
        self.assertLess(processing_time, 5.0)
        self.assertIsInstance(result, str)
        self.assertGreater(len(result), 0)
    
    def test_batch_processing_efficiency(self):
        """Test that batch processing is efficient"""
        processor = AdvancedTextProcessor()
        texts = ["Test text."] * 10
        
        start_time = time.time()
        results = processor.batch_process(texts)
        total_time = time.time() - start_time
        
        # Should complete within reasonable time
        self.assertLess(total_time, 10.0)
        self.assertEqual(len(results), 10)


def run_all_tests():
    """Run all tests and return results"""
    # Create test suite
    loader = unittest.TestLoader()
    suite = unittest.TestSuite()
    
    # Add all test classes
    test_classes = [
        TestSimpleProcessor,
        TestAdvancedProcessor,
        TestTextAnalyzer,
        TestTextValidator,
        TestTextUtils,
        TestConvenienceFunctions,
        TestFactory,
        TestPerformance
    ]
    
    for test_class in test_classes:
        tests = loader.loadTestsFromTestCase(test_class)
        suite.addTests(tests)
    
    # Run tests
    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(suite)
    
    return result


if __name__ == "__main__":
    print("Running AI Text Processor Tests")
    print("=" * 50)
    
    result = run_all_tests()
    
    print("\n" + "=" * 50)
    print("TEST SUMMARY:")
    print(f"Tests run: {result.testsRun}")
    print(f"Failures: {len(result.failures)}")
    print(f"Errors: {len(result.errors)}")
    print(f"Success rate: {((result.testsRun - len(result.failures) - len(result.errors)) / result.testsRun * 100):.1f}%")
    
    if result.failures:
        print("\nFAILURES:")
        for test, traceback in result.failures:
            print(f"- {test}: {traceback}")
    
    if result.errors:
        print("\nERRORS:")
        for test, traceback in result.errors:
            print(f"- {test}: {traceback}")
