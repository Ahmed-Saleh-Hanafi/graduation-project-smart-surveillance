import faiss
import numpy as np
import json
from app.config import settings
from utils.validation import validate_path

class FaceDatabase:
    def __init__(self):
        self.dimension = settings.EMB_DIM
        self.index = faiss.IndexFlatIP(self.dimension)
        self.metadata = {}
        self.load()
    
    def load(self):
        validate_path(settings.FACE_DB_PATH,"Not founded file faces.index")
        self.index = faiss.read_index(settings.FACE_DB_PATH)
        validate_path(settings.META_PATH)
        with open(settings.META_PATH, "r") as f:
            self.metadata = json.load(f)
            
    def save(self):
        faiss.write_index(self.index, settings.FACE_DB_PATH)
        with open(settings.META_PATH, "w") as f:
            json.dump(self.metadata, f)
    
    def add_face(self, cam_id, face_id, embedding):
        embedding = np.array([embedding]).astype("float32")
        self.index.add(embedding)
        idx = self.index.ntotal - 1
        self.metadata[str(idx)] = {
            "cam_id": cam_id,
            "face_id": face_id
        }
        self.save()
        return idx

    def search(self, embedding, k=1):
        if self.index.ntotal == 0:
            return None, 0
        query = np.array([embedding]).astype("float32")
        D, I = self.index.search(query, k)
        idx = str(I[0][0])
        if idx in self.metadata:
            return self.metadata[idx], float(D[0][0])
        return None, 0
    
    def delete_face(self, face_id):
        to_keep = []
        new_meta = {}
        for idx, data in self.metadata.items():
            if data["face_id"] != face_id:
                to_keep.append(int(idx))

        if not to_keep:
            self.index = faiss.IndexFlatIP(self.dimension)
            self.metadata = {}
            self.save()
            return
        
        vectors = [self.index.reconstruct(i) for i in to_keep]
        self.index = faiss.IndexFlatIP(self.dimension)
        for new_idx, vec in enumerate(vectors):
            self.index.add(np.array([vec]).astype("float32"))
            old_idx = str(to_keep[new_idx])
            new_meta[str(new_idx)] = self.metadata[old_idx]

        self.metadata = new_meta
        self.save()