import io
from contextlib import asynccontextmanager

from fastapi import FastAPI, File, UploadFile
from PIL import Image

from models.captioner import preload as preload_blip
from models.classifier import preload as preload_clip
from pipeline.orchestrator import run_pipeline
from schemas import PipelineResponse


@asynccontextmanager
async def lifespan(app: FastAPI):
    print("Loading CLIP weights...")
    preload_clip()
    print("Loading BLIP weights...")
    preload_blip()
    print("Models ready.")
    yield


app = FastAPI(title="San Jose 311 Vision Pipeline", lifespan=lifespan)


@app.get("/")
def root():
    return {"status": "ok"}


@app.post("/predict", response_model=PipelineResponse)
async def predict_image(file: UploadFile = File(...)):
    image_bytes = await file.read()
    image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    return run_pipeline(image)
