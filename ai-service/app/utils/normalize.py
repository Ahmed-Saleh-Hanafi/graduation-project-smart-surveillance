import numpy as np

def normalize(emb):
    return emb / np.linalg.norm(emb)