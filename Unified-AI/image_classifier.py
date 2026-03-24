import torch
from transformers import CLIPProcessor, CLIPModel
from PIL import Image
import io

processor = None
clip_model = None
device = None

CATEGORIES = {
    "Water Works": [
        "water leakage", "no water supply", "sewer overflow", 
        "burst pipe", "flooded street", "contaminated water", 
        "drainage block", "waterlogging", "dirty water"
    ],
    "Public Works Department": [
        "pothole", "damaged road", "broken footpath", "pot hole", 
        "cracked pavement", "sinkhole", "road cave-in", 
        "unpaved road", "uneven street surface", "bridge damage"
    ],
    "Electrical Works": [
        "street light not working", "electric pole damage", 
        "loose hanging wires", "sparking electricity", 
        "power outage", "broken street lamp", "transformer issue"
    ],
    "Sanitation": [
        "garbage accumulation", "unclean street", "waste", "garbage", 
        "trash pile", "littering", "dead animal on road", 
        "overflowing dustbin", "foul smell", "public toilet unhygienic", "plastic waste"
    ]
}

FLAT_CATEGORIES = []
CATEGORY_MAPPING = {}
for main_cat, sub_cats in CATEGORIES.items():
    for sub_cat in sub_cats:
        FLAT_CATEGORIES.append(sub_cat)
        CATEGORY_MAPPING[sub_cat] = main_cat

CLIP_LABELS = [f"a photo of a {cat} problem" for cat in FLAT_CATEGORIES]

def load_image_model():
    global processor, clip_model, device
    device = "cuda" if torch.cuda.is_available() else "cpu"
    print(f"Loading CLIP model on {device}...")
    model_id = "openai/clip-vit-base-patch32"
    processor = CLIPProcessor.from_pretrained(model_id)
    clip_model = CLIPModel.from_pretrained(model_id).to(device)

def classify_image(image_bytes: bytes):
    try:
        raw_image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    except Exception as e:
        print(f"Error decoding image: {e}")
        return {
            "issue_type": "Unknown",
            "department": "Unknown",
            "confidence": 0.00
        }
        
    print("Classifying image with CLIP...")
    inputs = processor(text=CLIP_LABELS, images=raw_image, return_tensors="pt", padding=True).to(device)
    
    with torch.inference_mode(): 
        outputs = clip_model(**inputs)
    
    logits_per_image = outputs.logits_per_image
    probs = logits_per_image.softmax(dim=1) 
    
    best_idx = probs.argmax().item()
    confidence_score = probs[0, best_idx].item()
    
    best_sub_cat = FLAT_CATEGORIES[best_idx]
    main_cat = CATEGORY_MAPPING[best_sub_cat]
    
    return {
        "issue_type": best_sub_cat,
        "department": main_cat,
        "confidence": confidence_score
    }
