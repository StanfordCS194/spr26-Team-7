from __future__ import annotations

from PIL import Image

from models.captioner import caption
from models.classifier import clip_bool, clip_label

from .base import CategoryPipeline

_SEVERITIES: dict[str, str] = {
    "minor": "a small crack or minor surface imperfection in the road",
    "moderate": "a moderately sized pothole or significant road damage",
    "severe": "a large, deep pothole or severely deteriorated road surface",
}

_SIZES: dict[str, str] = {
    "small": "a small pothole less than a foot across",
    "medium": "a medium-sized pothole roughly one to two feet across",
    "large": "a large pothole more than two feet across",
}


class PotholePipeline(CategoryPipeline):
    def extract(self, image: Image.Image) -> dict:
        severity, _ = clip_label(image, _SEVERITIES)
        size, _ = clip_label(image, _SIZES)
        water_present = clip_bool(
            image,
            "standing water or puddles in a road pothole",
            "a dry road pothole with no standing water",
        )
        return {
            "severity": severity,
            "approximate_size": size,
            "water_present": water_present,
        }

    def describe(self, image: Image.Image, extraction: dict) -> str:
        scene = caption(image, "a photo of road damage showing")
        parts = [
            f"The image appears to show {extraction['severity']} road damage approximately {extraction['approximate_size']} in extent.",
            f"Visual observation: {scene}.",
        ]
        if extraction["water_present"]:
            parts.append("Standing water or puddles are visible within the damaged area, which may obscure the full depth of the damage.")
        parts.append(
            "The system suggests this may qualify as a pothole or road damage report for the City of San Jose."
        )
        return " ".join(parts)
