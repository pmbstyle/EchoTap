"""
Database manager for EchoTap - SQLite with full-text search
"""
import sqlite3
import aiosqlite
import json
import uuid
from datetime import datetime
from typing import List, Dict, Optional, Any
from pathlib import Path

from models import SessionData, TranscriptSegment, SessionSummary, TranscriptionStats

class DatabaseManager:
    """Async SQLite database manager with full-text search"""
    
    def __init__(self, db_path: str):
        self.db_path = db_path
        self.db = None
        
    async def initialize(self):
        """Initialize database and create tables"""
        # Ensure directory exists
        Path(self.db_path).parent.mkdir(parents=True, exist_ok=True)
        
        self.db = await aiosqlite.connect(self.db_path)
        self.db.row_factory = aiosqlite.Row
        
        await self._create_tables()
        await self._create_indexes()
        
    async def close(self):
        """Close database connection"""
        if self.db:
            await self.db.close()
            
    async def _create_tables(self):
        """Create database tables"""
        
        # Sessions table
        await self.db.execute("""
            CREATE TABLE IF NOT EXISTS sessions (
                id TEXT PRIMARY KEY,
                source TEXT NOT NULL,
                model TEXT NOT NULL,
                language TEXT,
                created_at TIMESTAMP NOT NULL,
                completed_at TIMESTAMP,
                duration INTEGER,
                word_count INTEGER DEFAULT 0,
                average_confidence REAL DEFAULT 0.0,
                metadata TEXT
            )
        """)
        
        # Transcript segments table
        await self.db.execute("""
            CREATE TABLE IF NOT EXISTS transcript_segments (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                session_id TEXT NOT NULL,
                text TEXT NOT NULL,
                start_time REAL NOT NULL,
                end_time REAL NOT NULL,
                confidence REAL NOT NULL,
                created_at TIMESTAMP NOT NULL,
                FOREIGN KEY (session_id) REFERENCES sessions (id)
            )
        """)
        
        # Full-text search virtual table
        await self.db.execute("""
            CREATE VIRTUAL TABLE IF NOT EXISTS transcript_fts USING fts5(
                session_id,
                text,
                content='transcript_segments',
                content_rowid='id'
            )
        """)
        
        # User preferences table
        await self.db.execute("""
            CREATE TABLE IF NOT EXISTS preferences (
                key TEXT PRIMARY KEY,
                value TEXT NOT NULL,
                updated_at TIMESTAMP NOT NULL
            )
        """)
        
        # Model downloads table
        await self.db.execute("""
            CREATE TABLE IF NOT EXISTS downloaded_models (
                name TEXT PRIMARY KEY,
                path TEXT NOT NULL,
                size_bytes INTEGER,
                downloaded_at TIMESTAMP NOT NULL,
                last_used TIMESTAMP
            )
        """)
        
        await self.db.commit()
        
    async def _create_indexes(self):
        """Create database indexes for better performance"""
        
        indexes = [
            "CREATE INDEX IF NOT EXISTS idx_sessions_created_at ON sessions (created_at DESC)",
            "CREATE INDEX IF NOT EXISTS idx_sessions_source ON sessions (source)",
            "CREATE INDEX IF NOT EXISTS idx_transcript_session ON transcript_segments (session_id)",
            "CREATE INDEX IF NOT EXISTS idx_transcript_time ON transcript_segments (start_time, end_time)",
            "CREATE INDEX IF NOT EXISTS idx_models_last_used ON downloaded_models (last_used DESC)"
        ]
        
        for index_sql in indexes:
            await self.db.execute(index_sql)
            
        await self.db.commit()
        
    async def create_session(self, session_data: SessionData) -> str:
        """Create a new transcription session"""
        session_id = str(uuid.uuid4())
        
        await self.db.execute("""
            INSERT INTO sessions (
                id, source, model, language, created_at, metadata
            ) VALUES (?, ?, ?, ?, ?, ?)
        """, (
            session_id,
            session_data.source,
            session_data.model,
            session_data.language,
            session_data.created_at or datetime.now(),
            json.dumps({"version": "1.0"})
        ))
        
        await self.db.commit()
        return session_id
        
    async def complete_session(self, session_id: str, duration: Optional[int] = None):
        """Mark session as completed and calculate stats"""
        
        # Calculate duration if not provided
        if duration is None:
            cursor = await self.db.execute("""
                SELECT 
                    MIN(start_time) as min_time,
                    MAX(end_time) as max_time
                FROM transcript_segments
                WHERE session_id = ?
            """, (session_id,))
            
            result = await cursor.fetchone()
            if result and result['max_time'] and result['min_time']:
                duration = int(result['max_time'] - result['min_time'])
            else:
                duration = 0
                
        # Calculate word count and average confidence
        cursor = await self.db.execute("""
            SELECT 
                COUNT(*) as segment_count,
                AVG(confidence) as avg_confidence,
                SUM(LENGTH(text) - LENGTH(REPLACE(text, ' ', '')) + 1) as word_count
            FROM transcript_segments
            WHERE session_id = ?
        """, (session_id,))
        
        stats = await cursor.fetchone()
        word_count = stats['word_count'] or 0
        avg_confidence = stats['avg_confidence'] or 0.0
        
        # Update session
        await self.db.execute("""
            UPDATE sessions
            SET completed_at = ?, duration = ?, word_count = ?, average_confidence = ?
            WHERE id = ?
        """, (datetime.now(), duration, word_count, avg_confidence, session_id))
        
        await self.db.commit()
        
    async def add_transcript_segment(
        self, 
        session_id: str, 
        text: str, 
        start_time: float, 
        end_time: float, 
        confidence: float
    ):
        """Add a transcript segment to the database"""
        
        cursor = await self.db.execute("""
            INSERT INTO transcript_segments (
                session_id, text, start_time, end_time, confidence, created_at
            ) VALUES (?, ?, ?, ?, ?, ?)
        """, (session_id, text, start_time, end_time, confidence, datetime.now()))
        
        segment_id = cursor.lastrowid
        
        # Update FTS index
        await self.db.execute("""
            INSERT INTO transcript_fts (rowid, session_id, text)
            VALUES (?, ?, ?)
        """, (segment_id, session_id, text))
        
        await self.db.commit()
        
    async def get_sessions(self, limit: int = 100, offset: int = 0) -> List[Dict]:
        """Get list of sessions for archive view"""
        
        cursor = await self.db.execute("""
            SELECT 
                s.id,
                s.source,
                s.model,
                s.language,
                s.created_at,
                s.duration,
                s.word_count,
                s.average_confidence,
                (
                    SELECT text 
                    FROM transcript_segments ts 
                    WHERE ts.session_id = s.id 
                    ORDER BY start_time 
                    LIMIT 1
                ) as first_segment,
                (
                    SELECT COUNT(*) 
                    FROM transcript_segments ts 
                    WHERE ts.session_id = s.id
                ) as segment_count
            FROM sessions s
            WHERE s.completed_at IS NOT NULL
            ORDER BY s.created_at DESC
            LIMIT ? OFFSET ?
        """, (limit, offset))
        
        sessions = []
        async for row in cursor:
            # Create preview text
            preview = row['first_segment'] or ""
            if len(preview) > 100:
                preview = preview[:97] + "..."
                
            sessions.append({
                "id": row['id'],
                "created_at": row['created_at'],
                "source": row['source'],
                "duration": row['duration'] or 0,
                "model": row['model'],
                "preview": preview,
                "word_count": row['word_count'] or 0,
                "segment_count": row['segment_count'] or 0,
                "average_confidence": row['average_confidence'] or 0.0
            })
            
        return sessions
        
    async def get_session_transcript(self, session_id: str) -> Dict:
        """Get full transcript for a session"""
        
        # Get session info
        cursor = await self.db.execute("""
            SELECT * FROM sessions WHERE id = ?
        """, (session_id,))
        
        session = await cursor.fetchone()
        if not session:
            return None
            
        # Get transcript segments
        cursor = await self.db.execute("""
            SELECT text, start_time, end_time, confidence
            FROM transcript_segments
            WHERE session_id = ?
            ORDER BY start_time
        """, (session_id,))
        
        segments = []
        full_text = []
        
        async for row in cursor:
            segment = {
                "text": row['text'],
                "start_time": row['start_time'],
                "end_time": row['end_time'],
                "confidence": row['confidence']
            }
            segments.append(segment)
            full_text.append(row['text'])
            
        return {
            "session": dict(session),
            "segments": segments,
            "full_text": " ".join(full_text)
        }
        
    async def search_transcripts(self, query: str, limit: int = 50) -> List[Dict]:
        """Full-text search across all transcripts"""
        
        cursor = await self.db.execute("""
            SELECT 
                fts.session_id,
                fts.text,
                ts.start_time,
                ts.end_time,
                ts.confidence,
                s.created_at,
                s.source,
                s.model,
                bm25(fts) as rank
            FROM transcript_fts fts
            JOIN transcript_segments ts ON fts.rowid = ts.id
            JOIN sessions s ON fts.session_id = s.id
            WHERE transcript_fts MATCH ?
            ORDER BY rank
            LIMIT ?
        """, (query, limit))
        
        results = []
        async for row in cursor:
            results.append({
                "session_id": row['session_id'],
                "text": row['text'],
                "start_time": row['start_time'],
                "end_time": row['end_time'],
                "confidence": row['confidence'],
                "session_created_at": row['created_at'],
                "source": row['source'],
                "model": row['model'],
                "relevance_score": row['rank']
            })
            
        return results
        
    async def delete_session(self, session_id: str) -> bool:
        """Delete a session and all its transcript segments"""
        
        try:
            # Delete from FTS index first (referencing transcript_segments)
            await self.db.execute("""
                DELETE FROM transcript_fts 
                WHERE rowid IN (
                    SELECT id FROM transcript_segments WHERE session_id = ?
                )
            """, (session_id,))
            
            # Delete transcript segments
            await self.db.execute("""
                DELETE FROM transcript_segments WHERE session_id = ?
            """, (session_id,))
            
            # Delete session
            cursor = await self.db.execute("""
                DELETE FROM sessions WHERE id = ?
            """, (session_id,))
            
            await self.db.commit()
            
            # Check if session was actually deleted
            return cursor.rowcount > 0
            
        except Exception as e:
            await self.db.rollback()
            raise e
        
    async def get_transcription_stats(self) -> TranscriptionStats:
        """Get overall transcription statistics"""
        
        cursor = await self.db.execute("""
            SELECT 
                COUNT(*) as total_sessions,
                SUM(duration) as total_duration,
                SUM(word_count) as total_words,
                AVG(average_confidence) as avg_confidence
            FROM sessions
            WHERE completed_at IS NOT NULL
        """)
        
        stats = await cursor.fetchone()
        
        # Get most used language
        cursor = await self.db.execute("""
            SELECT language, COUNT(*) as count
            FROM sessions
            WHERE language IS NOT NULL AND completed_at IS NOT NULL
            GROUP BY language
            ORDER BY count DESC
            LIMIT 1
        """)
        
        lang_result = await cursor.fetchone()
        most_used_language = lang_result['language'] if lang_result else 'unknown'
        
        return TranscriptionStats(
            total_sessions=stats['total_sessions'] or 0,
            total_duration=stats['total_duration'] or 0,
            total_words=stats['total_words'] or 0,
            average_confidence=stats['avg_confidence'] or 0.0,
            most_used_language=most_used_language
        )
        
    async def export_session_transcript(self, session_id: str, format: str = "txt") -> str:
        """Export session transcript in specified format"""
        
        transcript_data = await self.get_session_transcript(session_id)
        if not transcript_data:
            return None
            
        session = transcript_data['session']
        segments = transcript_data['segments']
        
        if format == "txt":
            lines = [
                f"EchoTap Transcript",
                f"Session: {session['id']}",
                f"Date: {session['created_at']}",
                f"Source: {session['source']}",
                f"Model: {session['model']}",
                f"Duration: {session['duration']}s",
                "",
                transcript_data['full_text']
            ]
            return "\n".join(lines)
            
        elif format == "srt":
            # SRT subtitle format
            srt_lines = []
            for i, segment in enumerate(segments, 1):
                start_time = self._seconds_to_srt_time(segment['start_time'])
                end_time = self._seconds_to_srt_time(segment['end_time'])
                
                srt_lines.extend([
                    str(i),
                    f"{start_time} --> {end_time}",
                    segment['text'],
                    ""
                ])
                
            return "\n".join(srt_lines)
            
        elif format == "vtt":
            # WebVTT format
            vtt_lines = ["WEBVTT", ""]
            
            for segment in segments:
                start_time = self._seconds_to_vtt_time(segment['start_time'])
                end_time = self._seconds_to_vtt_time(segment['end_time'])
                
                vtt_lines.extend([
                    f"{start_time} --> {end_time}",
                    segment['text'],
                    ""
                ])
                
            return "\n".join(vtt_lines)
            
        return None
        
    def _seconds_to_srt_time(self, seconds: float) -> str:
        """Convert seconds to SRT time format"""
        hours = int(seconds // 3600)
        minutes = int((seconds % 3600) // 60)
        secs = int(seconds % 60)
        millis = int((seconds % 1) * 1000)
        return f"{hours:02d}:{minutes:02d}:{secs:02d},{millis:03d}"
        
    def _seconds_to_vtt_time(self, seconds: float) -> str:
        """Convert seconds to VTT time format"""
        minutes = int(seconds // 60)
        secs = seconds % 60
        return f"{minutes:02d}:{secs:06.3f}"