import asyncio
from typing import List, Tuple

# (cam_id, frame)
frame_queue: asyncio.Queue[Tuple[int, any]] = asyncio.Queue(maxsize=100)