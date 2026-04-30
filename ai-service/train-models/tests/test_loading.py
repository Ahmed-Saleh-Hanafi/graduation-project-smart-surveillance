import unittest
from ai.train.utils.loading import load_img


class TestLoading(unittest.TestCase):
    def test_valid(self):
        valid_img_path = r"D:\GitHub\projects\graduation-project-smart-surveillance\imgs\logo.jpeg"
        img = load_img (valid_img_path)
        print(img)
        
    def test_invalid(self):
        invalid_img_path = r"D:\GitHub\projects\graduation-project-smart-surveillance\imgs\logo5.jpeg"
        with self.assertRaises(FileNotFoundError):
            img = load_img (invalid_img_path)
            print(img)
        
if __name__ == '__main__':
    unittest.main()