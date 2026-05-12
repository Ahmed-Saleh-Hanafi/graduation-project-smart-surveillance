import httpx
from pydantic import BaseModel
from app.config import settings

class AlertRequest(BaseModel):
    name: str = "Name"
    description: str = "description"
    type: str          # face / weapon / abnormal
    videoUrl: str = "VideoUrl"
    cameraId: int
    snapshotUrl:str =  "string"


async def send_alert(alert: AlertRequest) -> dict:
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
    api_url = settings.BACKEND_ALERT_API
    async with httpx.AsyncClient(timeout=30.0) as client:
        print("Hamadah Yel3ab")
        json=alert.model_dump()
        print(json)
        response = await client.post(
            api_url,
            json=alert.model_dump()
        )
        print(response)
        response.raise_for_status()
        return response.json()
