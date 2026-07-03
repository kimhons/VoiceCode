"""
Performance and benchmark tests for AI Text Processor
"""

import pytest
import time
import statistics
import concurrent.futures
from concurrent.futures import ThreadPoolExecutor
from unittest.mock import patch

from src.api import SimpleTextProcessor, AdvancedTextProcessor
from src.text_processor import ProcessingOptions, ProcessingContext, ToneType


class TestPerformanceBenchmarks:
    """Performance benchmarks for text processing"""
    
    @pytest.fixture
    def processor(self):
        return SimpleTextProcessor()
    
    @pytest.fixture
    def advanced_processor(self):
        return AdvancedTextProcessor()
    
    @pytest.fixture
    def sample_texts(self):
        return [
            "Short text.",
            "This is a medium length sentence with some complexity.",
            "This is a much longer text that contains multiple sentences and should take longer to process. " * 10,
            "Technical documentation with API endpoints, JSON data structures, and various programming concepts. " * 20,
            "Very long academic text with complex vocabulary, multiple clauses, subordinate phrases, and advanced grammatical structures that should test the limits of the processing system. " * 50
        ]
    
    def test_processing_speed_benchmark(self, processor, benchmark):
        """Benchmark processing speed for different text lengths"""
        text = "This is a benchmark test sentence for measuring processing performance."
        
        def process_text():
            return processor.process(text)
        
        result = benchmark(processing_time_processor, processor, text)
        assert result is not None
        assert len(result) > 0
    
    @pytest.mark.performance
    def test_batch_processing_efficiency(self, advanced_processor, benchmark):
        """Test batch processing efficiency"""
        texts = ["Sample text for batch processing."] * 100
        
        def batch_process():
            return advanced_processor.batch_process(texts)
        
        result = benchmark(batch_process)
        assert len(result) == 100
        assert all(hasattr(r, 'processed_text') for r in result)
    
    @pytest.mark.performance
    def test_concurrent_processing(self, advanced_processor):
        """Test concurrent processing performance"""
        texts = ["Concurrent test text."] * 50
        
        # Sequential processing
        start_time = time.time()
        sequential_results = []
        for text in texts:
            result = advanced_processor.process(text)
            sequential_results.append(result)
        sequential_time = time.time() - start_time
        
        # Concurrent processing
        start_time = time.time()
        with ThreadPoolExecutor(max_workers=4) as executor:
            concurrent_results = list(executor.map(
                advanced_processor.process, texts
            ))
        concurrent_time = time.time() - start_time
        
        # Concurrent should be faster (or at least not significantly slower)
        print(f"Sequential: {sequential_time:.3f}s, Concurrent: {concurrent_time:.3f}s")
        assert len(concurrent_results) == 50
        assert all(hasattr(r, 'processed_text') for r in concurrent_results)
    
    @pytest.mark.performance
    def test_large_text_processing(self, processor):
        """Test processing of very large texts"""
        # Create a very large text
        base_sentence = "This is a test sentence with various words and punctuation for performance testing."
        large_text = (base_sentence + " ") * 10000  # ~1M characters
        
        start_time = time.time()
        result = processor.process(large_text)
        processing_time = time.time() - start_time
        
        print(f"Processed {len(large_text)} characters in {processing_time:.3f}s")
        
        assert len(result) > 0
        assert processing_time < 10.0  # Should complete within 10 seconds
    
    @pytest.mark.performance
    def test_memory_usage_during_batch_processing(self, advanced_processor):
        """Test memory usage during batch processing"""
        texts = ["Memory test text."] * 1000
        
        # Get initial memory usage (if psutil is available)
        try:
            import psutil
            process = psutil.Process()
            initial_memory = process.memory_info().rss
        except ImportError:
            initial_memory = 0
        
        start_time = time.time()
        results = advanced_processor.batch_process(texts)
        processing_time = time.time() - start_time
        
        # Check final memory usage
        try:
            final_memory = process.memory_info().rss
            memory_increase = final_memory - initial_memory
            print(f"Memory increase: {memory_increase / 1024 / 1024:.2f} MB")
        except (ImportError, NameError):
            memory_increase = 0
        
        assert len(results) == 1000
        assert processing_time < 30.0  # Should complete within 30 seconds
        assert all(hasattr(r, 'processed_text') for r in results)
    
    @pytest.mark.performance
    def test_cache_performance(self, advanced_processor):
        """Test cache performance impact"""
        text = "This is a text for cache performance testing."
        
        # First run (cache miss)
        start_time = time.time()
        result1 = advanced_processor.process(text)
        first_run_time = time.time() - start_time
        
        # Second run (cache hit)
        start_time = time.time()
        result2 = advanced_processor.process(text)
        second_run_time = time.time() - start_time
        
        print(f"First run: {first_run_time:.4f}s, Second run: {second_run_time:.4f}s")
        
        assert result1.processed_text == result2.processed_text
        assert second_run_time < first_run_time  # Cache should be faster
    
    @pytest.mark.performance
    def test_text_analysis_performance(self, advanced_processor):
        """Test performance of text analysis features"""
        text = "This is a comprehensive test for analysis performance. " * 100
        
        start_time = time.time()
        analysis = advanced_processor.analyze_text(text)
        analysis_time = time.time() - start_time
        
        print(f"Analysis completed in {analysis_time:.3f}s")
        
        assert analysis_time < 5.0  # Should complete within 5 seconds
        assert 'readability' in analysis
        assert 'statistics' in analysis
        assert 'keywords' in analysis
    
    @pytest.mark.performance
    def test_aggressive_processing_performance(self, processor):
        """Test performance of aggressive processing options"""
        text = "This is like, basically, really important for testing performance with aggressive processing enabled."
        
        start_time = time.time()
        result = processor.process(text, aggressive=True)
        aggressive_time = time.time() - start_time
        
        start_time = time.time()
        result_normal = processor.process(text, aggressive=False)
        normal_time = time.time() - start_time
        
        print(f"Aggressive: {aggressive_time:.4f}s, Normal: {normal_time:.4f}s")
        
        assert len(result) > 0
        assert len(result_normal) > 0
        # Aggressive processing might be slower due to more complex operations
    
    @pytest.mark.performance
    def test_context_switching_performance(self, processor):
        """Test performance when switching between different contexts"""
        text = "This is a test for context switching performance."
        contexts = ['email', 'code', 'document', 'social', 'technical']
        
        start_time = time.time()
        results = []
        for context in contexts:
            result = processor.process(text, context=context)
            results.append(result)
        context_switching_time = time.time() - start_time
        
        print(f"Context switching for {len(contexts)} contexts took {context_switching_time:.3f}s")
        
        assert len(results) == len(contexts)
        assert all(len(result) > 0 for result in results)
        assert context_switching_time < 5.0  # Should complete within 5 seconds


class TestScalabilityTests:
    """Tests for scalability under load"""
    
    @pytest.mark.performance
    @pytest.mark.slow
    def test_sustained_load_performance(self):
        """Test performance under sustained load"""
        processor = SimpleTextProcessor()
        duration = 60  # Run for 60 seconds
        batch_size = 10
        texts = ["Load test text for sustained performance."] * batch_size
        
        start_time = time.time()
        processed_count = 0
        processing_times = []
        
        while time.time() - start_time < duration:
            batch_start = time.time()
            
            # Process batch
            for text in texts:
                result = processor.process(text)
                processed_count += 1
            
            batch_time = time.time() - batch_start
            processing_times.append(batch_time)
            
            # Brief pause between batches
            time.sleep(0.1)
        
        total_time = time.time() - start_time
        
        # Calculate statistics
        avg_time = statistics.mean(processing_times)
        max_time = max(processing_times)
        min_time = min(processing_times)
        
        print(f"Processed {processed_count} texts in {total_time:.1f}s")
        print(f"Average batch time: {avg_time:.3f}s, Min: {min_time:.3f}s, Max: {max_time:.3f}s")
        print(f"Throughput: {processed_count / total_time:.1f} texts/second")
        
        # Performance assertions
        assert processed_count > 0
        assert total_time >= duration * 0.9  # Should run for at least 90% of target duration
        assert avg_time < 1.0  # Average batch time should be reasonable
    
    @pytest.mark.performance
    def test_memory_growth_under_load(self):
        """Test memory growth during extended processing"""
        processor = SimpleTextProcessor()
        iterations = 1000
        
        try:
            import psutil
            process = psutil.Process()
            initial_memory = process.memory_info().rss
            memory_samples = [initial_memory]
        except ImportError:
            initial_memory = 0
            memory_samples = [0]
        
        for i in range(iterations):
            text = f"Memory test iteration {i} for growth analysis."
            result = processor.process(text)
            
            # Sample memory every 100 iterations
            if i % 100 == 0:
                try:
                    current_memory = process.memory_info().rss
                    memory_samples.append(current_memory)
                except NameError:
                    pass
        
        # Analyze memory growth
        if len(memory_samples) > 1:
            memory_growth = memory_samples[-1] - memory_samples[0]
            print(f"Memory growth after {iterations} iterations: {memory_growth / 1024 / 1024:.2f} MB")
            
            # Memory growth should be reasonable (not excessive leaks)
            assert memory_growth < 100 * 1024 * 1024  # Less than 100MB growth
    
    @pytest.mark.performance
    def test_cache_eviction_performance(self, advanced_processor):
        """Test cache eviction under memory pressure"""
        # Fill cache with many entries
        texts = [f"Cache test text {i} for eviction testing." for i in range(1000)]
        
        start_time = time.time()
        for text in texts:
            advanced_processor.process(text)
        fill_time = time.time() - start_time
        
        # Clear cache and measure
        cache = advanced_processor.cache
        cache.clear()
        assert cache.size() == 0
        
        print(f"Filled cache with {len(texts)} entries in {fill_time:.3f}s")


class TestConcurrencyTests:
    """Tests for concurrent processing scenarios"""
    
    @pytest.mark.performance
    def test_thread_safety(self):
        """Test thread safety of processors"""
        from threading import Thread
        from queue import Queue
        
        processor = SimpleTextProcessor()
        queue = Queue()
        num_threads = 10
        texts_per_thread = 50
        
        def process_worker(thread_id):
            for i in range(texts_per_thread):
                text = f"Thread {thread_id} text {i}."
                try:
                    result = processor.process(text)
                    queue.put((thread_id, i, len(result)))
                except Exception as e:
                    queue.put((thread_id, i, str(e)))
        
        # Start threads
        threads = []
        start_time = time.time()
        for thread_id in range(num_threads):
            thread = Thread(target=process_worker, args=(thread_id,))
            threads.append(thread)
            thread.start()
        
        # Wait for completion
        for thread in threads:
            thread.join()
        
        total_time = time.time() - start_time
        
        # Collect results
        results = []
        while not queue.empty():
            results.append(queue.get())
        
        print(f"Processed {len(results)} texts with {num_threads} threads in {total_time:.2f}s")
        
        # Verify all tasks completed
        assert len(results) == num_threads * texts_per_thread
        
        # Check for errors
        errors = [r for r in results if isinstance(r[2], str)]
        assert len(errors) == 0, f"Found {len(errors)} errors during concurrent processing"
    
    @pytest.mark.performance
    def test_shared_cache_thread_safety(self, advanced_processor):
        """Test thread safety of shared cache"""
        from threading import Thread
        from threading import Lock
        import time
        
        cache = advanced_processor.cache
        lock = Lock()
        results = []
        
        def cache_worker(worker_id):
            for i in range(50):
                text = f"Worker {worker_id} cache test {i}."
                
                try:
                    result = advanced_processor.process(text)
                    with lock:
                        results.append(result.processed_text)
                except Exception as e:
                    with lock:
                        results.append(f"Error: {e}")
                
                # Small delay to encourage cache interactions
                time.sleep(0.01)
        
        # Start workers
        workers = 5
        threads = []
        start_time = time.time()
        
        for worker_id in range(workers):
            thread = Thread(target=cache_worker, args=(worker_id,))
            threads.append(thread)
            thread.start()
        
        # Wait for completion
        for thread in threads:
            thread.join()
        
        total_time = time.time() - start_time
        
        print(f"Cache stress test with {workers} workers completed in {total_time:.2f}s")
        print(f"Cache size: {cache.size()}")
        
        # Verify no errors occurred
        errors = [r for r in results if r.startswith("Error:")]
        assert len(errors) == 0, f"Found {len(errors)} cache-related errors"


def processing_time_processor(processor, text):
    """Helper function for pytest-benchmark"""
    start_time = time.time()
    result = processor.process(text)
    processing_time = time.time() - start_time
    return result, processing_time