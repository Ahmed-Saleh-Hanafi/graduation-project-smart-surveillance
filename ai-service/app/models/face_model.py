

from insightface.app import FaceAnalysis
from app.config import settings

class FaceDetector:
    def __init__(self):
        ctx_id, device = settings.get_provider()
        self.device = device
        self.app = FaceAnalysis(name=settings.DET_MODEL)
        self.app.prepare(ctx_id=ctx_id, det_size=settings.DET_SIZE)

    def detect(self, frame):
        return self.app.get(frame)