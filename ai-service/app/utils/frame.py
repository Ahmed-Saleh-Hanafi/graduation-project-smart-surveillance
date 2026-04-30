

import cv2

def draw(frame, boxes):
        """
        Draw bounding boxes on frame
        """
        for box in boxes:
            x1, y1, x2, y2 = box
            cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 255, 0), 2)
            
        return frame
    