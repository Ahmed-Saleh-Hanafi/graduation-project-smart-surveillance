class SimpleTracker:
    def __init__(self):
        self.next_id = 0
        self.tracks = {}
        
    def update(self, faces):
        results = []
        for face in faces:
            track_id = self.next_id
            self.tracks[track_id] = face.bbox
            self.next_id += 1
            results.append({
                "track_id": track_id,
                "face": face
            })
        return results