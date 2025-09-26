# Base image with Python
FROM python:3.11-slim

# Set workdir
WORKDIR /app

# Install system deps for torchaudio and common packages
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install
COPY requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir -r /app/requirements.txt

# Copy app
COPY . /app

# Expose port
EXPOSE 5005

# Run uvicorn on container start with recommended settings
CMD ["uvicorn", "server:app", "--host", "0.0.0.0", "--port", "5005", "--workers", "1"]
