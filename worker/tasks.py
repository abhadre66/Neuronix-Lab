import os
import mlflow
import mlflow.pytorch
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader, TensorDataset
import torchvision
import torchvision.transforms as transforms
from celery import Celery
from prometheus_client import Gauge, start_http_server

from models.image_classifier import get_model as get_image_model
from models.text_classifier import get_text_model, get_tokenizer
from models.tabular_regressor import get_model as get_regression_model

REDIS_URL = os.getenv("REDIS_URL", "redis://redis:6379/0")
MLFLOW_TRACKING_URI = os.getenv("MLFLOW_TRACKING_URI", "http://mlflow:5000")

celery_app = Celery("tasks", broker=REDIS_URL, backend=REDIS_URL)
mlflow.set_tracking_uri(MLFLOW_TRACKING_URI)

IMAGE_MODELS = {"mlp", "cnn", "resnet18", "mobilenet", "efficientnet"}
TEXT_MODELS = {"bert-tiny", "distilbert"}
REGRESSION_MODELS = {"mlp-regressor"}

training_loss = Gauge("training_loss", "Current training loss", ["job_id"])
training_accuracy = Gauge("training_accuracy", "Current training accuracy", ["job_id"])
active_jobs = Gauge("active_training_jobs", "Number of active training jobs")

try:
    start_http_server(8001)
except Exception:
    pass


def get_image_dataset(dataset_name: str):
    transform = transforms.Compose([
        transforms.Resize((32, 32)),
        transforms.ToTensor(),
        transforms.Normalize((0.5,), (0.5,)),
    ])
    data_dir = "/app/data"
    if dataset_name == "mnist":
        train = torchvision.datasets.MNIST(data_dir, train=True, download=True, transform=transforms.Compose([
            transforms.Resize((32, 32)),
            transforms.Grayscale(num_output_channels=3),
            transforms.ToTensor(),
            transforms.Normalize((0.5,), (0.5,)),
        ]))
        test = torchvision.datasets.MNIST(data_dir, train=False, download=True, transform=transforms.Compose([
            transforms.Resize((32, 32)),
            transforms.Grayscale(num_output_channels=3),
            transforms.ToTensor(),
            transforms.Normalize((0.5,), (0.5,)),
        ]))
    elif dataset_name == "cifar10":
        train = torchvision.datasets.CIFAR10(data_dir, train=True, download=True, transform=transform)
        test = torchvision.datasets.CIFAR10(data_dir, train=False, download=True, transform=transform)
    else:
        raise ValueError(f"Unknown image dataset: {dataset_name}")
    return train, test


def get_text_dataset(model_name: str, max_samples: int = 2000):
    from datasets import load_dataset
    tokenizer = get_tokenizer(model_name)
    dataset = load_dataset("sst2", trust_remote_code=True)
    train_data = dataset["train"].select(range(min(max_samples, len(dataset["train"]))))
    val_data = dataset["validation"]

    def tokenize(batch):
        return tokenizer(batch["sentence"], truncation=True, padding="max_length", max_length=128)

    train_data = train_data.map(tokenize, batched=True)
    val_data = val_data.map(tokenize, batched=True)

    train_data.set_format(type="torch", columns=["input_ids", "attention_mask", "label"])
    val_data.set_format(type="torch", columns=["input_ids", "attention_mask", "label"])
    return train_data, val_data


def train_image_model(model, train_dataset, test_dataset, epochs, lr, job_id):
    device = torch.device("cpu")
    model = model.to(device)
    train_loader = DataLoader(train_dataset, batch_size=64, shuffle=True, num_workers=0)
    test_loader = DataLoader(test_dataset, batch_size=64, shuffle=False, num_workers=0)
    criterion = nn.CrossEntropyLoss()
    optimizer = optim.Adam(model.parameters(), lr=lr)

    for epoch in range(epochs):
        model.train()
        total_loss, correct, total = 0.0, 0, 0
        for images, labels in train_loader:
            images, labels = images.to(device), labels.to(device)
            optimizer.zero_grad()
            outputs = model(images)
            loss = criterion(outputs, labels)
            loss.backward()
            optimizer.step()
            total_loss += loss.item() * images.size(0)
            _, predicted = outputs.max(1)
            correct += predicted.eq(labels).sum().item()
            total += labels.size(0)

        train_loss = total_loss / total
        train_acc = correct / total

        model.eval()
        val_loss, val_correct, val_total = 0.0, 0, 0
        with torch.no_grad():
            for images, labels in test_loader:
                images, labels = images.to(device), labels.to(device)
                outputs = model(images)
                loss = criterion(outputs, labels)
                val_loss += loss.item() * images.size(0)
                _, predicted = outputs.max(1)
                val_correct += predicted.eq(labels).sum().item()
                val_total += labels.size(0)

        val_loss = val_loss / val_total
        val_acc = val_correct / val_total

        mlflow.log_metric("train_loss", train_loss, step=epoch)
        mlflow.log_metric("train_accuracy", train_acc, step=epoch)
        mlflow.log_metric("val_loss", val_loss, step=epoch)
        mlflow.log_metric("val_accuracy", val_acc, step=epoch)

        training_loss.labels(job_id=job_id).set(train_loss)
        training_accuracy.labels(job_id=job_id).set(train_acc)

        print(f"Epoch {epoch+1}/{epochs} | loss={train_loss:.4f} acc={train_acc:.4f} | val_loss={val_loss:.4f} val_acc={val_acc:.4f}")

    return model


def train_text_model(model_name, epochs, lr, job_id):
    from torch.optim import AdamW
    device = torch.device("cpu")
    model = get_text_model(model_name)
    model = model.to(device)
    train_data, val_data = get_text_dataset(model_name)
    train_loader = DataLoader(train_data, batch_size=16, shuffle=True)
    val_loader = DataLoader(val_data, batch_size=16)
    optimizer = AdamW(model.parameters(), lr=lr)

    for epoch in range(epochs):
        model.train()
        total_loss, correct, total = 0.0, 0, 0
        for batch in train_loader:
            input_ids = batch["input_ids"].to(device)
            attention_mask = batch["attention_mask"].to(device)
            labels = batch["label"].to(device)
            optimizer.zero_grad()
            outputs = model(input_ids=input_ids, attention_mask=attention_mask, labels=labels)
            loss = outputs.loss
            loss.backward()
            optimizer.step()
            total_loss += loss.item()
            preds = outputs.logits.argmax(dim=-1)
            correct += (preds == labels).sum().item()
            total += labels.size(0)

        train_loss = total_loss / len(train_loader)
        train_acc = correct / total

        model.eval()
        val_correct, val_total = 0, 0
        with torch.no_grad():
            for batch in val_loader:
                input_ids = batch["input_ids"].to(device)
                attention_mask = batch["attention_mask"].to(device)
                labels = batch["label"].to(device)
                outputs = model(input_ids=input_ids, attention_mask=attention_mask)
                preds = outputs.logits.argmax(dim=-1)
                val_correct += (preds == labels).sum().item()
                val_total += labels.size(0)

        val_acc = val_correct / val_total

        mlflow.log_metric("train_loss", train_loss, step=epoch)
        mlflow.log_metric("train_accuracy", train_acc, step=epoch)
        mlflow.log_metric("val_accuracy", val_acc, step=epoch)

        training_loss.labels(job_id=job_id).set(train_loss)
        training_accuracy.labels(job_id=job_id).set(train_acc)

        print(f"Epoch {epoch+1}/{epochs} | loss={train_loss:.4f} acc={train_acc:.4f} | val_acc={val_acc:.4f}")

    return model


def train_regression_model(model_name, dataset_name, epochs, lr, job_id):
    import pandas as pd
    from sklearn.model_selection import train_test_split
    from sklearn.preprocessing import StandardScaler
    from sklearn.metrics import mean_absolute_error, r2_score
    import numpy as np

    data_path = f"/app/data/{dataset_name}.csv"
    df = pd.read_csv(data_path)
    target_col = df.columns[-1]
    X = df.drop(columns=[target_col]).values.astype("float32")
    y = df[target_col].values.astype("float32")

    scaler = StandardScaler()
    X = scaler.fit_transform(X)

    X_train, X_val, y_train, y_val = train_test_split(X, y, test_size=0.2, random_state=42)
    train_loader = DataLoader(TensorDataset(torch.tensor(X_train), torch.tensor(y_train)), batch_size=32, shuffle=True)
    val_loader = DataLoader(TensorDataset(torch.tensor(X_val), torch.tensor(y_val)), batch_size=32)

    device = torch.device("cpu")
    model = get_regression_model(input_dim=X.shape[1]).to(device)
    optimizer = optim.Adam(model.parameters(), lr=lr)
    criterion = nn.MSELoss()

    for epoch in range(epochs):
        model.train()
        total_loss = 0.0
        for X_batch, y_batch in train_loader:
            X_batch, y_batch = X_batch.to(device), y_batch.to(device)
            optimizer.zero_grad()
            preds = model(X_batch)
            loss = criterion(preds, y_batch)
            loss.backward()
            optimizer.step()
            total_loss += loss.item()

        train_loss = total_loss / len(train_loader)

        model.eval()
        all_preds, all_targets = [], []
        with torch.no_grad():
            for X_batch, y_batch in val_loader:
                preds = model(X_batch.to(device)).cpu().numpy()
                all_preds.extend(preds)
                all_targets.extend(y_batch.numpy())

        mae = mean_absolute_error(all_targets, all_preds)
        r2 = r2_score(all_targets, all_preds)

        mlflow.log_metric("train_loss", train_loss, step=epoch)
        mlflow.log_metric("mae", mae, step=epoch)
        mlflow.log_metric("r2_score", r2, step=epoch)

        training_loss.labels(job_id=job_id).set(train_loss)

        print(f"Epoch {epoch+1}/{epochs} | loss={train_loss:.4f} | mae={mae:.4f} | r2={r2:.4f}")

    return model


@celery_app.task(name="tasks.run_training_job")
def run_training_job(job_id, model, dataset, epochs, learning_rate):
    active_jobs.inc()
    try:
        with mlflow.start_run() as run:
            mlflow.set_tag("job_id", job_id)
            mlflow.log_param("model", model)
            mlflow.log_param("dataset", dataset)
            mlflow.log_param("epochs", epochs)
            mlflow.log_param("learning_rate", learning_rate)

            if model in IMAGE_MODELS:
                train_dataset, test_dataset = get_image_dataset(dataset)
                trained_model = train_image_model(
                    get_image_model(model), train_dataset, test_dataset, epochs, learning_rate, job_id
                )
                mlflow.pytorch.log_model(trained_model, "model")

            elif model in TEXT_MODELS:
                trained_model = train_text_model(model, epochs, learning_rate, job_id)
                mlflow.pytorch.log_model(trained_model, "model")

            elif model in REGRESSION_MODELS:
                trained_model = train_regression_model(model, dataset, epochs, learning_rate, job_id)
                mlflow.pytorch.log_model(trained_model, "model")

            else:
                raise ValueError(f"Unknown model: {model}")

            return {"job_id": job_id, "run_id": run.info.run_id, "status": "finished"}

    except Exception as e:
        mlflow.log_param("error", str(e))
        raise
    finally:
        active_jobs.dec()
        try:
            training_loss.remove(job_id)
            training_accuracy.remove(job_id)
        except KeyError:
            pass
