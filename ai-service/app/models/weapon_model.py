import cv2
import torch
import numpy as np
from ultralytics import YOLO
from app.config import settings


class WeaponDetection:
    def __init__(self, device):
        self.model = YOLO(settings.WEAPON_ONN_MODEL_PATH)
        self.conf = settings.WEAPON_THRESHOLD
        self.imgsz = settings.FRAME_SIZE[0]
        self.device = device


    def predict(self, frame):
        results = self.model.predict(
            source=frame,
            conf=self.conf,
        )

        return results