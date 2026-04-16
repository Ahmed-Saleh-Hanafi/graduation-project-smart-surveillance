"""
The Dataset class is responsible for:
   1- knowing the dataset structure on the disk.
   2- Mapping index to sample
   3- Loading only what config requests 
   4- Appling augmentation according to the transform function
"""

from torch.utils.data import Dataset
from typing import Any, List, Optional
from utils.loading import load_img

class ImageDataset(Dataset):
    """ to represent, manipulate and load a dataset in parallel.

    Args:
        Dataset (_type_): _description_
    """
    def __init__(
        self, 
        img_paths: List[str],
        labels:List[str],
        transform: Optional[Any] = None
        ):
        super().__init__()

        self.img_paths = img_paths
        self.labels = labels
        self.transform = transform
    
    def __len__(self):
        return len(self.img_paths)

    def __getitem__(self, index):
        img_path = self.img_paths[index]
        img = load_img(img_path)
        if self.transform:
            img = self.transform(img)
        return img, self.labels[index]