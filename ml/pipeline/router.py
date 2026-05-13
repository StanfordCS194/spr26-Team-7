from __future__ import annotations

from PIL import Image

from models.classifier import clip_top_k
from schemas import RouteCandidate, RouterResult

# Descriptive text must be specific enough for CLIP to distinguish categories
# while remaining general enough for diverse real-world images.
CATEGORIES: dict[str, str] = {
    "pothole": "damaged road surface with cracks, holes, or broken pavement",
    "streetlight": "a broken, dark, or malfunctioning street light or lamp post",
    "encampment": "a tent, makeshift shelter, or homeless encampment on public land",
    "fireworks": "fireworks packaging, fireworks debris, or evidence of illegal fireworks",
    "sewer": "a flooded street, open sewer, water main break, or drainage overflow",
    "dumping": "piles of garbage, construction debris, or trash illegally dumped in public",
    "graffiti": "graffiti, spray paint, or vandalism markings on a wall, fence, or structure",
    "vehicle": "an abandoned, damaged, or improperly parked vehicle on a city street",
}


def route(image: Image.Image, top_k: int = 3) -> RouterResult:
    ranked = clip_top_k(image, CATEGORIES, k=top_k)
    top_label, top_conf = ranked[0]
    alternatives = [
        RouteCandidate(category=label, confidence=conf) for label, conf in ranked[1:]
    ]
    return RouterResult(
        top_category=top_label,
        confidence=top_conf,
        alternatives=alternatives,
    )
