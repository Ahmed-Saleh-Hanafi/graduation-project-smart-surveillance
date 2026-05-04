from fastapi import FastAPI
from comunication.cameras import get_all_cameras
import asyncio
from api.faces import router as face_router

app = FastAPI(title="AI Surveillance Service")

BACKEND_CAMERAS_API = "http://localhost:5198/api/Camera/ai"

@app.on_event("startup")
async def startup_event():
    try:
        cameras = await get_all_cameras(BACKEND_CAMERAS_API)

        if not cameras:
            print("[WARNING] No cameras found.")
            return
        print(cameras)
        print(f"[INFO] Loaded {len(cameras)} cameras.")


    except Exception as e:
        print(f"[ERROR] Failed to load cameras: {e}")
        

@app.get("/")
async def home():
    return {
        "message": "AI Surveillance Service Running"
    }
    
app.include_router(
    face_router,
    prefix="/faces",  
    tags=["Face Management"]
)