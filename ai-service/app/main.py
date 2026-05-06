from app.config import settings
from app.comunication.cameras import get_all_cameras
from app.comunication.faces import get_all_faces
from app.utils.add_cameras import add_cameras
from app.data.faces_dp import face_dp
import asyncio
from app.utils.add_faces import add_faces
from app.core.camera_worker import camera_worker
from app.core.consumer import consumer
from app.models.model_loader import models

async def start():
    # get all cameras from backend and add them to settings.CAMERA_SOURCES {cam_id: rtsp_url}
    try:
        cameras = await get_all_cameras(settings.BACKEND_CAMERAS_API)
        add_cameras(cameras)
        print(settings.CAMERA_SOURCES)
    except Exception as e:
        print(f"[ERROR] Failed to load cameras: {e}")
        
    try:
        models.load_models()
        print('loaded models su')
    except Exception as e:
        print(f"[ERROR] Failed to load models {e}")
        
        
    # get all whithlist person from backend and add them to face_dp
    try:
        faces = await get_all_faces(settings.BACKEND_FACE_API)
        print(faces)
        try:
            add_faces(faces)
        except Exception as e:
            print(f'[ERROR] Failed to load faces from faces.index: {e}')
        
    except Exception as e:
        print(f"[ERROR] Failed to get faces from backend: {e}")
    
    
    # assign worker to each camera
    # workers = [
    #     asyncio.create_task(camera_worker(cam_id, url))
    #     for cam_id, url in settings.CAMERA_SOURCES.items()
    # ]
    workers = [asyncio.create_task(camera_worker(1, 0))
       ]
    # consumer
    consum = asyncio.create_task(consumer())

    await asyncio.gather(*workers, consum)

if __name__ == '__main__':
    asyncio.run(start())
    print("CamGuard")
