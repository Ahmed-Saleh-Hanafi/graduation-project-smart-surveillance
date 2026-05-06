from app.utils.get_provider import get_provider

class Settings:
    APP_NAME = "CamGuard"
    
    # api to communicate with backend
    BACKEND_CAMERAS_API = "http://localhost:5198/api/Camera/ai"
    BACKEND_FACE_API = "http://localhost:5198/api/Face/get-all-faces"
    BACKEND_ALERT_API = "http://localhost:5198/api/Detection"
    
    # Mapping of camera IDs to RTSP URLs that is acctive 
    CAMERA_SOURCES = {
        
    }
    
    # get the device that we need to run ai models
    PROVIDER_IDX = 0
    DEVICE = get_provider(PROVIDER_IDX)
    
    # config of face 
    FACE_DB_PATH = r"D:\GitHub\graduation-project-smart-surveillance\ai-service\app\data\database\faces.index"
    META_PATH = r"D:\GitHub\graduation-project-smart-surveillance\ai-service\app\data\database\metadata.json"
    EMB_DIM = 512
    ROOT_IMAGES = r"D:\GitHub\graduation-project-smart-surveillance\backend\Smart_Surviellance\Smart_Surviellance\wwwroot"
    SNAPSHOT_IMAGES = r"D:\GitHub\graduation-project-smart-surveillance\ai-service\app\data\database\snapshots"
    # config about processing stream
    FRAME_SIZE = (640, 640)
    BATCH_SIZE = 1
    MAX_WAIT = 0.05
    
    DET_MODEL = "buffalo_l"
    SIM_THRESHOLD = 0.55
    PROCESS_FRAME = 5


settings = Settings()