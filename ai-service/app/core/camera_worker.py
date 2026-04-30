import cv2
from config import settings
from batch_queue import frame_queue


async def camera_worker(cam_id: int, rtsp_url: str):
    """
    Reads stream and pushes frames to batch queue.
    """
    cap = cv2.VideoCapture(rtsp_url)

    fps = cap.get(cv2.CAP_PROP_FPS) or 25
    interval = int(fps / settings.PROCESS_FRAME)

    count = 0

    while True:
        ret, frame = cap.read()
        if not ret:
            continue

        count += 1
        if count % interval != 0:
            continue

        frame = cv2.resize(frame, settings.FRAME_SIZE)

        await frame_queue.put((cam_id, frame))