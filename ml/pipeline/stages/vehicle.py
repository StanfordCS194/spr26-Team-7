from __future__ import annotations

from PIL import Image

from models.captioner import caption
from models.classifier import clip_bool, clip_label

from .base import CategoryPipeline

_TYPES: dict[str, str] = {
    "sedan": "a sedan or coupe passenger car",
    "pickup_truck": "a pickup truck",
    "suv": "an SUV or crossover vehicle",
    "van": "a van or minivan",
    "rv": "an RV or motorhome",
    "motorcycle": "a motorcycle or scooter",
    "commercial_truck": "a commercial truck, semi-truck, or box truck",
}

_COLORS: dict[str, str] = {
    "white": "a white vehicle",
    "black": "a black vehicle",
    "gray": "a gray or silver vehicle",
    "red": "a red vehicle",
    "blue": "a blue vehicle",
    "green": "a green vehicle",
    "brown": "a brown or tan vehicle",
    "yellow": "a yellow or gold vehicle",
    "other": "a vehicle of an unusual or unspecified color",
}

_CONDITIONS: dict[str, str] = {
    "poor": "a heavily damaged, burned, or inoperable vehicle",
    "fair": "a vehicle with minor visible damage or wear",
    "good": "a vehicle in good overall condition",
}

# Maps to San Jose 311 vehicle concern sub-types (categories_sj.txt)
_CONCERN_TYPES: dict[str, str] = {
    "lived_in": "a vehicle that appears to have someone living inside it",
    "trash_sewage": "trash or sewage accumulated around or near a vehicle",
    "park_creek": "a vehicle parked inside a park, along a creek, or on a trail",
    "private_property": "a vehicle parked on private property without permission",
    "poor_condition": "a vehicle in severely deteriorated condition on a city street",
    "parking_violation": "a vehicle parked in a prohibited or illegal location",
    "criminal_activity": "a vehicle involved in suspected criminal or illegal activity",
}


class VehiclePipeline(CategoryPipeline):
    def extract(self, image: Image.Image) -> dict:
        vtype, _ = clip_label(image, _TYPES)
        vcolor, _ = clip_label(image, _COLORS)
        condition, _ = clip_label(image, _CONDITIONS)
        concern, _ = clip_label(image, _CONCERN_TYPES)
        flat_tires = clip_bool(
            image,
            "a vehicle with flat, deflated, or missing tires",
            "a vehicle with properly inflated tires",
        )
        trash_nearby = clip_bool(
            image,
            "trash, garbage, or debris visible near a vehicle",
            "a clean area with no trash near a vehicle",
        )
        appears_lived_in = clip_bool(
            image,
            "a vehicle with curtains, belongings, or clutter indicating habitation",
            "an unoccupied parked vehicle with no signs of habitation",
        )
        return {
            "vehicle_type": vtype,
            "vehicle_color": vcolor,
            "condition": condition,
            "concern_type": concern,
            "possible_flat_tires": flat_tires,
            "trash_nearby": trash_nearby,
            "appears_lived_in": appears_lived_in,
        }

    def describe(self, image: Image.Image, extraction: dict) -> str:
        scene = caption(image, "a photo of a vehicle on a public street showing")
        parts = [
            f"The image appears to show a {extraction['vehicle_color']} {extraction['vehicle_type']} on a public street.",
            f"Visual observation: {scene}.",
        ]
        if extraction["possible_flat_tires"]:
            parts.append("The vehicle appears to have one or more flat or significantly deflated tires.")
        if extraction["appears_lived_in"]:
            parts.append("There are visible signs that the vehicle may be inhabited.")
        if extraction["trash_nearby"]:
            parts.append("Trash or debris is visible in the vicinity of the vehicle.")
        if extraction["condition"] == "poor":
            parts.append("The vehicle appears to be in poor or deteriorated condition.")
        parts.append(
            "The system suggests this may qualify as a vehicle concern report for the City of San Jose."
        )
        return " ".join(parts)
