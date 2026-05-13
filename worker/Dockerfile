FROM python:3.11-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    g++ \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir torch==2.2.2 torchvision==0.17.2 --index-url https://download.pytorch.org/whl/cpu
RUN pip install --no-cache-dir -r requirements.txt

COPY worker/ .

RUN mkdir -p /app/data /tmp/prometheus_multiproc

EXPOSE 8001

ENV PROMETHEUS_MULTIPROC_DIR=/tmp/prometheus_multiproc

CMD ["celery", "-A", "tasks", "worker", "--loglevel=info", "--pool=solo"]
