import sys
from pathlib import Path

sys.path.append(str(Path(__file__).parent.parent))
from shared.tools import get_heatmap_insights, get_public_updates

# Admins might also query specific wards, but we'll stick to macro insights for simplicity here.
ADMIN_TOOLS = [get_heatmap_insights, get_public_updates]
