# Stage 1: Dependency Builder
FROM python:3.9-slim as builder

WORKDIR /build

COPY requirements.txt .

# Install CPU version of torch specifically to save memory and space
RUN pip install --no-cache-dir "torch>=2.6.0" --extra-index-url https://download.pytorch.org/whl/cpu

# Install remaining dependencies, filtering out torch to avoid conflicts
RUN grep -v "torch" requirements.txt > requirements-docker.txt && \
    pip install --no-cache-dir -r requirements-docker.txt && \
    rm requirements-docker.txt

# Stage 2: Final Runtime Image
FROM python:3.9-slim

# Install system dependencies required for runtime (ffmpeg for Whisper, git for some HF models)
RUN apt-get update && apt-get install -y \
    ffmpeg \
    libsm6 \
    libxext6 \
    git \
 && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy installed python packages from builder
COPY --from=builder /usr/local/lib/python3.9/site-packages /usr/local/lib/python3.9/site-packages
COPY --from=builder /usr/local/bin /usr/local/bin

# Copy pre-downloaded model caches from builder
COPY --from=builder /root/.cache /root/.cache

# Copy application source code
COPY . .

EXPOSE 7860

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "7860"]
