FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
# Copy the root processar_faturas.py to /app/processar_faturas.py
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
