FROM python:3.12-slim

WORKDIR /app

RUN useradd --create-home --uid 10001 appuser

COPY requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt

COPY app.py .

RUN chown -R appuser:appuser /app

USER appuser

EXPOSE 5000

CMD ["gunicorn", "--bind", "0.0.0.0:5000", "--workers", "2", "--threads", "2", "--access-logfile", "-", "app:app"]
