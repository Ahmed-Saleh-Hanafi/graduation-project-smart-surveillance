import os

def validate_path (path: str, error_msg: str| None = None)-> None :
    """ To validate that the path is correct

    Args:
        path (str): path of the file
        error_msg (str): error massage if path is not correct

    Raises:
        FileNotFoundError: the path is not correct
    """
    if not os.path.exists(path):
        raise FileNotFoundError(f"{error_msg} {path}")
    
