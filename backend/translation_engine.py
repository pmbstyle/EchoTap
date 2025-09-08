"""
Simple, modular translation engine.
Clean code with proper separation of concerns.
"""
import logging
from typing import Dict, List, Optional, Any
from datetime import datetime
from llm_engine import get_engine

logger = logging.getLogger(__name__)

class TranslationEngine:
    """Simple translation engine using clean LLM calls"""
    
    def __init__(self):
        self.engine = get_engine()
        self.is_initialized = True  # Simple initialization
    
    async def translate_text(self, text: str, target_language: str) -> Optional[Dict[str, Any]]:
        """Translate single text - simple and clean"""
        if not text or len(text.strip()) < 5:
            logger.info("Text too short for translation")
            return None
        
        # Ensure model is ready
        if not await self.engine.ensure_model_ready():
            logger.error("Model not available for translation")
            return None
        
        logger.info(f"Translating {len(text)} chars to {target_language}")
        
        result = await self.engine.translate(text, target_language)
        
        if result:
            logger.info(f"Translation successful: {len(result['translated_text'])} chars")
        else:
            logger.error("Translation failed")
        
        return result
    
    async def translate_session_content(
        self, 
        transcript_text: str, 
        summary_text: Optional[str], 
        target_language: str
    ) -> Optional[Dict[str, Any]]:
        """Translate both transcript and summary - modular approach"""
        
        # Ensure model is ready
        if not await self.engine.ensure_model_ready():
            logger.error("Model not available for translation")
            return None
        
        try:
            # Translate transcript
            logger.info(f"Translating transcript ({len(transcript_text)} chars) to {target_language}")
            transcript_result = await self.engine.translate(transcript_text, target_language)
            
            if not transcript_result:
                logger.error("Transcript translation failed")
                return None
            
            # Translate summary if available
            translated_summary = None
            summary_generation_time = 0
            
            if summary_text and summary_text.strip():
                logger.info(f"Translating summary ({len(summary_text)} chars)")
                summary_result = await self.engine.translate(summary_text, target_language)
                
                if summary_result:
                    translated_summary = summary_result['translated_text']
                    summary_generation_time = summary_result['generation_time']
                    logger.info(f"Summary translation successful ({len(translated_summary)} chars)")
                else:
                    logger.warning("Summary translation failed")
            
            # Return combined results
            return {
                "translated_transcript": transcript_result['translated_text'],
                "translated_summary": translated_summary,
                "original_transcript_length": len(transcript_text),
                "translated_transcript_length": len(transcript_result['translated_text']),
                "target_language": target_language,
                "generation_time": transcript_result['generation_time'] + summary_generation_time,
                "model": "qwen2.5-3b-instruct",
                "created_at": datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Translation error: {e}")
            return None
    
    def get_supported_languages(self) -> List[Dict[str, str]]:
        """Get supported languages"""
        return self.engine.get_supported_languages()
    
    def get_model_info(self) -> Dict[str, Any]:
        """Get model information"""
        return {
            **self.engine.get_info(),
            "engine_type": "clean_llm_engine",
            "is_initialized": self.is_initialized
        }
    
    def cleanup(self):
        """Cleanup resources"""
        if self.engine:
            self.engine.cleanup()
        self.is_initialized = False