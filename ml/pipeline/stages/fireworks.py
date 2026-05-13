from __future__ import annotations

from PIL import Image

from models.captioner import caption
from models.classifier import clip_bool, clip_label

from .base import CategoryPipeline

_EVIDENCE_TYPES: dict[str, str] = {
    "active_fireworks": "fireworks being actively lit or mid-explosion",
    "fireworks_debris": "spent fireworks casings or remnants on the ground",
    "fireworks_packaging": "fireworks packaging, boxes, or unopened fireworks",
    "burn_marks": "burn marks or scorching on pavement or surfaces caused by fireworks",
}


class FireworksPipeline(CategoryPipeline):
    def extract(self, image: Image.Image) -> dict:
        evidence, _ = clip_label(image, _EVIDENCE_TYPES)
        in_residential = clip_bool(
            image,
            "fireworks in a residential neighborhood or near homes and buildings",
            "fireworks in an open field, park, or unpopulated outdoor area",
        )
        return {
            "evidence_type": evidence,
            "in_residential_area": in_residential,
        }

    def describe(self, image: Image.Image, extraction: dict) -> str:
        scene = caption(image, "a photo showing fireworks or fireworks evidence including")
        evidence_display = extraction["evidence_type"].replace("_", " ")
        parts = [
            f"The image appears to show {evidence_display} in a public area.",
            f"Visual observation: {scene}.",
        ]
        if extraction["in_residential_area"]:
            parts.append(
                "The fireworks activity appears to be located in or near a residential neighborhood, which poses an elevated safety risk."
            )
        parts.append(
            "The system suggests this may qualify as an illegal fireworks report for the City of San Jose."
        )
        return " ".join(parts)
