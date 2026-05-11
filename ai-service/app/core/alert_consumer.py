import asyncio
from app.core.batch_queue import alert_queue
from app.config import settings
from app.utils.draw_box_frame import draw
from app.utils.make_snapshot import save_frame_and_get_url
from app.comunication.alert import AlertRequest, send_alert

async def alert_consumer():
    # alert queue (cam_id, type, datatime, frames, info)
    while True:
        alert = await alert_queue.get()
        await process_alert(alert)
            
async def process_alert(alert):
    cam_id, type, datatime, frame, info = alert

    if type == 'face':
       
        frame = await draw(frame, info['bbox'], info['score'])
        url = save_frame_and_get_url(frame)
        alert = AlertRequest(
            cameraId=int(cam_id),
            type="face",
            snapshotUrl=str(url)
        )
        await send_alert(alert)
        
    elif type == 'weapon':
        boxes = info['bboxs']
        print('HHHHHHHHHHHHHHH')
        print(frame)
        for box in boxes:
            xyxy = box.xyxy[0].cpu().numpy()
            frame = await draw(
                frame,
                xyxy,
                float(box.conf[0])
            )

        # save image once
        url = save_frame_and_get_url(frame)

        alert = AlertRequest(
            cameraId=int(cam_id),
            type="weapon",
            snapshotUrl=url
        )

        await send_alert(alert)