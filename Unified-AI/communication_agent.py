"""
Communication Agent — LangChain + Groq Llama integration for generating
official municipal communications.
"""

import os
import logging
from langchain_groq import ChatGroq
from langchain_core.prompts import PromptTemplate
from langchain_core.output_parsers import StrOutputParser

from prompts import (
    STATUS_UPDATE_TEMPLATE,
    CITIZEN_NOTIFICATION_TEMPLATE,
    WARD_SUMMARY_TEMPLATE,
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

GROQ_API_KEY = os.environ.get("GROQ_API_KEY")
MODEL_NAME = os.environ.get("GROQ_MODEL", "llama-3.3-70b-versatile")


def _get_llm():
    """Return a ChatGroq LLM instance."""
    if not GROQ_API_KEY:
        raise RuntimeError("GROQ_API_KEY environment variable is not set.")
    return ChatGroq(
        api_key=GROQ_API_KEY,
        model_name=MODEL_NAME,
        temperature=0.4,
        max_tokens=256,
    )


def _run_chain(template: str, **kwargs) -> str:
    """Build a LangChain LCEL chain and invoke it."""
    llm = _get_llm()
    prompt = PromptTemplate.from_template(template)
    chain = prompt | llm | StrOutputParser()
    result = chain.invoke(kwargs)
    return result.strip()


def generate_status_update(
    issue_type: str,
    ward_name: str,
    department: str,
    status: str,
    description: str,
) -> str:
    """Generate an official public status update."""
    logger.info(f"Generating status update for {issue_type} in {ward_name}")
    return _run_chain(
        STATUS_UPDATE_TEMPLATE,
        issue_type=issue_type,
        ward_name=ward_name,
        department=department,
        status=status,
        description=description,
    )


def generate_citizen_notification(
    issue_type: str,
    status: str,
    department: str = "Municipal Services",
) -> str:
    """Generate a citizen-facing notification message."""
    logger.info(f"Generating citizen notification for {issue_type}")
    return _run_chain(
        CITIZEN_NOTIFICATION_TEMPLATE,
        issue_type=issue_type,
        status=status,
        department=department,
    )


def generate_ward_summary(
    ward_name: str,
    verified: int,
    resolved: int,
    in_progress: int,
    needs_redo: int,
    flagged: int,
    reported: int,
) -> str:
    """Generate a ward activity summary."""
    logger.info(f"Generating ward summary for {ward_name}")
    return _run_chain(
        WARD_SUMMARY_TEMPLATE,
        ward_name=ward_name,
        verified=verified,
        resolved=resolved,
        in_progress=in_progress,
        needs_redo=needs_redo,
        flagged=flagged,
        reported=reported,
    )
