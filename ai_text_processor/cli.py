#!/usr/bin/env python3
"""
Command-line interface for AI Text Processor
Provides easy command-line access to text processing features
"""

import argparse
import sys
import os
from pathlib import Path

# Add the current directory to Python path
current_dir = os.path.dirname(os.path.abspath(__file__))
src_dir = os.path.join(current_dir, 'src')
sys.path.insert(0, src_dir)

try:
    from api import SimpleTextProcessor, AdvancedTextProcessor, analyze_text
    from text_processor import ProcessingOptions, ProcessingContext, ToneType
except ImportError as e:
    print(f"Error importing modules: {e}")
    print("Make sure you're running this from the ai_text_processor directory")
    sys.exit(1)


def process_text_simple(args):
    """Process text using simple interface"""
    processor = SimpleTextProcessor()
    
    # Read text from file if specified
    if args.input_file:
        try:
            with open(args.input_file, 'r', encoding='utf-8') as f:
                text = f.read()
        except FileNotFoundError:
            print(f"Error: File '{args.input_file}' not found")
            return 1
        except Exception as e:
            print(f"Error reading file: {e}")
            return 1
    else:
        text = args.text
    
    if not text.strip():
        print("Error: No text to process")
        return 1
    
    # Process text
    try:
        result = processor.process(
            text, 
            context=args.context, 
            tone=args.tone,
            aggressive=args.aggressive
        )
        
        if args.output_file:
            with open(args.output_file, 'w', encoding='utf-8') as f:
                f.write(result)
            print(f"Processed text saved to: {args.output_file}")
        else:
            print("PROCESSED TEXT:")
            print("=" * 50)
            print(result)
            print("=" * 50)
        
        return 0
        
    except Exception as e:
        print(f"Error processing text: {e}")
        return 1


def analyze_text_cmd(args):
    """Analyze text using text analysis"""
    
    # Read text from file if specified
    if args.input_file:
        try:
            with open(args.input_file, 'r', encoding='utf-8') as f:
                text = f.read()
        except FileNotFoundError:
            print(f"Error: File '{args.input_file}' not found")
            return 1
        except Exception as e:
            print(f"Error reading file: {e}")
            return 1
    else:
        text = args.text
    
    if not text.strip():
        print("Error: No text to analyze")
        return 1
    
    try:
        analysis = analyze_text(text)
        
        # Display analysis
        print("TEXT ANALYSIS:")
        print("=" * 50)
        
        # Readability
        readability = analysis['readability']
        print(f"Readability (Flesch Score): {readability['flesch_score']:.1f}/100")
        print(f"Avg Sentence Length: {readability['avg_sentence_length']:.1f} words")
        
        # Statistics
        stats = analysis['statistics']
        print(f"\nStatistics:")
        print(f"  Words: {stats['word_count']}")
        print(f"  Characters: {stats['character_count']}")
        print(f"  Sentences: {stats['sentence_count']}")
        print(f"  Paragraphs: {stats['paragraph_count']}")
        
        # Text type
        text_type = analysis['text_type']
        print(f"\nText Type: {text_type['primary_type']} (confidence: {text_type['confidence']:.2f})")
        
        # Keywords
        keywords = analysis['keywords']
        print(f"\nKeywords: {', '.join(keywords[:10])}")
        
        # Summary
        summary = analysis['summary']
        print(f"\nGenerated Summary:")
        print(f"  {summary}")
        
        if args.output_file:
            import json
            with open(args.output_file, 'w', encoding='utf-8') as f:
                json.dump(analysis, f, indent=2)
            print(f"\nFull analysis saved to: {args.output_file}")
        
        return 0
        
    except Exception as e:
        print(f"Error analyzing text: {e}")
        return 1


def batch_process_cmd(args):
    """Process multiple texts in batch"""
    
    # Read texts from file
    try:
        with open(args.input_file, 'r', encoding='utf-8') as f:
            lines = f.readlines()
        
        texts = [line.strip() for line in lines if line.strip()]
        
        if not texts:
            print("Error: No text lines found in file")
            return 1
            
    except FileNotFoundError:
        print(f"Error: File '{args.input_file}' not found")
        return 1
    except Exception as e:
        print(f"Error reading file: {e}")
        return 1
    
    # Process texts
    processor = SimpleTextProcessor()
    results = []
    
    try:
        for i, text in enumerate(texts, 1):
            print(f"Processing text {i}/{len(texts)}...", end=" ")
            result = processor.process(
                text,
                context=args.context,
                tone=args.tone,
                aggressive=args.aggressive
            )
            results.append(result)
            print("Done")
        
        # Save results
        if args.output_file:
            with open(args.output_file, 'w', encoding='utf-8') as f:
                for result in results:
                    f.write(result + '\n')
            print(f"\nProcessed texts saved to: {args.output_file}")
        else:
            print("\nPROCESSED TEXTS:")
            print("=" * 50)
            for i, result in enumerate(results, 1):
                print(f"{i}. {result}")
            print("=" * 50)
        
        return 0
        
    except Exception as e:
        print(f"Error in batch processing: {e}")
        return 1


def interactive_mode():
    """Interactive text processing mode"""
    print("AI Text Processor - Interactive Mode")
    print("=" * 50)
    print("Enter text to process (press Ctrl+C to exit)")
    print("Commands: 'analyze <text>', 'help', 'quit'")
    print()
    
    processor = SimpleTextProcessor()
    
    try:
        while True:
            try:
                user_input = input("> ").strip()
                
                if not user_input:
                    continue
                
                if user_input.lower() in ['quit', 'exit', 'q']:
                    print("Goodbye!")
                    break
                
                if user_input.lower() == 'help':
                    print("Available commands:")
                    print("  <text> - Process text with default settings")
                    print("  analyze <text> - Analyze text")
                    print("  help - Show this help")
                    print("  quit - Exit interactive mode")
                    print()
                    continue
                
                if user_input.lower().startswith('analyze '):
                    text = user_input[8:].strip()
                    if text:
                        analysis = analyze_text(text)
                        print(f"Words: {analysis['statistics']['word_count']}")
                        print(f"Readability: {analysis['readability']['flesch_score']:.1f}")
                        print(f"Type: {analysis['text_type']['primary_type']}")
                    else:
                        print("Usage: analyze <text>")
                    continue
                
                # Regular text processing
                print("Processing...")
                result = processor.process(user_input, aggressive=False)
                print("Result:")
                print(result)
                print()
                
            except KeyboardInterrupt:
                print("\nGoodbye!")
                break
            except Exception as e:
                print(f"Error: {e}")
                print()
                
    except Exception as e:
        print(f"Error in interactive mode: {e}")
        return 1
    
    return 0


def main():
    """Main command-line interface"""
    parser = argparse.ArgumentParser(
        description="AI Text Processing Module - Command Line Interface",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Process text with default settings
  python cli.py --text "hey! this is good actually!"

  # Process text for email with professional tone
  python cli.py --text "hey team! the project is going well!" --context email --tone professional

  # Analyze text from file
  python cli.py analyze --input-file text.txt

  # Batch process multiple texts
  python cli.py batch --input-file texts.txt --output-file processed.txt

  # Interactive mode
  python cli.py interactive
        """
    )
    
    # Global options
    parser.add_argument('--context', default='document',
                       choices=['email', 'code', 'document', 'social', 'formal', 'casual', 'technical', 'creative'],
                       help='Processing context (default: document)')
    parser.add_argument('--tone', default='neutral',
                       choices=['professional', 'friendly', 'formal', 'casual', 'empathetic', 'confident', 'persuasive', 'neutral'],
                       help='Tone adjustment (default: neutral)')
    parser.add_argument('--aggressive', action='store_true',
                       help='Apply aggressive processing (remove fillers, etc.)')
    
    subparsers = parser.add_subparsers(dest='command', help='Available commands')
    
    # Process command
    process_parser = subparsers.add_parser('process', help='Process text')
    group = process_parser.add_mutually_exclusive_group(required=True)
    group.add_argument('--text', help='Text to process')
    group.add_argument('--input-file', help='Input file containing text to process')
    process_parser.add_argument('--output-file', help='Output file for processed text')
    
    # Analyze command
    analyze_parser = subparsers.add_parser('analyze', help='Analyze text')
    group = analyze_parser.add_mutually_exclusive_group(required=True)
    group.add_argument('--text', help='Text to analyze')
    group.add_argument('--input-file', help='Input file containing text to analyze')
    analyze_parser.add_argument('--output-file', help='Output file for analysis results (JSON)')
    
    # Batch command
    batch_parser = subparsers.add_parser('batch', help='Process multiple texts')
    batch_parser.add_argument('--input-file', required=True, help='Input file with one text per line')
    batch_parser.add_argument('--output-file', help='Output file for processed texts')
    
    # Interactive command
    interactive_parser = subparsers.add_parser('interactive', help='Interactive text processing mode')
    
    # Parse arguments
    args = parser.parse_args()
    
    # Handle no arguments (show help)
    if not args.command:
        parser.print_help()
        return 0
    
    # Execute command
    if args.command == 'process':
        return process_text_simple(args)
    elif args.command == 'analyze':
        return analyze_text_cmd(args)
    elif args.command == 'batch':
        return batch_process_cmd(args)
    elif args.command == 'interactive':
        return interactive_mode()
    else:
        print(f"Unknown command: {args.command}")
        return 1


if __name__ == "__main__":
    sys.exit(main())
