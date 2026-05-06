import cv2
import asyncio
from app.core.batch_queue import frame_queue
from app.config import settings
import time

async def camera_worker(cam_id, rtsp_url):
    cap = cv2.VideoCapture(
        0 if rtsp_url == 0 else rtsp_url,
        cv2.CAP_DSHOW if rtsp_url == 0 else cv2.CAP_FFMPEG
    )
    
    
    if not cap.isOpened():
        print(f"[ERROR] Camera {cam_id} not opened")
        return
 
    while True:
        await asyncio.sleep(1)
        
        
        ret, frame = cap.read()

        if not ret:
            continue

        
        frame = cv2.resize(frame, settings.FRAME_SIZE)

        await frame_queue.put((cam_id, frame))