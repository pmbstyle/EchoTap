<p align="center">
<img width="50%" src="https://github.com/user-attachments/assets/630c284e-f642-48f5-b46e-11276dc3799c" />
</p>

## EchoTap (WORK IN PROGRESS)


Real-time desktop transcription app that converts speech from any audio source into text locally on your machine.

## What it does

EchoTap transcribes audio from any desktop source - system audio, microphone, or any application - into live text. Everything runs locally using the faster-whisper large-v3-turbo model with no external APIs or internet dependencies required.

## Setup

### Prerequisites

- Node.js 18+ and npm  
- Python 3.8+ with pip
- Git

### System Dependencies

**macOS:**
```bash
brew install portaudio
```

**Ubuntu/Debian:**
```bash
sudo apt-get update
sudo apt-get install portaudio19-dev python3-dev
```

**Windows:** No additional dependencies needed

### Installation

```bash
git clone https://github.com/pmbstyle/EchoTap
cd EchoTap
```

```bash
npm run setup
```

```bash
npm run dev
```

### GPU Acceleration (Optional, Recommended)

For **4-10x faster transcription**, install PyTorch with CUDA support:

```bash
# Navigate to backend directory
cd backend

# Install CUDA-enabled PyTorch (requires NVIDIA GPU)
pip install torch --index-url https://download.pytorch.org/whl/cu121

# Verify GPU is detected
python -c "import torch; print('CUDA available:', torch.cuda.is_available())"
```

**Note:** If you don't have an NVIDIA GPU, the app will automatically use CPU (slower but works fine).

### First Run

On first launch, EchoTap automatically downloads the faster-whisper large-v3-turbo model (~1.5GB). This enables completely offline transcription afterward.

## Usage

1. Click the microphone button in the floating bar to start transcribing
2. Audio from your system or microphone will be converted to text in real-time  
3. Click the transcript icon to view full transcription history
4. Click the archive icon to search through past sessions
