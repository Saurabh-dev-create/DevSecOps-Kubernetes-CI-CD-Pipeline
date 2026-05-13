# FROM python:3.9

# WORKDIR /app

# COPY . .

# RUN pip install flask

# USER root

# EXPOSE 5000

# CMD ["python","app.py"]

# Above Dockerfile is intentionall insecure to prove trivy working to check fail container

FROM python:3.9-slim

WORKDIR /app

COPY . .

# Upgrade packaging tools to secure versions

RUN pip install --no-cache-dir --upgrade pip setuptools wheel

# Install application dependency

RUN pip install --no-cache-dir flask

# Create a non-root user

RUN useradd -m appuser
USER appuser

EXPOSE 5000

CMD ["python", "app.py"]
