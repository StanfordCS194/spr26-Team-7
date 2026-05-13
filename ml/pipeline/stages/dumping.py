from __future__ import annotations

from PIL import Image

from models.captioner import caption
from models.classifier import clip_bool, clip_label

from .base import CategoryPipeline

_MATERIAL_TYPES: dict[str, str] = {
    "household_trash": "bags of household garbage or trash illegally dumped",
    "construction_debris": "construction debris, wood, drywall, or building materials dumped illegally",
    "furniture": "furniture, mattresses, or large household items dumped illegally",
    "electronics": "electronics, appliances, or e-waste dumped illegally",
    "yard_waste": "yard waste, branches, or vegetation dumped illegally",
    "mixed_debris": "a mixed pile of various debris and trash dumped illegally",
}

_VOLUMES: dict[str, str] = {
    "small": "a small pile of trash that could fit in a few garbage bags",
    "medium": "a medium amount of illegally dumped material filling a pickup truck bed",
    "large": "a large amount of illegally dumped material requiring multiple truckloads",
}


class DumpingPipeline(CategoryPipeline):
    def extract(self, image: Image.Image) -> dict:
        material, _ = clip_label(image, _MATERIAL_TYPES)
        volume, _ = clip_label(image, _VOLUMES)
        blocking = clip_bool(
            image,
            "dumped material blocking a road, travel lane, or sidewalk",
            "dumped material piled on the side of a road without blocking traffic",
        )
        return {
            "material_type": material,
            "approximate_volume": volume,
            "blocking_road_or_sidewalk": blocking,
        }

    def describe(self, image: Image.Image, extraction: dict) -> str:
        scene = caption(image, "a photo of illegally dumped trash showing")
        material_display = extraction["material_type"].replace("_", " ")
        parts = [
            f"The image appears to show a {extraction['approximate_volume']} amount of illegally dumped {material_display} in a public area.",
            f"Visual observation: {scene}.",
        ]
        if extraction["blocking_road_or_sidewalk"]:
            parts.append(
                "The dumped material appears to be blocking a road, lane, or sidewalk, creating a potential hazard."
            )
        parts.append(
            "The system suggests this may qualify as an illegal dumping report for the City of San Jose."
        )
        return " ".join(parts)
