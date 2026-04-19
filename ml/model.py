import torch
import torch.nn as nn
from torchvision import models

NUM_CLASSES = 5
LABELS = [
    "Graffiti",
    "Pothole",
    "Streetlight Outage",
    "Illegal Dumping",
    "Vehicle Concerns"
]

def load_model():
    model = models.mobilenet_v3_small(pretrained=True)

    # replace classifier for your 5 classes
    model.classifier[3] = nn.Linear(model.classifier[3].in_features, NUM_CLASSES)

    model.eval()
    return model

model = load_model()