FROM python:3.10-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the service code
COPY . .

# Expose the port the FastAPI app runs on
EXPOSE 8003

# The command is overridden in docker-compose for worker/beat
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8003"]
