"""
ai_models.py — Issue Verification using Google Gemini API

Algorithm design:
  - Step 1: Fake Image Detection (local/fast PIL stddev check)
  - Step 2: Vision Reasoning using Gemini 1.5 Flash
"""
import os
import json
import logging
import google.genai as genai
from PIL import Image, ImageStat

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize Gemini AI
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")
if GEMINI_API_KEY:
    try:
        client = genai.Client(api_key=GEMINI_API_KEY)
        logger.info("Successfully initialized Gemini API client.")
    except Exception as e:
        logger.error(f"Failed to initialize Gemini API: {e}")
        client = None
else:
    logger.warning("GEMINI_API_KEY environment variable not found. Vision reasoning will fail.")
    client = None


# ----------------------------------------------------------------
# Fake Image Detection  (purely statistical, no ML model needed)
# ----------------------------------------------------------------

def detect_fake_image(image: Image.Image) -> tuple[bool, float]:
    """
    Real photos have natural per-channel noise.
    Purely synthetic/AI-generated flat images have very low stddev.
    Returns (is_fake: bool, confidence: float)
    """
    try:
        stat = ImageStat.Stat(image)
        avg_std = sum(stat.stddev) / len(stat.stddev)

        if avg_std < 12.0:
            confidence = round(min(0.9, 0.65 + (12.0 - avg_std) / 12.0), 2)
            logger.info(f"[FakeDetect] avg_std={avg_std:.2f} → FAKE  (conf={confidence})")
            return True, confidence

        logger.info(f"[FakeDetect] avg_std={avg_std:.2f} → real  (conf=0.1)")
        return False, 0.10

    except Exception as e:
        logger.error(f"[FakeDetect] Error: {e}")
        return False, 0.0


# ----------------------------------------------------------------
# Main Vision Comparison using Gemini
# ----------------------------------------------------------------

def verify_issue_resolution(before_image: Image.Image, after_image: Image.Image) -> dict:
    """
    Compares before/after civic repair images using Gemini 1.5 Flash.
    """
    if not client:
        logger.error("Gemini client is not initialized (Missing API Key).")
        return {
            "issue_type": "unknown",
            "resolved": False,
            "confidence": 0.0,
            "error": "GEMINI_API_KEY not configured. Please add it to your .env file."
        }

    prompt = """
    You are an AI tasked with analyzing before and after images of civic issues such as potholes, damaged roads, waterlogging, or scattered garbage.
    The first image is the "before" photo.
    The second image is the "after" photo.
    
    Determine:
    1. 'issue_type': A short string describing what the primary civic issue is (e.g., 'pothole', 'garbage', 'broken_streetlight', 'waterlogging', 'unknown').
    2. 'resolved': A boolean (true or false) indicating whether the issue appears fully and properly repaired/resolved in the "after" photo compared to the "before" photo.
    3. 'confidence': A float between 0.0 and 1.0 indicating how confident you are in this assessment.
    4. 'message': A short human-readable explanation of why you consider it resolved or not.
    
    Output strictly as a valid JSON object matching the keys mentioned above, and nothing else.
    """

    try:
        logger.info("Sending images to Gemini API for reasoning...")
        
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=[prompt, before_image, after_image],
            config=genai.types.GenerateContentConfig(
                response_mime_type="application/json"
            )
        )
        
        # Parse output ensuring standard dict structure
        result_text = response.text.strip()
        logger.info(f"[Gemini Output]: {result_text}")
        
        result_json = json.loads(result_text)
        
        return {
            "issue_type": str(result_json.get("issue_type", "unknown")),
            "resolved": bool(result_json.get("resolved", False)),
            "confidence": float(result_json.get("confidence", 0.0)),
            "message": str(result_json.get("message", "No explanation provided."))
        }

    except Exception as e:
        logger.error(f"[Vision] Gemini Analysis Error: {e}")
        return {
            "issue_type": "unknown",
            "resolved": False,
            "confidence": 0.0,
            "error": f"API Analysis failed: {str(e)}"
        }
