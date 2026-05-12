import logging
import subprocess
from typing import Dict
from app.config import settings
from app.data.faces_dp import FaceDatabase, face_dp

def add_cameras(cameras:Dict[int, str])->None:
    # validation
    if not cameras:
        logging.warning('No cameras found')
        return
    
    if not isinstance(cameras, dict):
        raise TypeError('cameras must be dict like {cam_id: rtsp_url}')

    success_read_camera = 0
    for cam_id , rtsp_url in cameras.items():
        if cam_id == settings.CAMERA_DEVICE_ID: 
            rtsp_url = 0             # for test
        if cam_id != settings.CAMERA_DEVICE_ID:
            if  not check_rtsp(str(rtsp_url)):
                logging.warning(f'can not read stream from: {cam_id} that has rtsp_url: {rtsp_url}')
                continue
        success_read_camera+= 1
        settings.CAMERA_SOURCES[cam_id] = rtsp_url
        logging.info(f'Loaded camera: {cam_id} that has rtsp_url: {rtsp_url}')
        face_dp[str(cam_id)] = FaceDatabase()
    logging.info(f'Loading {success_read_camera} cameras and save them in settings.CAMERA_SOURCES is success')

def check_rtsp(rtsp_url: str)-> bool:
    if not isinstance(rtsp_url, str):
        raise TypeError('RTSP URL must be str')
    
    cmd = [
        'ffprobe',
        '-rtsp_transport',
        'tcp',
        '-v',
        'error',
        '-show_entries',
        'stream=codec_type',
        '-of', 
        'default=noprint_wrappers=1:nokey=1',
        rtsp_url
    ]
    
    try:
        result = subprocess.run(
            cmd,
            stdout= subprocess.PIPE,
            stderr= subprocess.PIPE,
            timeout=5,
            text=True
        )
        if result.returncode == 0 and 'video' in result.stdout:
            return True
        
        return False
    
    except subprocess.TimeoutExpired:
        return False