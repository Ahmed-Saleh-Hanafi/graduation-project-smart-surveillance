from insightface.app import FaceAnalysis
from app.config import settings

class FaceDetector:
    def __init__(self, device):
        self.app = FaceAnalysis(name=settings.DET_MODEL)
        self.app.prepare(ctx_id=device, det_size=settings.FRAME_SIZE)

    def detect(self, frame):
        return self.app.get(frame)
    
