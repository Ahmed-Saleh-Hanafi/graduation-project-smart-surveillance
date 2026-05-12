import cv2
import numpy as np
import torch
from torch import nn
import torchvision
from torchvision.models.video import r3d_18, R3D_18_Weights

from app.config import settings


class ABLModelV1(nn.Module):
    def __init__(self, input_dim=512):
        super().__init__()

        self.fc = nn.Sequential(
            nn.Linear(input_dim, 512),
            nn.ReLU(),
            nn.Dropout(0.6),

            nn.Linear(512, 128),
            nn.ReLU(),
            nn.Dropout(0.6),

            nn.Linear(128, 1),
            nn.Sigmoid()
        )

    def forward(self, x):
        return self.fc(x)


class AbnormalDetection:
    def __init__(self, device="cpu"):
        self.device = device
        self.feature_extractor = r3d_18(
            weights=R3D_18_Weights.DEFAULT
        )

        # remove classification layer
        self.feature_extractor.fc = nn.Identity()

        self.feature_extractor = self.feature_extractor.to(device)
        self.feature_extractor.eval()

        # classifier
        self.classifier_model = ABLModelV1().to(device)

        checkpoint = torch.load(
            settings.ABNORMAL_MODEL_PATH,
            map_location=device
        )

        self.classifier_model.load_state_dict(checkpoint)
        self.classifier_model.eval()

        self.mean = torch.tensor(
            [0.43216, 0.394666, 0.37645]
        ).view(3, 1, 1, 1)

        self.std = torch.tensor(
            [0.22803, 0.22145, 0.216989]
        ).view(3, 1, 1, 1)

    def preprocess_frames(self, frames):

        processed = []

        for frame in frames:

            # BGR -> RGB
            frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)

            frame = cv2.resize(frame, (112, 112))

            frame = frame.astype(np.float32) / 255.0

            processed.append(frame)

        clip = np.array(processed)

        # T,H,W,C -> C,T,H,W
        clip = torch.tensor(clip).permute(3, 0, 1, 2)

        clip = (clip - self.mean) / self.std

        return clip

    def predict(self, frames):

        if len(frames) != 16:
            raise ValueError(
                "Model expects exactly 16 frames"
            )

        clip = self.preprocess_frames(frames)

        clip = clip.unsqueeze(0).to(self.device)

        with torch.no_grad():

            # shape => [1, 512]
            feat = self.feature_extractor(clip)

            # classifier
            score = self.classifier_model(feat)

            score = score.squeeze().item()

        return score