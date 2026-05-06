from typing import Dict
from app.config import settings

def add_cameras(cameras:Dict[int, str])->None:
    # validation
    if not cameras:
        print("[WARNING] No cameras found.")
        return
    settings.CAMERA_SOURCES = cameras
    print(f"[INFO] Loaded {len(cameras)} cameras.")
