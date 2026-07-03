#!/usr/bin/env python3
"""
Setup script for AI Text Processor
Provides easy installation and usage examples
"""

import os
import sys
import subprocess

def install_dependencies():
    """Install required dependencies"""
    try:
        import unittest
        print("✓ Required dependencies already available")
        return True
    except ImportError:
        print("Installing dependencies...")
        # All dependencies are built-in for this module
        print("✓ All dependencies are available (built-in Python modules)")
        return True

def setup_module():
    """Setup the AI Text Processor module"""
    print("Setting up AI Text Processor...")
    
    # Add the src directory to Python path
    current_dir = os.path.dirname(os.path.abspath(__file__))
    src_dir = os.path.join(current_dir, 'src')
    
    if src_dir not in sys.path:
        sys.path.insert(0, src_dir)
        print(f"✓ Added {src_dir} to Python path")
    
    # Test imports
    try:
        from text_processor import AITextProcessor
        print("✓ Core modules imported successfully")
    except ImportError as e:
        print(f"✗ Import error: {e}")
        return False
    
    try:
        from utils.text_utils import TextAnalyzer
        print("✓ Utility modules imported successfully")
    except ImportError as e:
        print(f"✗ Utility import error: {e}")
        return False
    
    try:
        from api import SimpleTextProcessor
        print("✓ API modules imported successfully")
    except ImportError as e:
        print(f"✗ API import error: {e}")
        return False
    
    print("✓ AI Text Processor setup complete!")
    return True

def run_quick_test():
    """Run a quick functionality test"""
    print("\n" + "="*50)
    print("QUICK FUNCTIONALITY TEST")
    print("="*50)
    
    try:
        from api import SimpleTextProcessor
        
        # Test text
        test_text = "hey! i kinda think this is actually really good."
        print(f"Original: {test_text}")
        
        # Process text
        processor = SimpleTextProcessor()
        result = processor.process(test_text, "email", "professional")
        
        print(f"Processed: {result}")
        print("✓ Text processing test passed!")
        
        # Test advanced processing
        from api import AdvancedTextProcessor
        from text_processor import ProcessingOptions, ProcessingContext, ToneType
        
        advanced = AdvancedTextProcessor()
        options = ProcessingOptions(
            context=ProcessingContext.EMAIL,
            tone=ToneType.PROFESSIONAL,
            aggressiveness=0.7
        )
        
        result = advanced.process(test_text, options)
        print(f"Advanced processing confidence: {result.confidence_score:.2f}")
        print("✓ Advanced processing test passed!")
        
        return True
        
    except Exception as e:
        print(f"✗ Test failed: {e}")
        return False

def show_usage_examples():
    """Show usage examples"""
    print("\n" + "="*50)
    print("USAGE EXAMPLES")
    print("="*50)
    
    examples = {
        "Basic Processing": '''
from ai_text_processor.src.api import SimpleTextProcessor

processor = SimpleTextProcessor()
text = "hey! this is kinda good actually!"
result = processor.process(text, "email", "professional")
print(result)
        ''',
        
        "Advanced Processing": '''
from ai_text_processor.src.api import AdvancedTextProcessor
from ai_text_processor.src.text_processor import ProcessingOptions, ProcessingContext, ToneType

processor = AdvancedTextProcessor()
options = ProcessingOptions(
    context=ProcessingContext.EMAIL,
    tone=ToneType.PROFESSIONAL,
    aggressiveness=0.7,
    remove_fillers=True
)
result = processor.process(text, options)
print(f"Changes: {len(result.changes_made)}")
print(f"Confidence: {result.confidence_score:.2f}")
        ''',
        
        "Text Analysis": '''
from ai_text_processor.src.api import analyze_text

analysis = analyze_text("Your text here")
print(f"Readability: {analysis['readability']['flesch_score']}")
print(f"Keywords: {analysis['keywords']}")
        ''',
        
        "Batch Processing": '''
from ai_text_processor.src.api import batch_process_texts

texts = ["Text 1", "Text 2", "Text 3"]
results = batch_process_texts(texts, "document", "professional")
for result in results:
    print(result)
        '''
    }
    
    for title, code in examples.items():
        print(f"\n--- {title} ---")
        print(code.strip())

def run_tests():
    """Run the test suite"""
    print("\n" + "="*50)
    print("RUNNING TESTS")
    print("="*50)
    
    try:
        # Run tests
        result = subprocess.run([
            sys.executable, 
            os.path.join(os.path.dirname(__file__), 'tests', 'test_all.py')
        ], capture_output=True, text=True)
        
        print(result.stdout)
        if result.stderr:
            print("Errors:", result.stderr)
        
        if result.returncode == 0:
            print("✓ All tests passed!")
        else:
            print("✗ Some tests failed!")
            
        return result.returncode == 0
        
    except Exception as e:
        print(f"✗ Could not run tests: {e}")
        return False

def main():
    """Main setup function"""
    print("AI Text Processor Setup")
    print("=" * 50)
    
    # Install dependencies
    if not install_dependencies():
        print("✗ Failed to install dependencies")
        return False
    
    # Setup module
    if not setup_module():
        print("✗ Failed to setup module")
        return False
    
    # Run quick test
    if not run_quick_test():
        print("✗ Functionality test failed")
        return False
    
    # Ask if user wants to run full tests
    print("\n" + "="*50)
    response = input("Run full test suite? (y/N): ").lower().strip()
    if response == 'y':
        if not run_tests():
            print("✗ Some tests failed, but setup is complete")
    
    # Show usage examples
    show_usage_examples()
    
    print("\n" + "="*50)
    print("SETUP COMPLETE!")
    print("="*50)
    print("You can now use the AI Text Processor in your Python scripts.")
    print("See README.md for detailed documentation.")
    
    return True

if __name__ == "__main__":
    main()
