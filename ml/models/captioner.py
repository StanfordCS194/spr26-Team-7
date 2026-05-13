from __future__ import annotations

from pathlib import Path

import torch
from PIL import Image
from transformers import BlipForConditionalGeneration, BlipProcessor

_MODEL_ID = "Salesforce/blip-image-captioning-base"
_LOCAL_PATH = Path(__file__).parent.parent / "weights" / "blip"

_processor: BlipProcessor | None = None
_model: BlipForConditionalGeneration | None = None


def _load() -> None:
    global _processor, _model
    if _model is None:
        source = str(_LOCAL_PATH) if _LOCAL_PATH.exists() else _MODEL_ID
        _processor = BlipProcessor.from_pretrained(source)
        _model = BlipForConditionalGeneration.from_pretrained(source)
        _model.eval()


def preload() -> None:
    _load()


def caption(image: Image.Image, prompt: str = "") -> str:
    _load()
    inputs = _processor(image, text=prompt or None, return_tensors="pt")
    with torch.no_grad():
        output = _model.generate(
            **inputs,
            max_new_tokens=100,
            num_beams=4,
            length_penalty=1.2,
            repetition_penalty=2.0,
        )
    return _processor.decode(output[0], skip_special_tokens=True)
