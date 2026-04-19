import io
from PIL import Image
import torch
import torchvision.transforms as T
from model import model
from model import LABELS

transform = T.Compose([
    T.Resize(256),
    T.CenterCrop(224),
    T.ToTensor(),
])

def predict(image_bytes: bytes):
    image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    img = transform(image)
    x = img.unsqueeze(0)

    with torch.no_grad():
        outputs = model(x)
        pred = outputs.argmax(dim=1).item()

    return LABELS[pred]