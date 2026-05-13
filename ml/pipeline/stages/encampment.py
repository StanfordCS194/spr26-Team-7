from __future__ import annotations

from PIL import Image

from models.captioner import caption
from models.classifier import clip_bool, clip_label

from .base import CategoryPipeline

_STRUCTURE_TYPES: dict[str, str] = {
    "tent": "a camping tent or tarp used as a makeshift shelter",
    "vehicle_dwelling": "a vehicle being used as a dwelling or sleeping space",
    "lean_to": "a lean-to or improvised structure made from scavenged materials",
    "sleeping_area": "a sleeping bag, bedroll, or outdoor sleeping setup with no structure",
    "established_camp": "an established camp with multiple shelters and accumulated belongings",
}

_SIZES: dict[str, str] = {
    "individual": "a single-person encampment with one shelter or sleeping area",
    "small_group": "a small group encampment with a few shelters",
    "large": "a large encampment with many shelters and extensive belongings",
}


class EncampmentPipeline(CategoryPipeline):
    def extract(self, image: Image.Image) -> dict:
        structure, _ = clip_label(image, _STRUCTURE_TYPES)
        size, _ = clip_label(image, _SIZES)
        trash_nearby = clip_bool(
            image,
            "trash, garbage, or debris accumulated near a shelter or encampment",
            "a campsite area with no visible trash or debris nearby",
        )
        return {
            "structure_type": structure,
            "estimated_size": size,
            "trash_nearby": trash_nearby,
        }

    def describe(self, image: Image.Image, extraction: dict) -> str:
        scene = caption(image, "a photo of an outdoor encampment showing")
        structure_display = extraction["structure_type"].replace("_", " ")
        size_display = extraction["estimated_size"].replace("_", " ")
        parts = [
            f"The image appears to show a {size_display} encampment with a {structure_display} on public property.",
            f"Visual observation: {scene}.",
        ]
        if extraction["trash_nearby"]:
            parts.append("Trash or debris accumulation is visible near the encampment.")
        parts.append(
            "The system suggests this may qualify as an encampment report for the City of San Jose."
        )
        return " ".join(parts)
