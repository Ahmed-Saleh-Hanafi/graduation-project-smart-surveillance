from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, HttpUrl
from typing import Dict, List

router = APIRouter()

# In-memory storage (you can replace with DB later)
camera_faces: Dict[int, List[str]] = {}


class FaceRequest(BaseModel):
    cam_id: int
    url_image_face: HttpUrl


@router.post("/add-face")
async def add_face(request: FaceRequest) -> dict:
    """
    Add a face image URL to a specific camera.

    Args:
        request (FaceRequest):
            cam_id (int): Camera ID.
            url_image_face (HttpUrl): URL of the face image.

    Returns:
        dict: Success message with updated count of faces for the camera.

    Raises:
        HTTPException: If the input is invalid.
    """
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
    """
    Remove a face image URL from a specific camera.

    Args:
        request (FaceRequest):
            cam_id (int): Camera ID.
            url_image_face (HttpUrl): URL of the face image.

    Returns:
        dict: Success message with updated count.

    Raises:
        HTTPException: If camera or face does not exist.
    """
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