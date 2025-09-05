"""
Translation engine using Gemma-3-1B-IT GGUF model
Provides automatic translation functionality for transcripts and summaries
"""
import asyncio
import logging
import os
import re
import threading
from pathlib import Path
from typing import Dict, List, Optional, Any
from datetime import datetime

logger = logging.getLogger(__name__)

# Try to import llama-cpp-python for GGUF model support
try:
    from llama_cpp import Llama
    LLAMA_CPP_AVAILABLE = True
except ImportError:
    LLAMA_CPP_AVAILABLE = False
    Llama = None

class TranslationEngine:
    """Translation engine using Gemma-3-1B-IT GGUF model"""
    
    def __init__(self):
        # Model configuration - reuse the same Gemma model as summarization
        self.model_name = "gemma-3-1b-it"
        self.model_file = "gemma-3-1b-it-Q8_0.gguf"
        self.model: Optional[Llama] = None
        
        # Model parameters optimized for translation
        self.max_tokens = 2048  # Larger for translation output
        self.temperature = 0.2  # Very low for more accurate translation
        self.top_p = 0.95
        self.repeat_penalty = 1.05  # Lower to avoid cutting off translations
        
        # Model management
        self.model_cache_dir = self._get_model_cache_dir()
        self.is_initialized = False
        
        # Threading for async operations
        self.model_lock = threading.Lock()
        
        # Common language mappings
        self.language_names = {
            'es': 'Spanish',
            'fr': 'French',
            'de': 'German',
            'it': 'Italian',
            'pt': 'Portuguese',
            'ru': 'Russian',
            'ja': 'Japanese',
            'ko': 'Korean',
            'zh': 'Chinese',
            'ar': 'Arabic',
            'hi': 'Hindi',
            'tr': 'Turkish',
            'pl': 'Polish',
            'nl': 'Dutch',
            'sv': 'Swedish',
            'no': 'Norwegian',
            'da': 'Danish',
            'fi': 'Finnish',
            'he': 'Hebrew',
            'th': 'Thai',
            'vi': 'Vietnamese',
            'uk': 'Ukrainian',
            'cs': 'Czech',
            'hu': 'Hungarian',
            'ro': 'Romanian',
            'bg': 'Bulgarian',
            'hr': 'Croatian',
            'sk': 'Slovak',
            'sl': 'Slovenian',
            'et': 'Estonian',
            'lv': 'Latvian',
            'lt': 'Lithuanian'
        }
        
        self._initialize()
        
    def _initialize(self):
        """Initialize the translation engine"""
        try:
            if not LLAMA_CPP_AVAILABLE:
                logger.error("llama-cpp-python not available. Install with: pip install llama-cpp-python")
                return
                
            # Check if model exists (should be downloaded by summarization engine)
            model_path = self.model_cache_dir / self.model_file
            if not model_path.exists():
                logger.warning(f"Gemma model not found at {model_path}. Translation will be unavailable until model is downloaded.")
                return
            
            # Load the model
            self._load_model()
            
            logger.info("Translation engine initialized successfully")
            self.is_initialized = True
            
        except Exception as e:
            logger.error(f"Failed to initialize translation engine: {e}")
            
    def _get_model_cache_dir(self) -> Path:
        """Get model cache directory (shared with summarization engine)"""
        if os.name == "nt":  # Windows
            cache_dir = Path(os.environ.get("APPDATA", "")) / "EchoTap" / "models" / "summarization"
        elif os.sys.platform == "darwin":  # macOS
            cache_dir = Path.home() / "Library" / "Application Support" / "EchoTap" / "models" / "summarization"
        else:  # Linux
            cache_dir = Path.home() / ".config" / "EchoTap" / "models" / "summarization"
            
        cache_dir.mkdir(parents=True, exist_ok=True)
        return cache_dir
            
    def _load_model(self):
        """Load the Gemma GGUF model"""
        if not LLAMA_CPP_AVAILABLE:
            logger.error("llama-cpp-python not available")
            return
            
        model_path = self.model_cache_dir / self.model_file
        
        try:
            logger.info(f"Loading Gemma model for translation from {model_path}")
            
            # Configure model parameters for translation
            self.model = Llama(
                model_path=str(model_path),
                n_ctx=4096,  # Larger context window for better translations
                n_threads=None,  # Use all available threads
                n_gpu_layers=0,  # CPU only for compatibility
                verbose=False,
                use_mmap=True,  # Memory map for efficiency
                use_mlock=False,  # Don't lock memory
                logits_all=False,  # Don't compute logits for all tokens (saves memory)
                embedding=False  # Don't compute embeddings
            )
            
            logger.info("Gemma model loaded successfully for translation")
            
        except Exception as e:
            logger.error(f"Failed to load Gemma model for translation: {e}")
            raise
            
    async def translate_text(
        self, 
        text: str, 
        target_language: str, 
        source_language: str = "English"
    ) -> Optional[Dict[str, Any]]:
        """Translate text to target language"""
        if not self.is_initialized or not self.model:
            logger.error("Translation engine not initialized")
            return None
            
        if not text or len(text.strip()) < 10:
            logger.info("Text too short for translation")
            return None
            
        # Get language name from code
        target_lang_name = self.language_names.get(target_language.lower(), target_language)
        
        try:
            # Run in thread to avoid blocking
            loop = asyncio.get_event_loop()
            translation_result = await loop.run_in_executor(
                None, self._translate_text_sync, text, target_lang_name, source_language
            )
            
            return translation_result
            
        except Exception as e:
            logger.error(f"Error translating text: {e}")
            return None
            
    def _translate_text_sync(self, text: str, target_language: str, source_language: str) -> Dict[str, Any]:
        """Synchronous translation generation"""
        with self.model_lock:
            try:
                # Prepare the prompt for translation
                prompt = self._build_translation_prompt(text, target_language, source_language)
                
                start_time = datetime.now()
                
                # Generate translation
                response = self.model(
                    prompt,
                    max_tokens=self.max_tokens,
                    temperature=0.1,  # Very low temperature for consistent translations
                    top_p=0.9,
                    repeat_penalty=1.1,
                    stop=["\n\nTranslate", "\n\nOriginal", "\nTranslation:", "Translation:"],  # Simple stop tokens
                    echo=False,
                    stream=False
                )
                
                logger.info(f"Model response received, choices: {len(response.get('choices', []))}")
                
                end_time = datetime.now()
                generation_time = (end_time - start_time).total_seconds()
                
                # Extract the translation text
                raw_translation = response['choices'][0]['text'].strip()
                logger.info(f"Raw output: {len(raw_translation)} chars")
                
                # Clean up the translation
                translated_text = self._clean_translation(raw_translation)
                
                if not translated_text.strip():
                    logger.error(f"Empty translation after cleanup. Raw: '{raw_translation[:200]}...'")
                    return None
                    
                logger.info(f"Translation generated: {len(translated_text)} chars to {target_language} in {generation_time:.2f}s")
                logger.info(f"Translation preview: '{translated_text[:200]}...'")
                
                # Check if it actually contains non-English characters
                has_non_latin = any(ord(c) > 127 for c in translated_text[:100])
                if not has_non_latin and target_language.lower() in ['ru', 'russian', 'chinese', 'zh', 'japanese', 'ja', 'korean', 'ko', 'arabic', 'ar']:
                    logger.warning(f"Translation may not be in target language - no non-Latin characters found")
                
                return {
                    "translated_text": translated_text,
                    "original_length": len(text),
                    "translated_length": len(translated_text),
                    "target_language": target_language,
                    "source_language": source_language,
                    "generation_time": generation_time,
                    "model": self.model_name,
                    "created_at": datetime.now().isoformat()
                }
                
            except Exception as e:
                logger.error(f"Error in synchronous translation generation: {e}")
                return None
                
    def _build_translation_prompt(self, text: str, target_language: str, source_language: str) -> str:
        """Build the prompt for translation"""
        # Clean up the text before translation to avoid model issues
        text = text.replace('**', '').replace('##', '').replace('***', '')
        text = text.replace('- ', '').replace('* ', '').strip()
        
        # Limit the input text to avoid context overflow
        max_input_length = 1800  # Reduced to leave more room for response
        
        original_length = len(text)
        if len(text) > max_input_length:
            text = text[:max_input_length]
            # Try to end at a sentence boundary
            last_period = text.rfind('.')
            if last_period > max_input_length * 0.8:
                text = text[:last_period + 1]
            logger.info(f"Text truncated from {original_length} to {len(text)} chars")
            
        # Simplified, direct prompt without conversation format
        prompt = f"Translate this {source_language} text to {target_language}:\n\n{text}\n\nTranslation:"
        
        logger.info(f"Translation prompt: {len(prompt)} chars, target={target_language}")
        
        return prompt
        
    def _clean_translation(self, translation_text: str) -> str:
        """Clean up the generated translation - simplified approach"""
        if not translation_text:
            return ""
            
        # Basic cleanup only
        translation_text = translation_text.strip()
        
        # Remove obvious artifacts
        translation_text = re.sub(r'\|start_of_turn\|', '', translation_text)
        translation_text = re.sub(r'\|end_of_turn\|', '', translation_text)
        translation_text = re.sub(r'<\|.*?\|>', '', translation_text)
        
        # Remove common prefixes that models add
        prefixes = [
            "Here is the translation:",
            "Translation:",
            "Here's the translation:",
            "Ось переклад на українську мову:",
            "Ось переклад:",
        ]
        
        for prefix in prefixes:
            if translation_text.startswith(prefix):
                translation_text = translation_text[len(prefix):].strip()
                break
        
        # Basic whitespace cleanup
        translation_text = re.sub(r'\n\n\n+', '\n\n', translation_text)
        translation_text = translation_text.strip()
        
        return translation_text
    
    async def translate_session_content(
        self, 
        transcript_text: str, 
        summary_text: Optional[str], 
        target_language: str
    ) -> Optional[Dict[str, Any]]:
        """Translate both transcript and summary for a session"""
        if not self.is_initialized or not self.model:
            logger.error("Translation engine not initialized")
            return None
        
        try:
            # Translate transcript
            transcript_result = await self.translate_text(transcript_text, target_language)
            if not transcript_result:
                return None
            
            translated_summary = None
            summary_generation_time = 0
            if summary_text and summary_text.strip():
                logger.info(f"Translating summary ({len(summary_text)} chars)")
                summary_result = await self.translate_text(summary_text, target_language)
                if summary_result and summary_result['translated_text'].strip():
                    translated_summary = summary_result['translated_text']
                    summary_generation_time = summary_result['generation_time']
                    logger.info(f"Summary translation successful ({len(translated_summary)} chars)")
                else:
                    logger.warning("Summary translation failed or empty")
            else:
                logger.info("No summary to translate")
            
            return {
                "translated_transcript": transcript_result['translated_text'],
                "translated_summary": translated_summary,
                "original_transcript_length": len(transcript_text),
                "translated_transcript_length": len(transcript_result['translated_text']),
                "target_language": target_language,
                "generation_time": transcript_result['generation_time'] + summary_generation_time,
                "model": self.model_name,
                "created_at": datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error translating session content: {e}")
            return None
    
    def get_supported_languages(self) -> List[Dict[str, str]]:
        """Get list of supported languages"""
        return [
            {"code": code, "name": name} 
            for code, name in sorted(self.language_names.items(), key=lambda x: x[1])
        ]
    
    def get_model_info(self) -> Dict[str, Any]:
        """Get information about the translation model"""
        model_path = self.model_cache_dir / self.model_file
        
        return {
            "model_name": self.model_name,
            "model_file": self.model_file,
            "is_available": LLAMA_CPP_AVAILABLE,
            "is_downloaded": model_path.exists(),
            "is_loaded": self.model is not None,
            "model_size": model_path.stat().st_size if model_path.exists() else 0,
            "model_path": str(model_path),
            "supported_languages": len(self.language_names)
        }
        
    def cleanup(self):
        """Cleanup resources"""
        if self.model:
            # The Llama model doesn't have an explicit cleanup method
            # but we can clear our reference
            self.model = None
        self.is_initialized = False