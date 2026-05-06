import time
from app.core.batch_queue import frame_queue
from app.core.batch_inference import run_inference
from app.config import settings
import asyncio

async def consumer():
    batch = []

    while True:
        cam_id, frame = await frame_queue.get()
        batch.append((cam_id, frame))
        #print(frame)
        if len(batch) >= settings.BATCH_SIZE:
            await run_inference(batch.copy())
            batch.clear()