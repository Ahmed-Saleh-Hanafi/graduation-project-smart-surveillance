import cv2

def test_camera():
    cap = cv2.VideoCapture(0, cv2.CAP_DSHOW) 
    print("Camera opened:", cap.isOpened())

    while True:
        ret, frame = cap.read()

        if not ret:
            print("Failed to read frame")
            break

        cv2.imshow("TEST CAMERA", frame)

        if cv2.waitKey(1) & 0xFF == ord('q'):
            break

    cap.release()
    cv2.destroyAllWindows()


test_camera()