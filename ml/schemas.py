from pydantic import BaseModel


class RouteCandidate(BaseModel):
    category: str
    confidence: float


class RouterResult(BaseModel):
    top_category: str
    confidence: float
    alternatives: list[RouteCandidate]


class PipelineResponse(BaseModel):
    router: RouterResult
    category: str
    extraction: dict
    description: str
