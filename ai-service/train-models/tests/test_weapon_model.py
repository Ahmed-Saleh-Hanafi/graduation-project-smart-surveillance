import cv2
from ultralytics import YOLO


onnx_model_path = r"C:\Users\engah\Downloads\weapon_detection_yolov8_samll_100epoch_32batch_imgsz640.onnx"
model = YOLO(onnx_model_path)

camera_source = 0

cap = cv2.VideoCapture(camera_source)


cap.set(cv2.CAP_PROP_FRAME_WIDTH, 1280)
cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 720)

if not cap.isOpened():
    print("Error: Cannot open camera")
    exit()

while True:
    ret, frame = cap.read()

    if not ret:
        print("Failed to read frame")
        break

    results = model(frame, conf=0.5)  

    for result in results:
        for box in result.boxes:
            x1, y1, x2, y2 = map(int, box.xyxy[0])

            conf = float(box.conf[0])

            cls_id = int(box.cls[0])

            label = model.names[cls_id]

            cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 255, 0), 2)

            text = f"{label} {conf:.2f}"
            cv2.putText(
                frame,
                text,
                (x1, y1 - 10),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.6,
                (0, 255, 0),
                2
            )

 
    cv2.imshow("Weapon Detection", frame)

    if cv2.waitKey(1) & 0xFF == ord("q"):
        break


cap.release()
cv2.destroyAllWindows()