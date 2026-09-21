# TTS System

Text-to-Speech system powered by Next.js and Kokoro TTS with a Python FastAPI G2P service for Hindi.

## Prerequisites

- Node.js 18+
- Python 3.9+ with `espeak-ng` installed

## Quick Start

### 1. Python G2P Service

Install dependencies and start the G2P FastAPI server:

```bash
pip install -r requirements.txt
uvicorn python.g2p:app --host 0.0.0.0 --port 8000
```

### 2. Next.js Web Application

Start the web server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment Variables

- `HINDI_G2P_URL` (optional): URL of the deployed Python G2P service. Defaults to `http://127.0.0.1:8000/g2p`.
