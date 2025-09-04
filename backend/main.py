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

# Audio capture now handled by frontend VAD
from transcription_engine import TranscriptionEngine
from database import DatabaseManager
from models import (
    TranscriptionMessage, 
    SessionData, 
    PreferencesUpdate,
    ModelInfo
)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Global state
active_connections: List[WebSocket] = []
transcription_engine: Optional[TranscriptionEngine] = None
database: Optional[DatabaseManager] = None
current_session_id: Optional[str] = None
current_session_transcript = ""  # Track current session transcript for live sync
is_recording = False  # Track recording state for frontend sync

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan management"""
    global transcription_engine, database
    
    # Startup
    logger.info("Starting EchoTap backend...")
    
    # Initialize database
    app_data_dir = get_app_data_dir()
    db_path = app_data_dir / "db" / "echotap.db"
    db_path.parent.mkdir(parents=True, exist_ok=True)
    
    database = DatabaseManager(str(db_path))
    await database.initialize()
    
    # Initialize transcription engine only
    transcription_engine = TranscriptionEngine()
    
    logger.info("EchoTap backend started successfully - audio handled by frontend")
    
    yield
    
    # Shutdown
    logger.info("Shutting down EchoTap backend...")
    
    if database:
        await database.close()
        
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
            
        logger.info(f"🎤 Received audio from frontend: {len(audio_data)} bytes")
        
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
        
        # Convert back to bytes
        audio_bytes = bytes(audio_data)
        
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
                
        elif message_type == "get_sessions":
            if database:
                sessions = await database.get_sessions()
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
        
        # Reset session ID but preserve transcript for transcription window access
        current_session_id = None
        # Keep current_session_transcript available for transcription window retrieval
        # It will be cleared when a new session starts
        
        await broadcast_message({
            "type": "recording_stopped",
            "session_id": session_id
        })
        
        logger.info(f"📴 Frontend recording stopped, session: {session_id}")

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