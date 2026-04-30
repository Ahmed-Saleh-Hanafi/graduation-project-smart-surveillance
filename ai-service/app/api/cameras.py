import httpx
from typing import Dict


async def get_all_cameras(api_url: str) -> Dict[int, str]:
    """
    Fetch all cameras from the backend API and return a dictionary
    mapping camera ID to its RTSP URL.

    Args:
        api_url (str): The backend endpoint URL for retrieving cameras.

    Returns:
        Dict[int, str]: A dictionary where:
            - key: cam_id (int)
            - value: RTSP URL (str)

    Raises:
        httpx.HTTPError: If the request fails.
        KeyError: If expected fields are missing in the response.
    """
    async with httpx.AsyncClient() as client:
        response = await client.get(api_url)
        response.raise_for_status()

    data = response.json()

    cameras_dict: Dict[int, str] = {}

    if data.get("isSuccess"):
        for cam in data.get("data", []):
            cam_id = cam["id"]
            rtsp_url = cam["streamUrl"]
            cameras_dict[cam_id] = rtsp_url

    return cameras_dict