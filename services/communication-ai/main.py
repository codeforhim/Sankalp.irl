"""
Communication AI Microservice — FastAPI endpoints for AI-generated
municipal communications using Groq Llama via LangChain.
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import logging

from dotenv import load_dotenv
load_dotenv()

from communication_agent import (
    generate_status_update,
    generate_citizen_notification,
    generate_ward_summary,
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

app = FastAPI(title="Communication AI Service", version="1.0.0")

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request, exc):
    logger.error(f"Validation error: {exc.errors()}")
    logger.error(f"Request body: {exc.body}")
    return JSONResponse(
        status_code=422,
        content={"detail": exc.errors(), "body": exc.body},
    )

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Request Models ──────────────────────────────────────────────

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


# ── Endpoints ───────────────────────────────────────────────────

@app.get("/health")
def health():
    return {"status": "ok", "service": "communication-ai"}


@app.post("/generate/status-update")
async def status_update(req: StatusUpdateRequest):
    try:
        message = generate_status_update(
            issue_type=req.issue_type,
            ward_name=req.ward_name,
            department=req.department,
            status=req.status,
            description=req.description,
        )
        return {"message": message}
    except Exception as e:
        logger.error(f"Status update generation failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/generate/citizen-notification")
async def citizen_notification(req: CitizenNotificationRequest):
    try:
        message = generate_citizen_notification(
            issue_type=req.issue_type,
            status=req.status,
            department=req.department,
        )
        return {"message": message}
    except Exception as e:
        logger.error(f"Citizen notification generation failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/generate/ward-summary")
async def ward_summary(req: WardSummaryRequest):
    try:
        message = generate_ward_summary(
            ward_name=req.ward_name,
            verified=req.verified,
            resolved=req.resolved,
            in_progress=req.in_progress,
            needs_redo=req.needs_redo,
            flagged=req.flagged,
            reported=req.reported,
        )
        return {"message": message}
    except Exception as e:
        logger.error(f"Ward summary generation failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
