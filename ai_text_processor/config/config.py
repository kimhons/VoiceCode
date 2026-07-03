"""
Configuration file for AI Text Processor
Defines default settings and rules for different contexts and tones
"""

import json
from typing import Dict, Any

# Default configuration
DEFAULT_CONFIG = {
    "version": "1.0.0",
    "grammar_rules": {
        "common_mistakes": {
            "its/it's": {
                "enabled": True,
                "confidence_threshold": 0.8,
                "patterns": [
                    r'\bits\b(?!\s+is)',
                    r'(?<!\w)its(?=\s+[a-z])'
                ]
            },
            "their/there/they're": {
                "enabled": True,
                "confidence_threshold": 0.7,
                "context_sensitive": True
            },
            "your/you're": {
                "enabled": True,
                "confidence_threshold": 0.8,
                "patterns": [
                    r'\byour\b(?=\s+(?:name|phone|email))'
                ]
            },
            "affect/effect": {
                "enabled": True,
                "confidence_threshold": 0.6,
                "requires_context": True
            },
            "lose/loose": {
                "enabled": True,
                "confidence_threshold": 0.7
            }
        },
        "verb_corrections": {
            "enabled": True,
            "aggressiveness_threshold": 0.3,
            "forms": {
                "went": "gone",
                "did": "done",
                "saw": "seen",
                "brought": "brought"
            }
        },
        "subject_verb_agreement": {
            "enabled": True,
            "confidence_threshold": 0.7
        }
    },
    
    "punctuation_rules": {
        "fix_multiple_punctuation": {
            "enabled": True,
            "pattern": r'([.!?]){2,}',
            "replacement": r'\1'
        },
        "add_missing_periods": {
            "enabled": True,
            "conservative_mode": True,
            "min_sentence_length": 10
        },
        "fix_space_issues": {
            "enabled": True,
            "patterns": [
                {
                    "pattern": r'([.!?])([A-Za-z])',
                    "replacement": r'\1 \2'
                },
                {
                    "pattern": r'\s*,\s*',
                    "replacement": ', '
                }
            ]
        },
        "smart_quotes": {
            "enabled": False,
            "style": "straight"
        }
    },
    
    "tone_adjustments": {
        "professional": {
            "replace_informal": True,
            "informal_replacements": {
                "got": "received",
                "gotta": "need to",
                "wanna": "want to",
                "kinda": "somewhat",
                "sorta": "somewhat"
            }
        },
        "friendly": {
            "soften_language": True,
            "add_warmth": True,
            "warmth_additions": {
                "hello": "hello there",
                "thank you": "thank you so much"
            }
        },
        "formal": {
            "expand_contractions": True,
            "formal_replacements": {
                "don't": "do not",
                "can't": "cannot",
                "won't": "will not",
                "it's": "it is"
            }
        },
        "casual": {
            "use_contractions": True,
            "casual_replacements": {
                "do not": "don't",
                "cannot": "can't",
                "will not": "won't",
                "it is": "it's"
            }
        },
        "empathetic": {
            "add_empathy": True,
            "empathy_phrases": {
                "I understand": "I truly understand",
                "I see": "I can see how that might be difficult",
                "sorry": "I'm really sorry"
            }
        },
        "confident": {
            "strengthen_language": True,
            "confidence_boosters": {
                "maybe": "certainly",
                "perhaps": "definitely",
                "I think": "I believe",
                "I hope": "I am confident"
            }
        },
        "persuasive": {
            "enhance_persuasion": True,
            "persuasive_elements": {
                "but": "however",
                "however": "nevertheless",
                "because": "since"
            }
        }
    },
    
    "formatting_rules": {
        "sentence_spacing": {
            "enabled": True,
            "normalize_whitespace": True
        },
        "paragraph_structure": {
            "enabled": True,
            "min_sentences_per_paragraph": 1,
            "capitalize_first_letter": True
        },
        "bullet_points": {
            "enabled": True,
            "auto_bullet": False
        },
        "headers": {
            "enabled": True,
            "auto_header": False
        }
    },
    
    "filler_word_removal": {
        "enabled": True,
        "conservative": {
            "words": ["actually", "basically", "literally"],
            "threshold": 0.3
        },
        "moderate": {
            "words": ["actually", "basically", "literally", "really", "very", "quite"],
            "threshold": 0.6
        },
        "aggressive": {
            "words": [
                "actually", "basically", "literally", "really", "very", "quite",
                "sort of", "kind of", "maybe", "perhaps", "like", "you know",
                "i mean", "just", "simply", "somewhat", "probably", "definitely"
            ],
            "threshold": 1.0
        }
    },
    
    "context_specific": {
        "email": {
            "auto_greeting": True,
            "signature_required": True,
            "formal_closing": True,
            "max_line_length": 80
        },
        "code": {
            "preserve_indentation": True,
            "add_comments": True,
            "preserve_syntax": True,
            "comment_threshold": 50
        },
        "document": {
            "improve_flow": True,
            "formal_structure": True,
            "academic_style": False
        },
        "social": {
            "maintain_voice": True,
            "emoji_preservation": True,
            "casual_tone": True
        }
    },
    
    "style_matching": {
        "enabled": True,
        "similarity_threshold": 0.7,
        "adaptation_strength": 0.5
    },
    
    "quality_metrics": {
        "confidence_calculation": {
            "high_confidence_threshold": 0.7,
            "medium_confidence_threshold": 0.5,
            "base_confidence": 0.5
        },
        "change_impact": {
            "grammar_change_weight": 0.8,
            "punctuation_change_weight": 0.9,
            "tone_change_weight": 0.6,
            "formatting_change_weight": 0.7,
            "filler_removal_weight": 0.8
        }
    },
    
    "performance": {
        "batch_processing": {
            "max_batch_size": 100,
            "timeout_seconds": 30
        },
        "caching": {
            "enabled": True,
            "cache_size": 1000,
            "ttl_seconds": 3600
        }
    }
}

# Context-specific templates
CONTEXT_TEMPLATES = {
    "email": {
        "structure": {
            "greeting": "Hello {name},",
            "body": "{content}",
            "closing": "Best regards,\n{name}"
        },
        "tone": "professional",
        "max_length": 500
    },
    
    "code": {
        "structure": {
            "comments": True,
            "docstrings": True,
            "naming_convention": "snake_case"
        },
        "tone": "technical",
        "max_length": 1000
    },
    
    "document": {
        "structure": {
            "title": True,
            "abstract": False,
            "sections": True,
            "conclusion": True
        },
        "tone": "formal",
        "max_length": 2000
    },
    
    "social": {
        "structure": {
            "hashtags": True,
            "mentions": True,
            "emoji_preservation": True
        },
        "tone": "casual",
        "max_length": 280
    }
}

# Tone presets
TONE_PRESETS = {
    "professional": {
        "formality": 0.8,
        "warmth": 0.3,
        "directness": 0.7,
        "confidence": 0.7
    },
    "friendly": {
        "formality": 0.3,
        "warmth": 0.8,
        "directness": 0.6,
        "confidence": 0.6
    },
    "formal": {
        "formality": 1.0,
        "warmth": 0.2,
        "directness": 0.5,
        "confidence": 0.7
    },
    "casual": {
        "formality": 0.1,
        "warmth": 0.7,
        "directness": 0.8,
        "confidence": 0.5
    },
    "empathetic": {
        "formality": 0.4,
        "warmth": 0.9,
        "directness": 0.4,
        "confidence": 0.6
    },
    "confident": {
        "formality": 0.6,
        "warmth": 0.4,
        "directness": 0.9,
        "confidence": 1.0
    },
    "persuasive": {
        "formality": 0.5,
        "warmth": 0.6,
        "directness": 0.8,
        "confidence": 0.8
    }
}

def save_config(config: Dict[str, Any], file_path: str) -> None:
    """Save configuration to JSON file"""
    with open(file_path, 'w') as f:
        json.dump(config, f, indent=2)

def load_config(file_path: str) -> Dict[str, Any]:
    """Load configuration from JSON file"""
    with open(file_path, 'r') as f:
        return json.load(f)

def create_custom_config(
    context: str = None,
    tone: str = None,
    aggressiveness: float = 0.5
) -> Dict[str, Any]:
    """Create a custom configuration based on parameters"""
    config = DEFAULT_CONFIG.copy()
    
    if context and context in CONTEXT_TEMPLATES:
        # Apply context-specific settings
        context_config = CONTEXT_TEMPLATES[context]
        config["context_specific"][context].update(context_config)
    
    if tone and tone in TONE_PRESETS:
        # Apply tone-specific settings
        tone_config = TONE_PRESETS[tone]
        config["tone_adjustments"]["tone_preset"] = tone_config
    
    # Adjust aggressiveness
    if aggressiveness > 0.7:
        config["filler_word_removal"]["level"] = "aggressive"
    elif aggressiveness > 0.4:
        config["filler_word_removal"]["level"] = "moderate"
    else:
        config["filler_word_removal"]["level"] = "conservative"
    
    return config
