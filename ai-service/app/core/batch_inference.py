import asyncio
import logging
import cv2
import time
from typing import List, Tuple
from app.config import settings
from app.models.model_loader import models
from app.data.faces_dp import face_dp
from app.utils.normalize import normalize
from app.utils.make_snapshot import save_frame_and_get_url
from app.utils.draw_box_frame import draw
from app.comunication.alert import AlertRequest, send_alert 
from app.data.faces_dp import FaceDatabase
from app.core.batch_queue import alert_queue

cam_id_frames = {} 
async def run_inference(batch):
    for cam_id, frame, tim in batch:
        if cam_id in cam_id_frames:
            cam_id_frames[cam_id]['frames'].append(frame)
            cam_id_frames[cam_id]['time'].append(tim)
        else: cam_id_frames[cam_id] = {'frames':[], 'time':[]}
        
    await asyncio.gather(
        run_restricted_area_access(batch),
        run_weapon(batch),
        run_abnormal()
    )
    

trak = FaceDatabase()

async def run_restricted_area_access(batch):
    for cam_id, frame, tim in batch:
        faces = models.face_detector.detect(frame)
        print(tim)
        for face in faces:
            embedding = face.embedding
            embedding = normalize(embedding)
            met, d = face_dp[str(cam_id)].search(embedding)
            print(d)
            if d < 0.35:
                me2, d2 = trak.search(embedding)
                print('d2', d2)
                
                if d2!=None and d2 > 0.6: continue
                
                try:
                    alert_queue.put_nowait(
                        (
                            cam_id,
                            "face",
                            tim,
                            frame,
                            {
                                "bbox": face.bbox,
                                "score": d
                            }
                        )
                    )
                    trak.add_face(cam_id, '66', embedding)
                except asyncio.QueueFull:
                    pass
                
                
            
weapon_cooldown = {}
       
async def run_weapon(batch: List[Tuple[int, any, str]])-> None:
    # frames = []
    # metadata = []
    # for cam_id, frame, tim in batch:
    #     frames.append(frame)
    #     metadata.append((cam_id, tim))
    for cam_id, frame, tim in batch:
        results = models.weapon_detector.predict(frame)

        for result in results:

            if len(result.boxes) == 0:
                continue

            now = time.time()
            last = weapon_cooldown.get(cam_id, 0)

            # cooldown per camera
            if now - last < 10:
                continue

            weapon_cooldown[cam_id] = now

            try:
                alert_queue.put_nowait(
                    (
                        cam_id,
                        "weapon",
                        tim,
                        frame,
                        {
                            "bboxs": result.boxes,
                        }
                    )
                )

            except asyncio.QueueFull:
                pass


async def run_abnormal():
    for key in cam_id_frames.keys():
        if len(cam_id_frames[key]['frames']) >= 16:
            score = models.abnormal_detector.predict(cam_id_frames[key]['frames'][:16])
            print(score)
            if score > settings.ABNORMAL_THRESHOLD:
                try:
                    alert_queue.put_nowait(
                        (
                            key,
                            "abnormal",
                            cam_id_frames[key]['time'][7],
                            cam_id_frames[key]['frames'][7],
                            {
                                "bboxs": 'No',
                            }
                        )
                    )

                except asyncio.QueueFull:
                    pass
            cam_id_frames[key] =  {'frames':[], 'time':[]}
            
    
