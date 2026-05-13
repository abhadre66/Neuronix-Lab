import uuid
import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from pydantic import BaseModel
from celery import Celery
import mlflow
from mlflow.tracking import MlflowClient
from prometheus_client import Counter, generate_latest, CONTENT_TYPE_LATEST

jobs_submitted_total = Counter("jobs_submitted_total", "Total training jobs submitted")

app = FastAPI(title="Neuronix Lab API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

REDIS_URL = os.getenv("REDIS_URL", "redis://redis:6379/0")
MLFLOW_TRACKING_URI = os.getenv("MLFLOW_TRACKING_URI", "http://mlflow:5000")

celery_app = Celery("tasks", broker=REDIS_URL, backend=REDIS_URL)
mlflow.set_tracking_uri(MLFLOW_TRACKING_URI)
client = MlflowClient()


class JobRequest(BaseModel):
    model: str
    dataset: str
    epochs: int
    learning_rate: float


@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/metrics")
def metrics():
    return Response(generate_latest(), media_type=CONTENT_TYPE_LATEST)


@app.post("/jobs")
def submit_job(job: JobRequest):
    job_id = str(uuid.uuid4())
    celery_app.send_task(
        "tasks.run_training_job",
        kwargs={
            "job_id": job_id,
            "model": job.model,
            "dataset": job.dataset,
            "epochs": job.epochs,
            "learning_rate": job.learning_rate,
        },
    )
    jobs_submitted_total.inc()
    return {"job_id": job_id, "status": "queued"}


@app.get("/jobs")
def list_jobs():
    try:
        runs = client.search_runs(
            experiment_ids=["0"],
            order_by=["start_time DESC"],
        )
        return [
            {
                "job_id": run.data.tags.get("job_id", run.info.run_id),
                "run_id": run.info.run_id,
                "status": run.info.status,
                "model": run.data.params.get("model"),
                "dataset": run.data.params.get("dataset"),
                "epochs": run.data.params.get("epochs"),
                "learning_rate": run.data.params.get("learning_rate"),
                "metrics": run.data.metrics,
                "start_time": run.info.start_time,
                "end_time": run.info.end_time,
            }
            for run in runs
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/jobs/{job_id}")
def get_job(job_id: str):
    try:
        runs = client.search_runs(
            experiment_ids=["0"],
            filter_string=f"tags.job_id = '{job_id}'",
        )
        if not runs:
            raise HTTPException(status_code=404, detail="Job not found")

        run = runs[0]
        history = {}
        for metric_key in run.data.metrics:
            history[metric_key] = [
                {"step": m.step, "value": m.value}
                for m in client.get_metric_history(run.info.run_id, metric_key)
            ]

        return {
            "job_id": job_id,
            "run_id": run.info.run_id,
            "status": run.info.status,
            "params": run.data.params,
            "metrics": run.data.metrics,
            "metric_history": history,
            "start_time": run.info.start_time,
            "end_time": run.info.end_time,
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
