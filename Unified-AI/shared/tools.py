import os
import httpx
import json
from typing import Dict, Any, List
from langchain_core.tools import tool

# Assuming the Node backend is reachable at http://backend:5001 in Docker
BACKEND_URL = os.getenv("BACKEND_URL", "http://backend:5001")
AGENT_SECRET = "super_agent_bypass_404"

@tool
def get_user_complaints(user_id: str) -> str:
    """Fetch all civic complaints submitted by a specific user (citizen)."""
    try:
        headers = {"x-agent-secret": AGENT_SECRET, "x-agent-user-id": str(user_id), "x-agent-role": "user"}
        response = httpx.get(f"{BACKEND_URL}/complaints/my", headers=headers)
        response.raise_for_status()
        return json.dumps(response.json())
    except Exception as e:
        return json.dumps([{"error": str(e)}])

@tool
def create_complaint(user_id: str, issue_type: str, latitude: float, longitude: float, description: str) -> str:
    """Create a new civic complaint to be processed by the municipality."""
    payload = {
        "text_input": description,
        "latitude": latitude,
        "longitude": longitude
    }
    try:
        headers = {"x-agent-secret": AGENT_SECRET, "x-agent-user-id": str(user_id), "x-agent-role": "user"}
        response = httpx.post(f"{BACKEND_URL}/complaints/create", json=payload, headers=headers)
        response.raise_for_status()
        return json.dumps(response.json())
    except Exception as e:
        return json.dumps({"error": f"Failed to submit complaint: {str(e)}"})

@tool
def get_ward_complaints(ward_id: str) -> str:
    """Fetch all complaints assigned to a specific ward for the Ward Officer."""
    try:
        headers = {"x-agent-secret": AGENT_SECRET, "x-agent-role": "ward_staff"}
        response = httpx.get(f"{BACKEND_URL}/complaints/ward/{ward_id}", headers=headers)
        response.raise_for_status()
        return json.dumps(response.json())
    except Exception as e:
        return json.dumps([{"error": str(e)}])

@tool
def update_complaint_status(complaint_id: str, status: str) -> str:
    """Update the resolution status of a complaint (e.g. 'resolved', 'in_progress', 'rejected')."""
    try:
        headers = {"x-agent-secret": AGENT_SECRET, "x-agent-role": "ward_staff"}
        response = httpx.patch(f"{BACKEND_URL}/complaints/status/{complaint_id}", json={"status": status}, headers=headers)
        response.raise_for_status()
        return json.dumps({"success": True, "message": f"Complaint {complaint_id} updated to {status}."})
    except Exception as e:
        return json.dumps({"error": str(e)})

@tool
def get_priority_complaints(ward_id: str) -> str:
    """Fetch the top priority unresolved complaints that need immediate attention in a ward."""
    try:
        headers = {"x-agent-secret": AGENT_SECRET, "x-agent-role": "ward_staff"}
        response = httpx.get(f"{BACKEND_URL}/complaints/ward/{ward_id}", headers=headers)
        data = response.json()
        if isinstance(data, list):
            # Sort mock prioritization to retrieve top 5 pending
            return json.dumps(sorted([c for c in data if c.get("status") != "resolved"], key=lambda x: x.get("priority_score", 0), reverse=True)[:5])
        return json.dumps([{"error": "Unexpected format"}])
    except Exception as e:
        return json.dumps([{"error": str(e)}])

@tool
def get_heatmap_insights() -> str:
    """Fetch city-wide spatial complaint clusters and statistics for higher level administrators."""
    try:
        headers = {"x-agent-secret": AGENT_SECRET, "x-agent-role": "admin"}
        # City ID 2 points to Delhi in the initialized PostgreSQL database
        response = httpx.get(f"{BACKEND_URL}/map/heatmap/city/2", headers=headers)
        response.raise_for_status()
        data = response.json()
        return json.dumps({"total_hotspots_tracked": len(data), "sample": data[:5]})
    except Exception as e:
        return json.dumps({"error": str(e)})

@tool
def get_public_updates() -> str:
    """Fetch the latest AI generated Public Transparency Updates broadcasted to citizens."""
    try:
        headers = {"x-agent-secret": AGENT_SECRET}
        response = httpx.get(f"{BACKEND_URL}/communication/public-feed", headers=headers)
        response.raise_for_status()
        return json.dumps(response.json())
    except Exception as e:
        return json.dumps([{"error": str(e)}])
