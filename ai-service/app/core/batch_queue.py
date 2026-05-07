import asyncio
from typing import Tuple

# (cam_id, frame, datatime)
frame_queue: asyncio.Queue[Tuple[int, any, str]] = asyncio.Queue(maxsize=100)