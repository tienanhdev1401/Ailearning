FROM python:3.10-slim

WORKDIR /app

# system deps for audio processing if needed
RUN apt-get update && apt-get install -y ffmpeg libsndfile1 && rm -rf /var/lib/apt/lists/*

COPY requirements.txt /app/
RUN pip install --no-cache-dir -r requirements.txt

COPY . /app

EXPOSE 5002

CMD ["uvicorn", "server:app", "--host", "0.0.0.0", "--port", "5005"]
