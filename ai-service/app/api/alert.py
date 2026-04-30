import httpx


async def send_alert(api_url: str, alert: AlertRequest) -> dict:
    """
    Send an alert from the AI service to the backend.

    Args:
        api_url (str): Backend endpoint URL for receiving alerts.
        alert (AlertRequest): Alert payload including camera ID,
                              detection type, and video URL.

    Returns:
        dict: Backend response as JSON.

    Raises:
        httpx.HTTPError: If request fails.
    """
    async with httpx.AsyncClient() as client:
        response = await client.post(
            api_url,
            json=alert.model_dump()
        )
        response.raise_for_status()

    return response.json()