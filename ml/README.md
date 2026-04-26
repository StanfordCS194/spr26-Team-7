# ML Backend (FastAPI + MobileNetV3)

This folder contains a lightweight image classification backend using:

- PyTorch (BLIP)
- FastAPI (inference API)

---

## 🚀 Setup

```bash
cd ml
python3 -m venv venv
source venv/bin/activate      # macOS / Linux
# venv\Scripts\activate       # Windows
pip install -r requirements.txt
```

## To run locally

``uvicorn main:app --reload``
Go to the IP address:8000/docs
And test it out


## Known Issues
This is just a proof-of-concept open-source imaging captioning model

For now, we need to find a way to increase the accuracy of captions when trying to create a detailed description.
This may involve:
1. Fine-tuning BLIP
2. Using a more powerful model like BLIP2