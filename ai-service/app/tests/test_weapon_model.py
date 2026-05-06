import cv2
import numpy as np
import onnxruntime as ort

# تحميل الموديل
session = ort.InferenceSession("retinaface_mnet025_v2.onnx", providers=['CPUExecutionProvider'])

input_name = session.get_inputs()[0].name

def preprocess(img):
    img = cv2.resize(img, (640, 640))
    img = img.astype(np.float32)
    img -= (104, 117, 123)
    img = np.transpose(img, (2, 0, 1))
    img = np.expand_dims(img, axis=0)
    return img

cap = cv2.VideoCapture(0)

while True:
    ret, frame = cap.read()
    if not ret:
        break

    input_tensor = preprocess(frame)

    outputs = session.run(None, {input_name: input_tensor})

    # ⚠️ decoding محتاج implementation حسب الموديل
    # (دي أهم نقطة — لو عايز أديك decoder جاهز قولّي)

    cv2.imshow("RetinaFace", frame)

    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

cap.release()
cv2.destroyAllWindows()