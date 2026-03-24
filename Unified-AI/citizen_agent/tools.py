import sys
from pathlib import Path

# Add shared to path for internal imports
sys.path.append(str(Path(__file__).parent.parent))
from shared.tools import get_user_complaints, create_complaint, get_public_updates

# Expose only the tools relevant to a Citizen
CITIZEN_TOOLS = [get_user_complaints, create_complaint, get_public_updates]
