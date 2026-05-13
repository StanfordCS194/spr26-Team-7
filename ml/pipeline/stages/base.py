from __future__ import annotations

from abc import ABC, abstractmethod

from PIL import Image


class CategoryPipeline(ABC):
    @abstractmethod
    def extract(self, image: Image.Image) -> dict:
        """Stage 3: return structured fields specific to this category."""
        ...

    @abstractmethod
    def describe(self, image: Image.Image, extraction: dict) -> str:
        """Stage 4: produce a human-readable report description."""
        ...

    def run(self, image: Image.Image) -> dict:
        extraction = self.extract(image)
        description = self.describe(image, extraction)
        return {"extraction": extraction, "description": description}
