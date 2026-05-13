from __future__ import annotations

from PIL import Image

from schemas import PipelineResponse

from .router import route
from .stages.dumping import DumpingPipeline
from .stages.encampment import EncampmentPipeline
from .stages.fireworks import FireworksPipeline
from .stages.graffiti import GraffitiPipeline
from .stages.pothole import PotholePipeline
from .stages.sewer import SewerPipeline
from .stages.streetlight import StreetlightPipeline
from .stages.vehicle import VehiclePipeline

_PIPELINES = {
    "pothole": PotholePipeline(),
    "streetlight": StreetlightPipeline(),
    "encampment": EncampmentPipeline(),
    "fireworks": FireworksPipeline(),
    "sewer": SewerPipeline(),
    "dumping": DumpingPipeline(),
    "graffiti": GraffitiPipeline(),
    "vehicle": VehiclePipeline(),
}


def run_pipeline(image: Image.Image) -> PipelineResponse:
    router_result = route(image)
    category = router_result.top_category
    stage_result = _PIPELINES[category].run(image)
    return PipelineResponse(
        router=router_result,
        category=category,
        extraction=stage_result["extraction"],
        description=stage_result["description"],
    )
