import numpy as np
from sentence_transformers import SentenceTransformer, util

embedder = None
category_embeddings = None
category_labels = []
category_descriptions = []

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

def load_text_model():
    global embedder, category_embeddings, category_labels, category_descriptions
    print("Loading SentenceTransformer 'all-MiniLM-L6-v2'...")
    embedder = SentenceTransformer('all-MiniLM-L6-v2', device='cpu')

    for dept, issues in CATEGORIES.items():
        for issue in issues:
            category_labels.append(dept)
            category_descriptions.append(issue)

    print(f"Precomputing embeddings for {len(category_descriptions)} text keywords...")
    category_embeddings = embedder.encode(category_descriptions, convert_to_tensor=True)

def classify_text(text: str):
    if not text.strip():
        return {
            "issue_type": "Unknown",
            "department": "Unknown",
            "confidence": 0.00
        }
    
    complaint_embedding = embedder.encode(text, convert_to_tensor=True)
    cosine_scores = util.cos_sim(complaint_embedding, category_embeddings)[0]
    
    best_match_idx = int(np.argmax(cosine_scores.cpu().numpy()))
    best_score = float(cosine_scores[best_match_idx])
    
    department = category_labels[best_match_idx]
    category = category_descriptions[best_match_idx]
    
    return {
        "issue_type": category,
        "department": department,
        "confidence": best_score
    }
