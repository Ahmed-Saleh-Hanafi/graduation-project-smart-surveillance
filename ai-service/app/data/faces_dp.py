import faiss
import numpy as np
from app.config import settings

class FaceDatabase:
    def __init__(self):
        self.dimension = settings.EMB_DIM
        self.index = faiss.IndexFlatIP(self.dimension)
        self.metadata = {}
        
    def clear(self):
        self.dimension = settings.EMB_DIM
        self.index = faiss.IndexFlatIP(self.dimension)
        self.metadata = {}
        
    def add_face(self, cam_id, face_url, embedding):
        embedding = np.array([embedding]).astype("float32")
        self.index.add(embedding)
        idx = self.index.ntotal - 1
        self.metadata[str(idx)] = {
            "cam_id": cam_id,
            "face_url": face_url
        }

    def search(self, embedding, k=1):
        if self.index.ntotal == 0:
            return None, 0
        query = np.array([embedding]).astype("float32")
        D, I = self.index.search(query, k)
        idx = str(I[0][0])
        if idx in self.metadata:
            return self.metadata[idx], float(D[0][0])
        return None, 0


face_dp = {}  # cam_id , face database