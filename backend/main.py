"""
EchoTap Backend - FastAPI server for local speech-to-text processing
"""
import asyncio
import json
import logging
import os
import sys
from datetime import datetime

os.environ["KMP_DUPLICATE_LIB_OK"] = "TRUE"
from contextlib import asynccontextmanager
from pathlib import Path
from typing import Dict, List, Optional

import uvicorn
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

# Audio capture imports
from audio_capture import AudioCapture
from transcription_engine import TranscriptionEngine
from summarization_engine import SummarizationEngine
from database import DatabaseManager
from models import (
    TranscriptionMessage, 
    SessionData, 
    PreferencesUpdate,
    ModelInfo,
    SummaryRequest,
    SummaryResponse,
    SessionSummaryData
)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Global state
active_connections: List[WebSocket] = []
audio_capture: Optional[AudioCapture] = None
transcription_engine: Optional[TranscriptionEngine] = None
summarization_engine: Optional[SummarizationEngine] = None
database: Optional[DatabaseManager] = None
current_session_id: Optional[str] = None
current_session_transcript = ""  # Track current session transcript for live sync
is_recording = False  # Track recording state for frontend sync
main_event_loop: Optional[asyncio.AbstractEventLoop] = None  # Store main loop reference

# Audio buffering for transcription
audio_buffer = bytearray()  # Accumulate audio chunks
last_transcription_time = 0  # Track when we last sent audio to transcription
MIN_AUDIO_DURATION = 1.0  # Minimum 1 second before transcription
SAMPLE_RATE = 16000  # Audio sample rate
is_speech_active = False  # Track if we're currently in a speech segment

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan management"""
    global transcription_engine, summarization_engine, database, audio_capture, main_event_loop
    
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
    
    # Initialize audio capture for backend recording
    audio_capture = AudioCapture()
    
    # Audio capture initialized but callback disabled - using VAD-based transcription
    # Backend will process complete speech segments from frontend VAD instead
    logger.info("✅ Audio capture ready for VAD-based transcription")
    
    logger.info("EchoTap backend started successfully with audio capture support")
    
    yield
    
    # Shutdown
    logger.info("Shutting down EchoTap backend...")
    
    if database:
        await database.close()
        
    if summarization_engine:
        summarization_engine.cleanup()
        
    logger.info("EchoTap backend shutdown complete")

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

# Waveform is now handled by frontend - no backend waveform loop needed

async def handle_start_recording(source: str = "microphone"):
    """Handle start recording request from frontend"""
    global is_recording, current_session_id, current_session_transcript, audio_capture
    global audio_buffer, last_transcription_time
    
    if is_recording:
        logger.info("Recording already in progress")
        return
    
    try:
        logger.info(f"🎬 Starting backend recording from {source}")
        
        # Clear audio buffer for new session
        audio_buffer.clear()
        last_transcription_time = 0
        current_session_transcript = ""
        
        # Create new session
        if database:
            session_data = SessionData(
                source=source,
                model=transcription_engine.get_current_model() if transcription_engine else "unknown"
            )
            current_session_id = await database.create_session(session_data)
            logger.info(f"🆔 Created new session: {current_session_id}")
        
        # Start audio capture
        if audio_capture:
            await audio_capture.start_recording()
            is_recording = True
            
            await broadcast_message({
                "type": "recording_started",
                "session_id": current_session_id
            })
            logger.info("✅ Backend recording started successfully")
        else:
            logger.error("❌ Audio capture not available")
            
    except Exception as e:
        logger.error(f"❌ Failed to start backend recording: {e}")

async def handle_stop_recording():
    """Handle stop recording request from frontend"""
    global is_recording, current_session_id, audio_capture
    global audio_buffer, last_transcription_time, SAMPLE_RATE
    
    if not is_recording:
        logger.info("No recording in progress")
        return
        
    try:
        logger.info("🛑 Stopping backend recording")
        
        # Process any remaining buffered audio before stopping
        if len(audio_buffer) > 0:
            buffered_audio = bytes(audio_buffer)
            buffer_duration = len(audio_buffer) / (SAMPLE_RATE * 2)
            logger.debug(f"Processing final buffered audio: {len(buffered_audio)} bytes ({buffer_duration:.2f}s)")
            await process_captured_audio(buffered_audio, SAMPLE_RATE, "microphone")
            audio_buffer.clear()
        
        # Stop audio capture
        if audio_capture:
            await audio_capture.stop_recording()
            
        is_recording = False
        session_id = current_session_id
        
        # Complete session in database
        if database and current_session_id:
            await database.complete_session(current_session_id)
            
            # Generate summary for the completed session
            await generate_session_summary(current_session_id)
        
        # Reset session ID
        current_session_id = None
        
        await broadcast_message({
            "type": "recording_stopped", 
            "session_id": session_id
        })
        
        logger.info(f"✅ Backend recording stopped, session: {session_id}")
        
    except Exception as e:
        logger.error(f"❌ Failed to stop backend recording: {e}")

async def handle_audio_callback(audio_data: bytes, sample_rate: int, source: str):
    """Handle audio data from audio capture system"""
    global transcription_engine, current_session_id, current_session_transcript, main_event_loop
    global audio_buffer, last_transcription_time, MIN_AUDIO_DURATION, SAMPLE_RATE
    
    if not is_recording or not current_session_id:
        return
    
    try:
        # Check if we're in the main event loop already
        try:
            current_loop = asyncio.get_running_loop()
            if current_loop == main_event_loop:
                # We're in the main loop, can call directly
                await buffer_and_process_audio(audio_data, sample_rate, source)
            else:
                # We're in a different loop, schedule in main loop
                if main_event_loop:
                    asyncio.run_coroutine_threadsafe(
                        buffer_and_process_audio(audio_data, sample_rate, source), 
                        main_event_loop
                    )
        except RuntimeError:
            # No current loop, schedule in main loop
            if main_event_loop:
                asyncio.run_coroutine_threadsafe(
                    buffer_and_process_audio(audio_data, sample_rate, source), 
                    main_event_loop
                )
    except Exception as e:
        logger.error(f"❌ Error in audio callback: {e}")

async def buffer_and_process_audio(audio_data: bytes, sample_rate: int, source: str):
    """Process audio directly - VAD already handles speech detection"""
    try:
        # Skip tiny audio chunks that are likely noise
        audio_duration = len(audio_data) / (sample_rate * 2)  # 2 bytes per sample (16-bit)
        
        if audio_duration < 0.5:  # Skip chunks smaller than 0.5 seconds
            return
            
        logger.debug(f"Processing audio chunk: {len(audio_data)} bytes ({audio_duration:.2f}s) from {source}")
        await process_captured_audio(audio_data, sample_rate, source)
                
    except Exception as e:
        logger.error(f"❌ Error in audio processing: {e}")

async def process_captured_audio(audio_data: bytes, sample_rate: int, source: str):
    """Process captured audio data through transcription engine"""
    global transcription_engine, current_session_id, current_session_transcript, database
    
    try:
        if not transcription_engine or not current_session_id:
            return
            
        # Process audio through transcription engine
        result = await transcription_engine.process_wav_audio(audio_data, sample_rate, source)
        
        if result and result.get("text", "").strip():
            # Send transcription result to frontend
            timestamp_str = datetime.now().isoformat()
            
            partial_message = {
                "type": "partial_transcript",
                "text": result["text"],
                "confidence": float(result.get("confidence", 0.0)),
                "is_final": False,
                "timestamp": timestamp_str,
                "source": source
            }
            
            final_message = {
                "type": "final_transcript", 
                "text": result["text"],
                "confidence": float(result.get("confidence", 0.0)),
                "is_final": True,
                "timestamp": timestamp_str,
                "source": source
            }
            
            # Update session transcript
            new_text = result["text"].strip()
            if new_text:
                # Simple append for backend recording (no overlap detection needed)
                current_session_transcript += " " + new_text
                logger.info(f"✅ Backend transcript: '{new_text[:50]}...'")
            
            await broadcast_message(partial_message)
            await broadcast_message(final_message)
            
            # Save to database
            if database and current_session_id:
                await database.add_transcript_segment(
                    session_id=current_session_id,
                    text=result["text"],
                    start_time=float(result.get("start_time", 0)),
                    end_time=float(result.get("end_time", 0)),
                    confidence=float(result.get("confidence", 0.0))
                )
                
    except Exception as e:
        logger.error(f"❌ Error processing captured audio: {e}")

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
            
        # Backend recording handlers removed - using VAD-based transcription
                
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
                
        elif message_type == "download_model":
            model_name = message.get("model")
            if transcription_engine and model_name:
                await transcription_engine.download_model(model_name, 
                    progress_callback=lambda p: asyncio.create_task(
                        websocket.send_text(json.dumps({
                            "type": "model_download_progress",
                            "model": model_name,
                            "progress": p
                        }))
                    )
                )
                
        elif message_type == "get_session_summary":
            session_id = message.get("session_id")
            if database and session_id:
                summary = await database.get_session_summary(session_id)
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

# Recording is now handled by frontend VAD - backend only processes transcription

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