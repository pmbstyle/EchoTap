"""
Pydantic models for EchoTap backend
"""
from datetime import datetime
from typing import Dict, List, Optional, Any
from pydantic import BaseModel, Field

class TranscriptionMessage(BaseModel):
    """WebSocket message for transcription results"""
    type: str = Field(..., description="Message type")
    text: str = Field(..., description="Transcribed text")
    confidence: float = Field(0.0, ge=0.0, le=1.0, description="Confidence score")
    is_final: bool = Field(False, description="Whether this is a final result")
    timestamp: Optional[str] = Field(None, description="Timestamp of transcription")

class SessionData(BaseModel):
    """Data model for transcription sessions"""
    source: str = Field(..., description="Audio source (system/microphone)")
    model: str = Field(..., description="Transcription model used")
    language: Optional[str] = Field(None, description="Detected/specified language")
    created_at: Optional[datetime] = Field(default_factory=datetime.now)
    duration: Optional[int] = Field(None, description="Session duration in seconds")

class TranscriptSegment(BaseModel):
    """Individual transcript segment"""
    text: str = Field(..., description="Transcribed text")
    start_time: float = Field(..., description="Start time in seconds")
    end_time: float = Field(..., description="End time in seconds")
    confidence: float = Field(..., description="Confidence score")
    is_final: bool = Field(True, description="Whether this is final")

class PreferencesUpdate(BaseModel):
    """User preferences update model"""
    audio_source: Optional[str] = Field(None, description="Preferred audio source")
    language: Optional[str] = Field(None, description="Language preference")
    model: Optional[str] = Field(None, description="Transcription model")
    vad_sensitivity: Optional[int] = Field(None, ge=0, le=100)
    copy_mode: Optional[str] = Field(None, description="Copy behavior mode")
    copy_minutes: Optional[int] = Field(None, ge=1, le=30)

class ModelInfo(BaseModel):
    """Information about available transcription models"""
    name: str = Field(..., description="Model name")
    size: str = Field(..., description="Model size (e.g., '74 MB')")
    description: str = Field(..., description="Model description")
    downloaded: bool = Field(False, description="Whether model is downloaded")
    download_url: Optional[str] = Field(None, description="Download URL")

class AudioDeviceInfo(BaseModel):
    """Audio device information"""
    id: str = Field(..., description="Device ID")
    name: str = Field(..., description="Device name")
    type: str = Field(..., description="Device type (input/output)")
    is_default: bool = Field(False, description="Whether this is the default device")
    sample_rate: Optional[int] = Field(None, description="Supported sample rate")

class WaveformData(BaseModel):
    """Waveform visualization data"""
    amplitudes: List[float] = Field(..., description="Amplitude values")
    sample_rate: int = Field(..., description="Sample rate")
    timestamp: datetime = Field(default_factory=datetime.now)

class SessionSummary(BaseModel):
    """Summary information for archive display"""
    id: str = Field(..., description="Session ID")
    created_at: datetime = Field(..., description="Creation timestamp")
    source: str = Field(..., description="Audio source")
    duration: int = Field(..., description="Duration in seconds")
    model: str = Field(..., description="Model used")
    preview: str = Field(..., description="Preview text")
    word_count: int = Field(..., description="Total word count")

class TranscriptionStats(BaseModel):
    """Statistics about transcription performance"""
    total_sessions: int = Field(..., description="Total number of sessions")
    total_duration: int = Field(..., description="Total recording time in seconds")
    total_words: int = Field(..., description="Total words transcribed")
    average_confidence: float = Field(..., description="Average confidence score")
    most_used_language: str = Field(..., description="Most frequently detected language")

class SystemStatus(BaseModel):
    """System status information"""
    is_recording: bool = Field(..., description="Whether currently recording")
    current_source: str = Field(..., description="Current audio source")
    active_connections: int = Field(..., description="Number of active WebSocket connections")
    available_models: List[str] = Field(..., description="Available model names")
    cpu_usage: Optional[float] = Field(None, description="CPU usage percentage")
    memory_usage: Optional[float] = Field(None, description="Memory usage in MB")

class ErrorResponse(BaseModel):
    """Error response model"""
    type: str = Field("error", description="Message type")
    error: str = Field(..., description="Error message")
    code: Optional[str] = Field(None, description="Error code")
    details: Optional[Dict[str, Any]] = Field(None, description="Additional error details")

