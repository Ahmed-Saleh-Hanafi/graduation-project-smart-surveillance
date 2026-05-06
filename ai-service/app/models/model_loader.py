from app.models.face_model import FaceDetector
from app.config import settings

class ModelManager:
    def __init__(self):
        self.device = settings.DEVICE
        print(self.device)
        
    def load_models(self):
        self.face_detector = FaceDetector(self.device['device_id'])

models = ModelManager()
