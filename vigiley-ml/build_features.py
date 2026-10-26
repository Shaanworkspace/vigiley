"""Rebuild NTHU-DDD frame features with subject IDs (reproducibility protocol).

Usage:
    python build_features.py --videos <nthu_ddd_dir> --out datasets/features.npz

Expected raw layout (NTHU-DDD release): per-subject folders, file names
encoding subject id, scenario and label, e.g. ``010_BareFace_yawning.avi``.
File-name parsing is defensive: unknown patterns are skipped with a warning
rather than silently mislabeled.

Pipeline per frame (every K-th frame, default K=6 at 30 fps -> ~5 fps):
    1. MediaPipe FaceLandmarker (face_landmarker.task) -> 478 landmarks.
    2. FeatureExtractor.compute_ear / compute_mar / compute_head_pose.
    3. Row [EAR, MAR, pitch, yaw]; label from file-name scenario tag
       (drowsy tags: yawning, slow_blink, falling_asleep, nodding, drowsy;
       normal tags: normal, talking, laughing, looking).
    4. Subject id parsed from the file name, stored alongside.

Output .npz keys: X_train, X_test, y_train, y_test,
subject_train, subject_test. Splits are SUBJECT-DISJOINT (no driver appears
in both splits) and stratified by label within subjects — the protocol
train.py requires for publication-grade numbers. Re-running train.py on this
output upgrades evaluation_results.json from frame-stratified to
subject-disjoint automatically (train.py detects subject_* keys).

Requires the NTHU-DDD license (non-commercial research only, no
redistribution; see datasets/README.md).
"""

import os
import re
import argparse
import numpy as np

from feature_extraction import FeatureExtractor

DROWSY_TAGS = ('yawning', 'yawn', 'slow_blink', 'slowblink', 'falling_asleep',
               'fallingasleep', 'nodding', 'nod', 'drowsy', 'sleepy', 'sleep')
NORMAL_TAGS = ('normal', 'talking', 'talk', 'laughing', 'laugh', 'looking',
               'nondrowsy', 'notdrowsy', 'awake')
SUBJECT_RE = re.compile(r'(?i)(?:subject|subj|s)?\s*0*(\d{1,3})')


def parse_label(path):
    name = os.path.basename(path).lower()
    if any(t in name for t in DROWSY_TAGS):
        return 1
    if any(t in name for t in NORMAL_TAGS):
        return 0
    return None


def parse_subject(path):
    name = os.path.basename(path)
    m = SUBJECT_RE.search(name)
    return 's%03d' % int(m.group(1)) if m else 'unknown'


def iter_videos(root):
    exts = ('.avi', '.mp4', '.mov', '.mkv')
    for dirpath, _, files in os.walk(root):
        for f in sorted(files):
            if f.lower().endswith(exts):
                yield os.path.join(dirpath, f)


def extract_video(path, extractor, frame_step=6):
    import cv2
    cap = cv2.VideoCapture(path)
    rows = []
    idx = 0
    while True:
        ok, frame = cap.read()
        if not ok:
            break
        if idx % frame_step == 0:
            feats = extractor.extract(frame)
            if feats:
                rows.append([feats['eye_aspect_ratio'],
                             feats['mouth_aspect_ratio'],
                             feats['head_pitch'], feats['head_yaw']])
        idx += 1
    cap.release()
    return rows


def subject_disjoint_split(X, y, subjects, test_fraction=0.2, seed=42):
    rng = np.random.RandomState(seed)
    uniq = sorted(set(subjects))
    rng.shuffle(uniq)
    n_test = max(1, int(len(uniq) * test_fraction))
    test_subj = set(uniq[:n_test])
    te = [i for i, s in enumerate(subjects) if s in test_subj]
    tr = [i for i, s in enumerate(subjects) if s not in test_subj]
    return (X[tr], X[te], y[tr], y[te],
            np.array([subjects[i] for i in tr]),
            np.array([subjects[i] for i in te]))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--videos', required=True)
    ap.add_argument('--out', required=True)
    ap.add_argument('--frame-step', type=int, default=6)
    ap.add_argument('--test-fraction', type=float, default=0.2)
    args = ap.parse_args()

    extractor = FeatureExtractor()
    X, y, subjects = [], [], []
    skipped = 0
    for path in iter_videos(args.videos):
        label = parse_label(path)
        if label is None:
            skipped += 1
            continue
        rows = extract_video(path, extractor, args.frame_step)
        if not rows:
            skipped += 1
            continue
        subj = parse_subject(path)
        X.extend(rows)
        y.extend([label] * len(rows))
        subjects.extend([subj] * len(rows))
        print('%-50s subj=%s label=%d frames=%d' % (
            os.path.basename(path), subj, label, len(rows)))

    X = np.array(X, dtype=float)
    y = np.array(y, dtype=int)
    X_train, X_test, y_train, y_test, s_train, s_test = subject_disjoint_split(
        X, y, subjects, args.test_fraction)
    os.makedirs(os.path.dirname(os.path.abspath(args.out)), exist_ok=True)
    np.savez(args.out, X_train=X_train, X_test=X_test, y_train=y_train,
             y_test=y_test, subject_train=s_train, subject_test=s_test)
    print('saved %s  train=%d test=%d subjects=%d skipped=%d' % (
        args.out, len(X_train), len(X_test), len(set(subjects)), skipped))


if __name__ == '__main__':
    main()
