import cv2
import time
import asyncio
import numpy as np
from ultralytics import YOLO
from insightface.app import FaceAnalysis
import faiss
from collections import defaultdict

# =========================================================
# CONFIG
# =========================================================

RTSP_URL = "rtsp://username:password@ip:port/stream"

TARGET_FPS = 5
FRAME_INTERVAL = 1.0 / TARGET_FPS

RECOGNITION_INTERVAL = 10  # recognize every N frames per track
SIMILARITY_THRESHOLD = 0.45

# =========================================================
# LOAD YOLO + BYTE TRACK
# =========================================================

model = YOLO("yolov8s.pt")

# =========================================================
# LOAD INSIGHTFACE
# =========================================================

face_app = FaceAnalysis(
    name="buffalo_l",
    providers=["CUDAExecutionProvider", "CPUExecutionProvider"]
)

face_app.prepare(ctx_id=0)

# =========================================================
# FAISS DATABASE
# =========================================================

dimension = 512

faiss_index = faiss.IndexFlatL2(dimension)

known_embeddings = []
known_names = []

# =========================================================
# EXAMPLE DATABASE
# =========================================================

def add_known_person(name, embedding):
    embedding = np.asarray(embedding, dtype=np.float32)

    known_embeddings.append(embedding)
    known_names.append(name)

    faiss_index.add(np.expand_dims(embedding, axis=0))

# =========================================================
# TRACK MEMORY
# =========================================================

track_id_to_name = {}
track_last_recognition = defaultdict(int)

# =========================================================
# ALERT SYSTEM
# =========================================================

async def send_alert(track_id, person_name):
    print(f"[ALERT] Track={track_id} Person={person_name}")

# =========================================================
# FACE RECOGNITION
# =========================================================

def recognize_face(face_embedding):

    if len(known_embeddings) == 0:
        return None, None

    query = np.asarray(face_embedding, dtype=np.float32)
    query = np.expand_dims(query, axis=0)

    distances, indices = faiss_index.search(query, 1)

    distance = distances[0][0]
    idx = indices[0][0]

    if distance < SIMILARITY_THRESHOLD:
        return known_names[idx], distance

    return None, distance

# =========================================================
# MAIN PIPELINE
# =========================================================

async def process_stream():

    cap = cv2.VideoCapture(
        0,
        cv2.CAP_DSHOW
    )

    if not cap.isOpened():
        print("Failed to open RTSP stream")
        return

    prev_time = 0

    while True:

        current_time = time.time()

        # ============================================
        # FRAME SAMPLING -> 5 FPS
        # ============================================

        if current_time - prev_time < FRAME_INTERVAL:
            await asyncio.sleep(0.001)
            continue

        prev_time = current_time

        success, frame = cap.read()

        if not success:
            print("Frame read failed")
            await asyncio.sleep(1)
            continue

        # ============================================
        # YOLO + BYTE TRACK
        # ============================================

        results = model.track(
            frame,
            persist=True,
            tracker="bytetrack.yaml",
            verbose=False,
            classes=[0]  # person only
        )

        annotated_frame = frame.copy()

        if len(results) == 0:
            continue

        result = results[0]

        boxes = result.boxes

        if boxes.id is None:
            continue

        track_ids = boxes.id.cpu().numpy().astype(int)
        xyxy_boxes = boxes.xyxy.cpu().numpy()

        # ============================================
        # PROCESS TRACKS
        # ============================================

        for box, track_id in zip(xyxy_boxes, track_ids):

            x1, y1, x2, y2 = map(int, box)

            person_crop = frame[y1:y2, x1:x2]

            if person_crop.size == 0:
                continue

            # ========================================
            # FACE DETECTION + RECOGNITION
            # ========================================

            track_last_recognition[track_id] += 1

            if track_id not in track_id_to_name or \
               track_last_recognition[track_id] >= RECOGNITION_INTERVAL:

                track_last_recognition[track_id] = 0

                faces = face_app.get(person_crop)

                if len(faces) > 0:

                    best_face = max(
                        faces,
                        key=lambda f: (
                            f.bbox[2] - f.bbox[0]
                        ) * (
                            f.bbox[3] - f.bbox[1]
                        )
                    )

                    embedding = best_face.embedding

                    person_name, distance = recognize_face(embedding)

                    if person_name is not None:

                        track_id_to_name[track_id] = person_name

                        await send_alert(track_id, person_name)

            # ========================================
            # DRAW RESULTS
            # ========================================

            label = f"ID {track_id}"

            if track_id in track_id_to_name:
                label += f" | {track_id_to_name[track_id]}"

            cv2.rectangle(
                annotated_frame,
                (x1, y1),
                (x2, y2),
                (0, 255, 0),
                2
            )

            cv2.putText(
                annotated_frame,
                label,
                (x1, y1 - 10),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.7,
                (0, 255, 0),
                2
            )

        # ============================================
        # DISPLAY
        # ============================================

        cv2.imshow("Surveillance", annotated_frame)

        key = cv2.waitKey(1)

        if key == ord("q"):
            break

    cap.release()
    cv2.destroyAllWindows()

# =========================================================
# RUN
# =========================================================

if __name__ == "__main__":
    asyncio.run(process_stream())