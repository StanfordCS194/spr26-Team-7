from __future__ import annotations

from PIL import Image

from models.captioner import caption
from models.classifier import clip_bool, clip_label

from .base import CategoryPipeline

# Surface options match San Jose 311 graffiti form (categories_sj.txt)
_SURFACES: dict[str, str] = {
    "painted_wall": "graffiti on a painted wall",
    "unpainted_wall": "graffiti on a bare or unpainted wall",
    "sidewalk": "graffiti on a sidewalk or pavement",
    "tree": "graffiti carved or painted on a tree",
    "wood_fence": "graffiti on a wooden fence",
    "chain_link_fence": "graffiti on a chain link fence",
    "utility_box": "graffiti on an electrical or utility box",
    "light_pole": "graffiti on a street light pole",
    "park_restroom": "graffiti on a park restroom building",
    "picnic_table": "graffiti on a picnic table",
}

# Static public-property likelihood per surface type
_PUBLIC_LIKELIHOOD: dict[str, float] = {
    "park_restroom": 0.95,
    "light_pole": 0.90,
    "sidewalk": 0.90,
    "picnic_table": 0.90,
    "utility_box": 0.85,
    "tree": 0.70,
    "chain_link_fence": 0.70,
    "painted_wall": 0.60,
    "unpainted_wall": 0.55,
    "wood_fence": 0.50,
}


class GraffitiPipeline(CategoryPipeline):
    def extract(self, image: Image.Image) -> dict:
        surface, _ = clip_label(image, _SURFACES)
        appears_on_public = clip_bool(
            image,
            "graffiti on public property or public infrastructure",
            "graffiti on private property or a private building",
        )
        on_state_highway = clip_bool(
            image,
            "graffiti on a state highway sign, overpass, or highway infrastructure",
            "graffiti not on a state highway",
        )
        return {
            "surface_type": surface,
            "public_property_likelihood": _PUBLIC_LIKELIHOOD.get(surface, 0.60),
            "appears_on_public_property": appears_on_public,
            "on_state_highway": on_state_highway,
        }

    def describe(self, image: Image.Image, extraction: dict) -> str:
        scene = caption(image, "a photo of graffiti on")
        surface_display = extraction["surface_type"].replace("_", " ")
        likelihood = extraction["public_property_likelihood"]
        parts = [
            f"The image appears to show graffiti markings on a {surface_display} adjacent to a public area.",
            f"Visual observation: {scene}.",
        ]
        if extraction["appears_on_public_property"]:
            parts.append("The surface appears to be public property or public infrastructure.")
        if extraction["on_state_highway"]:
            parts.append("The graffiti may be located on or near state highway infrastructure.")
        parts.append(
            f"The system classifies this as a likely graffiti-related concern "
            f"with {likelihood:.0%} estimated likelihood of being on public property."
        )
        return " ".join(parts)
