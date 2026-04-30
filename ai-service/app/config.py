import os
import onnxruntime as ort
from utils.get_provider import get_provider

class Settings:
    APP_NAME = "CamGuard"
    
    PROVIDER_IDX = 0
    DEVICE = get_provider(PROVIDER_IDX)["device"]
    
    
    FACE_DB_PATH = r"ai-service\app\data\database\faces.index"
    META_PATH = "app/database/metadata.json"
    EMB_DIM = 512
    DET_MODEL = "buffalo_l"
    
    FRAME_SIZE = (640, 640)
    BATCH_SIZE = 8
    
    SIM_THRESHOLD = 0.55
    PROCESS_FRAME = 5

    CAMERA_SOURCES = {
        
    }
        

settings = Settings()