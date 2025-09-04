# EchoTap

**Local real-time transcription with beautiful UI**

_Captions for anything. Locally._

EchoTap is a desktop application that provides real-time speech-to-text transcription using local AI models. No cloud dependencies, complete privacy, and beautiful design inspired by modern macOS interfaces.

## ✨ Features

- **🎯 Real-time Transcription**: Stream live captions from system audio or microphone
- **🔒 Completely Local**: All processing happens on your device - no internet required
- **🎨 Beautiful UI**: Elegant capsule interface with light/dark themes
- **📱 Always-on-top**: Floating bar that stays visible over other applications
- **🗃️ Archive & Search**: Full-text search across all your transcription sessions
- **🌍 Multilingual**: Auto-detect or manually specify language
- **⚡ High Performance**: Optimized for real-time processing with minimal CPU usage
- **🎛️ Customizable**: Adjustable models, shortcuts, and interface preferences

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+ and npm
- **Python** 3.8+ with pip
- **Git**

### Installation

```bash
# Clone the repository
git clone https://github.com/your-org/echotap.git
cd echotap

# Install dependencies (both frontend and backend)
npm run setup

# Start development server
npm run dev
```

The app will launch with the backend server running on port 8888.

### System Audio Setup

**macOS**: Install [BlackHole 2ch](https://github.com/ExistentialAudio/BlackHole) for system audio capture:

```bash
brew install blackhole-2ch
```

**Windows**: System audio capture uses WASAPI loopback (built-in).

**Linux**: System audio capture uses PulseAudio monitor sources.

## 🏗️ Architecture

### Frontend (Electron + Vue.js)

- **Electron**: Cross-platform desktop app framework
- **Vue 3**: Reactive UI with Composition API
- **Pinia**: State management
- **Native styling**: Platform-aware design system

### Backend (Python + FastAPI)

- **FastAPI**: High-performance async web framework
- **faster-whisper**: Optimized Whisper implementation with CTranslate2
- **SQLite**: Local database with full-text search
- **WebSocket**: Real-time communication with frontend

### Key Components

```
src/
├── main/              # Electron main process
├── renderer/          # Vue.js frontend
│   ├── components/    # UI components
│   ├── stores/        # Pinia stores
│   └── composables/   # Vue composables
└── assets/           # Static assets

backend/
├── main.py           # FastAPI server
├── audio_capture.py  # Cross-platform audio input
├── transcription_engine.py  # Whisper integration
├── database.py       # SQLite with FTS
└── models.py         # Pydantic data models
```

## 🎮 Usage

### Basic Operation

1. **Launch EchoTap** - The capsule bar appears at the top of your screen
2. **Choose Source** - Click the microphone icon to toggle between system audio and microphone
3. **Start Recording** - Click the play button or press `Alt+Shift+S`
4. **View Live Transcript** - Text appears in real-time as audio is processed
5. **Access Archive** - Click the archive icon to search past sessions

### Keyboard Shortcuts

- **Alt+Shift+S**: Start/stop recording
- **Alt+Shift+C**: Copy current transcript
- **Alt+Shift+O**: Toggle overlay captions
- **Cmd/Ctrl+Y**: Open archive

### Models

EchoTap includes several Whisper models with different trade-offs:

- **tiny** (39 MB): Fastest, good for quick notes
- **base** (74 MB): **Recommended** - balanced speed and accuracy
- **small** (244 MB): Better accuracy for important content
- **medium** (769 MB): Best accuracy for professional use

Models are downloaded automatically on first use and cached locally.

## 🔧 Development

### Development Setup

```bash
# Install dependencies
npm install
cd backend && pip install -r requirements.txt

# Start development mode (hot reload)
npm run dev

# Run frontend only
npm run dev:electron

# Run backend only
npm run dev:backend
```

### Building for Production

```bash
# Build renderer (Vue.js)
npm run build:renderer

# Package app for current platform
npm run build

# Outputs will be in dist/
```

### Platform-Specific Builds

```bash
# macOS (requires macOS)
electron-builder --mac

# Windows (requires Windows or Wine)
electron-builder --win

# Linux
electron-builder --linux
```

## 📁 Project Structure

### Frontend Architecture

- **CapsuleBar**: Main floating UI component
- **WaveformVisualization**: Real-time audio visualization
- **ArchiveModal**: Session browser with search
- **PreferencesModal**: Settings and configuration
- **OverlayCaption**: Resizable overlay text

### Backend Architecture

- **AudioCapture**: Cross-platform audio input handling
- **TranscriptionEngine**: Whisper model management and processing
- **DatabaseManager**: SQLite operations with full-text search
- **WebSocket Server**: Real-time frontend communication

### Data Flow

1. Audio captured from system/microphone
2. Chunked and processed through Whisper
3. Results streamed to frontend via WebSocket
4. Final transcripts saved to SQLite database
5. UI updates in real-time with live text

## ⚙️ Configuration

### User Preferences

- **Audio Source**: System audio vs microphone
- **Language**: Auto-detect or specify (50+ languages supported)
- **Model Size**: Tiny/Base/Small/Medium
- **VAD Sensitivity**: Voice activity detection threshold
- **Copy Behavior**: Current line vs last N minutes
- **Appearance**: Light/dark/system theme
- **Shortcuts**: Customizable global hotkeys

### Advanced Settings

- **Chunk Duration**: Audio processing window (default: 3s)
- **Overlap**: Chunk overlap for continuity (default: 0.5s)
- **Sample Rate**: Audio sample rate (16kHz recommended)
- **Compute Device**: CPU/GPU selection (auto-detected)

## 🐛 Troubleshooting

### Common Issues

**"No audio detected"**

- Check microphone permissions in system settings
- Ensure correct audio source is selected
- Verify audio levels in system mixer

**"Model download failed"**

- Check internet connection for initial download
- Clear model cache: Delete `~/.config/EchoTap/models/`
- Try smaller model first (tiny/base)

**"High CPU usage"**

- Switch to smaller model (base → tiny)
- Adjust VAD sensitivity in preferences
- Close other resource-intensive applications

**macOS system audio not working**

- Install BlackHole: `brew install blackhole-2ch`
- Set BlackHole as system output in Audio MIDI Setup
- Restart EchoTap after BlackHole installation

### Performance Tips

- **Use base model** for best speed/accuracy balance
- **Enable VAD** to reduce processing on silence
- **Close archive window** when not needed
- **Limit overlay caption length** for better performance

## 🔒 Privacy & Security

- **No telemetry**: Zero data collection by default
- **Local processing**: Audio never leaves your device
- **Offline operation**: Works completely without internet
- **Secure storage**: Transcripts stored in local SQLite database
- **Open source**: Full code transparency

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes
4. Run tests: `npm test`
5. Commit changes: `git commit -m 'Add amazing feature'`
6. Push to branch: `git push origin feature/amazing-feature`
7. Open a Pull Request

### Development Guidelines

- Follow existing code style and patterns
- Add tests for new features
- Update documentation as needed
- Test on multiple platforms when possible

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **OpenAI Whisper**: The foundation model for speech recognition
- **faster-whisper**: High-performance Whisper implementation
- **Electron**: Cross-platform desktop framework
- **Vue.js**: Progressive JavaScript framework
- **Design inspiration**: macOS Human Interface Guidelines

---

**Made with ❤️ for privacy-conscious users who need reliable, local transcription.**
