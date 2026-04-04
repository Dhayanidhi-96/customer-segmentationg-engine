FROM python:3.10-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Make sure the data and model directories exist logically
RUN mkdir -p /app/data/synthetic /app/app/ml/saved_models

# Copy source
COPY . .

# Expose API port
EXPOSE 8000

# Run FastAPI backend
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
