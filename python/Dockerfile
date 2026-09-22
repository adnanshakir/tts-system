FROM python:3.11-slim

# espeak-ng is required by misaki for phoneme generation
RUN apt-get update \
    && apt-get install -y --no-install-recommends espeak-ng \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY g2p.py .

# Render sets PORT env var (default 10000)
CMD ["sh", "-c", "uvicorn g2p:app --host 0.0.0.0 --port ${PORT:-10000}"]
