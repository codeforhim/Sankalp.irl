"""
Unified AI Service — Single FastAPI application combining:
  1. AI Classification (text, image, audio) — /classify/*
  2. Communication AI (status updates, notifications, helpdesk) — /generate/*
  3. Agentic AI (citizen, ward, admin chat) — /chat/*
  4. ML Vision (before/after issue verification) — /verify-issue
"""

from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse, HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from pydantic import BaseModel
from typing import Optional, Dict, Any, List
from contextlib import asynccontextmanager
from PIL import Image
import uvicorn
import shutil
import io
import os
import logging

from dotenv import load_dotenv
load_dotenv()

# ── AI-Service imports ──────────────────────────────────────────
from text_classifier import load_text_model, classify_text
from audio_classifier import load_audio_model, transcribe_audio
from image_classifier import load_image_model, classify_image

# ── ML-Vision imports ───────────────────────────────────────────
from ai_models import detect_fake_image, verify_issue_resolution

# ── Communication-AI imports ────────────────────────────────────
from communication_agent import (
    generate_status_update,
    generate_citizen_notification,
    generate_ward_summary,
)
from helpdesk_agent import get_helpdesk_response

# ── Agents imports ──────────────────────────────────────────────
from langgraph.checkpoint.memory import MemorySaver
from citizen_agent.agent import build_citizen_agent
from ward_agent.agent import build_ward_agent
from admin_agent.agent import build_admin_agent

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


# ── Application Lifespan ────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing AI models...")
    load_text_model()
    load_audio_model()
    load_image_model()
    logger.info("All models loaded successfully!")
    yield
    logger.info("Shutting down Unified AI service...")


app = FastAPI(title="LokaYuktai Unified AI Service", version="2.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request, exc):
    logger.error(f"Validation error: {exc.errors()}")
    return JSONResponse(status_code=422, content={"detail": exc.errors()})

# ── Serve ML Vision static frontend ─────────────────────────────
STATIC_DIR = os.path.join(os.path.dirname(__file__), "static")
if os.path.exists(STATIC_DIR):
    app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")

@app.get("/health")
def health():
    return {"status": "ok", "service": "unified-ai"}


# ═══════════════════════════════════════════════════════════════
#  1. AI CLASSIFICATION ROUTES (/classify/*)
# ═══════════════════════════════════════════════════════════════

class TextClassificationRequest(BaseModel):
    text: str

@app.post("/classify/text")
async def api_classify_text(request: TextClassificationRequest):
    result = classify_text(request.text)
    return result

@app.post("/classify/audio")
async def api_classify_audio(audio: UploadFile = File(...)):
    temp_path = f"temp_{audio.filename}"
    with open(temp_path, "wb") as buffer:
        shutil.copyfileobj(audio.file, buffer)
    try:
        transcribed_text = transcribe_audio(temp_path)
        if not transcribed_text:
            raise HTTPException(status_code=400, detail="Could not transcribe audio")
        result = classify_text(transcribed_text)
        result["transcribed_text"] = transcribed_text
        return result
    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)

@app.post("/classify/image")
async def api_classify_image(image: UploadFile = File(...)):
    if not image.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File is not an image")
    image_bytes = await image.read()
    result = classify_image(image_bytes)
    return result


# ═══════════════════════════════════════════════════════════════
#  2. ML VISION ROUTES (/verify-issue)
# ═══════════════════════════════════════════════════════════════

@app.post("/verify-issue")
async def verify_issue(
    before_image: UploadFile = File(...),
    after_image: UploadFile = File(...)
):
    try:
        before_bytes = await before_image.read()
        after_bytes = await after_image.read()
        img_before = Image.open(io.BytesIO(before_bytes)).convert("RGB")
        img_after = Image.open(io.BytesIO(after_bytes)).convert("RGB")
    except Exception as e:
        logger.error(f"Error reading images: {e}")
        raise HTTPException(status_code=400, detail="Invalid image files provided.")

    # Step 1: Fake Image Detection
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
    return JSONResponse({"ai_generated": False, **vision_result})


# ═══════════════════════════════════════════════════════════════
#  3. COMMUNICATION AI ROUTES (/generate/*)
# ═══════════════════════════════════════════════════════════════

class StatusUpdateRequest(BaseModel):
    issue_type: str
    ward_name: str
    department: str
    status: str
    description: str

class CitizenNotificationRequest(BaseModel):
    issue_type: str
    status: str
    department: Optional[str] = "Municipal Services"

class WardSummaryRequest(BaseModel):
    ward_name: str
    verified: int
    resolved: int
    in_progress: int
    needs_redo: int
    flagged: int
    reported: int

class HelpdeskRequest(BaseModel):
    user_query: str

@app.post("/generate/status-update")
async def status_update(req: StatusUpdateRequest):
    try:
        message = generate_status_update(
            issue_type=req.issue_type, ward_name=req.ward_name,
            department=req.department, status=req.status, description=req.description,
        )
        return {"message": message}
    except Exception as e:
        logger.error(f"Status update generation failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/generate/citizen-notification")
async def citizen_notification(req: CitizenNotificationRequest):
    try:
        message = generate_citizen_notification(
            issue_type=req.issue_type, status=req.status, department=req.department,
        )
        return {"message": message}
    except Exception as e:
        logger.error(f"Citizen notification generation failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/generate/ward-summary")
async def ward_summary(req: WardSummaryRequest):
    try:
        message = generate_ward_summary(
            ward_name=req.ward_name, verified=req.verified, resolved=req.resolved,
            in_progress=req.in_progress, needs_redo=req.needs_redo,
            flagged=req.flagged, reported=req.reported,
        )
        return {"message": message}
    except Exception as e:
        logger.error(f"Ward summary generation failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/generate/citizen-help")
async def citizen_help(req: HelpdeskRequest):
    try:
        message = get_helpdesk_response(user_query=req.user_query)
        return {"message": message}
    except Exception as e:
        logger.error(f"Helpdesk generation failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ═══════════════════════════════════════════════════════════════
#  4. AGENTIC AI ROUTES (/chat/*)
# ═══════════════════════════════════════════════════════════════

# Build agents once on startup
memory = MemorySaver()
citizen_executor = build_citizen_agent(memory)
ward_executor = build_ward_agent(memory)
admin_executor = build_admin_agent(memory)

class ChatRequest(BaseModel):
    message: str
    user_id: str
    context: Optional[Dict[str, Any]] = None

class ChatResponse(BaseModel):
    response: str
    actions_taken: List[str] = []

def process_agent_chat(executor, request: ChatRequest) -> ChatResponse:
    try:
        config = {"configurable": {"thread_id": request.user_id}}
        context_str = f"The authenticated user_id logging this request is {request.user_id}."
        if request.context:
            context_str += f" Additional contextual variables: {request.context}"
        enhanced_msg = f"[System Context: {context_str} Do not ask the user for their ID or context, just use this.]\n\n{request.message}"

        result = executor.invoke(
            {"messages": [("user", enhanced_msg)]},
            config=config
        )
        final_message = result["messages"][-1].content
        
        actions = list(set(
            f"Executed tool: {msg.name}" for msg in result["messages"] if msg.type == "tool"
        ))
        return ChatResponse(response=final_message, actions_taken=actions)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/chat/citizen", response_model=ChatResponse)
async def chat_citizen(request: ChatRequest):
    return process_agent_chat(citizen_executor, request)

@app.post("/chat/ward", response_model=ChatResponse)
async def chat_ward(request: ChatRequest):
    return process_agent_chat(ward_executor, request)

@app.post("/chat/admin", response_model=ChatResponse)
async def chat_admin(request: ChatRequest):
    return process_agent_chat(admin_executor, request)


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=7860)
