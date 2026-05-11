import asyncio
from app.core.batch_queue import frame_queue
from app.core.batch_inference import run_inference
from app.config import settings

async def consumer():
    while True:
        batch = []
        
        while len(batch) < settings.BATCH_SIZE:
            item = await frame_queue.get()
            batch.append(item)

        await run_inference(batch)
        