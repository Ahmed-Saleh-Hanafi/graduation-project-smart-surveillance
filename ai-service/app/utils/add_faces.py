from typing import Dict
from app.config import settings
from app.data.faces_dp import face_dp
import os
from app.models.model_loader import models
from app.utils.normalize import normalize
import cv2 

def add_faces(faces: Dict[str, int]) -> None:
    if not hasattr(models, "face_detector"):
        raise RuntimeError("Face detector is not initialized")

    for face_url, cam_id in faces.items():
        path = os.path.join(settings.ROOT_IMAGES, face_url)

        img = cv2.imread(path)
        if img is None:
            print(f"[WARN] Failed to read image: {path}")
            continue

        detections = models.face_detector.detect(img)

        if not detections:
            print(f"[WARN] No face found in: {face_url}")
            continue

        face = detections[0] 
        em = face.embedding
        em = normalize(em)
        face_dp.add_face(cam_id, face_url, em)

    print(face_dp.metadata)
    