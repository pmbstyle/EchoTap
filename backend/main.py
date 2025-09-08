"""
EchoTap Backend - FastAPI server for local speech-to-text processing
"""
import asyncio
import json
import logging
import os
import sys
from collections import deque
from datetime import datetime

os.environ["KMP_DUPLICATE_LIB_OK"] = "TRUE"
from contextlib import asynccontextmanager
from pathlib import Path
from typing import Any, Dict, List, Optional

import uvicorn
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

# Audio capture imports
from audio_capture import AudioCapture
from transcription_engine import TranscriptionEngine
from summarization_engine import SummarizationEngine
from translation_engine import TranslationEngine
from database import DatabaseManager
from models import (
    TranscriptionMessage, 
    SessionData, 
    PreferencesUpdate,
    ModelInfo,
    SummaryRequest,
    SummaryResponse,
    SessionSummaryData,
    TranslationRequest,
    TranslationResponse,
    SessionTranslationData,
    LanguageInfo
)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Resource Manager for proper cleanup and memory management
class ResourceManager:
    """Manages application resources and prevents memory leaks"""
    
    def __init__(self):
        self.active_connections: List[WebSocket] = []
        self.audio_buffer = deque(maxlen=100)  # Bounded buffer (max 100 chunks)
        self.current_session_id: Optional[str] = None
        self.current_session_transcript = ""
        self.is_recording = False
        self.is_speech_active = False
        self.last_transcription_time = 0
        
        # Constants
        self.MIN_AUDIO_DURATION = 1.0
        self.SAMPLE_RATE = 16000
        self.MAX_SESSION_DURATION = 3600  # 1 hour max session
        
        # Session tracking for cleanup
        self.session_start_time: Optional[float] = None
        self.last_cleanup_time = 0
        self.CLEANUP_INTERVAL = 300  # Cleanup every 5 minutes
    
    def add_connection(self, connection: WebSocket) -> None:
        """Add a WebSocket connection"""
        self.active_connections.append(connection)
        logger.info(f"Client connected. Total connections: {len(self.active_connections)}")
    
    def remove_connection(self, connection: WebSocket) -> None:
        """Remove a WebSocket connection"""
        if connection in self.active_connections:
            self.active_connections.remove(connection)
        logger.info(f"Client removed. Total connections: {len(self.active_connections)}")
    
    def start_session(self, session_id: str) -> None:
        """Start a new session with proper cleanup of previous session"""
        # Cleanup previous session
        self.cleanup_session()
        
        self.current_session_id = session_id
        self.current_session_transcript = ""
        self.is_recording = True
        self.session_start_time = time.time()
        self.audio_buffer.clear()
        self.last_transcription_time = 0
        
        logger.info(f"Started new session: {session_id}")
    
    def end_session(self) -> str:
        """End current session and return session ID"""
        session_id = self.current_session_id
        self.cleanup_session()
        logger.info(f"Ended session: {session_id}")
        return session_id
    
    def cleanup_session(self) -> None:
        """Clean up current session resources"""
        self.current_session_id = None
        self.current_session_transcript = ""
        self.is_recording = False
        self.is_speech_active = False
        self.session_start_time = None
        self.audio_buffer.clear()
        
        # Force garbage collection
        import gc
        gc.collect()
    
    def should_cleanup(self) -> bool:
        """Check if periodic cleanup is needed"""
        current_time = time.time()
        return (current_time - self.last_cleanup_time) > self.CLEANUP_INTERVAL
    
    def periodic_cleanup(self) -> None:
        """Perform periodic cleanup to prevent memory leaks"""
        try:
            current_time = time.time()
            
            # Check for overly long sessions
            if self.session_start_time and (current_time - self.session_start_time) > self.MAX_SESSION_DURATION:
                logger.warning("Session exceeded maximum duration, forcing cleanup")
                self.cleanup_session()
            
            # Clear old audio buffer chunks
            if len(self.audio_buffer) > 50:  # Keep only recent chunks
                while len(self.audio_buffer) > 25:
                    self.audio_buffer.popleft()
                logger.info("Cleaned up old audio buffer chunks")
            
            # Update cleanup time
            self.last_cleanup_time = current_time
            
            # Force garbage collection
            import gc
            gc.collect()
            
            logger.debug("Performed periodic resource cleanup")
            
        except Exception as e:
            logger.error(f"Error during periodic cleanup: {e}")
    
    def get_stats(self) -> Dict[str, Any]:
        """Get resource usage statistics"""
        return {
            "active_connections": len(self.active_connections),
            "current_session_id": self.current_session_id,
            "is_recording": self.is_recording,
            "audio_buffer_size": len(self.audio_buffer),
            "session_transcript_length": len(self.current_session_transcript),
            "session_duration": time.time() - self.session_start_time if self.session_start_time else 0
        }

# Global resource manager instance
resource_manager = ResourceManager()

# Legacy global variables for backwards compatibility (will be phased out)
active_connections = resource_manager.active_connections
audio_capture: Optional[AudioCapture] = None
transcription_engine: Optional[TranscriptionEngine] = None
summarization_engine: Optional[SummarizationEngine] = None
translation_engine: Optional[TranslationEngine] = None
database: Optional[DatabaseManager] = None
main_event_loop: Optional[asyncio.AbstractEventLoop] = None

# Session state variables
is_recording: bool = False
current_session_id: Optional[str] = None
current_session_transcript: str = ""

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan management with proper resource cleanup"""
    global transcription_engine, summarization_engine, translation_engine, database, audio_capture, main_event_loop
    
    # Startup
    logger.info("Starting EchoTap backend...")
    
    # Store reference to main event loop for audio callback
    main_event_loop = asyncio.get_running_loop()
    
    # Initialize database
    app_data_dir = get_app_data_dir()
    db_path = app_data_dir / "db" / "echotap.db"
    db_path.parent.mkdir(parents=True, exist_ok=True)
    
    database = DatabaseManager(str(db_path))
    await database.initialize()
    
    # Initialize transcription engine
    transcription_engine = TranscriptionEngine()
    
    # Initialize summarization engine
    summarization_engine = SummarizationEngine()
    
    # Initialize translation engine
    translation_engine = TranslationEngine()
    
    # Initialize audio capture for backend recording
    audio_capture = AudioCapture()
    
    logger.info("✅ Audio capture ready for VAD-based transcription")
    logger.info("EchoTap backend started successfully with audio capture support")
    
    # Start periodic cleanup task
    cleanup_task = asyncio.create_task(periodic_cleanup_task())
    
    yield
    
    # Shutdown
    logger.info("Shutting down EchoTap backend...")
    
    # Cancel cleanup task
    cleanup_task.cancel()
    try:
        await cleanup_task
    except asyncio.CancelledError:
        pass
    
    # Cleanup active sessions
    resource_manager.cleanup_session()
    
    # Cleanup engines with proper resource management
    if database:
        try:
            await database.close()
        except Exception as e:
            logger.error(f"Error closing database: {e}")
        
    if summarization_engine:
        try:
            summarization_engine.cleanup()
        except Exception as e:
            logger.error(f"Error cleaning up summarization engine: {e}")
        
    if translation_engine:
        try:
            translation_engine.cleanup()
        except Exception as e:
            logger.error(f"Error cleaning up translation engine: {e}")
    
    if transcription_engine:
        try:
            # Clean up transcription engine resources
            if hasattr(transcription_engine, 'cleanup'):
                transcription_engine.cleanup()
        except Exception as e:
            logger.error(f"Error cleaning up transcription engine: {e}")
    
    if audio_capture:
        try:
            # Stop any active recording
            if hasattr(audio_capture, 'stop_recording'):
                await audio_capture.stop_recording()
        except Exception as e:
            logger.error(f"Error stopping audio capture: {e}")
        
    # Final garbage collection
    import gc
    gc.collect()
    
    logger.info("EchoTap backend shutdown complete")

async def periodic_cleanup_task():
    """Background task for periodic resource cleanup"""
    while True:
        try:
            await asyncio.sleep(300)  # Run every 5 minutes
            if resource_manager.should_cleanup():
                resource_manager.periodic_cleanup()
        except asyncio.CancelledError:
            break
        except Exception as e:
            logger.error(f"Error in periodic cleanup task: {e}")

def get_app_data_dir() -> Path:
    """Get application data directory based on platform"""
    if sys.platform == "win32":
        return Path(os.environ.get("APPDATA", "")) / "EchoTap"
    elif sys.platform == "darwin":
        return Path.home() / "Library" / "Application Support" / "EchoTap"
    else:  # Linux
        return Path.home() / ".config" / "EchoTap"

# Audio processing is now handled by handle_frontend_audio function below

async def broadcast_message(message: Dict):
    """Broadcast message to all connected WebSocket clients"""
    if not active_connections:
        return
    
    message_str = json.dumps(message)
    disconnected = []
    
    for connection in active_connections:
        try:
            await connection.send_text(message_str)
        except Exception as e:
            logger.error(f"Error sending message to client: {e}")
            disconnected.append(connection)
    
    # Remove disconnected clients
    for connection in disconnected:
        if connection in active_connections:
            active_connections.remove(connection)

async def handle_frontend_audio(message: Dict):
    """Handle audio data from frontend VAD"""
    global current_session_id, current_session_transcript, database, transcription_engine, is_recording
    
    try:
        audio_data = message.get("audio_data")
        sample_rate = message.get("sample_rate", 16000)
        
        if not audio_data:
            logger.warning("No audio data received from frontend")
            return
        
        # Handle both base64 string and byte array formats
        if isinstance(audio_data, str):
            # Base64 encoded data from frontend
            import base64
            try:
                audio_bytes = base64.b64decode(audio_data)
                logger.debug(f"Received base64 audio from frontend: {len(audio_bytes)} bytes")
            except Exception as e:
                logger.error(f"❌ Failed to decode base64 audio data: {e}")
                return
        else:
            # Legacy byte array format
            audio_bytes = bytes(audio_data)
            logger.debug(f"Received audio from frontend: {len(audio_bytes)} bytes")
        
        # Create session if not exists
        if not current_session_id and database:
            session_data = SessionData(
                source="microphone",
                model=transcription_engine.get_current_model() if transcription_engine else "unknown"
            )
            current_session_id = await database.create_session(session_data)
            current_session_transcript = ""
            logger.info(f"🆔 Created new session: {current_session_id}")
        
        # Set recording state when we receive audio
        if not is_recording:
            is_recording = True
            await broadcast_message({
                "type": "recording_started",
                "session_id": current_session_id
            })
        
        # Process with transcription engine
        if transcription_engine:
            result = await transcription_engine.process_wav_audio(audio_bytes, sample_rate, "microphone")
            
            if result and result.get("text", "").strip():
                # Send transcription result to frontend - ensure correct message type
                timestamp_str = datetime.now().isoformat()
                
                # Since frontend VAD sends complete utterances, send as partial first, then final
                partial_message = {
                    "type": "partial_transcript",
                    "text": result["text"],
                    "confidence": float(result.get("confidence", 0.0)),
                    "is_final": False,
                    "timestamp": timestamp_str,
                    "source": "microphone"
                }
                
                final_message = {
                    "type": "final_transcript", 
                    "text": result["text"],
                    "confidence": float(result.get("confidence", 0.0)),
                    "is_final": True,
                    "timestamp": timestamp_str,
                    "source": "microphone"
                }
                
                # Send partial first, then final to simulate streaming behavior
                await broadcast_message(partial_message)
                await asyncio.sleep(0.1)  # Small delay between messages
                
                # Simple transcript merging for 1-second chunks with minimal overlap
                new_text = result["text"].strip()
                if new_text:
                    if not current_session_transcript:
                        # First transcription
                        current_session_transcript = new_text
                        logger.info(f"✅ Started transcript: '{new_text[:50]}...'")
                    else:
                        # Simple overlap detection for 1-second chunks
                        current_words = current_session_transcript.split()
                        new_words = new_text.split()
                        
                        # Check for small overlap at the end of current transcript with start of new text
                        max_check = min(5, len(current_words), len(new_words))  # Check only last 5 words
                        overlap_found = False
                        
                        for i in range(1, max_check + 1):
                            # Check if last i words of current match first i words of new
                            if current_words[-i:] == new_words[:i]:
                                # Found overlap, add only the non-overlapping part
                                new_content_words = new_words[i:]
                                if new_content_words:
                                    new_content = " ".join(new_content_words)
                                    current_session_transcript += " " + new_content
                                    logger.info(f"✅ Merged with {i}-word overlap: '{new_content[:50]}...'")
                                else:
                                    logger.info(f"⏩ Skipped - complete overlap ({i} words)")
                                overlap_found = True
                                break
                        
                        if not overlap_found:
                            # No overlap, add as separate content
                            current_session_transcript += " " + new_text
                            logger.info(f"✅ Added separate content: '{new_text[:50]}...'")
                
                
                await broadcast_message(final_message)
                
                # Save to database (merging logic above ensures no duplicates)
                if database and current_session_id:
                    await database.add_transcript_segment(
                        session_id=current_session_id,
                        text=result["text"],
                        start_time=float(result.get("start_time", 0)),
                        end_time=float(result.get("end_time", 0)),
                        confidence=float(result.get("confidence", 0.0))
                    )
                
    except Exception as e:
        logger.error(f"Error handling frontend audio: {e}")

# Legacy backend recording functions removed - now using VAD-based transcription

# Legacy stop recording function removed

# Legacy audio callback removed - using frontend VAD

# Legacy buffer and process audio removed

# Legacy process captured audio removed

# Initialize FastAPI app
app = FastAPI(
    title="EchoTap Backend",
    description="Local speech-to-text processing server",
    version="1.0.0",
    lifespan=lifespan
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """WebSocket endpoint for real-time communication"""
    await websocket.accept()
    active_connections.append(websocket)
    logger.info(f"Client connected. Total connections: {len(active_connections)}")
    
    try:
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)
            await handle_websocket_message(websocket, message)
            
    except WebSocketDisconnect:
        logger.info("Client disconnected")
        # Auto-complete any active session on disconnect
        await handle_disconnect_cleanup()
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        # Auto-complete any active session on error
        await handle_disconnect_cleanup()
    finally:
        if websocket in active_connections:
            active_connections.remove(websocket)
        logger.info(f"Client removed. Total connections: {len(active_connections)}")

async def handle_websocket_message(websocket: WebSocket, message: Dict):
    """Handle incoming WebSocket messages"""
    global is_recording, current_session_id
    
    message_type = message.get("type")
    
    try:
        if message_type == "transcribe_audio":
            await handle_frontend_audio(message)
        
        elif message_type == "frontend_recording_stopped":
            await handle_frontend_recording_stopped()
            
        # Note: Backend recording handlers removed - using efficient VAD-based transcription
                
        elif message_type == "get_sessions":
            if database:
                sessions = await database.get_sessions_with_summaries()
                await websocket.send_text(json.dumps({
                    "type": "sessions_list",
                    "sessions": sessions
                }))
                
        elif message_type == "get_session_transcript":
            session_id = message.get("session_id")
            if database and session_id:
                transcript = await database.get_session_transcript(session_id)
                logger.info(f"🔍 Sending transcript for session {session_id}: {len(transcript.get('full_text', '') if transcript else 'None')} chars")
                if transcript:
                    logger.info(f"   Transcript preview: {transcript.get('full_text', '')[:80]}...")
                await websocket.send_text(json.dumps({
                    "type": "session_transcript",
                    "session_id": session_id,
                    "transcript": transcript
                }))
                
        elif message_type == "delete_session":
            session_id = message.get("session_id")
            if database and session_id:
                success = await database.delete_session(session_id)
                await websocket.send_text(json.dumps({
                    "type": "session_deleted",
                    "session_id": session_id,
                    "success": success
                }))
                
        elif message_type == "update_preferences":
            preferences = message.get("preferences")
            if preferences and transcription_engine:
                await transcription_engine.update_preferences(preferences)
                    
        elif message_type == "get_models":
            if transcription_engine:
                models = await transcription_engine.get_available_models()
                await websocket.send_text(json.dumps({
                    "type": "available_models",
                    "models": models
                }))
                
        elif message_type == "get_status":
            # Send current backend status to sync frontend state
            current_model = transcription_engine.get_current_model() if transcription_engine else "unknown"
            
            # Use the live accumulated session transcript
            status_response = {
                "type": "backend_status",
                "is_recording": is_recording,
                "current_session_id": current_session_id,
                "audio_source": "microphone",
                "model": current_model,
                "connections": len(active_connections),
                "current_transcript": current_session_transcript
            }
            
            await websocket.send_text(json.dumps(status_response))
            logger.info(f"📊 Status queried: recording={is_recording}, session={current_session_id}, source=microphone, transcript_chars={len(current_session_transcript)}")
                

        elif message_type == "get_session_summary":
            session_id = message.get("session_id")
            if database and session_id:
                summary = await database.get_session_summary(session_id)
                logger.info(f"📋 Sending summary for session {session_id}: {len(summary.get('summary', '') if summary else 'None')} chars")
                if summary:
                    logger.info(f"   Summary preview: {summary.get('summary', '')[:80]}...")
                await websocket.send_text(json.dumps({
                    "type": "session_summary",
                    "session_id": session_id,
                    "summary": summary
                }))
                
        elif message_type == "generate_summary":
            session_id = message.get("session_id")
            if session_id:
                success = await generate_session_summary(session_id)
                await websocket.send_text(json.dumps({
                    "type": "summary_generation_result",
                    "session_id": session_id,
                    "success": success
                }))
                
        elif message_type == "get_summarization_status":
            if summarization_engine:
                model_info = summarization_engine.get_model_info()
                await websocket.send_text(json.dumps({
                    "type": "summarization_status",
                    "available": model_info["is_available"],
                    "downloaded": model_info["is_downloaded"],
                    "loaded": model_info["is_loaded"],
                    "model_name": model_info["model_name"]
                }))
                
        elif message_type == "download_summarization_model":
            if summarization_engine:
                success = await summarization_engine.download_model_if_needed()
                await websocket.send_text(json.dumps({
                    "type": "summarization_model_download_result",
                    "success": success
                }))
                
        elif message_type == "get_supported_languages":
            if translation_engine:
                languages = translation_engine.get_supported_languages()
                await websocket.send_text(json.dumps({
                    "type": "supported_languages",
                    "languages": languages
                }))
                
        elif message_type == "translate_session":
            session_id = message.get("session_id")
            target_language = message.get("target_language")
            if session_id and target_language:
                success = await translate_session_content(session_id, target_language)
                await websocket.send_text(json.dumps({
                    "type": "translation_result",
                    "session_id": session_id,
                    "target_language": target_language,
                    "success": success
                }))
                
        elif message_type == "get_session_translation":
            session_id = message.get("session_id")
            target_language = message.get("target_language")
            if database and session_id and target_language:
                translation = await database.get_session_translation(session_id, target_language)
                await websocket.send_text(json.dumps({
                    "type": "session_translation",
                    "session_id": session_id,
                    "target_language": target_language,
                    "translation": translation
                }))
                
        elif message_type == "get_session_translations":
            session_id = message.get("session_id")
            if database and session_id:
                translations = await database.get_session_translations(session_id)
                await websocket.send_text(json.dumps({
                    "type": "session_translations",
                    "session_id": session_id,
                    "translations": translations
                }))
                
        elif message_type == "get_translation_status":
            if translation_engine:
                model_info = translation_engine.get_model_info()
                await websocket.send_text(json.dumps({
                    "type": "translation_status",
                    "available": model_info["is_available"],
                    "downloaded": model_info["is_downloaded"],
                    "loaded": model_info["is_loaded"],
                    "model_name": model_info["model_name"],
                    "supported_languages": model_info["supported_languages"]
                }))
                
        elif message_type == "update_settings":
            settings = message.get("settings")
            if settings:
                logger.info(f"Received settings update: {settings}")
                # Update engines with new settings
                if transcription_engine and "transcriptionModel" in settings:
                    await transcription_engine.switch_model(settings["transcriptionModel"])
                
                if summarization_engine and "summarizationModel" in settings:
                    # Switch summarization model tier
                    from llm_engine import get_engine
                    llm_engine = get_engine()
                    await llm_engine.switch_tier(settings["summarizationModel"])
                
                if translation_engine and "translationModel" in settings:
                    # Switch translation model tier
                    from llm_engine import get_engine
                    llm_engine = get_engine()
                    await llm_engine.switch_tier(settings["translationModel"])
                
                await websocket.send_text(json.dumps({
                    "type": "settings_updated",
                    "success": True
                }))
                
        elif message_type == "download_model":
            model_type = message.get("model_type")
            model = message.get("model")
            
            if model_type == "transcription" and transcription_engine:
                success = await transcription_engine.download_model(model)
                await websocket.send_text(json.dumps({
                    "type": "model_download_result",
                    "model_type": model_type,
                    "model": model,
                    "success": success
                }))
                
            elif model_type == "summarization" and summarization_engine:
                from llm_engine import get_engine
                llm_engine = get_engine()
                success = await llm_engine.ensure_model_ready(model)
                await websocket.send_text(json.dumps({
                    "type": "model_download_result",
                    "model_type": model_type,
                    "model": model,
                    "success": success
                }))
                
            elif model_type == "translation" and translation_engine:
                from llm_engine import get_engine
                llm_engine = get_engine()
                success = await llm_engine.ensure_model_ready(model)
                await websocket.send_text(json.dumps({
                    "type": "model_download_result",
                    "model_type": model_type,
                    "model": model,
                    "success": success
                }))
                
        elif message_type == "get_llm_models":
            try:
                from llm_engine import get_engine
                llm_engine = get_engine()
                available_tiers = llm_engine.get_available_tiers()
                await websocket.send_text(json.dumps({
                    "type": "llm_models",
                    "models": available_tiers
                }))
            except Exception as e:
                logger.error(f"Error getting LLM models: {e}")
                await websocket.send_text(json.dumps({
                    "type": "llm_models",
                    "models": []
                }))
                
        else:
            logger.warning(f"Unknown message type: {message_type}")
            
    except Exception as e:
        logger.error(f"Error handling message {message_type}: {e}")
        await websocket.send_text(json.dumps({
            "type": "error",
            "error": str(e)
        }))

async def handle_disconnect_cleanup():
    """Handle cleanup when WebSocket disconnects - complete any active session"""
    global is_recording, current_session_id, current_session_transcript
    
    if current_session_id and database:
        try:
            logger.info(f"🔄 Auto-completing session on disconnect: {current_session_id}")
            await database.complete_session(current_session_id)
            
            # Generate summary for the completed session
            await generate_session_summary(current_session_id)
            
            # Reset session state
            session_id = current_session_id
            current_session_id = None
            current_session_transcript = ""
            is_recording = False
            
            await broadcast_message({
                "type": "session_completed", 
                "session_id": session_id,
                "reason": "disconnect_cleanup"
            })
            
            logger.info(f"✅ Session auto-completed on disconnect: {session_id}")
        except Exception as e:
            logger.error(f"❌ Error completing session on disconnect: {e}")

async def handle_frontend_recording_stopped():
    """Handle when frontend recording stops"""
    global is_recording, current_session_id, current_session_transcript
    
    if is_recording:
        is_recording = False
        session_id = current_session_id
        
        # End transcription session to process remaining audio chunks
        if transcription_engine and current_session_id:
            logger.info("🔄 Processing remaining audio chunks before stopping...")
            await transcription_engine.end_session(current_session_id)
        
        # Complete session in database
        if database and current_session_id:
            await database.complete_session(current_session_id)
            
            # Generate summary for the completed session
            await generate_session_summary(current_session_id)
        
        # Reset session ID but preserve transcript for transcription window access
        current_session_id = None
        # Keep current_session_transcript available for transcription window retrieval
        # It will be cleared when a new session starts
        
        await broadcast_message({
            "type": "recording_stopped",
            "session_id": session_id
        })
        
        logger.info(f"📴 Frontend recording stopped, session: {session_id}")

async def generate_session_summary(session_id: str) -> bool:
    """Generate summary for a completed session"""
    global database, summarization_engine
    
    if not database or not summarization_engine or not summarization_engine.is_initialized:
        logger.info("Summary generation skipped - summarization engine not available")
        return False
    
    try:
        # Get session transcript
        transcript_data = await database.get_session_transcript(session_id)
        if not transcript_data:
            logger.warning(f"No transcript found for session {session_id}")
            return False
            
        full_text = transcript_data.get('full_text', '')
        if len(full_text.strip()) < 50:  # Too short to summarize
            logger.info(f"Session {session_id} transcript too short for summarization")
            return False
            
        logger.info(f"🤖 Generating summary for session {session_id} ({len(full_text)} chars)")
        
        # Generate summary
        summary_result = await summarization_engine.generate_summary(full_text)
        if not summary_result:
            logger.warning(f"Failed to generate summary for session {session_id}")
            return False
            
        # Save summary to database
        success = await database.save_session_summary(session_id, summary_result)
        if success:
            logger.info(f"✅ Summary generated and saved for session {session_id}: '{summary_result['summary'][:100]}...'")
            
            # Broadcast summary completion to connected clients
            await broadcast_message({
                "type": "summary_generated",
                "session_id": session_id,
                "summary": summary_result['summary'],
                "compression_ratio": summary_result['compression_ratio']
            })
            
        return success
        
    except Exception as e:
        logger.error(f"Error generating summary for session {session_id}: {e}")
        return False

async def translate_session_content(session_id: str, target_language: str) -> bool:
    """Translate transcript and summary for a completed session"""
    global database, translation_engine
    
    if not database or not translation_engine or not translation_engine.is_initialized:
        logger.info("Translation skipped - translation engine not available")
        return False
    
    try:
        logger.info(f"🌐 Translating session {session_id} to {target_language} (allowing re-translation)")
        # Get session transcript
        transcript_data = await database.get_session_transcript(session_id)
        if not transcript_data:
            logger.warning(f"No transcript found for session {session_id}")
            return False
            
        full_text = transcript_data.get('full_text', '')
        if len(full_text.strip()) < 20:  # Too short to translate
            logger.info(f"Session {session_id} transcript too short for translation")
            return False
            
        # Get summary if available
        summary_data = await database.get_session_summary(session_id)
        summary_text = summary_data.get('summary') if summary_data else None
        logger.info(f"Retrieved summary data: exists={bool(summary_data)}, text_length={len(summary_text) if summary_text else 0}")
        
        # Generate translation
        translation_result = await translation_engine.translate_session_content(
            full_text, summary_text, target_language
        )
        if not translation_result or translation_result.get("error"):
            error_msg = translation_result.get("error") if translation_result else "unknown error"
            logger.warning(f"Failed to translate session {session_id} to {target_language}: {error_msg}")
            return False
            
        # Save translation to database
        success = await database.save_session_translation(session_id, target_language, translation_result)
        if success:
            logger.info(f"✅ Translation generated and saved for session {session_id} to {target_language}")
            logger.info(f"Transcript translation: {len(translation_result['translated_transcript'])} chars")
            logger.info(f"Summary translation: {len(translation_result.get('translated_summary') or '') if translation_result.get('translated_summary') else 'None'} chars")
            
            # Broadcast translation completion to connected clients
            await broadcast_message({
                "type": "translation_generated",
                "session_id": session_id,
                "target_language": target_language,
                "translated_transcript": translation_result['translated_transcript'][:100] + "..." if len(translation_result['translated_transcript']) > 100 else translation_result['translated_transcript'],
                "translated_summary": translation_result.get('translated_summary')
            })
            
        return success
        
    except Exception as e:
        logger.error(f"Error translating session {session_id} to {target_language}: {e}")
        return False

# All legacy backend recording code removed - now using efficient frontend VAD

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "recording": is_recording,
        "connections": len(active_connections)
    }

@app.get("/models")
async def get_models():
    """Get available transcription models"""
    if transcription_engine:
        models = await transcription_engine.get_available_models()
        return {"models": models}
    return {"models": []}

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="127.0.0.1",
        port=8888,
        log_level="info",
        reload=False
    )