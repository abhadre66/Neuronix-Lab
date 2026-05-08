from transformers import AutoTokenizer, AutoModelForSequenceClassification

MODELS = {
    "bert-tiny": "prajjwal1/bert-tiny",
    "distilbert": "distilbert-base-uncased",
}


def get_text_model(model_name: str = "bert-tiny", num_classes: int = 2):
    if model_name not in MODELS:
        raise ValueError(f"Unknown text model: {model_name}. Choose from {list(MODELS.keys())}")
    return AutoModelForSequenceClassification.from_pretrained(
        MODELS[model_name],
        num_labels=num_classes,
    )


def get_tokenizer(model_name: str = "bert-tiny"):
    if model_name not in MODELS:
        raise ValueError(f"Unknown text model: {model_name}. Choose from {list(MODELS.keys())}")
    return AutoTokenizer.from_pretrained(MODELS[model_name])
