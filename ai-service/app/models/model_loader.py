import torch
from ultralytics import YOLO
from config import settings


class ModelManager:
    def __init__(self):
        self.device = settings.DEVICE

        #self.weapon_model = YOLO("weapon.pt")
        self.face_model = YOLO("face.pt")
        #self.abnormal_model = YOLO("abnormal.pt")

        #self.weapon_model.to(self.device)
        self.face_model.to(self.device)
        #self.abnormal_model.to(self.device)


models = ModelManager()