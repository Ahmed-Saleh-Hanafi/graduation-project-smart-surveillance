

import cv2

def draw(frame, box, confid):
        """
        Draw bounding boxes on frame
        """
        x1, y1, x2, y2 = box.astype(int)
        score = confid

        # draw rectangle
        cv2.rectangle(
            frame,
            (x1, y1),
            (x2, y2),
            (0, 255, 0),
            2
        )

        # label text
        label = f"{score:.2f}"

        cv2.putText(
            frame,
            label,
            (x1, y1 - 10),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.6,
            (0, 255, 0),
            2
        )
        return frame
    