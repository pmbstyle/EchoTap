"""
Clean, modular LLM engine using proper prompt engineering.
No regex cleanup - just good prompts and model settings.
"""
import asyncio
import logging
import os
import threading
import requests
from pathlib import Path
from typing import Dict, List, Optional, Any
from datetime import datetime

logger = logging.getLogger(__name__)

try:
    from llama_cpp import Llama
    LLAMA_CPP_AVAILABLE = True
except ImportError:
    LLAMA_CPP_AVAILABLE = False
    Llama = None

class LLMEngine:
    """Simple, modular LLM engine with progressive model loading"""
    
    # Progressive model tiers for different hardware capabilities
    MODEL_TIERS = {
        "minimal": {
            "name": "TinyLlama-1.1B-Chat-Q4_K_M",
            "filename": "tinyllama-1.1b-chat-q4_k_m.gguf",
            "url": "https://huggingface.co/TheBloke/TinyLlama-1.1B-Chat-GGUF/resolve/main/tinyllama-1.1b-chat-q4_k_m.gguf",
            "size_mb": 600,
            "min_ram_gb": 2,
            "description": "Lightweight model for resource-constrained systems"
        },
        "balanced": {
            "name": "Phi-3.5-Mini-Instruct-Q4_K_M",
            "filename": "phi-3.5-mini-instruct-q4_k_m.gguf",
            "url": "https://huggingface.co/microsoft/Phi-3.5-mini-instruct-gguf/resolve/main/Phi-3.5-mini-instruct-q4.gguf",
            "size_mb": 2300,
            "min_ram_gb": 6,
            "description": "Balanced performance and resource usage"
        },
        "quality": {
            "name": "Qwen2.5-3B-Instruct-Q4_K_M",
            "filename": "qwen2.5-3b-instruct-q4_k_m.gguf",
            "url": "https://huggingface.co/Qwen/Qwen2.5-3B-Instruct-GGUF/resolve/main/qwen2.5-3b-instruct-q4_k_m.gguf",
            "size_mb": 1900,
            "min_ram_gb": 8,
            "description": "High quality model for capable systems"
        }
    }
    
    LANGUAGES = {
        'en': 'English', 'es': 'Spanish', 'fr': 'French', 'de': 'German', 'it': 'Italian',
        'pt': 'Portuguese', 'ru': 'Russian', 'ja': 'Japanese', 'ko': 'Korean',
        'zh': 'Chinese', 'ar': 'Arabic', 'hi': 'Hindi', 'tr': 'Turkish',
        'pl': 'Polish', 'nl': 'Dutch', 'sv': 'Swedish', 'da': 'Danish',
        'fi': 'Finnish', 'he': 'Hebrew', 'th': 'Thai', 'vi': 'Vietnamese'
    }
    
    def __init__(self, preferred_tier: str = "auto"):
        self.model = None
        self.model_path = None
        self.current_model_info = None
        self.is_initialized = False
        self.model_lock = threading.Lock()
        self.preferred_tier = preferred_tier
    
    def get_system_resources(self) -> Dict[str, Any]:
        """Get system resource information for model selection"""
        try:
            import psutil
            ram_gb = psutil.virtual_memory().total / (1024**3)
            cpu_count = psutil.cpu_count()
            
            # Try to get GPU memory if available
            gpu_memory_gb = 0
            try:
                import GPUtil
                gpus = GPUtil.getGPUs()
                if gpus:
                    gpu_memory_gb = gpus[0].memoryTotal / 1024  # Convert MB to GB
            except ImportError:
                pass
            
            return {
                "ram_gb": ram_gb,
                "cpu_count": cpu_count,
                "gpu_memory_gb": gpu_memory_gb
            }
        except ImportError:
            # Fallback when psutil not available
            return {
                "ram_gb": 8.0,  # Conservative estimate
                "cpu_count": 4,
                "gpu_memory_gb": 0
            }
    
    def auto_select_model_tier(self) -> str:
        """Automatically select model tier based on system resources"""
        resources = self.get_system_resources()
        ram_gb = resources["ram_gb"]
        
        logger.info(f"System resources: {ram_gb:.1f}GB RAM, {resources['cpu_count']} CPUs")
        
        # Select tier based on available RAM with safety margin
        if ram_gb < 4:
            tier = "minimal"
        elif ram_gb < 8:
            tier = "balanced" if ram_gb >= 6 else "minimal"
        else:
            tier = "quality"
        
        logger.info(f"Auto-selected model tier: {tier} ({self.MODEL_TIERS[tier]['name']})")
        return tier
    
    def get_model_info(self, tier: str = None) -> Dict[str, Any]:
        """Get information about a model tier"""
        if tier is None:
            tier = self.preferred_tier
        
        if tier == "auto":
            tier = self.auto_select_model_tier()
        
        if tier not in self.MODEL_TIERS:
            logger.warning(f"Unknown tier '{tier}', using 'balanced'")
            tier = "balanced"
        
        return {**self.MODEL_TIERS[tier], "tier": tier}
    
    def get_model_cache_dir(self) -> Path:
        """Get model cache directory"""
        if os.name == "nt":  # Windows
            cache_dir = Path(os.environ.get("APPDATA", "")) / "EchoTap" / "models"
        elif os.sys.platform == "darwin":  # macOS
            cache_dir = Path.home() / "Library" / "Application Support" / "EchoTap" / "models"
        else:  # Linux
            cache_dir = Path.home() / ".config" / "EchoTap" / "models"
        cache_dir.mkdir(parents=True, exist_ok=True)
        return cache_dir
    
    async def ensure_model_ready(self, tier: str = None) -> bool:
        """Download and initialize model if needed with progressive loading"""
        if self.is_initialized and self.model:
            return True
        
        model_info = self.get_model_info(tier)
        model_path = self.get_model_cache_dir() / model_info["filename"]
        
        if not model_path.exists():
            logger.info(f"Downloading {model_info['tier']} tier model: {model_info['name']} ({model_info['size_mb']}MB)")
            success = await self._download_model(model_path, model_info)
            if not success:
                # Try fallback to minimal tier if not already minimal
                if model_info["tier"] != "minimal":
                    logger.warning("Download failed, trying minimal tier as fallback")
                    return await self.ensure_model_ready("minimal")
                logger.error("Model download failed")
                return False
        
        self.current_model_info = model_info
        return self._load_model(str(model_path))
    
    async def _download_model(self, model_path: Path, model_info: Dict[str, Any]) -> bool:
        """Download model file with progress tracking"""
        try:
            response = requests.get(model_info["url"], stream=True)
            response.raise_for_status()
            
            total_size = int(response.headers.get('content-length', 0))
            downloaded = 0
            
            with open(model_path, 'wb') as f:
                for chunk in response.iter_content(chunk_size=8192):
                    if chunk:
                        f.write(chunk)
                        downloaded += len(chunk)
                        if total_size > 0:
                            progress = (downloaded / total_size) * 100
                            if downloaded % (1024 * 1024 * 10) == 0:  # Log every 10MB
                                logger.info(f"Download progress: {progress:.1f}%")
            
            logger.info(f"Model download completed: {model_info['name']}")
            return True
            
        except Exception as e:
            logger.error(f"Model download error: {e}")
            if model_path.exists():
                model_path.unlink()
            return False
    
    def _load_model(self, model_path: str) -> bool:
        """Load model into memory with optimized settings"""
        if not LLAMA_CPP_AVAILABLE:
            logger.error("llama-cpp-python not available")
            return False
        
        try:
            logger.info(f"Loading model: {model_path}")
            
            # Get system resources for optimization
            resources = self.get_system_resources()
            
            # Optimize threads based on CPU count
            n_threads = min(resources["cpu_count"], 8)  # Cap at 8 threads
            
            # Context size based on model tier
            n_ctx = 2048
            if self.current_model_info:
                if self.current_model_info["tier"] == "minimal":
                    n_ctx = 1536  # Smaller context for minimal tier
                elif self.current_model_info["tier"] == "quality":
                    n_ctx = 4096  # Larger context for quality tier
            
            self.model = Llama(
                model_path=model_path,
                n_ctx=n_ctx,
                n_threads=n_threads,
                n_gpu_layers=0,  # CPU-only for compatibility
                verbose=False,
                use_mmap=True,  # Memory-mapped files for efficiency
                use_mlock=False  # Don't lock memory to allow swapping
            )
            
            self.model_path = model_path
            self.is_initialized = True
            
            tier_name = self.current_model_info["tier"] if self.current_model_info else "unknown"
            logger.info(f"Model loaded successfully: {tier_name} tier ({n_ctx} context, {n_threads} threads)")
            return True
            
        except Exception as e:
            logger.error(f"Model loading error: {e}")
            return False
    
    def is_ready(self) -> bool:
        """Check if engine is ready"""
        return self.is_initialized and self.model is not None
    
    async def _generate(self, prompt: str, max_tokens: int = 512, temperature: float = 0.1) -> Optional[str]:
        """Generate text with optimized settings"""
        if not self.is_ready():
            return None
        
        try:
            loop = asyncio.get_event_loop()
            result = await loop.run_in_executor(None, self._generate_sync, prompt, max_tokens, temperature)
            return result
        except Exception as e:
            logger.error(f"Generation error: {e}")
            return None
    
    def _generate_sync(self, prompt: str, max_tokens: int, temperature: float) -> Optional[str]:
        """Synchronous generation with resource-aware settings"""
        with self.model_lock:
            # Adjust max_tokens based on model tier
            if self.current_model_info:
                if self.current_model_info["tier"] == "minimal":
                    max_tokens = min(max_tokens, 256)  # Limit for minimal tier
                elif self.current_model_info["tier"] == "quality":
                    max_tokens = min(max_tokens, 1024)  # Allow more for quality tier
            
            response = self.model(
                prompt,
                max_tokens=max_tokens,
                temperature=temperature,
                top_p=0.9,
                stop=["</s>", "<|im_end|>"],
                echo=False
            )
        
        if response and 'choices' in response and response['choices']:
            return response['choices'][0]['text'].strip()
        return None
    
    async def summarize(self, text: str) -> Optional[Dict[str, Any]]:
        """Generate summary with tier-optimized prompt engineering"""
        if not text or len(text.strip()) < 20:
            return None
        
        # Adjust text length based on model tier
        max_text_length = 1500
        if self.current_model_info:
            if self.current_model_info["tier"] == "minimal":
                max_text_length = 800  # Shorter for minimal tier
            elif self.current_model_info["tier"] == "quality":
                max_text_length = 2000  # Longer for quality tier
        
        if len(text) > max_text_length:
            text = text[:max_text_length] + "..."
        
        prompt = f"""<|im_start|>system
You are a professional summarizer. Create a clear, structured summary.

Format your response exactly like this:
**Main Points:**
- Key topic 1
- Key topic 2

**Key Details:**
- Important fact 1
- Important fact 2

**Summary:**
Brief overview in 2-3 sentences.

Do not add any other text.<|im_end|>
<|im_start|>user
{text}<|im_end|>
<|im_start|>assistant
**Main Points:**"""
        
        start_time = datetime.now()
        
        # Adjust max_tokens based on tier
        max_tokens = 400
        if self.current_model_info and self.current_model_info["tier"] == "minimal":
            max_tokens = 200
        
        result = await self._generate(prompt, max_tokens=max_tokens, temperature=0.2)
        
        if not result:
            return None
        
        # Ensure it starts with Main Points
        if not result.startswith("- "):
            result = "- " + result
        
        summary = "**Main Points:**\n" + result
        
        generation_time = (datetime.now() - start_time).total_seconds()
        model_tier = self.current_model_info["tier"] if self.current_model_info else "unknown"
        
        return {
            "summary": summary,
            "original_length": len(text),
            "summary_length": len(summary),
            "original_words": len(text.split()),
            "summary_words": len(summary.split()),
            "compression_ratio": len(text.split()) / len(summary.split()) if len(summary.split()) > 0 else 0,
            "generation_time": generation_time,
            "model": f"{self.current_model_info['name'] if self.current_model_info else 'unknown'}",
            "model_tier": model_tier,
            "created_at": datetime.now().isoformat()
        }
    
    async def translate(self, text: str, target_language: str) -> Optional[Dict[str, Any]]:
        """Translate text with tier-optimized prompt engineering"""
        if not text or len(text.strip()) < 5:
            return None
        
        # Adjust text length based on model tier
        max_text_length = 1200
        if self.current_model_info:
            if self.current_model_info["tier"] == "minimal":
                max_text_length = 600
            elif self.current_model_info["tier"] == "quality":
                max_text_length = 1500
        
        if len(text) > max_text_length:
            text = text[:max_text_length] + "..."
        
        target_lang_name = self.LANGUAGES.get(target_language.lower(), target_language)
        
        prompt = f"""<|im_start|>system
You are a professional translator. Translate text to {target_lang_name}.
If text is already in {target_lang_name}, return it unchanged.
Return only the translation. No explanations.<|im_end|>
<|im_start|>user
{text}<|im_end|>
<|im_start|>assistant
"""
        
        start_time = datetime.now()
        
        # Adjust max_tokens based on tier and text length
        base_tokens = min(len(text.split()) + 200, 1024)
        if self.current_model_info and self.current_model_info["tier"] == "minimal":
            base_tokens = min(base_tokens, 300)
        
        result = await self._generate(
            prompt, 
            max_tokens=base_tokens,
            temperature=0.1
        )
        
        if not result:
            # Fallback to original text
            result = text.strip()
        
        generation_time = (datetime.now() - start_time).total_seconds()
        model_tier = self.current_model_info["tier"] if self.current_model_info else "unknown"
        
        return {
            "translated_text": result,
            "original_length": len(text),
            "translated_length": len(result),
            "target_language": target_language,
            "generation_time": generation_time,
            "model": f"{self.current_model_info['name'] if self.current_model_info else 'unknown'}",
            "model_tier": model_tier,
            "created_at": datetime.now().isoformat()
        }
    
    def get_supported_languages(self) -> List[Dict[str, str]]:
        """Get supported languages"""
        return [{"code": code, "name": name} for code, name in self.LANGUAGES.items()]
    
    def get_available_tiers(self) -> List[Dict[str, Any]]:
        """Get all available model tiers"""
        return [
            {
                "tier": tier,
                "name": info["name"],
                "size_mb": info["size_mb"],
                "min_ram_gb": info["min_ram_gb"],
                "description": info["description"]
            }
            for tier, info in self.MODEL_TIERS.items()
        ]
    
    def get_info(self) -> Dict[str, Any]:
        """Get comprehensive engine info"""
        resources = self.get_system_resources()
        current_tier = None
        if self.current_model_info:
            current_tier = {
                "tier": self.current_model_info["tier"],
                "name": self.current_model_info["name"],
                "size_mb": self.current_model_info["size_mb"]
            }
        
        return {
            "is_available": LLAMA_CPP_AVAILABLE,
            "is_initialized": self.is_initialized,
            "model_path": self.model_path,
            "current_tier": current_tier,
            "preferred_tier": self.preferred_tier,
            "system_resources": resources,
            "recommended_tier": self.auto_select_model_tier(),
            "available_tiers": self.get_available_tiers(),
            "supported_languages": len(self.LANGUAGES)
        }
    
    async def switch_tier(self, new_tier: str) -> bool:
        """Switch to a different model tier"""
        if new_tier not in self.MODEL_TIERS and new_tier != "auto":
            logger.error(f"Invalid tier: {new_tier}")
            return False
        
        # Cleanup current model
        self.cleanup()
        
        # Update preferred tier and reload
        self.preferred_tier = new_tier
        success = await self.ensure_model_ready()
        
        if success:
            logger.info(f"Successfully switched to {self.current_model_info['tier']} tier")
        else:
            logger.error(f"Failed to switch to {new_tier} tier")
        
        return success
    
    def cleanup(self):
        """Cleanup resources properly"""
        if self.model:
            del self.model
        self.model = None
        self.current_model_info = None
        self.is_initialized = False
        
        # Force garbage collection to free memory
        import gc
        gc.collect()


# Global instance
_engine = None

def get_engine() -> LLMEngine:
    """Get global engine instance"""
    global _engine
    if _engine is None:
        _engine = LLMEngine()
    return _engine