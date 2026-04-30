from ultralytics import YOLO
import torch

class YOLOv8WeaponDetector:
    def __init__(self, model_size="yolov8n.pt", device=None):
        self.device = device if device else ("cuda" if torch.cuda.is_available() else "cpu")
        self.model = YOLO(model_size)
        self.model.to(self.device)

    def train(self, data_yaml, epochs=50, imgsz=640, batch=16):
        results = self.model.train(
            data=data_yaml,
            epochs=epochs,
            imgsz=imgsz,
            batch=batch,
            device=self.device,
            name="weapon_detector"
        )
        return results

    def validate(self):
        return self.model.val()

    def predict(self, image_path, conf=0.25):
        results = self.model.predict(source=image_path, conf=conf)
        return results

    def export(self, format="onnx"):
        self.model.export(format=format)