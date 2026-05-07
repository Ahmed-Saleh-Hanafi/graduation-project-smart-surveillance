import asyncio
import numpy as np
from typing import List, Tuple
from app.config import settings
from app.models.model_loader import models
from app.data.faces_dp import face_dp
import cv2
import time
from app.utils.normalize import normalize
from app.utils.make_snapshot import save_frame_and_get_url
from app.utils.draw_box_frame import draw
from app.comunication.alert import AlertRequest, send_alert 
from app.data.faces_dp import FaceDatabase

async def run_inference(batch):
    await run_restricted_area_access(batch)
    
    #print("batch size:", len(batch)) 

trak = FaceDatabase()

async def run_restricted_area_access(batch):
    for cam_id, frame, tim in batch:
        faces = models.face_detector.detect(frame)
        for face in faces:
            em = face.embedding
            em = normalize(em)
            met, d = face_dp.search(em)
            print(d)
            if d < 0.35:
                me2, d2 = trak.search(em)
                print('d2', d2)
                if d2 > 0.6: continue
                
                frame = draw(frame, face.bbox, d)
                url = save_frame_and_get_url(frame)
                alert = AlertRequest(
                    cameraId=cam_id,
                    type="face",
                    snapshotUrl=url
                )
                trak.add_face(cam_id, url, em)
                await send_alert(alert)
            
            
    
    