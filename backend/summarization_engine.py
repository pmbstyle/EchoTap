"""
Simple, modular summarization engine.
Clean code with proper separation of concerns.
"""
import logging
from typing import Dict, Optional, Any
from llm_engine import get_engine

logger = logging.getLogger(__name__)

class SummarizationEngine:
    """Simple summarization engine using clean LLM calls"""
    
    def __init__(self):
        self.engine = get_engine()
        self.is_initialized = True  # Simple initialization
    
    async def generate_summary(self, text: str) -> Optional[Dict[str, Any]]:
        """Generate summary - simple and clean"""
        if not text or len(text.strip()) < 50:
            logger.info("Text too short for summarization")
            return None
        
        # Ensure model is ready
        if not await self.engine.ensure_model_ready():
            logger.error("Model not available for summarization")
            return None
        
        logger.info(f"Generating summary for {len(text)} chars")
        
        result = await self.engine.summarize(text)
        
        if result:
            logger.info(f"Summary generated: {result['summary_words']} words, {result['compression_ratio']:.1f}x compression")
        else:
            logger.error("Summary generation failed")
        
        return result
    
    async def download_model_if_needed(self, progress_callback=None) -> bool:
        """Download model if needed - compatibility method"""
        return await self.engine.ensure_model_ready()
    
    def get_model_info(self) -> Dict[str, Any]:
        """Get model information"""
        info = self.engine.get_info()
        return {
            **info,
            "engine_type": "clean_llm_engine",
            "is_initialized": self.is_initialized,
            "is_available": info.get("is_available", True),
            "is_downloaded": info.get("is_initialized", False),
            "is_loaded": info.get("is_initialized", False),
            "model_name": "qwen2.5-3b-instruct"
        }
    
    def cleanup(self):
        """Cleanup resources"""
        if self.engine:
            self.engine.cleanup()
        self.is_initialized = False