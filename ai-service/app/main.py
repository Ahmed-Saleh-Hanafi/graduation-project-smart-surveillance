import asyncio
from app.config import settings
from app.comunication.cameras import get_all_cameras
from app.comunication.faces import get_all_faces
from app.utils.add_cameras import add_cameras
from app.utils.add_faces import add_faces
from app.core.camera_worker import camera_worker
from app.core.consumer import consumer
from app.models.model_loader import models
from app.utils.logger import setup_logs
import logging

async def start():
    # setup log file
    setup_logs()
    logging.info("AI Service started")
    
    # get all cameras from backend and add them to settings.CAMERA_SOURCES {cam_id: rtsp_url}
    try:
        cameras = await get_all_cameras(settings.BACKEND_CAMERAS_API)
        add_cameras(cameras)
        logging.info(f'Loaded {len(cameras)} cameras')
    except Exception as e:
        logging.error(f'Failed to load cameras: {e}')
        
    # load models in cpu or gpu according to the provider
    try:
        models.load_models()
        logging.info('Loading models is success')
    except Exception as e:
        logging.error(f"Failed to load models {e}")
    
    # get all whithlist person from backend and add them to face_dp whithlist
    try:
        faces = await get_all_faces(settings.BACKEND_FACE_API)
        try:
            add_faces(faces)
        except Exception as e:
            logging.error(f'Failed to save faces in whithlist: {e}')
        logging.info(f'Loading {len(faces)} faces and save them in whithlist is success')
    except Exception as e:
        logging.error(f"Failed to get faces from backend: {e}")
    
    # assign worker to each camera
    if settings.MODE == 'test':
        workers = [asyncio.create_task(camera_worker(list(settings.CAMERA_SOURCES.keys())[0], 0))]
    else:
        workers = [
            asyncio.create_task(camera_worker(cam_id, url))
            for cam_id, url in settings.CAMERA_SOURCES.items()
        ]
    logging.info(f'The mode is {settings.MODE}')
    logging.info( f'assign worker to each camera is success {len(workers)}')
    
    # consumer
    try:
        consum = asyncio.create_task(consumer())
        logging.info('assign consumer is success')
    except Exception as e:
        logging.error(f"Failed to assign consumer to task {e}")
    
    # start workers and consumer
    try:
        logging.info('workers and consumer is runing')
        await asyncio.gather(*workers, consum)
    except Exception as e:
        logging.error(f"Failed to assign run workers and consumer {e}")

if __name__ == '__main__':
    asyncio.run(start())
    logging.info("AI Service is stoped")
