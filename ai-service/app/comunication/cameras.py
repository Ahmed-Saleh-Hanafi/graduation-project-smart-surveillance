import httpx
from typing import Dict


async def get_all_cameras(api_url: str) -> Dict[int, str]:
    """
    Fetch all cameras from backend API and return:
    {
        cam_id: rtsp_url
    }

    Example:
    {
        1: "rtsp://camera1",
        2: "rtsp://camera2"
    }

    Args:
        api_url (str): Backend endpoint URL.

    Returns:
        Dict[int, str]: Mapping of camera IDs to RTSP URLs.

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

    cameras = data.get("data", [])

    if not isinstance(cameras, list):
        raise ValueError("Invalid API response format: 'data' must be a list.")

    cameras_dict: Dict[int, str] = {}

    for cam in cameras:
        try:
            cam_id = cam["id"]
            rtsp_url = cam["streamUrl"]

            if not isinstance(cam_id, int):
                raise ValueError(f"Camera ID must be int, got {type(cam_id)}")

            if not isinstance(rtsp_url, str):
                raise ValueError(f"RTSP URL must be str, got {type(rtsp_url)}")

            cameras_dict[cam_id] = rtsp_url

        except KeyError as e:
            raise KeyError(f"Missing required camera field: {e}")
    return cameras_dict