"""
Run once to download and cache model weights locally:

    cd ml
    python scripts/download_models.py

Weights are saved to ml/weights/ and are gitignored.
After running this, the server loads from disk instead of the network.
"""

from pathlib import Path

from transformers import (
    BlipForConditionalGeneration,
    BlipProcessor,
    CLIPModel,
    CLIPProcessor,
)

WEIGHTS_DIR = Path(__file__).parent.parent / "weights"


def download_clip() -> None:
    model_id = "openai/clip-vit-base-patch32"
    dest = WEIGHTS_DIR / "clip"
    print(f"Downloading CLIP ({model_id}) → {dest}")
    CLIPProcessor.from_pretrained(model_id).save_pretrained(dest)
    CLIPModel.from_pretrained(model_id).save_pretrained(dest)
    print("CLIP saved.\n")


def download_blip() -> None:
    model_id = "Salesforce/blip-image-captioning-base"
    dest = WEIGHTS_DIR / "blip"
    print(f"Downloading BLIP ({model_id}) → {dest}")
    BlipProcessor.from_pretrained(model_id).save_pretrained(dest)
    BlipForConditionalGeneration.from_pretrained(model_id).save_pretrained(dest)
    print("BLIP saved.\n")


if __name__ == "__main__":
    WEIGHTS_DIR.mkdir(parents=True, exist_ok=True)
    download_clip()
    download_blip()
    print("All weights saved to", WEIGHTS_DIR)
