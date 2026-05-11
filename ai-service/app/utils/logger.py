import os
from datetime import datetime
import logging
from app.config import settings
from app.utils.validation import validate_path

def setup_logs() -> None:
    """
    Create log file inside settings.LOG_PATH with timestamp
    and configure logging system to save logs into file
    """
    validate_path(settings.LOG_PATH, 'Not founded log folder')
    os.makedirs(settings.LOG_PATH, exist_ok=True)
    
    start_time = datetime.now().strftime("%Y-%m-%d_%H-%M-%S")
    log_file = os.path.join(settings.LOG_PATH, f"{start_time}.log")
    
    logging.basicConfig(
        filename=log_file,
        filemode="a",
        level=logging.INFO,
        format="%(asctime)s - %(levelname)s - %(filename)s - %(lineno)d - %(message)s"
    )
    logging.info("Logging system initialized")



def add_log(log_type: str, message: str) -> None :
    """add message to log file

    Args:
        log_type (str): must be in this ['debug', 'info', 'warning', 'error', 'critical']
        message (str): message that to log it
    """
    if not isinstance(log_type, str):
        raise TypeError('log_type must be str')
    if not isinstance(message, str):
        raise TypeError('message must be str')
    
    if log_type not in {'debug', 'info', 'warning', 'error', 'critical'}:
        raise ValueError("log_type must be one of them  ['debug', 'info', 'warning', 'error', 'critical']")
    if message == "":
        raise ValueError('message can not be empty')
    
    log_methods = {
        "debug": logging.debug,
        "info": logging.info,
        "warning": logging.warning,
        "error": logging.error,
        "critical": logging.critical,
    }
    log_methods[log_type](message)
        