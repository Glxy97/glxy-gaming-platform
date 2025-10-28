# ============================================
# = Web-Adobe FastAPI Service - Docker Image
# ============================================

FROM python:3.11-slim as base

# Set environment variables
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1 \
    DEBIAN_FRONTEND=noninteractive

WORKDIR /app

# === Stage 1: Dependencies ===
FROM base as deps

# Install system dependencies for PDF processing and OCR
RUN apt-get update && apt-get install -y --no-install-recommends \
    # Build tools
    gcc \
    g++ \
    make \
    # PDF processing (PyMuPDF dependencies)
    libmupdf-dev \
    mupdf-tools \
    # OCR (Tesseract)
    tesseract-ocr \
    tesseract-ocr-eng \
    tesseract-ocr-deu \
    # Image processing
    libjpeg-dev \
    libpng-dev \
    libtiff-dev \
    # PostgreSQL client
    libpq-dev \
    # Utilities
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements
COPY requirements.txt .

# Install Python dependencies
RUN pip install --upgrade pip && \
    pip install -r requirements.txt

# === Stage 2: Production ===
FROM base as runner

# Install runtime dependencies only (no build tools)
RUN apt-get update && apt-get install -y --no-install-recommends \
    # OCR runtime
    tesseract-ocr \
    tesseract-ocr-eng \
    tesseract-ocr-deu \
    # PDF runtime libraries
    mupdf-tools \
    # Image processing runtime
    libjpeg62-turbo \
    libpng16-16 \
    libtiff5 \
    # PostgreSQL runtime
    libpq5 \
    # Health check utility
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy dependencies from deps stage
COPY --from=deps /usr/local/lib/python3.11/site-packages /usr/local/lib/python3.11/site-packages
COPY --from=deps /usr/local/bin /usr/local/bin

# Create non-root user and directories
RUN useradd -m -u 1001 webadobe && \
    mkdir -p /app/var/storage /app/var/uploads /app/logs && \
    chown -R webadobe:webadobe /app

# Copy application code
COPY --chown=webadobe:webadobe . .

# Switch to non-root user
USER webadobe

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Start command (can be overridden for worker)
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "2"]
