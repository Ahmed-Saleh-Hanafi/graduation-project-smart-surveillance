from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, HttpUrl
from typing import Dict, List

router = APIRouter()

# In-memory storage
camera_faces: Dict[int, List[str]] = {}


class FaceRequest(BaseModel):
    cam_id: int
    url_image_face: HttpUrl


@router.post("/add-face")
async def add_face(request: FaceRequest) -> dict:
    cam_id = request.cam_id
    face_url = str(request.url_image_face)

    if cam_id not in camera_faces:
        camera_faces[cam_id] = []

    if face_url not in camera_faces[cam_id]:
        camera_faces[cam_id].append(face_url)

    return {
        "isSuccess": True,
        "message": "Face added successfully",
        "cam_id": cam_id,
        "total_faces": len(camera_faces[cam_id]),
    }


@router.delete("/remove-face")
async def remove_face(request: FaceRequest) -> dict:
    cam_id = request.cam_id
    face_url = str(request.url_image_face)

    if cam_id not in camera_faces:
        raise HTTPException(status_code=404, detail="Camera not found")

    if face_url not in camera_faces[cam_id]:
        raise HTTPException(status_code=404, detail="Face not found")

    camera_faces[cam_id].remove(face_url)

    return {
        "isSuccess": True,
        "message": "Face removed successfully",
        "cam_id": cam_id,
        "total_faces": len(camera_faces[cam_id]),
    }