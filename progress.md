# Neuronix Lab — Project Progress

> AI Model Training Lab: A fully Dockerized ML platform with real-time monitoring, experiment tracking, and job queuing.
> Last updated: 2026-05-05 (Phase 1 completed)

---

## Legend

| Symbol | Meaning |
|--------|---------|
| `[ ]` | Not started |
| `[~]` | In progress |
| `[x]` | Completed |

---

## Phase 1 — Environment Setup & Prerequisites

**Goal:** Get all tools installed and the base project scaffold in place.

### Tools / Accounts / Sites to Use

| Tool / Site | What It Is | How to Use It | Where |
|-------------|-----------|---------------|-------|
| **Docker Desktop** | Runs all containers locally | Download installer, run it, verify with `docker compose version` in terminal | https://www.docker.com/products/docker-desktop |
| **Git** | Version control | Download installer; run `git --version` to confirm | https://git-scm.com/downloads |
| **Node.js + npm** | Required to scaffold the React frontend | Download LTS installer; run `node -v` and `npm -v` to confirm | https://nodejs.org |
| **VS Code** (recommended IDE) | Write and edit all project files | Install, open the project folder with `code .` | https://code.visualstudio.com |
| **Terminal / Shell** | Run all CLI commands | Use the built-in terminal on Mac/Linux or Git Bash on Windows | Local machine |
| **GitHub** (optional, recommended) | Host your repo for portfolio | Create a free account, create a new repo, push the project | https://github.com |

### Tasks

- [x] Install Docker Desktop (≥ 8 GB RAM, ≥ 20 GB disk free)
- [x] Install Git
- [x] Install Node.js LTS — v24.14.0 / npm v11.9.0
- [x] Create project folder structure (`frontend/`, `api/`, `worker/`, `monitoring/`, `scripts/`, `data/`)
- [x] Create `.env` file with `DB_PASSWORD` and `GRAFANA_PASSWORD`
- [x] Initialize React + Vite frontend (`npm create vite@latest`) — 136 packages installed, 0 vulnerabilities
- [x] Verify `docker compose version` works
- [x] (Optional) Create GitHub repo and push initial commit

**Status:** `[x]` Completed

---

## Phase 2 — Docker Compose Infrastructure

**Goal:** Get all 8 containers defined, wired, and booting together with a single command.

### Tools / Accounts / Sites to Use

| Tool / Site | What It Is | How to Use It | Where |
|-------------|-----------|---------------|-------|
| **Docker Compose** | Orchestrates all 8 containers | Edit `docker-compose.yml`; run `docker compose up --build` | Local terminal |
| **Docker Hub** | Source of pre-built images (postgres, redis, grafana, prometheus) | No account needed to pull; images are pulled automatically | https://hub.docker.com |
| **Docker Desktop Dashboard** | Visual UI to see container status, logs, resource usage | Open Docker Desktop app after running `docker compose up` | Local app |
| **PostgreSQL Docs** | Reference for healthcheck syntax and env vars | Read the `postgres:15` image docs for supported env variable names | https://hub.docker.com/_/postgres |
| **Redis Docs** | Reference for Redis image config | Check the `redis:7-alpine` image page | https://hub.docker.com/_/redis |
| **MLflow Docker image** | Pre-built MLflow server image | Use `ghcr.io/mlflow/mlflow:v2.10.0`; configure with `--backend-store-uri` | https://github.com/mlflow/mlflow/pkgs/container/mlflow |

### Tasks

- [x] Write `docker-compose.yml` with all services:
  - [x] PostgreSQL (port 5432) with health check
  - [x] Redis (port 6379)
  - [x] MLflow server (port 5001 on host, 5000 internal) backed by PostgreSQL
  - [x] FastAPI backend (port 8000)
  - [x] Celery worker (2 replicas)
  - [x] React frontend (port 3000)
  - [x] Prometheus (port 9090)
  - [x] Grafana (port 3001)
- [x] Define shared volumes: `postgres_data`, `mlflow_artifacts`, `grafana_data`
- [x] Run `docker compose up --build` — all containers healthy
- [x] Verify `docker compose ps` shows all services running
- [x] Open Docker Desktop dashboard and confirm no container is restarting

**Status:** `[x]` Completed

---

## Phase 3 — FastAPI Backend (`api/`)

**Goal:** REST API that accepts training job requests and queries experiment results from MLflow.

### Tools / Accounts / Sites to Use

| Tool / Site | What It Is | How to Use It | Where |
|-------------|-----------|---------------|-------|
| **FastAPI Docs** | Official framework docs and tutorial | Read "First Steps" and "Path Parameters" sections to understand routing | https://fastapi.tiangolo.com |
| **FastAPI Swagger UI** | Auto-generated interactive API explorer (built into FastAPI) | After starting the container, open in browser to test all endpoints manually | `http://localhost:8000/docs` |
| **Celery Docs** | Background job queue library | Read "First Steps with Celery" to understand how `send_task()` works | https://docs.celeryq.dev |
| **MLflow Tracking API** | Python API for logging and querying experiments | Read `MlflowClient` reference — `search_runs()`, `get_run()` | https://mlflow.org/docs/latest/python_api/mlflow.tracking.html |
| **PyPI** | Find and pin package versions for `requirements.txt` | Search package names, copy the exact version to pin | https://pypi.org |
| **Postman** (optional) | GUI tool to test API endpoints manually | Create a free account, import requests, test `POST /jobs` | https://www.postman.com |

### Tasks

- [x] Create `api/Dockerfile`
- [x] Create `api/requirements.txt` (fastapi, celery, mlflow, uvicorn)
- [x] Implement `api/main.py`:
  - [x] `POST /jobs` — validate input, enqueue to Redis via Celery, return `job_id`
  - [x] `GET /jobs` — list all MLflow runs
  - [x] `GET /jobs/{job_id}` — return single run metrics and params
- [x] Test all 3 endpoints via the Swagger UI at `http://localhost:8000/docs`
- [x] Test `POST /jobs` with `curl` and confirm `job_id` is returned

**Status:** `[x]` Completed

---

## Phase 4 — Celery Worker & PyTorch Training (`worker/`)

**Goal:** Worker picks jobs from Redis queue, runs model training, logs every metric to MLflow.

### Tools / Accounts / Sites to Use

| Tool / Site | What It Is | How to Use It | Where |
|-------------|-----------|---------------|-------|
| **PyTorch Docs** | Deep learning framework used for model training | Read "Training a Classifier" tutorial — covers DataLoader, optimizer, loss loop | https://pytorch.org/tutorials |
| **Torchvision Docs** | Datasets (MNIST, CIFAR-10) and pretrained models (ResNet-18) | See `torchvision.datasets` and `torchvision.models` pages | https://pytorch.org/vision/stable |
| **Hugging Face** | Source for BERT-Tiny pretrained model for text classification | Search `prajjwal1/bert-tiny`; download via `transformers` library | https://huggingface.co/prajjwal1/bert-tiny |
| **Celery Docs** | How to define and register tasks | Read "Tasks" section — `@celery_app.task(name=...)` decorator | https://docs.celeryq.dev/en/stable/userguide/tasks.html |
| **MLflow Tracking API** | Log params and metrics from inside the training loop | Use `mlflow.log_param()`, `mlflow.log_metric(step=epoch)`, `mlflow.pytorch.log_model()` | https://mlflow.org/docs/latest/python_api/mlflow.html |
| **MLflow UI** | Verify that logged metrics appear correctly after a training run | Open in browser after running a test job | `http://localhost:5000` |
| **MNIST / CIFAR-10** | Benchmark datasets downloaded automatically by torchvision | Call `datasets.MNIST(download=True)` or `datasets.CIFAR10(download=True)` in seed script | Downloaded to `./data/` by `scripts/seed_data.py` |

### Tasks

- [x] Create `worker/Dockerfile`
- [x] Create `requirements.txt` (shared — celery, torch, torchvision, mlflow, transformers)
- [x] Implement `worker/tasks.py` — `run_training_job()` Celery task:
  - [x] Connect to Redis broker
  - [x] Set MLflow tracking URI
  - [x] Log params (model, dataset, epochs, lr)
  - [x] Training loop: log `loss` and `accuracy` per epoch
  - [x] Save model artifact with `mlflow.pytorch.log_model()`
- [x] Implement model files:
  - [x] `worker/models/image_classifier.py` (MLP, CNN, ResNet-18, MobileNet, EfficientNet)
  - [x] `worker/models/text_classifier.py` (BERT-Tiny, DistilBERT)
  - [x] `worker/models/tabular_regressor.py` (MLP Regressor)
- [x] Write `scripts/seed_data.py` to download MNIST / CIFAR-10 into `./data/`
- [x] Submit a test job and confirm metrics appear in MLflow at `localhost:5001`

**Status:** `[x]` Completed

---

## Phase 5 — React Frontend (`frontend/`)

**Goal:** Web UI to submit training jobs and view live experiment status.

### Tools / Accounts / Sites to Use

| Tool / Site | What It Is | How to Use It | Where |
|-------------|-----------|---------------|-------|
| **Vite** | Fast React build tool and dev server | Scaffold with `npm create vite@latest`; run `npm run dev` locally | https://vitejs.dev |
| **React Docs** | Official React documentation | Read "Describing the UI" and "Adding Interactivity" sections | https://react.dev |
| **Recharts** (recommended) | Charting library for the live metrics chart | Install with `npm install recharts`; use `<LineChart>` for loss/accuracy curves | https://recharts.org |
| **Axios or Fetch API** | Make HTTP requests from the browser to FastAPI | Use native `fetch()` (no install) or `npm install axios` for cleaner syntax | Built-in / https://axios-http.com |
| **React DevTools** | Browser extension to inspect component state | Install for Chrome or Firefox; open via browser devtools panel | Chrome Web Store / Firefox Add-ons |
| **Browser** | Test and use the frontend | Open `localhost:3000` during development; submit jobs and watch the list update | `http://localhost:3000` |

### Tasks

- [x] Create `frontend/Dockerfile`
- [x] Install dependencies: `npm install recharts`
- [x] Implement `frontend/lib/api.ts` — all fetch calls to FastAPI
- [x] Implement components:
  - [x] `JobForm.tsx` — model selector, dataset selector, epochs slider, lr slider, Submit button
  - [x] `JobList.tsx` — table of all runs with status and final metrics, auto-refreshes every 10s
  - [x] `MetricsChart.tsx` — live chart polling `/jobs/{id}` for loss/accuracy every 5s
- [x] Wire everything in `app/page.tsx`
- [x] Verify job submission works end-to-end from browser at `localhost:3000`
- [x] Confirm `JobList` updates after job completes

**Status:** `[x]` Completed

---

## Phase 6 — Monitoring: Prometheus + Grafana

**Goal:** Live auto-refreshing dashboard showing training metrics in real time.

### Tools / Accounts / Sites to Use

| Tool / Site | What It Is | How to Use It | Where |
|-------------|-----------|---------------|-------|
| **Prometheus** | Metrics scraper — pulls data from all containers every 15 s | Configure `monitoring/prometheus.yml`; explore raw metrics at the Prometheus UI | `http://localhost:9090` |
| **Grafana** | Dashboard tool — visualizes Prometheus data as charts and gauges | Log in (admin/admin), add Prometheus data source, build panels | `http://localhost:3001` |
| **Grafana Docs — Dashboard JSON** | How to export/import dashboards as JSON for auto-provisioning | Read "Provisioning" docs; save dashboard JSON to `monitoring/grafana/dashboards/` | https://grafana.com/docs/grafana/latest/administration/provisioning |
| **PromQL Reference** | Query language used in Grafana panels to fetch metrics | Use the Prometheus UI expression browser to test queries before pasting into Grafana | https://prometheus.io/docs/prometheus/latest/querying/basics |
| **Prometheus Python Client** | Library to expose custom metrics from the worker container | Install `prometheus_client`; use `Gauge` and `Counter` in `tasks.py` | https://github.com/prometheus/client_python |
| **Grafana Dashboard Gallery** | Pre-built community dashboards for inspiration | Search for MLflow or Celery dashboards to adapt | https://grafana.com/grafana/dashboards |

### Tasks

- [ ] Write `monitoring/prometheus.yml` — scrape MLflow (`:5000`), worker (`:8001`), API (`:8000`) every 15 s
- [ ] Write `monitoring/grafana/datasources.yml` — point Grafana at Prometheus (`http://prometheus:9090`)
- [ ] Add `prometheus_client` to worker and expose a `/metrics` endpoint on port 8001
- [ ] Create Grafana dashboard JSON with panels:
  - [ ] Training Loss (line chart, per epoch)
  - [ ] Validation Accuracy (gauge)
  - [ ] Active Training Jobs (stat)
  - [ ] Jobs Queue Depth (stat)
  - [ ] Epoch Progress (bar gauge)
  - [ ] Experiment Comparison (multi-series line chart)
- [ ] Set dashboard auto-refresh to 5 seconds
- [ ] Export dashboard JSON and save to `monitoring/grafana/dashboards/training.json`
- [ ] Verify live updates at `localhost:3001` during a training run

**Status:** `[ ]` Not started

---

## Phase 7 — End-to-End Integration Testing

**Goal:** The complete pipeline works reliably without manual steps.

### Tools / Accounts / Sites to Use

| Tool / Site | What It Is | How to Use It | Where |
|-------------|-----------|---------------|-------|
| **curl** | Command-line HTTP client to test the API directly | Use `scripts/test_job.sh`; run `curl -X POST http://localhost:8000/jobs ...` | Terminal |
| **Docker Desktop Logs** | View logs from any container to debug failures | Click a container in Docker Desktop and open the Logs tab | Local Docker Desktop app |
| **MLflow Experiment UI** | Verify all runs logged correctly with right metrics | Browse experiment list, click a run, check params and metric history | `http://localhost:5000` |
| **Grafana Dashboard** | Visually confirm live metrics appear during training | Watch the Training Loss panel decrease in real time | `http://localhost:3001` |
| **Flower** (optional) | Celery task monitoring UI — shows queue depth and worker status | Add `flower` container to `docker-compose.yml`; open in browser | `http://localhost:5555` |

### Tasks

- [ ] `docker compose up --build` starts clean with no errors
- [ ] Submit a job via the React UI — job appears in MLflow
- [ ] Submit a job via `curl` (`scripts/test_job.sh`) — same result
- [ ] Grafana dashboard updates live during training
- [ ] Scale workers: `docker compose up --scale worker=4`, submit 4 jobs in parallel — all complete
- [ ] Run hyperparameter sweep (`scripts/hyperparameter_sweep.sh`) — 8 runs visible in MLflow
- [ ] Run `docker compose down -v` then `docker compose up --build` — confirm clean restart works

**Status:** `[ ]` Not started

---

## Phase 8 — Extensions (Optional / Portfolio Polish)

**Goal:** Elevate the project from "good" to "exceptional" for job applications.

### Tools / Accounts / Sites to Use

| Tool / Site | What It Is | How to Use It | Where |
|-------------|-----------|---------------|-------|
| **Apache Airflow** | Workflow scheduler for auto-retraining DAGs | Add Airflow container to `docker-compose.yml`; write a DAG in Python | https://airflow.apache.org/docs |
| **MLflow Model Registry** | Version and promote trained models (staging → production) | Use `mlflow.register_model()` and the Model Registry tab in the MLflow UI | `http://localhost:5000` → Models tab |
| **Evidently AI** | Open-source data drift and model monitoring library | Install `evidently`; generate drift reports by comparing new data to training data | https://docs.evidentlyai.com |
| **NVIDIA Container Toolkit** | Enables GPU passthrough into Docker containers | Follow install guide for your OS; add `deploy.resources.reservations.devices` to worker in compose | https://docs.nvidia.com/datacenter/cloud-native/container-toolkit |
| **Weights & Biases (W&B)** | Cloud-based experiment tracker (alternative / complement to MLflow) | Create a free account; swap `mlflow.log_metric()` calls with `wandb.log()` | https://wandb.ai |
| **Python `importlib`** | Standard library for dynamically loading user-uploaded model files | Use `importlib.util.spec_from_file_location()` in `worker/tasks.py` to import `.py` files at runtime | Built-in Python |
| **FastAPI File Upload** | Handles multipart file uploads from the browser | Use `UploadFile` type in FastAPI endpoint; save to `./data/` or `./worker/models/` | https://fastapi.tiangolo.com/tutorial/request-files |

### Tasks

- [ ] **Model Serving** — add `model-server` container (port 8080) that loads best MLflow model and serves predictions
- [ ] **Auto-Retraining Trigger** — Airflow DAG that runs daily; auto-promotes model if accuracy improves ≥ 2%
- [ ] **Experiment Comparison UI** — React page showing all runs side-by-side (accuracy, loss, training time)
- [ ] **GPU Support** — add `nvidia` device reservation to worker in `docker-compose.yml`
- [ ] **Data Drift Detection** — use Evidently to alert when incoming data distribution shifts
- [ ] **Custom Dataset Upload** — file upload input in `JobForm.jsx` → `POST /upload` in FastAPI saves CSV / image folder to `./data/` volume → worker auto-detects and loads it at training time
- [ ] **Custom Model Code Upload** — user uploads a `.py` file containing their model class → FastAPI saves to `./worker/models/` → worker uses `importlib` to dynamically import and run it inside the training loop

**Status:** `[ ]` Not started

---

## Summary Table

| Phase | Description | Status |
|-------|-------------|--------|
| 1 | Environment Setup & Prerequisites | `[x]` Completed |
| 2 | Docker Compose Infrastructure | `[x]` Completed |
| 3 | FastAPI Backend | `[x]` Completed |
| 4 | Celery Worker & PyTorch Training | `[x]` Completed |
| 5 | Next.js Frontend | `[x]` Completed |
| 6 | Prometheus + Grafana Monitoring | `[ ]` Not started |
| 7 | End-to-End Integration Testing | `[ ]` Not started |
| 8 | Extensions (Optional) | `[ ]` Not started |

---

## Notes / Blockers

> Add any blockers, decisions, or context here as the project progresses.

-
