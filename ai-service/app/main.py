from fastapi import FastAPI
from api.cameras import get_all_cameras
import asyncio
from config import settings
from core.camera_worker import camera_worker

app = FastAPI()


@app.on_event(settings.APP_NAME)
async def startup():
    cameras = await get_all_cameras("http://your-backend/api/cameras")
    settings.CAMERA_SOURCES = cameras
    
    # Start workers
    for cam_id, url in cameras.items():
        asyncio.create_task(camera_worker(cam_id, url))
    
    
    # Start batch engine
    asyncio.create_task(batch_inference_loop())