FROM python:3.12-alpine AS dependencies

WORKDIR /app

RUN python -m venv /opt/venv

COPY requirements.txt .

RUN /opt/venv/bin/pip install --no-cache-dir -r requirements.txt


FROM python:3.12-alpine AS runtime

WORKDIR /app

RUN addgroup -S -g 10001 appgroup \
    && adduser -S -D -H -u 10001 -G appgroup appuser

COPY --from=dependencies /opt/venv /opt/venv

COPY app.py .

RUN chown -R appuser:appgroup /app /opt/venv

ENV PATH="/opt/venv/bin:$PATH"

USER appuser

EXPOSE 5000

CMD ["gunicorn", "--bind", "0.0.0.0:5000", "--workers", "2", "--threads", "2", "--access-logfile", "-", "app:app"]
