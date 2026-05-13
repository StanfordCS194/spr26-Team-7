from __future__ import annotations

from pathlib import Path

import torch
from PIL import Image
from transformers import CLIPModel, CLIPProcessor

_MODEL_ID = "openai/clip-vit-base-patch32"
_LOCAL_PATH = Path(__file__).parent.parent / "weights" / "clip"

_processor: CLIPProcessor | None = None
_model: CLIPModel | None = None


def _load() -> None:
    global _processor, _model
    if _model is None:
        source = str(_LOCAL_PATH) if _LOCAL_PATH.exists() else _MODEL_ID
        _processor = CLIPProcessor.from_pretrained(source)
        _model = CLIPModel.from_pretrained(source)
        _model.eval()


def preload() -> None:
    _load()


def clip_scores(image: Image.Image, texts: list[str]) -> list[float]:
    _load()
    inputs = _processor(text=texts, images=image, return_tensors="pt", padding=True)
    with torch.no_grad():
        logits = _model(**inputs).logits_per_image[0]
    return logits.softmax(dim=0).tolist()


def clip_label(image: Image.Image, options: dict[str, str]) -> tuple[str, float]:
    """Return the best-matching label and its probability."""
    labels = list(options.keys())
    probs = clip_scores(image, list(options.values()))
    best = max(range(len(probs)), key=lambda i: probs[i])
    return labels[best], probs[best]


def clip_bool(image: Image.Image, true_text: str, false_text: str) -> bool:
    probs = clip_scores(image, [true_text, false_text])
    return probs[0] > probs[1]


def clip_top_k(
    image: Image.Image, options: dict[str, str], k: int = 3
) -> list[tuple[str, float]]:
    labels = list(options.keys())
    probs = clip_scores(image, list(options.values()))
    ranked = sorted(zip(labels, probs), key=lambda x: x[1], reverse=True)
    return ranked[:k]
