import logging
from app.config import settings
from app.models.face_model import FaceDetector
from app.models.weapon_model import WeaponDetection
from app.models.abnormal_model import AbnormalDetection

class ModelManager:
    def __init__(self):
        self.device = settings.DEVICE
        self.face_detector = None
        self.weapon_detector = None
        self.abnormal_detector = None
        
    def load_models(self):
        loaded_success = 0
        try:
            self.face_detector = FaceDetector(self.device['device_id'])
            loaded_success+=1
            logging.info(f'Loading model face detection in {self.device['device']} is success')
        except Exception as e:
            logging.warning(f'Faild to load model face detection because {e}')
        
        try:
            self.weapon_detector = WeaponDetection(self.device['device'])
            loaded_success+= 1
            logging.info(f'Loading model weapon detection in {self.device['device']} is success')
        except Exception as e:
            logging.warning(f'Faild to load model weapon detection because {e}')
            
        try:
            self.abnormal_detector = AbnormalDetection(self.device['device'])
            loaded_success+= 1
            logging.info(f'Loading model abnormal detection in {self.device['device']} is success')
        except Exception as e:
            logging.warning(f'Faild to load model abnormal detection because {e}')
        
        return loaded_success
        

models = ModelManager()
