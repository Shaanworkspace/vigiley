"""
================================================================================
VIGILEYE — Build real dataset from NTHU-DDD driver drowsiness images
================================================================================

Reads the NTHU-DDD face images (datasets/nthu-ddd/drowsy + notdrowsy),
runs MediaPipe Face Landmarker on each, and extracts the 4 features that
the real-time pipeline uses: EAR, MAR, head pitch, head yaw.

Output: datasets/features.npz  ->  X_train, X_test, y_train, y_test
Each row = [EAR, MAR, pitch, yaw];  label 1 = drowsy, 0 = not drowsy.
================================================================================
"""

import os
import sys
import glob
import numpy as np
import cv2
import random

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from feature_extraction import FeatureExtractor

DATASET_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'datasets', 'nthu-ddd')
OUT_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'datasets', 'features.npz')
RANDOM_SEED = 42
TEST_FRACTION = 0.2


def extract_features(fe, paths, label):
    feats = []
    labels = []
    n = len(paths)
    for i, p in enumerate(paths):
        img = cv2.imread(p)
        if img is None:
            continue
        r = fe.extract(img)
        if r is None:
            continue
        feats.append([r['eye_aspect_ratio'], r['mouth_aspect_ratio'], r['head_pitch'], r['head_yaw']])
        labels.append(label)
        if (i + 1) % 500 == 0:
            print(f'  {i + 1}/{n} processed ({label})')
    return np.array(feats), np.array(labels)


def build():
    drowsy_paths = glob.glob(os.path.join(DATASET_DIR, 'drowsy', '*.jpg'))
    normal_paths = glob.glob(os.path.join(DATASET_DIR, 'notdrowsy', '*.jpg'))
    print(f'NTHU-DDD images -> drowsy: {len(drowsy_paths)}, notdrowsy: {len(normal_paths)}')

    fe = FeatureExtractor()
    try:
        print('Extracting drowsy features...')
        X_drowsy, y_drowsy = extract_features(fe, drowsy_paths, 1)
        print('Extracting notdrowsy features...')
        X_normal, y_normal = extract_features(fe, normal_paths, 0)
    finally:
        fe.release()

    X = np.vstack([X_drowsy, X_normal])
    y = np.hstack([y_drowsy, y_normal])
    print(f'Total extracted samples: {len(X)} (drowsy: {np.sum(y == 1)}, normal: {np.sum(y == 0)})')

    rng = np.random.default_rng(RANDOM_SEED)
    idx = rng.permutation(len(X))
    X, y = X[idx], y[idx]
    split = int(len(X) * (1 - TEST_FRACTION))

    X_train, X_test = X[:split], X[split:]
    y_train, y_test = y[:split], y[split:]

    np.savez_compressed(
        OUT_PATH,
        X_train=X_train, X_test=X_test, y_train=y_train, y_test=y_test,
    )
    print(f'Saved -> {OUT_PATH}')
    print(f'Train: {len(X_train)}, Test: {len(X_test)}')
    print(f'Train distribution: {np.bincount(y_train.astype(int))}')
    print(f'Test  distribution: {np.bincount(y_test.astype(int))}')

    print()
    print('Feature means per class:')
    for name, mask, yv in [('drowsy', y == 1, y), ('normal', y == 0, y)]:
        sub = X[mask]
        print(f'  {name}: EAR={sub[:,0].mean():.4f}  MAR={sub[:,1].mean():.4f}  pitch={sub[:,2].mean():.2f}  yaw={sub[:,3].mean():.2f}')


if __name__ == '__main__':
    build()
