"""
Text summarization engine using Gemma-3-1B-IT GGUF model
Provides automatic transcript summarization functionality
"""
import asyncio
import logging
import os
import tempfile
from pathlib import Path
from typing import Dict, List, Optional, Any
import threading
from datetime import datetime
import requests

logger = logging.getLogger(__name__)

# Try to import llama-cpp-python for GGUF model support
try:
    from llama_cpp import Llama
    LLAMA_CPP_AVAILABLE = True
except ImportError:
    LLAMA_CPP_AVAILABLE = False
    Llama = None

class SummarizationEngine:
    """Text summarization engine using Gemma-3-1B-IT GGUF model"""
    
    def __init__(self):
        # Model configuration
        self.model_name = "gemma-3-1b-it"
        self.model_file = "gemma-3-1b-it-Q8_0.gguf"
        self.model_url = "https://huggingface.co/unsloth/gemma-3-1b-it-GGUF/resolve/main/gemma-3-1b-it-Q8_0.gguf"
        self.model: Optional[Llama] = None
        
        # Model parameters
        self.max_tokens = 800  # Increased for longer summaries
        self.temperature = 0.4  # Slightly higher for more creativity
        self.top_p = 0.85  # Slightly lower for more focused responses
        self.repeat_penalty = 1.05  # Lower to reduce repetition penalty
        
        # Model management
        self.model_cache_dir = self._get_model_cache_dir()
        self.is_initialized = False
        
        # Threading for async operations
        self.model_lock = threading.Lock()
        
        self._initialize()
        
    def _initialize(self):
        """Initialize the summarization engine"""
        try:
            if not LLAMA_CPP_AVAILABLE:
                logger.error("llama-cpp-python not available. Install with: pip install llama-cpp-python")
                return
                
            # Download model if not available
            model_path = self.model_cache_dir / self.model_file
            if not model_path.exists():
                logger.info(f"Gemma model not found. Downloading to {model_path}")
                self._download_model()
            
            # Load the model
            self._load_model()
            
            logger.info("Summarization engine initialized successfully")
            self.is_initialized = True
            
        except Exception as e:
            logger.error(f"Failed to initialize summarization engine: {e}")
            
    def _get_model_cache_dir(self) -> Path:
        """Get model cache directory"""
        if os.name == "nt":  # Windows
            cache_dir = Path(os.environ.get("APPDATA", "")) / "EchoTap" / "models" / "summarization"
        elif os.sys.platform == "darwin":  # macOS
            cache_dir = Path.home() / "Library" / "Application Support" / "EchoTap" / "models" / "summarization"
        else:  # Linux
            cache_dir = Path.home() / ".config" / "EchoTap" / "models" / "summarization"
            
        cache_dir.mkdir(parents=True, exist_ok=True)
        return cache_dir
        
    def _download_model(self):
        """Download the Gemma GGUF model"""
        model_path = self.model_cache_dir / self.model_file
        
        try:
            logger.info(f"Downloading Gemma model from {self.model_url}")
            
            response = requests.get(self.model_url, stream=True)
            response.raise_for_status()
            
            total_size = int(response.headers.get('content-length', 0))
            downloaded = 0
            
            with open(model_path, 'wb') as f:
                for chunk in response.iter_content(chunk_size=8192):
                    if chunk:
                        f.write(chunk)
                        downloaded += len(chunk)
                        
                        # Log progress every 100MB
                        if downloaded % (100 * 1024 * 1024) == 0:
                            progress = (downloaded / total_size * 100) if total_size > 0 else 0
                            logger.info(f"Download progress: {progress:.1f}% ({downloaded // 1024 // 1024}MB)")
            
            logger.info(f"Gemma model downloaded successfully to {model_path}")
            
        except Exception as e:
            logger.error(f"Failed to download Gemma model: {e}")
            if model_path.exists():
                model_path.unlink()  # Remove partial download
            raise
            
    def _load_model(self):
        """Load the Gemma GGUF model"""
        if not LLAMA_CPP_AVAILABLE:
            logger.error("llama-cpp-python not available")
            return
            
        model_path = self.model_cache_dir / self.model_file
        
        try:
            logger.info(f"Loading Gemma model from {model_path}")
            
            # Configure model parameters for summarization
            # Use optimal settings for summary generation
            self.model = Llama(
                model_path=str(model_path),
                n_ctx=4096,  # Larger context window for better summaries
                n_threads=None,  # Use all available threads
                n_gpu_layers=0,  # CPU only for compatibility
                verbose=False,
                use_mmap=True,  # Memory map for efficiency
                use_mlock=False,  # Don't lock memory
                logits_all=False,  # Don't compute logits for all tokens (saves memory)
                embedding=False  # Don't compute embeddings
            )
            
            logger.info("Gemma model loaded successfully")
            
        except Exception as e:
            logger.error(f"Failed to load Gemma model: {e}")
            raise
            
    async def generate_summary(self, text: str, max_length: int = 300) -> Optional[Dict[str, Any]]:
        """Generate a summary of the given text"""
        if not self.is_initialized or not self.model:
            logger.error("Summarization engine not initialized")
            return None
            
        if not text or len(text.strip()) < 50:
            logger.info("Text too short for summarization")
            return None
            
        try:
            # Run in thread to avoid blocking
            loop = asyncio.get_event_loop()
            summary_result = await loop.run_in_executor(
                None, self._generate_summary_sync, text, max_length
            )
            
            return summary_result
            
        except Exception as e:
            logger.error(f"Error generating summary: {e}")
            return None
            
    def _generate_summary_sync(self, text: str, max_length: int) -> Dict[str, Any]:
        """Synchronous summary generation"""
        with self.model_lock:
            try:
                # Prepare the prompt for Gemma
                # Use a clear instruction format that works well with Gemma
                prompt = self._build_summary_prompt(text, max_length)
                
                start_time = datetime.now()
                
                # Generate summary
                response = self.model(
                    prompt,
                    max_tokens=self.max_tokens,
                    temperature=self.temperature,
                    top_p=self.top_p,
                    repeat_penalty=self.repeat_penalty,
                    stop=["<|end_of_turn|>"],
                    echo=False,
                    stream=False,  # Ensure we get complete response
                    top_k=40,  # Add top-k sampling for better diversity
                    min_p=0.05  # Minimum probability threshold
                )
                
                end_time = datetime.now()
                generation_time = (end_time - start_time).total_seconds()
                
                # Extract the summary text
                raw_summary = response['choices'][0]['text'].strip()
                
                # Clean up the summary
                summary_text = self._clean_summary(raw_summary)
                
                if not summary_text:
                    logger.warning("Generated empty summary")
                    return None
                    
                # Calculate some basic metrics
                original_words = len(text.split())
                summary_words = len(summary_text.split())
                compression_ratio = original_words / summary_words if summary_words > 0 else 0
                
                logger.info(f"Summary generated: {summary_words} words from {original_words} words "
                           f"({compression_ratio:.1f}x compression) in {generation_time:.2f}s")
                
                return {
                    "summary": summary_text,
                    "original_length": len(text),
                    "summary_length": len(summary_text),
                    "original_words": original_words,
                    "summary_words": summary_words,
                    "compression_ratio": compression_ratio,
                    "generation_time": generation_time,
                    "model": self.model_name,
                    "created_at": datetime.now().isoformat()
                }
                
            except Exception as e:
                logger.error(f"Error in synchronous summary generation: {e}")
                return None
                
    def _build_summary_prompt(self, text: str, max_length: int) -> str:
        """Build the prompt for summary generation"""
        # Use Gemma's instruction format
        # Limit the input text to avoid context overflow
        max_input_length = 3000  # Increased with larger context window
        
        if len(text) > max_input_length:
            # Take first part of text for summary
            text = text[:max_input_length] + "..."
            
        prompt = f"""<|start_of_turn|>user
Summarize this transcript into structured sections. Start your response immediately with the summary content:

**Overview**: Main purpose and key theme (2-3 sentences)
**Key Points**: Important details and facts as bullet points
**Decisions/Agreements**: Any conclusions or decisions reached
**Action Items**: Tasks or follow-ups mentioned

Raw transcript: "{text}"<|end_of_turn|>
<|start_of_turn|>model
**Overview**: """
        
        return prompt
        
    def _clean_summary(self, summary_text: str) -> str:
        """Clean up the generated summary"""
        import re
        
        # Since we're starting with "**Overview**: " in the prompt, 
        # we need to add it back to the response
        if not summary_text.startswith("**Overview**"):
            summary_text = "**Overview**: " + summary_text
        
        # Remove any remaining special tokens
        summary_text = re.sub(r'<\|.*?\|>', '', summary_text)
        
        # Clean up whitespace but preserve formatting
        summary_text = re.sub(r'[ \t]+', ' ', summary_text)  # Multiple spaces/tabs to single space
        summary_text = re.sub(r'\n\n\n+', '\n\n', summary_text)  # Multiple newlines to double
        summary_text = summary_text.strip()
        
        # Remove any introductory phrases that might appear
        intro_patterns = [
            r'^(?:Here is|Here\'s|Okay, here is|Okay, here\'s)\s+(?:a\s+)?(?:summary|the summary)(?:\s+of\s+the\s+(?:provided\s+)?text)?:?\s*',
            r'^(?:Summary|The summary):?\s*',
            r'^(?:Based on|Looking at)\s+(?:the\s+)?(?:transcript|text).*?:\s*',
        ]
        
        for pattern in intro_patterns:
            summary_text = re.sub(pattern, '', summary_text, flags=re.IGNORECASE)
        
        summary_text = summary_text.strip()
        
        # Remove any leading/trailing quotes or formatting
        summary_text = summary_text.strip('"\'`')
        
        # Remove common artifacts and strange endings
        artifacts_to_remove = [
            " |.",
            " | .",
            " |",
            "| .",
            "|.",
            " •",
            " .",
        ]
        
        for artifact in artifacts_to_remove:
            if summary_text.endswith(artifact):
                summary_text = summary_text[:-len(artifact)].strip()
        
        # Remove repeated punctuation at the end
        summary_text = re.sub(r'[.!?]{2,}$', '.', summary_text)
        
        # Remove incomplete sentences or fragments at the end
        sentences = summary_text.split('.')
        if len(sentences) > 1:
            # Check if the last sentence is very short or incomplete
            last_sentence = sentences[-1].strip()
            if len(last_sentence) < 10 and not last_sentence.endswith(('!', '?')):
                # Remove the incomplete last sentence
                summary_text = '.'.join(sentences[:-1]).strip()
        
        # If the summary is still too long or contains prompt text, take only the first meaningful paragraph
        if len(summary_text) > 1000 or any(word in summary_text.lower() for word in ['transcription', 'assistant', 'guidelines']):
            # Try to find the actual summary part after common intro phrases
            lines = summary_text.split('\n')
            clean_lines = []
            found_content = False
            
            for line in lines:
                line = line.strip()
                if not line:
                    continue
                    
                # Skip lines that look like prompt remnants
                if any(word in line.lower() for word in ['transcription', 'assistant', 'guidelines', 'your task', 'extract the']):
                    continue
                    
                # Look for actual content
                if line and not line.startswith(('You are', 'Your task', 'Guidelines', 'Text to', 'The transcription')):
                    clean_lines.append(line)
                    found_content = True
                    
            if clean_lines:
                summary_text = '\n'.join(clean_lines)
                
        # Ensure the summary ends properly
        if summary_text and not summary_text.endswith(('.', '!', '?')):
            summary_text += '.'
            
        return summary_text
        
    def get_model_info(self) -> Dict[str, Any]:
        """Get information about the summarization model"""
        model_path = self.model_cache_dir / self.model_file
        
        return {
            "model_name": self.model_name,
            "model_file": self.model_file,
            "is_available": LLAMA_CPP_AVAILABLE,
            "is_downloaded": model_path.exists(),
            "is_loaded": self.model is not None,
            "model_size": model_path.stat().st_size if model_path.exists() else 0,
            "model_path": str(model_path)
        }
        
    async def download_model_if_needed(self, progress_callback=None) -> bool:
        """Download model if not available"""
        model_path = self.model_cache_dir / self.model_file
        
        if model_path.exists():
            return True
            
        try:
            # Run download in thread to avoid blocking
            loop = asyncio.get_event_loop()
            await loop.run_in_executor(None, self._download_model)
            
            # Reload the model after download
            await loop.run_in_executor(None, self._load_model)
            
            self.is_initialized = True
            return True
            
        except Exception as e:
            logger.error(f"Failed to download model: {e}")
            return False
            
    def cleanup(self):
        """Cleanup resources"""
        if self.model:
            # The Llama model doesn't have an explicit cleanup method
            # but we can clear our reference
            self.model = None
        self.is_initialized = False