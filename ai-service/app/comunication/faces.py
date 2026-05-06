import httpx
from typing import Dict


async def get_all_faces(api_url: str) -> Dict[str, int]:
    """
    Fetch all faces from backend API and return:
    {
        face_url unique: cam_id
    }

    Example:
    {
        "http://face1": 1,
        "http://face2":2
    }

    Args:
        api_url (str): Backend endpoint URL.

    Returns:
        Dict[str, int]: Mapping of face urls to cam IDs.

    Raises:
        httpx.HTTPStatusError: If API response status is not successful.
        httpx.RequestError: If request fails.
        KeyError: If required fields are missing.
        ValueError: If response structure is invalid.
    """

    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.get(api_url)
        response.raise_for_status()

        data = response.json()

    # Validate response structure
    if not isinstance(data, dict):
        raise ValueError("Invalid API response format: expected dictionary.")

    if not data.get("isSuccess", False):
        return {}

    faces = data.get("data", [])

    if not isinstance(faces, list):
        raise ValueError("Invalid API response format: 'data' must be a list.")

    faces_dict: Dict[str, int] = {}

    for face in faces:
        try:
            cam_id = face["cameraId"]
            face_url = face["url"]

            if not isinstance(cam_id, int):
                raise ValueError(f"Camera ID must be int, got {type(cam_id)}")

            if not isinstance(face_url, str):
                raise ValueError(f"URL must be str, got {type(face_url)}")

            faces_dict[face_url] = cam_id

        except KeyError as e:
            raise KeyError(f"Missing required camera field: {e}")

    return faces_dict