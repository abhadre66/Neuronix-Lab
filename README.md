# Neuronix Lab

A fully self-hosted, Dockerized ML training platform with real-time monitoring, experiment tracking, and job queuing. Submit training jobs from a web UI, watch live loss/accuracy charts update epoch by epoch, and compare experiments in MLflow — all running on your own machine.

---

## What it does

- Submit ML training jobs from a clean Next.js dashboard
- Train image classifiers (MLP, CNN, ResNet-18, MobileNet, EfficientNet) on MNIST / CIFAR-10
- Train text classifiers (BERT-Tiny, DistilBERT) on SST-2
- Train regression models (MLP Regressor) on custom CSV datasets
- Watch live loss and accuracy charts update every 5 seconds while training
- Track all experiments, metrics, and model artifacts in MLflow
- Monitor training metrics in real time via Prometheus + Grafana

---

## Architecture

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Next.js UI │────▶│  FastAPI    │────▶│    Redis    │
│  port 3000  │     │  port 8000  │     │  port 6379  │
└─────────────┘     └─────────────┘     └─────────────┘
                                               │
                                               ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   MLflow    │◀────│Celery Worker│◀────│   Worker 2  │
│  port 5001  │     │  (replica 1)│     │  (replica 2)│
└─────────────┘     └─────────────┘     └─────────────┘
       │
       ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│ PostgreSQL  │     │ Prometheus  │────▶│   Grafana   │
│  port 5432  │     │  port 9090  │     │  port 3001  │
└─────────────┘     └─────────────┘     └─────────────┘
```

---

## Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16, TypeScript, Tailwind CSS, Recharts |
| Backend | FastAPI, Uvicorn |
| Job Queue | Celery + Redis |
| ML Training | PyTorch, Torchvision, Hugging Face Transformers |
| Experiment Tracking | MLflow |
| Database | PostgreSQL |
| Monitoring | Prometheus + Grafana |
| Infrastructure | Docker Compose |

---

## Models

| Task | Models |
|------|--------|
| Image Classification | MLP, CNN, ResNet-18, MobileNet, EfficientNet |
| Text Classification | BERT-Tiny, DistilBERT |
| Regression | MLP Regressor |

---

## Getting Started

### Prerequisites

- Docker Desktop (≥ 8 GB RAM, ≥ 20 GB disk free)
- Git
- Node.js LTS

### Setup

1. **Clone the repo**
   ```bash
   git clone https://github.com/your-username/neuronix-lab.git
   cd neuronix-lab
   ```

2. **Create your `.env` file**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` and set your passwords:
   ```
   DB_PASSWORD=yourpassword
   GRAFANA_PASSWORD=yourpassword
   ```

3. **Start all containers**
   ```bash
   docker compose up --build
   ```
   First run takes 5–10 minutes (downloads PyTorch, ML models, etc.)

4. **Open the dashboard**

   | Service | URL |
   |---------|-----|
   | Neuronix Lab UI | http://localhost:3000 |
   | FastAPI Swagger | http://localhost:8000/docs |
   | MLflow UI | http://localhost:5001 |
   | Prometheus | http://localhost:9090 |
   | Grafana | http://localhost:3001 |

---

## Usage

### Submit a training job

1. Open `http://localhost:3000`
2. Select a model (e.g. `resnet18`)
3. Select a dataset (e.g. `cifar10`)
4. Set epochs and learning rate
5. Click **Submit Job**
6. Watch the live metrics chart update as training progresses

### Via API

```bash
curl -X POST http://localhost:8000/jobs \
  -H "Content-Type: application/json" \
  -d '{"model": "cnn", "dataset": "cifar10", "epochs": 5, "learning_rate": 0.001}'
```

### Stop all containers

```bash
docker compose down
```

---

## Project Structure

```
neuronix-lab/
├── api/                  # FastAPI backend
│   ├── Dockerfile
│   └── main.py
├── worker/               # Celery worker + PyTorch training
│   ├── Dockerfile
│   ├── tasks.py
│   └── models/
│       ├── image_classifier.py
│       ├── text_classifier.py
│       └── tabular_regressor.py
├── frontend/             # Next.js dashboard
│   ├── app/
│   ├── components/
│   └── lib/
├── mlflow/               # Custom MLflow image
├── monitoring/           # Prometheus + Grafana config
├── scripts/              # Data seeding scripts
├── docker-compose.yml
├── requirements.txt
└── .env.example
```

---

## Roadmap

- [ ] Model serving endpoint for inference
- [ ] Custom dataset upload via UI
- [ ] Custom model code upload via UI
- [ ] GPU support (Apple MPS / NVIDIA CUDA)
- [ ] Auto-retraining with Airflow
- [ ] Data drift detection with Evidently AI
- [ ] Experiment comparison page

---

## License

MIT
