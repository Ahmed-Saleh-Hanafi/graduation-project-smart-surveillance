import asyncio
from typing import Tuple

# (cam_id, frame, datatime)
frame_queue: asyncio.Queue[Tuple[int, any, str]] = asyncio.Queue(maxsize=100)

# alert queue (cam_id, alert_type, timestamp, frames, metadata)
alert_queue: asyncio.Queue[Tuple[int, str, str, any, any]] = asyncio.Queue(maxsize=100)