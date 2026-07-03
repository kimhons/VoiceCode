"""
AI-Powered Text Processing Engine
A comprehensive module for grammar correction, punctuation, formatting, tone adjustment,
and context-aware editing with smart text cleanup features.
"""

import re
import json
import logging
from typing import Dict, List, Optional, Tuple, Any
from dataclasses import dataclass, asdict
from enum import Enum
from collections import defaultdict


class ProcessingContext(Enum):
    """Text processing context types"""
    EMAIL = "email"
    CODE = "code"
    DOCUMENT = "document"
    SOCIAL = "social"
    FORMAL = "formal"
    CASUAL = "casual"
    TECHNICAL = "technical"
    CREATIVE = "creative"


class ToneType(Enum):
    """Tone adjustment types"""
    PROFESSIONAL = "professional"
    FRIENDLY = "friendly"
    FORMAL = "formal"
    CASUAL = "casual"
    EMPATHETIC = "empathetic"
    CONFIDENT = "confident"
    PERSUASIVE = "persuasive"
    NEUTRAL = "neutral"


@dataclass
class ProcessingOptions:
    """Configuration options for text processing"""
    context: ProcessingContext = ProcessingContext.DOCUMENT
    tone: ToneType = ToneType.NEUTRAL
    correct_grammar: bool = True
    fix_punctuation: bool = True
    improve_formatting: bool = True
    adjust_tone: bool = True
    remove_fillers: bool = True
    auto_format: bool = True
    style_matching: bool = True
    aggressiveness: float = 0.5  # 0.0 = conservative, 1.0 = aggressive
    preserve_specifics: bool = True  # Keep proper nouns, technical terms, etc.


@dataclass
class ProcessingResult:
    """Result of text processing operations"""
    original_text: str
    processed_text: str
    changes_made: List[Dict[str, Any]]
    suggestions: List[Dict[str, Any]]
    confidence_score: float
    processing_time: float


class AITextProcessor:
    """
    Main AI-powered text processing engine
    Handles grammar correction, punctuation, formatting, tone adjustment, and context-aware editing
    """
    
    def __init__(self, config_path: Optional[str] = None):
        """Initialize the text processor with configuration"""
        self.logger = logging.getLogger(__name__)
        self.config = self._load_config(config_path)
        
        # Initialize sub-processors
        self.grammar_processor = GrammarProcessor()
        self.punctuation_processor = PunctuationProcessor()
        self.formatting_processor = FormattingProcessor()
        self.tone_processor = ToneProcessor()
        self.filler_remover = FillerWordRemover()
        self.auto_formatter = AutoFormatter()
        self.style_matcher = StyleMatcher()
        self.context_analyzer = ContextAnalyzer()
        
        # Common filler words for removal
        self.filler_words = {
            'actually', 'basically', 'literally', 'very', 'really', 'quite',
            'sort of', 'kind of', 'maybe', 'perhaps', 'like', 'you know',
            'i mean', 'just', 'simply', 'somewhat', 'probably', 'definitely'
        }
        
        # Technical terms to preserve
        self.technical_terms = set()
    
    def _load_config(self, config_path: Optional[str]) -> Dict[str, Any]:
        """Load configuration from file or use defaults"""
        default_config = {
            "grammar_rules": {
                "common_mistakes": {
                    "its/it's": True,
                    "their/there/they're": True,
                    "your/you're": True,
                    "affect/effect": True,
                    "lose/loose": True
                }
            },
            "punctuation_rules": {
                "fix_multiple_punctuation": True,
                "add_missing_periods": True,
                "fix_space_issues": True,
                "smart_quotes": True
            },
            "tone_adjustments": {
                "professional": {
                    "replace_informal": True,
                    "improve_formality": True
                },
                "friendly": {
                    "soften_language": True,
                    "add_warmth": True
                }
            },
            "formatting_rules": {
                "sentence_spacing": True,
                "paragraph_structure": True,
                "bullet_points": True,
                "headers": True
            }
        }
        
        if config_path and os.path.exists(config_path):
            try:
                with open(config_path, 'r') as f:
                    config = json.load(f)
                    # Merge with defaults
                    default_config.update(config)
            except Exception as e:
                self.logger.warning(f"Could not load config: {e}")
        
        return default_config
    
    def process_text(
        self, 
        text: str, 
        options: Optional[ProcessingOptions] = None
    ) -> ProcessingResult:
        """
        Process text with all specified features
        """
        import time
        start_time = time.time()
        
        if not options:
            options = ProcessingOptions()
        
        original_text = text
        processed_text = text
        changes_made = []
        suggestions = []
        
        # Step 1: Context analysis
        context_info = self.context_analyzer.analyze(text, options.context)
        
        # Step 2: Remove filler words if enabled
        if options.remove_fillers:
            result = self.filler_remover.remove_fillers(processed_text, options.aggressiveness)
            if result['text'] != processed_text:
                processed_text = result['text']
                changes_made.extend(result['changes'])
        
        # Step 3: Fix punctuation
        if options.fix_punctuation:
            result = self.punctuation_processor.fix_punctuation(
                processed_text, 
                context_info,
                options.context
            )
            if result['text'] != processed_text:
                processed_text = result['text']
                changes_made.extend(result['changes'])
        
        # Step 4: Grammar correction
        if options.correct_grammar:
            result = self.grammar_processor.correct_grammar(
                processed_text,
                context_info,
                options
            )
            if result['text'] != processed_text:
                processed_text = result['text']
                changes_made.extend(result['changes'])
        
        # Step 5: Adjust tone
        if options.adjust_tone:
            result = self.tone_processor.adjust_tone(
                processed_text,
                options.tone,
                context_info
            )
            if result['text'] != processed_text:
                processed_text = result['text']
                changes_made.extend(result['changes'])
        
        # Step 6: Improve formatting
        if options.improve_formatting:
            result = self.formatting_processor.improve_formatting(
                processed_text,
                options.context,
                context_info
            )
            if result['text'] != processed_text:
                processed_text = result['text']
                changes_made.extend(result['changes'])
        
        # Step 7: Auto-formatting
        if options.auto_format:
            result = self.auto_formatter.auto_format(
                processed_text,
                options.context
            )
            if result['text'] != processed_text:
                processed_text = result['text']
                changes_made.extend(result['changes'])
        
        # Step 8: Style matching
        if options.style_matching:
            result = self.style_matcher.match_style(
                processed_text,
                options.context,
                context_info
            )
            if result['text'] != processed_text:
                processed_text = result['text']
                changes_made.extend(result['changes'])
        
        processing_time = time.time() - start_time
        
        # Generate suggestions
        suggestions = self._generate_suggestions(original_text, processed_text, options)
        
        # Calculate confidence score
        confidence_score = self._calculate_confidence(changes_made, context_info)
        
        return ProcessingResult(
            original_text=original_text,
            processed_text=processed_text,
            changes_made=changes_made,
            suggestions=suggestions,
            confidence_score=confidence_score,
            processing_time=processing_time
        )
    
    def _generate_suggestions(
        self, 
        original: str, 
        processed: str, 
        options: ProcessingOptions
    ) -> List[Dict[str, Any]]:
        """Generate improvement suggestions"""
        suggestions = []
        
        # Check for significant changes
        if original != processed:
            suggestions.append({
                "type": "improvement",
                "message": "Text has been enhanced with grammar, punctuation, and formatting corrections",
                "confidence": 0.8
            })
        
        # Context-specific suggestions
        if options.context == ProcessingContext.EMAIL:
            suggestions.append({
                "type": "style",
                "message": "Consider adding a clear subject line and signature",
                "confidence": 0.6
            })
        elif options.context == ProcessingContext.CODE:
            suggestions.append({
                "type": "syntax",
                "message": "Ensure proper code formatting and comments",
                "confidence": 0.7
            })
        
        return suggestions
    
    def _calculate_confidence(
        self, 
        changes: List[Dict[str, Any]], 
        context_info: Dict[str, Any]
    ) -> float:
        """Calculate confidence score for the processing"""
        if not changes:
            return 1.0
        
        # Base confidence on number and type of changes
        high_confidence_changes = sum(1 for change in changes if change.get('confidence', 0.5) > 0.7)
        total_confidence = sum(change.get('confidence', 0.5) for change in changes)
        
        if len(changes) > 0:
            avg_confidence = total_confidence / len(changes)
            return min(avg_confidence, 0.95)  # Cap at 95%
        
        return 0.5
    
    def batch_process(
        self,
        texts: List[str],
        options: Optional[ProcessingOptions] = None
    ) -> List[ProcessingResult]:
        """Process multiple texts efficiently"""
        results = []
        for text in texts:
            try:
                result = self.process_text(text, options)
                results.append(result)
            except Exception as e:
                self.logger.error(f"Error processing text: {e}")
                # Create error result
                results.append(ProcessingResult(
                    original_text=text,
                    processed_text=text,
                    changes_made=[{"error": str(e)}],
                    suggestions=[{"error": "Processing failed"}],
                    confidence_score=0.0,
                    processing_time=0.0
                ))
        
        return results
    
    def add_technical_terms(self, terms: List[str]):
        """Add technical terms to preserve list"""
        self.technical_terms.update(terms)
    
    def export_config(self, file_path: str):
        """Export current configuration to file"""
        with open(file_path, 'w') as f:
            json.dump(self.config, f, indent=2)
    
    def import_config(self, file_path: str):
        """Import configuration from file"""
        try:
            with open(file_path, 'r') as f:
                self.config = json.load(f)
                self.logger.info(f"Configuration imported from {file_path}")
        except Exception as e:
            self.logger.error(f"Could not import config: {e}")


# Import sub-processors (will be defined below)


class GrammarProcessor:
    """Handles grammar correction and improvement"""
    
    def __init__(self):
        self.common_mistakes = {
            r'\bits\b(?!\s+is)': "it's",  # its -> it's when followed by is
            r'(?<!\w)its(?=\s+[a-z])': "it's",  # its at start of sentence
            r'\byour\b(?=\s+(?:name|phone|email))': "you're",
            r'\bthere\b(?=\s+are|\s+is|\s+will|\s+can)': "there",
            r'\btheir\b(?=\s+(?:car|house|dog))': "their",
        }
        
        self.verb_forms = {
            'went': 'gone',
            'did': 'done', 
            'saw': 'seen',
            'brought': 'brought'
        }
    
    def correct_grammar(
        self, 
        text: str, 
        context_info: Dict[str, Any], 
        options: ProcessingOptions
    ) -> Dict[str, Any]:
        """Correct grammar issues in text"""
        changes = []
        processed_text = text
        
        # Fix common mistakes
        for pattern, replacement in self.common_mistakes.items():
            matches = list(re.finditer(pattern, processed_text, re.IGNORECASE))
            for match in reversed(matches):  # Reverse to maintain positions
                original = match.group(0)
                if original != replacement:
                    processed_text = (
                        processed_text[:match.start()] + 
                        replacement + 
                        processed_text[match.end():]
                    )
                    changes.append({
                        "type": "grammar",
                        "original": original,
                        "corrected": replacement,
                        "position": match.start(),
                        "confidence": 0.8
                    })
        
        # Fix verb forms (conservative approach)
        if options.aggressiveness > 0.3:
            for incorrect, correct in self.verb_forms.items():
                pattern = r'\b' + incorrect + r'\b'
                matches = list(re.finditer(pattern, processed_text, re.IGNORECASE))
                for match in reversed(matches):
                    original = match.group(0)
                    processed_text = (
                        processed_text[:match.start()] + 
                        correct + 
                        processed_text[match.end():]
                    )
                    changes.append({
                        "type": "grammar",
                        "original": original,
                        "corrected": correct,
                        "position": match.start(),
                        "confidence": 0.6
                    })
        
        # Fix subject-verb agreement (basic)
        processed_text = self._fix_subject_verb_agreement(processed_text, changes)
        
        return {
            "text": processed_text,
            "changes": changes
        }
    
    def _fix_subject_verb_agreement(self, text: str, changes: List[Dict[str, Any]]) -> str:
        """Fix basic subject-verb agreement issues"""
        # Simple patterns for common issues
        patterns = [
            (r'\bhe go\b', 'he goes'),
            (r'\bshe go\b', 'she goes'),
            (r'\bit go\b', 'it goes'),
            (r'\bthey was\b', 'they were'),
            (r'\bwe was\b', 'we were')
        ]
        
        for pattern, replacement in patterns:
            matches = list(re.finditer(pattern, text, re.IGNORECASE))
            for match in reversed(matches):
                original = match.group(0)
                text = (
                    text[:match.start()] + 
                    replacement + 
                    text[match.end():]
                )
                changes.append({
                    "type": "grammar",
                    "original": original,
                    "corrected": replacement,
                    "position": match.start(),
                    "confidence": 0.7
                })
        
        return text


class PunctuationProcessor:
    """Handles punctuation correction and improvement"""
    
    def fix_punctuation(
        self, 
        text: str, 
        context_info: Dict[str, Any], 
        context_type: ProcessingContext
    ) -> Dict[str, Any]:
        """Fix punctuation issues in text"""
        changes = []
        processed_text = text
        
        # Fix multiple punctuation marks
        processed_text = re.sub(r'([.!?]){2,}', r'\1', processed_text)
        
        # Fix missing spaces after punctuation
        processed_text = re.sub(r'([.!?])([A-Za-z])', r'\1 \2', processed_text)
        
        # Fix comma spacing
        processed_text = re.sub(r'\s*,\s*', ', ', processed_text)
        
        # Add periods to sentences without them (conservative)
        sentences = re.split(r'[.!?]+\s+', processed_text)
        new_sentences = []
        
        for sentence in sentences:
            sentence = sentence.strip()
            if sentence and not sentence.endswith(('.', '!', '?')):
                # Check if it's likely a complete sentence
                if (len(sentence) > 10 and 
                    any(word in sentence.lower() for word in ['the', 'a', 'an', 'this', 'that'])):
                    sentence += '.'
                    changes.append({
                        "type": "punctuation",
                        "original": sentence[:-1],
                        "corrected": sentence,
                        "action": "added_period"
                    })
            new_sentences.append(sentence)
        
        processed_text = '. '.join(new_sentences)
        
        return {
            "text": processed_text,
            "changes": changes
        }


class FormattingProcessor:
    """Handles text formatting improvements"""
    
    def improve_formatting(
        self, 
        text: str, 
        context_type: ProcessingContext, 
        context_info: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Improve text formatting based on context"""
        changes = []
        processed_text = text
        
        # Normalize whitespace
        processed_text = re.sub(r'\s+', ' ', processed_text)
        
        # Fix paragraph breaks
        paragraphs = processed_text.split('\n\n')
        formatted_paragraphs = []
        
        for paragraph in paragraphs:
            paragraph = paragraph.strip()
            if paragraph:
                # Capitalize first letter of paragraph
                if paragraph and paragraph[0].islower():
                    paragraph = paragraph[0].upper() + paragraph[1:]
                    changes.append({
                        "type": "formatting",
                        "action": "capitalized_first_letter"
                    })
                formatted_paragraphs.append(paragraph)
        
        processed_text = '\n\n'.join(formatted_paragraphs)
        
        return {
            "text": processed_text,
            "changes": changes
        }


class ToneProcessor:
    """Handles tone adjustment"""
    
    def adjust_tone(
        self, 
        text: str, 
        target_tone: ToneType, 
        context_info: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Adjust the tone of the text"""
        changes = []
        processed_text = text
        
        tone_adjustments = {
            ToneType.PROFESSIONAL: self._make_professional,
            ToneType.FRIENDLY: self._make_friendly,
            ToneType.FORMAL: self._make_formal,
            ToneType.CASUAL: self._make_casual,
            ToneType.EMPATHETIC: self._make_empathetic,
            ToneType.CONFIDENT: self._make_confident,
            ToneType.PERSUASIVE: self._make_persuasive,
        }
        
        if target_tone in tone_adjustments:
            result = tone_adjustments[target_tone](processed_text)
            processed_text = result['text']
            changes.extend(result['changes'])
        
        return {
            "text": processed_text,
            "changes": changes
        }
    
    def _make_professional(self, text: str) -> Dict[str, Any]:
        """Make text more professional"""
        changes = []
        
        # Replace informal phrases
        replacements = {
            r'\bgot\b': 'received',
            r'\bgotta\b': 'need to',
            r'\bwanna\b': 'want to',
            r'\bkinda\b': 'somewhat',
            r'\bsorta\b': 'somewhat'
        }
        
        for pattern, replacement in replacements.items():
            matches = list(re.finditer(pattern, text, re.IGNORECASE))
            for match in reversed(matches):
                original = match.group(0)
                text = text[:match.start()] + replacement + text[match.end():]
                changes.append({
                    "type": "tone",
                    "original": original,
                    "replaced_with": replacement,
                    "reason": "professional"
                })
        
        return {"text": text, "changes": changes}
    
    def _make_friendly(self, text: str) -> Dict[str, Any]:
        """Make text more friendly"""
        changes = []
        
        # Add warmth indicators where appropriate
        friendly_additions = [
            (r'\bhello\b', 'hello there'),
            (r'\bthank you\b', 'thank you so much'),
            (r'\bplease\b', 'please')
        ]
        
        for pattern, replacement in friendly_additions:
            if re.search(pattern, text, re.IGNORECASE):
                text = re.sub(pattern, replacement, text, flags=re.IGNORECASE)
                changes.append({
                    "type": "tone",
                    "action": "added_warmth",
                    "reason": "friendly"
                })
        
        return {"text": text, "changes": changes}
    
    def _make_formal(self, text: str) -> Dict[str, Any]:
        """Make text more formal"""
        changes = []
        
        # Replace casual contractions
        formal_replacements = {
            r'\bdon\'t\b': 'do not',
            r'\bcan\'t\b': 'cannot',
            r'\bwont\'t\b': 'will not',
            r'\bits\b': 'it is'
        }
        
        for pattern, replacement in formal_replacements.items():
            matches = list(re.finditer(pattern, text, re.IGNORECASE))
            for match in reversed(matches):
                original = match.group(0)
                text = text[:match.start()] + replacement + text[match.end():]
                changes.append({
                    "type": "tone",
                    "original": original,
                    "replaced_with": replacement,
                    "reason": "formal"
                })
        
        return {"text": text, "changes": changes}
    
    def _make_casual(self, text: str) -> Dict[str, Any]:
        """Make text more casual"""
        changes = []
        
        # Replace formal phrases
        casual_replacements = {
            r'\bdo not\b': "don't",
            r'\bcannot\b': "can't",
            r'\bwill not\b': "won't",
            r'\bit is\b': "it's"
        }
        
        for pattern, replacement in casual_replacements.items():
            matches = list(re.finditer(pattern, text, re.IGNORECASE))
            for match in reversed(matches):
                original = match.group(0)
                text = text[:match.start()] + replacement + text[match.end():]
                changes.append({
                    "type": "tone",
                    "original": original,
                    "replaced_with": replacement,
                    "reason": "casual"
                })
        
        return {"text": text, "changes": changes}
    
    def _make_empathetic(self, text: str) -> Dict[str, Any]:
        """Make text more empathetic"""
        changes = []
        
        # Add empathy indicators
        empathetic_phrases = {
            r'\bI understand\b': 'I truly understand',
            r'\bI see\b': 'I can see how that might be difficult',
            r'\bsorry\b': 'I\'m really sorry'
        }
        
        for pattern, replacement in empathetic_phrases.items():
            if re.search(pattern, text, re.IGNORECASE):
                text = re.sub(pattern, replacement, text, flags=re.IGNORECASE)
                changes.append({
                    "type": "tone",
                    "action": "added_empathy",
                    "reason": "empathetic"
                })
        
        return {"text": text, "changes": changes}
    
    def _make_confident(self, text: str) -> Dict[str, Any]:
        """Make text more confident"""
        changes = []
        
        # Strengthen weak language
        confidence_boosters = {
            r'\bmaybe\b': 'certainly',
            r'\bperhaps\b': 'definitely',
            r'\bI think\b': 'I believe',
            r'\bI hope\b': 'I am confident'
        }
        
        for pattern, replacement in confidence_boosters.items():
            matches = list(re.finditer(pattern, text, re.IGNORECASE))
            for match in reversed(matches):
                original = match.group(0)
                text = text[:match.start()] + replacement + text[match.end():]
                changes.append({
                    "type": "tone",
                    "original": original,
                    "replaced_with": replacement,
                    "reason": "confident"
                })
        
        return {"text": text, "changes": changes}
    
    def _make_persuasive(self, text: str) -> Dict[str, Any]:
        """Make text more persuasive"""
        changes = []
        
        # Add persuasive elements
        persuasive_elements = {
            r'\bbut\b': 'however',
            r'\bhowever\b': 'nevertheless',
            r'\bbecause\b': 'since'
        }
        
        for pattern, replacement in persuasive_elements.items():
            if re.search(pattern, text, re.IGNORECASE):
                text = re.sub(pattern, replacement, text, flags=re.IGNORECASE)
                changes.append({
                    "type": "tone",
                    "action": "enhanced_persuasion",
                    "reason": "persuasive"
                })
        
        return {"text": text, "changes": changes}


class FillerWordRemover:
    """Removes filler words and unnecessary phrases"""
    
    def remove_fillers(
        self, 
        text: str, 
        aggressiveness: float = 0.5
    ) -> Dict[str, Any]:
        """Remove filler words from text"""
        changes = []
        processed_text = text
        
        # Common filler words by aggressiveness level
        if aggressiveness <= 0.3:  # Conservative
            fillers = ['actually', 'basically', 'literally']
        elif aggressiveness <= 0.6:  # Moderate
            fillers = ['actually', 'basically', 'literally', 'really', 'very', 'quite']
        else:  # Aggressive
            fillers = [
                'actually', 'basically', 'literally', 'really', 'very', 'quite',
                'sort of', 'kind of', 'maybe', 'perhaps', 'like', 'you know',
                'i mean', 'just', 'simply', 'somewhat', 'probably', 'definitely'
            ]
        
        # Remove filler words (carefully)
        for filler in fillers:
            # Use word boundaries to avoid partial matches
            pattern = r'\b' + re.escape(filler) + r'\b'
            matches = list(re.finditer(pattern, processed_text, re.IGNORECASE))
            
            for match in reversed(matches):  # Reverse to maintain positions
                # Only remove if it doesn't change meaning significantly
                original = match.group(0)
                processed_text = (
                    processed_text[:match.start()] + 
                    processed_text[match.end():]
                )
                changes.append({
                    "type": "filler_removal",
                    "removed": filler,
                    "original": original,
                    "position": match.start()
                })
        
        # Clean up extra spaces created by removal
        processed_text = re.sub(r'\s+', ' ', processed_text).strip()
        
        return {
            "text": processed_text,
            "changes": changes
        }


class AutoFormatter:
    """Handles automatic formatting based on content type"""
    
    def auto_format(
        self, 
        text: str, 
        context_type: ProcessingContext
    ) -> Dict[str, Any]:
        """Apply automatic formatting based on context"""
        changes = []
        processed_text = text
        
        if context_type == ProcessingContext.EMAIL:
            processed_text = self._format_email(text)
        elif context_type == ProcessingContext.CODE:
            processed_text = self._format_code(text)
        elif context_type == ProcessingContext.DOCUMENT:
            processed_text = self._format_document(text)
        
        return {
            "text": processed_text,
            "changes": changes
        }
    
    def _format_email(self, text: str) -> str:
        """Format text for email"""
        # Ensure proper line breaks
        sentences = text.split('. ')
        formatted_sentences = []
        
        for sentence in sentences:
            sentence = sentence.strip()
            if sentence:
                formatted_sentences.append(sentence)
        
        return '. '.join(formatted_sentences)
    
    def _format_code(self, text: str) -> str:
        """Format text for code"""
        # Preserve code-like formatting
        lines = text.split('\n')
        formatted_lines = []
        
        for line in lines:
            line = line.strip()
            if line:
                formatted_lines.append(line)
        
        return '\n'.join(formatted_lines)
    
    def _format_document(self, text: str) -> str:
        """Format text for document"""
        # Improve paragraph structure
        paragraphs = text.split('\n\n')
        formatted_paragraphs = []
        
        for paragraph in paragraphs:
            paragraph = paragraph.strip()
            if paragraph:
                # Ensure proper sentence structure
                sentences = paragraph.split('. ')
                if sentences:
                    last_sentence = sentences[-1]
                    if not last_sentence.endswith(('.', '!', '?')):
                        last_sentence += '.'
                    sentences[-1] = last_sentence
                    paragraph = '. '.join(sentences)
                
                formatted_paragraphs.append(paragraph)
        
        return '\n\n'.join(formatted_paragraphs)


class StyleMatcher:
    """Matches text style to specific contexts"""
    
    def match_style(
        self, 
        text: str, 
        context_type: ProcessingContext, 
        context_info: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Match text style to the specified context"""
        changes = []
        processed_text = text
        
        style_rules = {
            ProcessingContext.EMAIL: self._email_style,
            ProcessingContext.CODE: self._code_style,
            ProcessingContext.DOCUMENT: self._document_style,
            ProcessingContext.FORMAL: self._formal_style,
            ProcessingContext.CASUAL: self._casual_style,
        }
        
        if context_type in style_rules:
            result = style_rules[context_type](text)
            processed_text = result['text']
            changes.extend(result['changes'])
        
        return {
            "text": processed_text,
            "changes": changes
        }
    
    def _email_style(self, text: str) -> Dict[str, Any]:
        """Apply email-appropriate style"""
        changes = []
        
        # Ensure greeting and closing are appropriate
        if not re.search(r'^(hi|hello|dear)', text, re.IGNORECASE):
            # Add appropriate greeting for professional emails
            text = "Hello,\n\n" + text
            changes.append({"type": "style", "action": "added_greeting"})
        
        return {"text": text, "changes": changes}
    
    def _code_style(self, text: str) -> Dict[str, Any]:
        """Apply code-appropriate style"""
        changes = []
        
        # Preserve technical accuracy
        # Add comments if missing
        lines = text.split('\n')
        commented_lines = []
        
        for line in lines:
            commented_lines.append(line)
            # Simple heuristic: add comment for complex lines
            if len(line) > 50 and not line.strip().startswith('#'):
                commented_lines.append(f"# Note: {line.strip()}")
                changes.append({"type": "style", "action": "added_comment"})
        
        return {"text": '\n'.join(commented_lines), "changes": changes}
    
    def _document_style(self, text: str) -> Dict[str, Any]:
        """Apply document-appropriate style"""
        changes = []
        
        # Improve readability
        paragraphs = text.split('\n\n')
        formatted_paragraphs = []
        
        for paragraph in paragraphs:
            paragraph = paragraph.strip()
            if paragraph:
                # Ensure proper sentence flow
                sentences = re.split(r'(?<=[.!?])\s+', paragraph)
                formatted_sentences = []
                
                for sentence in sentences:
                    sentence = sentence.strip()
                    if sentence:
                        formatted_sentences.append(sentence)
                
                if formatted_sentences:
                    paragraph = ' '.join(formatted_sentences)
                    formatted_paragraphs.append(paragraph)
        
        return {"text": '\n\n'.join(formatted_paragraphs), "changes": changes}
    
    def _formal_style(self, text: str) -> Dict[str, Any]:
        """Apply formal style"""
        changes = []
        
        # Replace casual language
        casual_replacements = {
            r'\bokay\b': 'acceptable',
            r'\bcool\b': 'excellent',
            r'\bawesome\b': 'outstanding',
            r'\bgood\b': 'satisfactory'
        }
        
        for pattern, replacement in casual_replacements.items():
            if re.search(pattern, text, re.IGNORECASE):
                text = re.sub(pattern, replacement, text, flags=re.IGNORECASE)
                changes.append({
                    "type": "style",
                    "action": "formal_replacement",
                    "reason": "formal_style"
                })
        
        return {"text": text, "changes": changes}
    
    def _casual_style(self, text: str) -> Dict[str, Any]:
        """Apply casual style"""
        changes = []
        
        # Make language more conversational
        formal_replacements = {
            r'\bacceptable\b': 'okay',
            r'\boutstanding\b': 'awesome',
            r'\bsatisfactory\b': 'good'
        }
        
        for pattern, replacement in formal_replacements.items():
            if re.search(pattern, text, re.IGNORECASE):
                text = re.sub(pattern, replacement, text, flags=re.IGNORECASE)
                changes.append({
                    "type": "style",
                    "action": "casual_replacement",
                    "reason": "casual_style"
                })
        
        return {"text": text, "changes": changes}


class ContextAnalyzer:
    """Analyzes text context to improve processing"""
    
    def analyze(self, text: str, context_type: ProcessingContext) -> Dict[str, Any]:
        """Analyze text context"""
        analysis = {
            "context_type": context_type,
            "text_length": len(text),
            "sentence_count": len(re.findall(r'[.!?]+', text)),
            "word_count": len(text.split()),
            "complexity_score": self._calculate_complexity(text),
            "formality_score": self._calculate_formality(text),
            "technical_density": self._calculate_technical_density(text)
        }
        
        return analysis
    
    def _calculate_complexity(self, text: str) -> float:
        """Calculate text complexity score"""
        words = text.split()
        if not words:
            return 0.0
        
        # Simple complexity metric: average word length
        avg_word_length = sum(len(word) for word in words) / len(words)
        return min(avg_word_length / 10.0, 1.0)  # Normalize to 0-1
    
    def _calculate_formality(self, text: str) -> float:
        """Calculate formality score"""
        formal_indicators = ['therefore', 'furthermore', 'nevertheless', 'consequently']
        informal_indicators = ['gonna', 'wanna', 'cool', 'awesome']
        
        formal_count = sum(1 for indicator in formal_indicators if indicator in text.lower())
        informal_count = sum(1 for indicator in informal_indicators if indicator in text.lower())
        
        total_indicators = formal_count + informal_count
        if total_indicators == 0:
            return 0.5  # Neutral
        
        return formal_count / total_indicators
    
    def _calculate_technical_density(self, text: str) -> float:
        """Calculate technical term density"""
        technical_patterns = [
            r'\b[A-Z]{2,}\b',  # Acronyms
            r'\b\w+\.\w+\b',   # Version numbers
            r'\b\w+ing\b',     # Technical verbs
        ]
        
        technical_count = sum(
            len(re.findall(pattern, text)) 
            for pattern in technical_patterns
        )
        
        word_count = len(text.split())
        if word_count == 0:
            return 0.0
        
        return min(technical_count / word_count, 1.0)
