import io
from PIL import Image
import torch
from model import processor, model

PROMPT = "a detailed description of"

def predict(image_bytes: bytes) -> str:
    image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    inputs = processor(image, text=PROMPT, return_tensors="pt")

    with torch.no_grad():
        output = model.generate(
            **inputs,
            max_new_tokens=150,
            num_beams=5,
            length_penalty=1.5,
            repetition_penalty=2.0,
        )

    return processor.decode(output[0], skip_special_tokens=True)
