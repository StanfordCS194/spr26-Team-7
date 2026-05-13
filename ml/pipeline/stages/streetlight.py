from __future__ import annotations

from PIL import Image

from models.captioner import caption
from models.classifier import clip_bool, clip_label

from .base import CategoryPipeline

_ISSUE_TYPES: dict[str, str] = {
    "outage": "a completely dark or non-functioning street light",
    "flickering": "a flickering or intermittently working street light",
    "damaged_fixture": "a street light with a damaged, broken, or vandalized fixture",
    "leaning_pole": "a street light pole that is leaning, bent, or knocked over",
    "exposed_wiring": "a street light with exposed or dangerous wiring",
}


class StreetlightPipeline(CategoryPipeline):
    def extract(self, image: Image.Image) -> dict:
        issue, _ = clip_label(image, _ISSUE_TYPES)
        daytime_photo = clip_bool(
            image,
            "a street light photographed during daytime with daylight visible",
            "a street light photographed at night or in low light conditions",
        )
        return {
            "issue_type": issue,
            "daytime_photo": daytime_photo,
        }

    def describe(self, image: Image.Image, extraction: dict) -> str:
        scene = caption(image, "a photo of a street light showing")
        issue_display = extraction["issue_type"].replace("_", " ")
        parts = [
            f"The image appears to show a {issue_display} on a public street.",
            f"Visual observation: {scene}.",
        ]
        if extraction["daytime_photo"]:
            parts.append(
                "The photo was taken during daytime; the outage or damage may be less immediately obvious but does not reduce the severity of the concern."
            )
        parts.append(
            "The system suggests this may qualify as a streetlight outage or damage report for the City of San Jose."
        )
        return " ".join(parts)
