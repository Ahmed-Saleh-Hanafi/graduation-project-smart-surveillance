
import torch
from torchvision.io import read_image
from ai.train.utils.validation import validate_path

def load_img(img_path: str)-> torch.tensor:
        """To load image from hard disk
        
        Args:
            img_path (str): Full image path in hard disk
        Raises:
            FileNotFoundError:
                If image path is not correct.
        Return: 
            torch.tensor with shape [C, H, W]
        """
        validate_path(img_path, "This path is not valid")
        img = read_image(img_path) 
        return img 