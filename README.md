# EchoTap

Real-time desktop transcription app that converts speech from any audio source into text locally on your machine.

## What it does

EchoTap transcribes audio from any desktop source - system audio, microphone, or any application - into live text. Everything runs locally using the faster-whisper large-v3-turbo model with no external APIs or internet dependencies required.

## Setup

### Prerequisites

- Node.js 18+ and npm  
- Python 3.8+ with pip
- Git

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

### First Run

On first launch, EchoTap automatically downloads the faster-whisper large-v3-turbo model (~1.5GB). This enables completely offline transcription afterward.

## Usage

1. Click the microphone button in the floating bar to start transcribing
2. Audio from your system or microphone will be converted to text in real-time  
3. Click the transcript icon to view full transcription history
4. Click the archive icon to search through past sessions