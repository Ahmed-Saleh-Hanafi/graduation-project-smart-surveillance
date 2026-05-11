import os
import cv2
import logging
from typing import Dict
from app.config import settings
from app.data.faces_dp import face_dp
from app.models.model_loader import models
from app.utils.normalize import normalize


def add_faces(faces: Dict[str, str | int]) -> None:
    # validation
    if not isinstance(faces, dict):
        raise TypeError('faces must be dict like {face_url, camera_id}')
    
    if len(faces) == 0:
        return
    
    if not hasattr(models, "face_detector"):
        raise RuntimeError("Face detector is not initialized")

    
    success_loaded_faces = 0
    for face_url, cam_id in faces.items():
        path = settings.ROOT_IMAGES / face_url
        if not os.path.exists(path):
            logging.warning(f"Failed to read image: {path} in camera: {cam_id} because invalid face_url")
            continue

        img = cv2.imread(str(path))
        if img is None:
            logging.warning(f"Failed to read image: {path} in camera: {cam_id}")
            continue
        detections = models.face_detector.detect(img)
        if not detections:
            logging.warning(f"No face found in: {face_url} camera: {cam_id}")
            continue
        
        face = detections[0] 
        embedding = face.embedding
        embedding = normalize(embedding)
        face_dp[str(cam_id)].add_face(cam_id, face_url, embedding)
        success_loaded_faces+= 1
        logging.info(f'add face: {face_url} camera: {cam_id} is success')
        
    logging.info(f'Loading {success_loaded_faces} faces and save them in whithlist is success')
    