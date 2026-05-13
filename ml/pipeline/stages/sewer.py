from __future__ import annotations

from PIL import Image

from models.captioner import caption
from models.classifier import clip_bool, clip_label

from .base import CategoryPipeline

_ISSUE_TYPES: dict[str, str] = {
    "flooding": "a flooded street or sidewalk with standing water",
    "water_main_break": "a broken water main with water gushing from the ground or street",
    "sewer_overflow": "a sewer overflow or sewage backing up onto a street or sidewalk",
    "drain_blockage": "a blocked storm drain or clogged catch basin",
    "open_manhole": "an open, missing, or damaged manhole cover on a street",
}


class SewerPipeline(CategoryPipeline):
    def extract(self, image: Image.Image) -> dict:
        issue, _ = clip_label(image, _ISSUE_TYPES)
        flooding_visible = clip_bool(
            image,
            "visible flooding, standing water, or water flowing across a road or sidewalk",
            "a dry road or sidewalk with no visible water accumulation",
        )
        return {
            "issue_type": issue,
            "flooding_visible": flooding_visible,
        }

    def describe(self, image: Image.Image, extraction: dict) -> str:
        scene = caption(image, "a photo of a water or drainage issue showing")
        issue_display = extraction["issue_type"].replace("_", " ")
        parts = [
            f"The image appears to show a {issue_display} on a public street or sidewalk.",
            f"Visual observation: {scene}.",
        ]
        if extraction["flooding_visible"]:
            parts.append(
                "Visible flooding or standing water is present, which may pose a hazard to pedestrians and vehicles."
            )
        parts.append(
            "The system suggests this may qualify as a sewer or water infrastructure report for the City of San Jose."
        )
        return " ".join(parts)
