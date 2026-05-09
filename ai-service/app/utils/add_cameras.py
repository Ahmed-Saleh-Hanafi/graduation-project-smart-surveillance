import logging
from typing import Dict
from app.config import settings

def add_cameras(cameras:Dict[int, str])->None:
    # validation
    if not cameras:
        logging.warning('No cameras found')
        return
    
    if not isinstance(cameras, dict):
        raise TypeError('cameras must be dict like {cam_id: rtsp_url}')

    settings.CAMERA_SOURCES = cameras
    for cam_id , rtsp_url in settings.CAMERA_SOURCES.items():
        logging.info(f'Loaded camera: {cam_id} that has rtsp_url: {rtsp_url}')
