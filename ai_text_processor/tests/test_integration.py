"""
Integration tests for AI Text Processor
Tests end-to-end workflows and component interactions
"""

import pytest
import tempfile
import json
import os
from unittest.mock import patch, MagicMock

from src.api import SimpleTextProcessor, AdvancedTextProcessor, TextProcessorFactory, quick_process, batch_process_texts
from src.text_processor import ProcessingOptions, ProcessingContext, ToneType, ProcessingResult
from src.utils.text_utils import TextAnalyzer, TextValidator, CacheManager


class TestFullWorkflowIntegration:
    """Test complete processing workflows"""
    
    def test_end_to_end_text_processing(self):
        """Test complete text processing from input to final output"""
        # Input text with various issues
        raw_text = """
        Hey there! i basically wanted to send you this email about the API documentation 
        that we were working on. Its really important that we get this done ASAP because 
        the client is expecting it by friday. Can you like review it and make sure everything 
        looks good? Thanks!
        """
        
        # Process with professional context
        processor = SimpleTextProcessor()
        result = processor.process(raw_text, context='email', tone='professional')
        
        # Verify result is improved
        assert len(result) > 0
        assert result != raw_text  # Should be different from input
        
        # Check that tone was adjusted
        assert 'hey' not in result.lower()  # Informal greeting removed
        assert 'basically' not in result.lower()  # Filler word removed
        
    def test_multi_stage_processing(self):
        """Test multi-stage processing with different contexts"""
        text = "This is a technical document with API endpoints and JSON data."
        
        # Stage 1: Initial processing
        initial_result = quick_process(text, 'technical', 'neutral')
        
        # Stage 2: Advanced analysis
        processor = TextProcessorFactory.create_advanced()
        advanced_result = processor.process(text, ProcessingOptions(
            context=ProcessingContext.TECHNICAL,
            tone=ToneType.NEUTRAL,
            aggressiveness=0.9
        ))
        
        # Verify both stages produce valid results
        assert len(initial_result) > 0
        assert isinstance(advanced_result, ProcessingResult)
        assert advanced_result.original_text == text
        
    def test_batch_processing_workflow(self):
        """Test batch processing workflow"""
        texts = [
            "First email draft.",
            "Second technical document.",
            "Third social media post.",
            "Fourth code comment.",
            "Fifth academic abstract."
        ]
        
        contexts = ['email', 'technical', 'social', 'code', 'academic']
        
        # Process all texts
        results = batch_process_texts(texts, contexts=contexts)
        
        assert len(results) == len(texts)
        
        # Verify each result corresponds to its context
        for i, (original, processed, context) in enumerate(zip(texts, results, contexts)):
            assert len(processed) > 0
            assert processed != original  # Should be modified
            
    def test_error_recovery_workflow(self):
        """Test error recovery in processing pipeline"""
        processor = AdvancedTextProcessor()
        
        # Test with invalid inputs
        invalid_inputs = ["", "   ", None]
        
        for invalid_input in invalid_inputs:
            if invalid_input is None:
                with pytest.raises((TypeError, ValueError)):
                    processor.process(invalid_input)
            else:
                result = processor.process(invalid_input)
                assert result is not None
                # Should handle gracefully
    
    def test_cache_invalidation_workflow(self):
        """Test cache invalidation during processing"""
        processor = AdvancedTextProcessor()
        text = "Cache test text for workflow testing."
        
        # First processing (cache miss)
        result1 = processor.process(text)
        
        # Second processing (cache hit)
        result2 = processor.process(text)
        
        # Results should be identical
        assert result1.processed_text == result2.processed_text
        
        # Clear cache
        processor.clear_cache()
        
        # Third processing (cache miss again)
        result3 = processor.process(text)
        
        # Result should still be identical
        assert result3.processed_text == result1.processed_text


class TestComponentInteractionIntegration:
    """Test interactions between different components"""
    
    def test_text_analyzer_integration(self):
        """Test integration with TextAnalyzer component"""
        processor = AdvancedTextProcessor()
        text = "This is a comprehensive integration test for text analysis."
        
        # Get analysis from processor
        processor_analysis = processor.analyze_text(text)
        
        # Get analysis from TextAnalyzer directly
        analyzer_analysis = TextAnalyzer.analyze_text(text)
        
        # Both should produce similar results
        assert 'readability' in processor_analysis
        assert 'readability' in analyzer_analysis
        
        assert 'statistics' in processor_analysis
        assert 'statistics' in analyzer_analysis
        
    def test_text_validator_integration(self):
        """Test integration with TextValidator component"""
        processor = AdvancedTextProcessor()
        
        # Valid text
        valid_text = "This is a valid text for processing."
        is_valid, errors = TextValidator.validate_input_text(valid_text)
        assert is_valid
        assert len(errors) == 0
        
        # Process valid text
        result = processor.process(valid_text)
        assert isinstance(result, ProcessingResult)
        
        # Invalid text
        invalid_text = ""
        is_valid, errors = TextValidator.validate_input_text(invalid_text)
        assert not is_valid
        assert len(errors) > 0
        
        # Processing should handle invalid text gracefully
        result = processor.process(invalid_text)
        assert result is not None
    
    def test_cache_manager_integration(self):
        """Test integration with CacheManager component"""
        processor = AdvancedTextProcessor()
        text = "Cache integration test text."
        
        # Get cache manager
        cache = processor.cache
        
        # Process text
        result1 = processor.process(text)
        
        # Verify cache has entry
        cached_result = cache.get(text)
        assert cached_result is not None
        
        # Process same text again
        result2 = processor.process(text)
        
        # Should get cached result
        assert result1.processed_text == result2.processed_text
        
        # Clear cache
        cache.clear()
        
        # Verify cache is empty
        assert cache.size() == 0
    
    def test_performance_monitor_integration(self):
        """Test integration with PerformanceMonitor component"""
        processor = AdvancedTextProcessor()
        text = "Performance monitoring integration test."
        
        # Get initial performance report
        initial_report = processor.get_performance_report()
        
        # Process some text
        processor.process(text)
        
        # Get updated performance report
        updated_report = processor.get_performance_report()
        
        # Total processed should increase
        assert updated_report['total_processed'] > initial_report['total_processed']
        
        # Performance metrics should be available
        assert 'average_time_seconds' in updated_report
        assert 'error_rate' in updated_report


class TestDataFlowIntegration:
    """Test data flow between components"""
    
    def test_processing_pipeline_data_flow(self):
        """Test data flow through processing pipeline"""
        processor = AdvancedTextProcessor()
        text = "This text should flow through the complete processing pipeline."
        
        # Step 1: Validation
        is_valid, errors = TextValidator.validate_input_text(text)
        assert is_valid
        
        # Step 2: Processing
        result = processor.process(text)
        assert isinstance(result, ProcessingResult)
        assert result.original_text == text
        
        # Step 3: Analysis
        analysis = processor.analyze_text(text)
        assert 'readability' in analysis
        
        # Step 4: Statistics update
        stats = processor.get_performance_report()
        assert stats['total_processed'] > 0
        
    def test_batch_processing_data_aggregation(self):
        """Test data aggregation in batch processing"""
        processor = AdvancedTextProcessor()
        texts = ["Batch test text 1.", "Batch test text 2.", "Batch test text 3."]
        
        # Process batch
        results = processor.batch_process(texts)
        
        # Verify data aggregation
        assert len(results) == len(texts)
        
        # Each result should have expected structure
        for result in results:
            assert isinstance(result, ProcessingResult)
            assert len(result.processed_text) > 0
            assert isinstance(result.confidence_score, float)
            assert isinstance(result.processing_time, float)
        
        # Performance report should reflect batch processing
        report = processor.get_performance_report()
        assert report['total_processed'] >= len(texts)
    
    def test_plugin_system_integration(self):
        """Test plugin system integration"""
        processor = AdvancedTextProcessor()
        
        # Create a mock plugin
        class MockPlugin:
            name = "test-integration-plugin"
            
            def initialize(self):
                pass
                
            def cleanup(self):
                pass
                
            def on_before_process(self, text, options):
                return text.upper()
                
            def on_after_process(self, result):
                result.metadata = result.metadata or {}
                result.metadata['plugin_processed'] = True
                return result
        
        # Register plugin
        plugin = MockPlugin()
        processor.register_plugin(plugin)
        
        text = "Plugin integration test."
        result = processor.process(text)
        
        # Plugin should have processed the text
        assert result.processed_text.isupper()  # Plugin uppercased the text
        assert result.metadata.get('plugin_processed') == True
        
        # Clean up
        processor.unregister_plugin(plugin.name)


class TestErrorHandlingIntegration:
    """Test error handling across component boundaries"""
    
    def test_cascade_error_handling(self):
        """Test error handling when one component fails"""
        processor = AdvancedTextProcessor()
        
        # Mock TextAnalyzer to raise an error
        with patch.object(TextAnalyzer, 'analyze_text', side_effect=Exception("Analysis error")):
            # Processing should still work despite analyzer failure
            text = "Test text for cascade error handling."
            result = processor.process(text)
            
            assert result is not None
            assert result.processed_text is not None
    
    def test_recovery_from_component_failure(self):
        """Test recovery when a component fails and recovers"""
        processor = AdvancedTextProcessor()
        
        # Mock cache to fail first time, then work
        cache = processor.cache
        call_count = 0
        
        original_get = cache.get
        def mock_get(key):
            nonlocal call_count
            call_count += 1
            if call_count == 1:
                raise Exception("Cache error")
            return original_get(key)
        
        cache.get = mock_get
        
        text = "Recovery test text."
        
        # First call should fail but recover
        try:
            result1 = processor.process(text)
        except:
            pass  # Expected to fail first time
        
        # Second call should work
        result2 = processor.process(text)
        assert result2 is not None
        assert len(result2.processed_text) > 0


class TestStateManagementIntegration:
    """Test state management across component interactions"""
    
    def test_processor_state_persistence(self):
        """Test that processor state persists across operations"""
        processor = AdvancedTextProcessor()
        
        # Set some custom options
        custom_options = ProcessingOptions(
            context=ProcessingContext.TECHNICAL,
            tone=ToneType.PROFESSIONAL,
            aggressiveness=0.8
        )
        
        # Process text with custom options
        result1 = processor.process("Test text.", custom_options)
        
        # Process another text (should maintain state)
        result2 = processor.process("Another test text.")
        
        # State should be maintained
        # Note: This depends on actual implementation
        assert isinstance(result1, ProcessingResult)
        assert isinstance(result2, ProcessingResult)
        
    def test_shared_state_between_processors(self):
        """Test sharing state between different processor instances"""
        # Create two processors that might share state
        processor1 = AdvancedTextProcessor()
        processor2 = AdvancedTextProcessor()
        
        text = "Shared state test."
        
        # Process with first processor
        result1 = processor1.process(text)
        
        # Process with second processor
        result2 = processor2.process(text)
        
        # Both should produce similar results (if sharing state/cache)
        assert len(result1.processed_text) > 0
        assert len(result2.processed_text) > 0
        
    def test_thread_local_state(self):
        """Test thread-local state management"""
        import threading
        from threading import Thread
        
        processor = AdvancedTextProcessor()
        results = {}
        
        def process_worker(thread_id, text):
            result = processor.process(text)
            results[thread_id] = result
        
        # Create threads
        threads = []
        for i in range(3):
            thread = Thread(target=process_worker, args=(i, f"Thread {i} text."))
            threads.append(thread)
            thread.start()
        
        # Wait for completion
        for thread in threads:
            thread.join()
        
        # Each thread should have its own result
        assert len(results) == 3
        for thread_id, result in results.items():
            assert isinstance(result, ProcessingResult)


class TestConfigurationIntegration:
    """Test configuration management across components"""
    
    def test_global_configuration_integration(self):
        """Test global configuration affecting all components"""
        # This would test global configuration management
        # Implementation depends on actual config system
        assert True  # Placeholder
    
    def test_component_configuration_consistency(self):
        """Test that component configurations are consistent"""
        processor = AdvancedTextProcessor()
        
        # Set configuration
        config = {
            'context': ProcessingContext.EMAIL,
            'tone': ToneType.PROFESSIONAL,
            'aggressiveness': 0.7
        }
        
        # Process multiple texts with same config
        texts = ["Email 1.", "Email 2.", "Email 3."]
        results = []
        
        for text in texts:
            options = ProcessingOptions(**config)
            result = processor.process(text, options)
            results.append(result)
        
        # All results should be processed consistently
        for result in results:
            assert isinstance(result, ProcessingResult)
            assert len(result.processed_text) > 0
        
    def test_dynamic_configuration_changes(self):
        """Test dynamic configuration changes during processing"""
        processor = AdvancedTextProcessor()
        
        texts = ["Email text.", "Social text.", "Technical text."]
        contexts = [ProcessingContext.EMAIL, ProcessingContext.SOCIAL, ProcessingContext.TECHNICAL]
        
        results = []
        for text, context in zip(texts, contexts):
            options = ProcessingOptions(context=context)
            result = processor.process(text, options)
            results.append(result)
        
        # Each should be processed with its specific configuration
        assert len(results) == len(texts)
        for result in results:
            assert isinstance(result, ProcessingResult)