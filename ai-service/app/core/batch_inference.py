import asyncio
import numpy as np
from typing import List, Tuple
from app.config import settings
from app.models.model_loader import models
from app.data.faces_dp import face_dp
import cv2
from app.utils.normalize import normalize
from app.utils.make_snapshot import save_frame_and_get_url
from app.utils.draw_box_frame import draw

async def run_inference(batch):
    frames = [f for _, f in batch]
    cam_ids = [c for c, _ in batch]
    for cam_id, frame in batch:
        faces = models.face_detector.detect(frame)
        for face in faces:
            em = face.embedding
            em = normalize(em)
            met, d = face_dp.search(em)
            print(met, d)
            print(face.bbox)
            if d < 0.5:
                frame = draw(frame, face.bbox, d)
                url = save_frame_and_get_url(frame)
                print(url)
            
    print("batch size:", len(batch)) 
    
    