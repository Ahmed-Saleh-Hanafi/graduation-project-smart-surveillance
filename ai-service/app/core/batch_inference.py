import asyncio
import numpy as np
from typing import List, Tuple
from batch_queue import frame_queue
from config import settings
from model_loader import models


async def batch_inference_frame_loop():
    while True:
        batch: List[Tuple[int, any]] = []

        for _ in range(settings.BATCH_SIZE):
            item = await frame_queue.get()
            batch.append(item)

        cam_ids = [x[0] for x in batch]
        frames = [x[1] for x in batch]

        imgs = np.stack(frames)

        # 🔥 Run models in batch
        weapon_results = models.weapon_model(imgs, device=models.device)
        face_results = models.face_model(imgs, device=models.device)
        abnormal_results = models.abnormal_model(imgs, device=models.device)

        # Process results
        for i, cam_id in enumerate(cam_ids):
            detection = process_results(
                weapon_results[i],
                face_results[i],
                abnormal_results[i]
            )

            if detection:
                asyncio.create_task(handle_detection(cam_id, frames[i], detection))