import os
import uuid
import cv2
from datetime import datetime
from app.config import settings

def save_frame_and_get_url(frame) -> str:
    """
    Save frame as image and return URL path to send to backend
    """
    if frame is None:
        raise ValueError("Frame is None")
    

    if frame.size == 0:
        raise ValueError("Frame is empty")
    
    path_snapshot = settings.SNAPSHOT_IMAGES
    filename = f"{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}_{uuid.uuid4().hex}.jpg"
    file_path = os.path.join(path_snapshot, filename)

    success = cv2.imwrite(file_path, frame)

    if not success:
        raise RuntimeError("Failed to save frame")
    url = os.path.join('/snapshots', filename)

    return url