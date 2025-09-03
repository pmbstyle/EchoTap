"""
EchoTap Backend - FastAPI server for local speech-to-text processing
"""
import asyncio
import json
import logging
import os
import sys

# Fix OpenMP library conflict issue
os.environ["KMP_DUPLICATE_LIB_OK"] = "TRUE"
from contextlib import asynccontextmanager
from pathlib import Path
from typing import Dict, List, Optional

import uvicorn
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

from audio_capture import AudioCapture
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
audio_capture: Optional[AudioCapture] = None
transcription_engine: Optional[TranscriptionEngine] = None
database: Optional[DatabaseManager] = None
current_session_id: Optional[str] = None
is_recording = False
current_session_transcript = ""  # Track current session transcript for live sync

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan management"""
    global audio_capture, transcription_engine, database
    
    # Startup
    logger.info("Starting EchoTap backend...")
    
    # Initialize database
    app_data_dir = get_app_data_dir()
    db_path = app_data_dir / "db" / "echotap.db"
    db_path.parent.mkdir(parents=True, exist_ok=True)
    
    database = DatabaseManager(str(db_path))
    await database.initialize()
    
    # Initialize audio capture
    audio_capture = AudioCapture()
    
    # Initialize transcription engine
    transcription_engine = TranscriptionEngine()
    
    # Set up audio processing pipeline
    audio_capture.set_audio_callback(audio_callback)
    
    logger.info("EchoTap backend started successfully")
    
    yield
    
    # Shutdown
    logger.info("Shutting down EchoTap backend...")
    
    if audio_capture:
        await audio_capture.stop_recording()
    
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

async def audio_callback(audio_data: bytes, sample_rate: int, source: str = "unknown"):
    """Process audio data and send to transcription"""
    global current_session_transcript
    if not is_recording or not transcription_engine:
        return
    
    logger.debug(f"🎵 Received audio from {source}: {len(audio_data)} bytes, {sample_rate}Hz")
    
    try:
        # Process audio through transcription engine
        result = await transcription_engine.process_audio_chunk(
            audio_data, sample_rate, current_session_id, source
        )
        
        if result:
            logger.info(f"🔊 Got transcription from {source}: '{result['text']}'")
            
            # Update current session transcript for live sync
            # Only add new text if it's not a duplicate and contains actual content
            new_text = result["text"].strip()
            if new_text and (not current_session_transcript or new_text not in current_session_transcript):
                if current_session_transcript:
                    current_session_transcript += " " + new_text
                else:
                    current_session_transcript = new_text
                logger.debug(f"📋 Updated session transcript: {len(current_session_transcript)} chars")
            
            # Send transcription to all connected clients with source information
            # Convert timestamp to string if it exists
            timestamp_str = result.get("timestamp")
            if timestamp_str and not isinstance(timestamp_str, str):
                timestamp_str = str(timestamp_str)
                
            message = TranscriptionMessage(
                type=result["type"],
                text=result["text"],
                confidence=float(result.get("confidence", 0.0)),
                is_final=result.get("is_final", False),
                timestamp=timestamp_str
            )
            
            # Add source information to the message
            message_dict = message.dict()
            message_dict["source"] = source
            
            await broadcast_message(message_dict)
            
            # Save to database - save both partial and final results
            # We'll save all transcription chunks to build up the complete transcript
            if database and current_session_id and result.get("text", "").strip():
                await database.add_transcript_segment(
                    session_id=current_session_id,
                    text=result["text"],
                    start_time=float(result.get("start_time", 0)),
                    end_time=float(result.get("end_time", 0)),
                    confidence=float(result.get("confidence", 0.0))
                )
        
        # Send waveform data
        waveform_data = audio_capture.get_waveform_data()
        await broadcast_message({
            "type": "waveform_data",
            "data": waveform_data
        })
        
    except Exception as e:
        logger.error(f"Error processing audio: {e}")

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
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
    finally:
        if websocket in active_connections:
            active_connections.remove(websocket)
        logger.info(f"Client removed. Total connections: {len(active_connections)}")

async def handle_websocket_message(websocket: WebSocket, message: Dict):
    """Handle incoming WebSocket messages"""
    global is_recording, current_session_id
    
    message_type = message.get("type")
    
    try:
        if message_type == "start_recording":
            await start_recording()
            
        elif message_type == "stop_recording":
            await stop_recording()
            
        elif message_type == "toggle_recording":
            if is_recording:
                await stop_recording()
            else:
                await start_recording()
                
        elif message_type == "toggle_source":
            if audio_capture:
                await audio_capture.toggle_source()
                source = audio_capture.get_current_source()
                await websocket.send_text(json.dumps({
                    "type": "source_changed",
                    "source": source
                }))
                
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
                if audio_capture:
                    await audio_capture.update_preferences(preferences)
                    
        elif message_type == "get_models":
            if transcription_engine:
                models = await transcription_engine.get_available_models()
                await websocket.send_text(json.dumps({
                    "type": "available_models",
                    "models": models
                }))
                
        elif message_type == "get_status":
            # Send current backend status to sync frontend state
            current_source = audio_capture.get_current_source() if audio_capture else "none"
            current_model = transcription_engine.get_current_model() if transcription_engine else "unknown"
            
            # Use the live accumulated session transcript
            status_response = {
                "type": "backend_status",
                "is_recording": is_recording,
                "current_session_id": current_session_id,
                "audio_source": current_source,
                "model": current_model,
                "connections": len(active_connections),
                "current_transcript": current_session_transcript
            }
            
            await websocket.send_text(json.dumps(status_response))
            logger.info(f"📊 Status queried: recording={is_recording}, session={current_session_id}, source={current_source}, transcript_chars={len(current_session_transcript)}")
                
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

async def start_recording():
    """Start audio recording and transcription"""
    global is_recording, current_session_id, current_session_transcript
    
    if is_recording:
        return
    
    try:
        # Clear previous session transcript
        current_session_transcript = ""
        
        # Create new session
        if database:
            current_source = audio_capture.get_current_source() if audio_capture else "unknown"
            # If source is "none", default to "microphone" for now
            if current_source == "none":
                current_source = "microphone"
                
            session_data = SessionData(
                source=current_source,
                model=transcription_engine.get_current_model() if transcription_engine else "unknown"
            )
            current_session_id = await database.create_session(session_data)
        
        # Start audio capture
        if audio_capture:
            await audio_capture.start_recording()
        
        # Start transcription engine
        if transcription_engine:
            await transcription_engine.start_session(current_session_id)
        
        is_recording = True
        await broadcast_message({
            "type": "recording_started",
            "session_id": current_session_id
        })
        
        logger.info(f"Recording started. Session ID: {current_session_id}")
        
    except Exception as e:
        logger.error(f"Error starting recording: {e}")
        await broadcast_message({
            "type": "error",
            "error": f"Failed to start recording: {str(e)}"
        })

async def stop_recording():
    """Stop audio recording and transcription"""
    global is_recording, current_session_id, current_session_transcript
    
    if not is_recording:
        return
    
    try:
        # Stop audio capture
        if audio_capture:
            await audio_capture.stop_recording()
        
        # Stop transcription engine
        if transcription_engine:
            await transcription_engine.end_session(current_session_id)
        
        # Update session in database
        if database and current_session_id:
            await database.complete_session(current_session_id)
        
        is_recording = False
        session_id = current_session_id
        current_session_id = None
        current_session_transcript = ""  # Clear session transcript
        
        await broadcast_message({
            "type": "recording_stopped",
            "session_id": session_id
        })
        
        logger.info(f"Recording stopped. Session ID: {session_id}")
        
    except Exception as e:
        logger.error(f"Error stopping recording: {e}")
        await broadcast_message({
            "type": "error", 
            "error": f"Failed to stop recording: {str(e)}"
        })

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