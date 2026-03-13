from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse, HTMLResponse
from fastapi.staticfiles import StaticFiles
from PIL import Image
import io
import logging
import os

from dotenv import load_dotenv
load_dotenv() # Load variables from .env BEFORE importing ai_models

from ai_models import detect_fake_image, verify_issue_resolution

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Issue Verification API", version="1.0.0")

# Serve static files (HTML frontend)
STATIC_DIR = os.path.join(os.path.dirname(__file__), "static")
app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")

@app.get("/", response_class=HTMLResponse)
def read_root():
    """Serve the visual frontend UI."""
    html_path = os.path.join(STATIC_DIR, "index.html")
    with open(html_path, "r", encoding="utf-8") as f:
        return HTMLResponse(content=f.read())

@app.post("/verify-issue")
async def verify_issue(
    before_image: UploadFile = File(...),
    after_image: UploadFile = File(...)
):
    try:
        before_bytes = await before_image.read()
        after_bytes  = await after_image.read()

        img_before = Image.open(io.BytesIO(before_bytes)).convert("RGB")
        img_after  = Image.open(io.BytesIO(after_bytes)).convert("RGB")

    except Exception as e:
        logger.error(f"Error reading images: {e}")
        raise HTTPException(status_code=400, detail="Invalid image files provided.")

    # Step 1: Fake Image Detection on the 'after' image
    logger.info("Running Fake Image Detection...")
    is_fake, fake_confidence = detect_fake_image(img_after)

    if is_fake and fake_confidence > 0.7:
        logger.warning(f"AI-generated image detected with confidence {fake_confidence:.2f}")
        return JSONResponse({
            "issue_type": "unknown",
            "resolved": False,
            "confidence": round(fake_confidence, 2),
            "ai_generated": True,
            "message": "The uploaded 'after' image appears to be AI-generated."
        })

    # Step 2: Vision Reasoning
    logger.info("Running Vision Model Reasoning...")
    vision_result = verify_issue_resolution(img_before, img_after)

    response_data = {
        "ai_generated": False,
        **vision_result
    }

    return JSONResponse(response_data)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8080)
