# services/alert_service.py

import httpx
from pydantic import BaseModel, HttpUrl


# -----------------------------------
# Alert Schema
# -----------------------------------
class AlertRequest(BaseModel):
    cam_id: int
    type: str          # face / weapon / abnormal
    video_url: HttpUrl


# -----------------------------------
# Send Alert Function
# -----------------------------------
async def send_alert(api_url: str, alert: AlertRequest) -> dict:
    """
    Send alert from AI service to backend.

    Args:
        api_url (str): Backend alert endpoint.
        alert (AlertRequest): Alert payload.

    Returns:
        dict: Backend response.

    Raises:
        httpx.HTTPStatusError: If response status is bad.
        httpx.RequestError: If connection fails.
    """

    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.post(
            api_url,
            json=alert.model_dump()
        )

        response.raise_for_status()

        return response.json()