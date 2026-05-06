from app.utils.make_snapshot import save_frame_and_get_url
import cv2

path = r"G:\ahmedsalehAM.jpeg"

img = cv2.imread(path)

url = save_frame_and_get_url(img)
print(url)
