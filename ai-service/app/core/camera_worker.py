import cv2
import asyncio
from datetime import datetime
import time
from app.utils.logger import add_log
from app.core.batch_queue import frame_queue
from app.config import settings

async def camera_worker(cam_id: int, rtsp_url: str)-> None:
    """
    Continuously reads frames according to settings.FRAME_INTERVAL from a camera or RTSP stream,
    resizes them, and pushes them into the shared frame queue
    for downstream batch inference.

    Args:
        cam_id (int):
            Unique camera identifier used for tracking the source
            of each frame in multi-camera systems.

        rtsp_url (str):
            RTSP stream URL or 0 for local webcam.

    Raises:
        ValueError:
            If camera ID is invalid or stream URL is empty.

        RuntimeError:
            If the video stream cannot be opened.

    Notes:
        - Uses async sleep to control target FPS.
        - Uses OpenCV FFMPEG backend for RTSP streams.
        - Uses DirectShow backend for webcam access on Windows.
        - Frames are resized before entering the queue to reduce
          GPU inference cost and memory usage.
    """
    # validation
    if not isinstance(cam_id, int):
        raise TypeError("cam_id must be an integer")
    if cam_id < 0:
        raise ValueError("cam_id must be >= 0")

    if rtsp_url != 0 and not isinstance(rtsp_url, str):
        raise TypeError("rtsp_url must be a string or 0")

    if isinstance(rtsp_url, str) and not rtsp_url.strip():
        raise ValueError("rtsp_url cannot be empty")

    if settings.FRAME_INTERVAL <= 0:
        raise ValueError("FRAME_INTERVAL must be > 0")

    if (
        not isinstance(settings.FRAME_SIZE, tuple)
        or len(settings.FRAME_SIZE) != 2
    ):
        raise ValueError(
            "FRAME_SIZE must be tuple(width, height)"
        )
    
    cap = cv2.VideoCapture(
        0 if rtsp_url == 0 else rtsp_url
    )
    
    if not cap.isOpened():
        add_log('error',f"Camera {cam_id} not opened")
        return
    add_log('info',f"Camera {cam_id} started")
    
    try:
        next_frame_time = time.monotonic()
        
        while True:
            # Frame sampling control
            now = time.monotonic()

            if now < next_frame_time:
                await asyncio.sleep(next_frame_time - now)
            
            next_frame_time += settings.FRAME_INTERVAL

            success, frame = await asyncio.to_thread(cap.read)

            if not success or frame is None:
                add_log('warning',f"Failed reading frame from camera {cam_id}")
                await asyncio.sleep(1)
                continue

            # frame validation
            if frame.size == 0:
                add_log('warning',f"Empty frame from camera {cam_id}")
                continue

            # resize frame
            frame = cv2.resize(
                frame,
                settings.FRAME_SIZE
            )

            # push to queue
            if frame_queue.full():
                add_log('warning',f"queue is full")
                frame_queue.get_nowait()
            start_time = str(datetime.now().strftime("%Y-%m-%d_%H-%M-%S"))
            await frame_queue.put((cam_id, frame, start_time))

    except asyncio.CancelledError:
        add_log('info',f"Camera worker {cam_id} cancelled")
        raise

    except Exception as e:
        add_log('error',f"[ERROR] Camera worker {cam_id} crashed: {e}")
        
    finally:
        cap.release()
        add_log('info',f"Camera {cam_id} released")