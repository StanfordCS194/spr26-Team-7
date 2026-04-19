from fastapi import FastAPI, File, UploadFile
from inference import predict

app = FastAPI()

@app.get("/")
def root():
    return {"status": "ok"}

@app.post("/predict")
async def predict_image(file: UploadFile = File(...)):
    image_bytes = await file.read()
    label = predict(image_bytes)

    return {
        "prediction": label
    }