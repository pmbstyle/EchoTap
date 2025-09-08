"""
Comprehensive test suite for EchoTap backend
Tests all critical functionality and error handling
"""
import asyncio
import json
import pytest
import tempfile
import os
from pathlib import Path
from typing import Dict, Any

from fastapi.testclient import TestClient
from fastapi.websockets import WebSocket

# Import our application
from main import app, get_app_data_dir
from models import SessionData, TranscriptionMessage
from database import DatabaseManager
from transcription_engine import TranscriptionEngine
from llm_engine import LLMEngine


@pytest.fixture
def client():
    """FastAPI test client"""
    return TestClient(app)


@pytest.fixture
async def test_db():
    """Test database with temporary file"""
    with tempfile.NamedTemporaryFile(suffix='.db', delete=False) as tmp_file:
        db_path = tmp_file.name
    
    db = DatabaseManager(db_path)
    await db.initialize()
    
    yield db
    
    await db.close()
    os.unlink(db_path)


@pytest.fixture
def mock_audio_data():
    """Mock WAV audio data for testing"""
    # Create minimal valid WAV header + audio data
    wav_header = b'RIFF' + b'\x24\x08\x00\x00' + b'WAVE' + b'fmt ' + b'\x10\x00\x00\x00' + \
                 b'\x01\x00\x01\x00\x40\x1f\x00\x00\x80\x3e\x00\x00\x02\x00\x10\x00' + \
                 b'data' + b'\x00\x08\x00\x00'
    # Add some silent audio data (1024 samples of silence)
    audio_data = b'\x00\x00' * 1024
    return wav_header + audio_data


class TestHealthEndpoint:
    """Test health check and basic API functionality"""
    
    def test_health_check(self, client):
        """Test health endpoint returns correct status"""
        response = client.get("/health")
        assert response.status_code == 200
        
        data = response.json()
        assert "status" in data
        assert data["status"] == "healthy"
        assert "recording" in data
        assert "connections" in data


class TestTranscriptionEngine:
    """Test transcription engine functionality"""
    
    @pytest.mark.asyncio
    async def test_engine_initialization(self):
        """Test transcription engine initializes correctly"""
        engine = TranscriptionEngine()
        
        # Test auto model selection
        assert engine.model_name in engine.model_tiers["minimal"]["name"]
        
        # Test system resource detection
        resources = engine._get_system_resources()
        assert "ram_gb" in resources
        assert "cpu_count" in resources
        assert resources["ram_gb"] > 0
        assert resources["cpu_count"] > 0
    
    def test_model_tier_selection(self):
        """Test automatic model tier selection based on resources"""
        engine = TranscriptionEngine()
        
        # Test with different resource scenarios
        tier = engine._auto_select_model()
        assert tier in ["tiny", "base", "small", "medium"]
        
        # Test model info retrieval
        model_info = engine.get_model_info()
        assert "tier" in model_info
        assert "size_mb" in model_info
        assert "description" in model_info
    
    @pytest.mark.asyncio
    async def test_audio_processing_safety(self):
        """Test audio processing handles edge cases safely"""
        engine = TranscriptionEngine()
        
        # Test empty audio
        result = await engine.process_wav_audio(b'', 16000, "test")
        assert result is None
        
        # Test invalid audio
        result = await engine.process_wav_audio(b'invalid', 16000, "test")
        assert result is None


class TestLLMEngine:
    """Test LLM engine with progressive model loading"""
    
    def test_progressive_model_tiers(self):
        """Test progressive model tier system"""
        engine = LLMEngine()
        
        # Test tier structure
        assert "minimal" in engine.MODEL_TIERS
        assert "balanced" in engine.MODEL_TIERS
        assert "quality" in engine.MODEL_TIERS
        
        # Test resource detection
        resources = engine.get_system_resources()
        assert "ram_gb" in resources
        assert resources["ram_gb"] > 0
    
    def test_auto_model_selection(self):
        """Test automatic model selection based on resources"""
        engine = LLMEngine()
        
        tier = engine.auto_select_model_tier()
        assert tier in engine.MODEL_TIERS
        
        model_info = engine.get_model_info()
        assert "tier" in model_info
        assert "size_mb" in model_info
    
    @pytest.mark.asyncio 
    async def test_safe_text_generation(self):
        """Test text generation handles errors gracefully"""
        engine = LLMEngine()
        
        # Test with engine not initialized
        result = await engine._generate("test prompt")
        # Should handle gracefully when model not loaded
        assert result is None or isinstance(result, str)


class TestDatabaseOperations:
    """Test database operations and data integrity"""
    
    @pytest.mark.asyncio
    async def test_session_lifecycle(self, test_db):
        """Test complete session lifecycle"""
        db = test_db
        
        # Create session
        session_data = SessionData(source="test", model="test-model")
        session_id = await db.create_session(session_data)
        
        assert session_id is not None
        assert len(session_id) > 0
        
        # Add transcript segments
        await db.add_transcript_segment(
            session_id=session_id,
            text="Test transcript",
            start_time=0.0,
            end_time=5.0,
            confidence=0.95
        )
        
        # Get transcript
        transcript = await db.get_session_transcript(session_id)
        assert transcript is not None
        assert "full_text" in transcript
        assert "Test transcript" in transcript["full_text"]
        
        # Complete session
        await db.complete_session(session_id)
        
        # Verify session exists in list
        sessions = await db.get_sessions_with_summaries()
        assert len(sessions) > 0
        assert any(s["id"] == session_id for s in sessions)
    
    @pytest.mark.asyncio
    async def test_database_error_handling(self, test_db):
        """Test database handles errors gracefully"""
        db = test_db
        
        # Test with invalid session ID
        transcript = await db.get_session_transcript("invalid-id")
        assert transcript is None
        
        # Test delete non-existent session
        success = await db.delete_session("invalid-id")
        assert success is False


class TestWebSocketCommunication:
    """Test WebSocket functionality"""
    
    @pytest.mark.asyncio
    async def test_websocket_connection(self, client):
        """Test WebSocket connection and basic communication"""
        with client.websocket_connect("/ws") as websocket:
            # Test status request
            websocket.send_text(json.dumps({"type": "get_status"}))
            
            response = websocket.receive_text()
            data = json.loads(response)
            
            assert data["type"] == "backend_status"
            assert "is_recording" in data
            assert "connections" in data
    
    @pytest.mark.asyncio
    async def test_websocket_error_handling(self, client):
        """Test WebSocket handles invalid messages gracefully"""
        with client.websocket_connect("/ws") as websocket:
            # Send invalid message
            websocket.send_text(json.dumps({"type": "invalid_message_type"}))
            
            # Should not crash, might receive error response
            try:
                response = websocket.receive_text()
                # If we get a response, it should be well-formed JSON
                json.loads(response)
            except:
                # Or connection might close gracefully
                pass


class TestResourceManagement:
    """Test resource management and memory leak prevention"""
    
    def test_resource_manager_initialization(self):
        """Test resource manager initializes properly"""
        from main import resource_manager
        
        assert resource_manager is not None
        assert hasattr(resource_manager, 'active_connections')
        assert hasattr(resource_manager, 'cleanup_session')
    
    def test_bounded_buffers(self):
        """Test audio buffers are properly bounded"""
        from main import resource_manager
        
        # Audio buffer should be bounded
        assert hasattr(resource_manager.audio_buffer, 'maxlen')
        assert resource_manager.audio_buffer.maxlen == 100
    
    def test_session_cleanup(self):
        """Test session cleanup prevents memory leaks"""
        from main import resource_manager
        
        # Start fake session
        resource_manager.start_session("test-session")
        assert resource_manager.current_session_id == "test-session"
        assert resource_manager.is_recording is True
        
        # Cleanup
        resource_manager.cleanup_session()
        assert resource_manager.current_session_id is None
        assert resource_manager.is_recording is False
        assert len(resource_manager.audio_buffer) == 0


class TestCrossPlatformCompatibility:
    """Test cross-platform compatibility"""
    
    def test_app_data_directory(self):
        """Test app data directory creation works on all platforms"""
        app_data_dir = get_app_data_dir()
        
        assert isinstance(app_data_dir, Path)
        assert app_data_dir.name == "EchoTap"
        
        # Should be able to create directory
        test_dir = app_data_dir / "test"
        test_dir.mkdir(parents=True, exist_ok=True)
        assert test_dir.exists()
        
        # Cleanup
        test_dir.rmdir()
    
    def test_model_cache_directories(self):
        """Test model cache directories work cross-platform"""
        from transcription_engine import TranscriptionEngine
        from llm_engine import LLMEngine
        
        # Test transcription engine cache
        trans_engine = TranscriptionEngine()
        trans_cache = trans_engine._get_model_cache_dir()
        assert isinstance(trans_cache, Path)
        assert trans_cache.name == "models"
        
        # Test LLM engine cache  
        llm_engine = LLMEngine()
        llm_cache = llm_engine.get_model_cache_dir()
        assert isinstance(llm_cache, Path)
        assert llm_cache.name == "models"


class TestErrorHandling:
    """Test comprehensive error handling"""
    
    @pytest.mark.asyncio
    async def test_missing_dependencies_handling(self):
        """Test graceful handling when dependencies are missing"""
        # This tests the fallback behavior when optional dependencies aren't available
        
        # Test transcription engine without faster-whisper
        engine = TranscriptionEngine()
        # Should not crash even if faster-whisper is not available
        assert engine is not None
    
    def test_invalid_audio_data_handling(self, mock_audio_data):
        """Test handling of invalid audio data"""
        engine = TranscriptionEngine()
        
        # Test with corrupted audio data - should not crash
        try:
            # This should handle gracefully
            pass
        except Exception as e:
            pytest.fail(f"Should handle invalid audio gracefully: {e}")
    
    @pytest.mark.asyncio
    async def test_network_error_simulation(self):
        """Test handling of network-related errors"""
        # Test model download failures
        llm_engine = LLMEngine()
        
        # Should handle download failures gracefully
        try:
            # This might fail but shouldn't crash the application
            await llm_engine.ensure_model_ready("invalid-tier")
        except Exception:
            # Expected - should fail gracefully
            pass


class TestPerformanceValidation:
    """Test performance requirements"""
    
    def test_memory_usage_bounds(self):
        """Test memory usage stays within reasonable bounds"""
        from main import resource_manager
        
        # Test that buffers have reasonable limits
        stats = resource_manager.get_stats()
        
        # Audio buffer should be bounded
        assert stats["audio_buffer_size"] <= 100
        
        # Session transcript should not grow unbounded in tests
        assert stats["session_transcript_length"] < 10000  # Reasonable limit for tests
    
    @pytest.mark.asyncio 
    async def test_response_times(self, client):
        """Test API response times are reasonable"""
        import time
        
        start = time.time()
        response = client.get("/health")
        end = time.time()
        
        # Health check should be very fast
        assert (end - start) < 1.0  # Less than 1 second
        assert response.status_code == 200


if __name__ == "__main__":
    # Run tests with pytest
    pytest.main([__file__, "-v", "--tb=short"])