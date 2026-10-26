"""VigilEye threshold-detector evaluation on NTHU-DDD MediaPipe features.

What this script does (and does NOT claim):
  * Loads pre-extracted frame features (EAR, MAR, head pitch, head yaw) with
    binary labels (0 = normal, 1 = drowsy).
  * Compares three frame-level baselines, all tuned ONLY on the train split
    and reported on the held-out test split (no test leakage):
      (i)   fixed defaults:  EAR < EAR_THRESHOLD OR MAR > MAR_THRESHOLD
      (ii)  EAR-only threshold swept on TRAIN for best F1
      (iii) L2 logistic regression (numpy-only) fitted on TRAIN
  * Reports accuracy / precision / recall / F1, confusion matrix, an EAR
    threshold sweep, and Expected Calibration Error (ECE) for (iii).
  * Writes machine-readable artefacts: evaluation_results.json (provenance +
    metrics) and confidence_weights.json (LR parameters consumed by model.py
    so runtime confidence is data-fitted, not hand-tuned).

Honest limitations (stated for the paper, not hidden):
  * The current features.npz carries NO subject IDs, so splits are
    frame-stratified, not subject-disjoint; subject overlap between train and
    test is possible. Use build_features.py (subject-id aware) to regenerate
    features and re-run for a subject-disjoint protocol.
  * Metrics are frame-level; temporal event metrics (episode detection rate,
    false alarms/hour, latency) are future work.

Dataset: NTHU-DDD (Weng, Lai & Lai, ACCV Workshop 2016) — 36 subjects,
~9.5h, 5 scenarios (bareface/glasses/night/sunglasses). Mandatory citation
whenever the data is used.
"""

import os
import json
import hashlib
import numpy as np

from model import EAR_THRESHOLD, EAR_LOW, MAR_THRESHOLD, \
    FRAMES_CLOSED, FRAMES_MICRO, FRAMES_DROWSY, FRAMES_CRITICAL, FRAMES_YAWN

HERE = os.path.dirname(os.path.abspath(__file__))
FEATURES_PATH = os.path.join(HERE, 'datasets', 'features.npz')
RESULTS_PATH = os.path.join(HERE, 'evaluation_results.json')
WEIGHTS_PATH = os.path.join(HERE, 'confidence_weights.json')

EAR_COL, MAR_COL = 0, 1  # feature layout: [EAR, MAR, pitch, yaw]


def sha256_of(path):
    h = hashlib.sha256()
    with open(path, 'rb') as f:
        for chunk in iter(lambda: f.read(1 << 20), b''):
            h.update(chunk)
    return h.hexdigest()


def generate_synthetic_dataset(n_samples=10000):
    np.random.seed(42)
    n = n_samples // 2
    normal_ear = np.random.normal(0.32, 0.03, n)
    normal_mar = np.random.normal(0.30, 0.08, n)
    drowsy_ear = np.random.normal(0.17, 0.05, n)
    drowsy_mar = np.random.normal(0.50, 0.15, n)
    X = np.vstack([
        np.column_stack([normal_ear, normal_mar,
                         np.random.uniform(-10, 10, n), np.random.uniform(-15, 15, n)]),
        np.column_stack([drowsy_ear, drowsy_mar,
                         np.random.uniform(-20, 20, n), np.random.uniform(-25, 25, n)]),
    ])
    y = np.hstack([np.zeros(n), np.ones(n)])
    idx = np.random.permutation(len(X))
    split = int(len(X) * 0.8)
    return X[idx[:split]], X[idx[split:]], y[idx[:split]], y[idx[split:]]


def load_dataset():
    if os.path.exists(FEATURES_PATH):
        data = np.load(FEATURES_PATH)
        keys = set(data.keys())
        subj = None
        for cand in ('subject_train', 'subject_test', 'subjects'):
            if cand in keys:
                subj = cand
                break
        provenance = {
            'file': os.path.basename(FEATURES_PATH),
            'sha256': sha256_of(FEATURES_PATH),
            'keys': sorted(keys),
            'subject_ids_present': subj is not None,
            'label': 'NTHU-DDD (real, MediaPipe features)'
            if subj is not None else
            'NTHU-DDD-derived (real, MediaPipe features; NO subject IDs — frame-stratified split, subject overlap possible)',
        }
        return (data['X_train'], data['X_test'], data['y_train'], data['y_test'],
                provenance)
    X_train, X_test, y_train, y_test = generate_synthetic_dataset(n_samples=16000)
    return X_train, X_test, y_train, y_test, {
        'file': None, 'sha256': None, 'keys': [],
        'subject_ids_present': False,
        'label': 'Synthetic (numpy fallback - NTHU-DDD not found)',
    }


def _metrics(y_true, y_pred):
    y_true = np.asarray(y_true).astype(int)
    y_pred = np.asarray(y_pred).astype(int)
    tn = int(np.sum((y_true == 0) & (y_pred == 0)))
    fp = int(np.sum((y_true == 0) & (y_pred == 1)))
    fn = int(np.sum((y_true == 1) & (y_pred == 0)))
    tp = int(np.sum((y_true == 1) & (y_pred == 1)))
    acc = (tp + tn) / len(y_true)
    prec = tp / (tp + fp) if (tp + fp) > 0 else 0.0
    rec = tp / (tp + fn) if (tp + fn) > 0 else 0.0
    f1 = 2 * prec * rec / (prec + rec) if (prec + rec) > 0 else 0.0
    return {'accuracy': float(acc), 'precision': float(prec), 'recall': float(rec),
            'f1_score': float(f1), 'confusion_matrix': [[tn, fp], [fn, tp]]}


def sigmoid(z):
    z = np.clip(z, -30.0, 30.0)
    return 1.0 / (1.0 + np.exp(-z))


def fit_logistic_regression(X, y, l2=1.0, iters=2000, lr=0.1, seed=0):
    """Full-batch L2 logistic regression on standardized features (numpy-only).

    Returns (w, b, mean, scale). Standardization stats come from TRAIN only.
    """
    rng = np.random.RandomState(seed)
    mean = X.mean(axis=0)
    scale = X.std(axis=0) + 1e-8
    Xs = (X - mean) / scale
    n, d = Xs.shape
    w = rng.randn(d) * 0.01
    b = 0.0
    for _ in range(iters):
        p = sigmoid(Xs @ w + b)
        err = p - y
        grad_w = Xs.T @ err / n + l2 * w / n
        grad_b = err.mean()
        w -= lr * grad_w
        b -= lr * grad_b
    return w, b, mean, scale


def predict_proba(X, w, b, mean, scale):
    return sigmoid(((X - mean) / scale) @ w + b)


def expected_calibration_error(y_true, proba, n_bins=10):
    y_true = np.asarray(y_true).astype(float)
    proba = np.asarray(proba)
    edges = np.linspace(0.0, 1.0, n_bins + 1)
    ece = 0.0
    bins = []
    for i in range(n_bins):
        lo, hi = edges[i], edges[i + 1]
        mask = (proba > lo) & (proba <= hi) if i > 0 else (proba >= lo) & (proba <= hi)
        count = int(mask.sum())
        if count == 0:
            bins.append({'bin': [float(lo), float(hi)], 'count': 0,
                         'accuracy': None, 'mean_confidence': None})
            continue
        acc = float(y_true[mask].mean())
        conf = float(proba[mask].mean())
        ece += abs(acc - conf) * count / len(y_true)
        bins.append({'bin': [float(lo), float(hi)], 'count': count,
                     'accuracy': acc, 'mean_confidence': conf})
    return float(ece), bins


def report(title, y_true, y_pred):
    m = _metrics(y_true, y_pred)
    tn, fp = m['confusion_matrix'][0]
    fn, tp = m['confusion_matrix'][1]
    print(f'  {title}: acc={m["accuracy"]:.4f} prec={m["precision"]:.4f} '
          f'rec={m["recall"]:.4f} f1={m["f1_score"]:.4f}')
    print('               Predicted:   Normal   Drowsy')
    print(f'  Actual Normal   {tn:5d}  {fp:5d}')
    print(f'  Actual Drowsy   {fn:5d}  {tp:5d}')
    return m


def evaluate():
    print('VigilEye Threshold Detector — Evaluation on NTHU-DDD')
    print('=' * 60)
    print()
    print('RUNTIME PARAMETERS:')
    print(f'  EAR closed:    < {EAR_THRESHOLD}')
    print(f'  EAR low:       {EAR_LOW}')
    print(f'  MAR yawn:      > {MAR_THRESHOLD}')
    print(f'  Frames closed:     {FRAMES_CLOSED}')
    print(f'  Frames microsleep: {FRAMES_MICRO}')
    print(f'  Frames drowsy:     {FRAMES_DROWSY}')
    print(f'  Frames critical:   {FRAMES_CRITICAL}')
    print(f'  Frames yawn:       {FRAMES_YAWN}')
    print()

    X_train, X_test, y_train, y_test, provenance = load_dataset()
    print(f'DATA SOURCE: {provenance["label"]}')
    if provenance['sha256']:
        print(f'features sha256: {provenance["sha256"][:16]}...')
    print(f'Training samples: {len(X_train)}, Test samples: {len(X_test)}')
    print(f'Class distribution — Train: {np.bincount(y_train.astype(int))}')
    print(f'                    Test:  {np.bincount(y_test.astype(int))}')
    if not provenance['subject_ids_present'] and provenance['file']:
        print('WARNING: no subject IDs — frame-stratified split only '
              '(subject overlap possible; see module docstring).')
    print()
    print('RESULTS (per-frame prediction on held-out test set; '
          'all tuning on TRAIN only):')
    print()

    # (i) Model fixed defaults (EAR closed OR mouth yawn)
    y_pred_default = (X_test[:, EAR_COL] < EAR_THRESHOLD) | (X_test[:, MAR_COL] > MAR_THRESHOLD)
    res_default = report(
        'EAR<%.2f OR MAR>%.2f (model default)' % (EAR_THRESHOLD, MAR_THRESHOLD),
        y_test, y_pred_default)
    print()

    # (ii) EAR threshold swept on TRAIN (best F1), applied to TEST
    best_f1, best_ear = -1.0, EAR_THRESHOLD
    for ear in np.arange(0.15, 0.45, 0.005):
        pred_tr = X_train[:, EAR_COL] < ear
        m_tr = _metrics(y_train, pred_tr)
        if m_tr['f1_score'] > best_f1:
            best_f1, best_ear = m_tr['f1_score'], ear
    y_pred_tuned = X_test[:, EAR_COL] < best_ear
    res_tuned = report('EAR<%.3f (tuned on TRAIN, best F1)' % best_ear, y_test, y_pred_tuned)
    res_tuned['threshold'] = float(round(best_ear, 3))
    res_tuned['train_best_f1'] = float(best_f1)
    print()

    # EAR sweep table on TEST for the paper figure (thresholds fixed; tuned above)
    sweep = []
    for ear in np.arange(0.15, 0.45, 0.01):
        m = _metrics(y_test, X_test[:, EAR_COL] < ear)
        sweep.append({'ear_threshold': float(round(ear, 2)), 'accuracy': m['accuracy'],
                      'precision': m['precision'], 'recall': m['recall'],
                      'f1_score': m['f1_score']})
    print()

    # (iii) L2 logistic regression fitted on TRAIN (numpy-only)
    w, b, mean, scale = fit_logistic_regression(X_train.astype(float), y_train.astype(float))
    proba_test = predict_proba(X_test.astype(float), w, b, mean, scale)
    y_pred_lr = (proba_test >= 0.5).astype(int)
    res_lr = report('LogReg [EAR,MAR,pitch,yaw] (fitted on TRAIN)', y_test, y_pred_lr)
    ece, bins = expected_calibration_error(y_test, proba_test)
    res_lr['expected_calibration_error'] = ece
    res_lr['reliability_bins'] = bins
    res_lr['coefficients'] = [float(v) for v in w]
    res_lr['intercept'] = float(b)
    print(f'  LogReg ECE (10 bins): {ece:.4f}')
    print()

    weights = {
        'feature_order': ['ear', 'mar', 'pitch', 'yaw'],
        'feature_mean': [float(v) for v in mean],
        'feature_scale': [float(v) for v in scale],
        'coefficients': [float(v) for v in w],
        'intercept': float(b),
        'trained_on': provenance['label'],
        'test_f1': res_lr['f1_score'],
        'test_ece': ece,
        'note': 'Fitted by train.py on TRAIN split only. Consumed by model.py '
                'so runtime confidence for drowsy-family states is data-fitted.',
    }
    with open(WEIGHTS_PATH, 'w') as f:
        json.dump(weights, f, indent=2)
    print(f'Weights saved to {os.path.basename(WEIGHTS_PATH)}')

    results = {
        'dataset': provenance['label'],
        'provenance': provenance,
        'protocol': 'Frame-level classification; stratified train/test split. '
                    'All thresholds and model weights tuned/fitted on TRAIN, '
                    'reported on held-out TEST. Subject-disjoint evaluation '
                    'requires subject IDs (see build_features.py).',
        'fixed_default': res_default,
        'ear_tuned_on_train': res_tuned,
        'logistic_regression': res_lr,
        'ear_sweep_on_test': sweep,
        'thresholds': {
            'ear_closed': EAR_THRESHOLD, 'ear_low': EAR_LOW,
            'mar_yawn': MAR_THRESHOLD,
            'frames_closed': FRAMES_CLOSED, 'frames_microsleep': FRAMES_MICRO,
            'frames_drowsy': FRAMES_DROWSY, 'frames_critical': FRAMES_CRITICAL,
            'frames_yawn': FRAMES_YAWN,
        },
        'limitations': [
            'No subject IDs in current features.npz: train/test subject overlap possible.',
            'MAR is weakly discriminative on NTHU-DDD (talking/laughing in negatives).',
            'Frame-level metrics only; temporal event metrics are future work.',
        ],
    }
    with open(RESULTS_PATH, 'w') as f:
        json.dump(results, f, indent=2)
    print(f'Results saved to {os.path.basename(RESULTS_PATH)}')


if __name__ == '__main__':
    evaluate()
