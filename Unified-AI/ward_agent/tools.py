import sys
from pathlib import Path

sys.path.append(str(Path(__file__).parent.parent))
from shared.tools import get_ward_complaints, get_priority_complaints, update_complaint_status

WARD_TOOLS = [get_ward_complaints, get_priority_complaints, update_complaint_status]
