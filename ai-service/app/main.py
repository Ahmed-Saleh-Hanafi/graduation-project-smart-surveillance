import asyncio
import logging
import argparse
from app.config import settings
from app.comunication.cameras import get_all_cameras
from app.comunication.faces import get_all_faces
from app.utils.add_cameras import add_cameras
from app.utils.add_faces import add_faces
from app.core.camera_worker import camera_worker
from app.core.consumer import consumer
from app.core.alert_consumer import alert_consumer
from app.models.model_loader import models
from app.utils.logger import setup_logs

async def start(mode: str):
    # validation 
    if not isinstance(mode, str):
        raise TypeError('mode must be string')
    if mode not in ['test', 'work']:
        raise ValueError('mode must be test or work')
    settings.MODE = mode
    
    # setup log file
    setup_logs()
    logging.info("AI Service started")
    logging.info(f"Mode is {settings.MODE}")
    
    # get all cameras from backend and add them to settings.CAMERA_SOURCES {cam_id: rtsp_url}
    try:
        cameras = await get_all_cameras(settings.BACKEND_CAMERAS_API)
        logging.info(f'Get {len(cameras)} cameras from backend')
        add_cameras(cameras)
        settings.BATCH_SIZE = len(cameras)
    except Exception as e:
        logging.error(f'Failed to load cameras from backend: {e}')
        
    # load models in cpu or gpu according to the provider
    try:
        logging.info(f'Device: {settings.DEVICE}')
        loaded_success = models.load_models()
        logging.info(f'Loading {loaded_success} models is success')
    except Exception as e:
        logging.error(f"Failed to load models {e}")
    
    # get all whithlist person from backend and add them to face_dp whithlist
    try:
        faces = await get_all_faces(settings.BACKEND_FACE_API)
        logging.info(f'Get {len(faces)} faces from backend')
        try:
            add_faces(faces)
        except Exception as e:
            logging.error(f'Failed to save faces in whithlist: {e}')
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
    logging.info( f'assign worker to each camera is success {len(workers)}')
    
    # consumer frames
    try:
        consum = asyncio.create_task(consumer())
        logging.info('assign consumer is success')
    except Exception as e:
        logging.error(f"Failed to assign consumer to task {e}")
    
    # consumer alerts
    try:
        consum_alerts = asyncio.create_task(alert_consumer())
        logging.info('assign alert consumer is success')
    except Exception as e:
        logging.error(f"Failed to assign alert consumer to task {e}")
        
    # start workers and consumer {frames, alerts}
    try:
        logging.info('workers and consumers is runing')
        await asyncio.gather(*workers, consum, consum_alerts)
    except Exception as e:
        logging.error(f"Failed to assign run workers and consumer {e}")

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('mode')             # mode {test, work}
    args = parser.parse_args()
    asyncio.run(start(args.mode))
    logging.info("AI Service is stoped")
