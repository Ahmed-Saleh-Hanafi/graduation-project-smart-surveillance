import cv2
from torch import nn
import torchvision
import numpy as np 
import torch
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
        B,T,D = x.shape
        x = x.view(B*T, D)
        scores = self.fc(x)
        scores = scores.view(B,T)
        return scores
    

class AbnormalDetection:
    def __init__(self, device):
        self.device = device
        self.feature_extractor = torchvision.models.video.r3d_18(pretrained=True)
        self.feature_extractor.fc = nn.Identity()
        if device == 'cuda':
            self.feature_extractor = self.feature_extractor.to(device)
        self.feature_extractor.eval()
        self.classifer_model = ABLModelV1()
        checkpoint = torch.load(settings.ABNORMAL_MODEL_PATH, map_location=device)
        self.classifer_model.load_state_dict(checkpoint)
        self.classifer_model.eval()
    
    def predict(self, frames): # 16 frame that represent 8 second
        frams = []
        for frame in frames:
            frame = cv2.resize(frame,(112, 112))
            frams.append(frame)
        clip = torch.tensor(frams).float() / 255.0
        with torch.no_grad():
            clip = clip.permute(3,0,1,2)
            clip = clip.unsqueeze(0)
            if self.device == 'cuda':
                clip = clip.to(self.device)
            feat = self.feature_extractor(clip)
            feat = self.feat.squeeze()
            feat = self.feat.cpu().numpy()
            feat = make_segments([feat])
            feat = torch.tensor(feat).float()
            score = self.classifer_model(feat)
            return score
        
        def make_segments(features, num_segments=32):
            total = len(features)
            if total == 0:
                return np.zeros(
                    (num_segments, 512)
                )
            segment_size = max(
                total // num_segments,
                1
            )
            segments = []
            for i in range(num_segments):

                start = i * segment_size

                end = min(
                    (i+1)*segment_size,
                    total
                )

                seg = features[start:end]

                if len(seg) == 0:

                    seg = np.zeros(
                        (1, features.shape[1])
                    )

                seg = np.mean(seg, axis=0)

                segments.append(seg)

            return np.array(segments)