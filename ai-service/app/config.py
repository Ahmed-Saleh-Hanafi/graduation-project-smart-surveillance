from app.utils.get_provider import get_provider
from pathlib import Path

class Settings:
    APP_NAME = "CamGuard"
    
    # api to communicate with backend
    BACKEND_CAMERAS_API = "http://localhost:5198/api/Camera/ai"
    BACKEND_FACE_API = "http://localhost:5198/api/Face/get-all-faces"
    BACKEND_ALERT_API = "http://localhost:5198/api/Detection"
    
    # Mapping of camera IDs to RTSP URLs that is acctive {cam_id: rtsp_url}
    CAMERA_SOURCES = {}
    CAMERA_DEVICE_ID = 1
    # mode must be test or work
    MODE = 'test'     
    
    # get the device that we need to run ai models  {device_id: -1 'cpu'or 0'gpu', provider, device: 'cpu' or 'gpu'}
    PROVIDER_IDX = 0
    DEVICE = get_provider(PROVIDER_IDX)  
    
    # config of face detection and recognition
    EMB_DIM = 512
    
    # Path of folder needed
        # path of start point of project
    BASE_DIR = Path(__file__).resolve().parent.parent.parent
        # path of images in whitlist
    ROOT_IMAGES = BASE_DIR / "backend" / "Smart_Surviellance" / "Smart_Surviellance" / "wwwroot"
        # path snapshot
    SNAPSHOT_IMAGES = BASE_DIR / "backend" / "Smart_Surviellance" / "Smart_Surviellance" / "wwwroot" / "snapshots"
        # path log folder
    LOG_PATH = BASE_DIR / "ai-service" / "app" / "log_files"
    
    # config about processing stream
    FRAME_SIZE = (640, 640)
    BATCH_SIZE = 1
    TARGET_FPS = 3
    FRAME_INTERVAL = 1.0 / TARGET_FPS
    SIMILARITY_THRESHOLD = 0.4
    
    # config about models
    DET_MODEL = "buffalo_l"   
    WEAPON_ONN_MODEL_PATH = BASE_DIR / "ai-service" / "app"/ "models" / "weabon_v1.onnx"
    ABNORMAL_MODEL_PATH = BASE_DIR / "ai-service" / "app"/ "models" / "abnormal_v1.pth"
    WEAPON_THRESHOLD = 0.7
    ABNORMAL_THRESHOLD = 0.6

settings = Settings()