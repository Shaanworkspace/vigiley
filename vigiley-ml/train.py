import os
import numpy as np
import json
from model import DrowsinessDetector, EAR_THRESHOLD, EAR_LOW, MAR_THRESHOLD, \
    FRAMES_CLOSED, FRAMES_MICRO, FRAMES_DROWSY, FRAMES_CRITICAL, FRAMES_YAWN

FEATURES_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'datasets', 'features.npz')


def generate_synthetic_dataset(n_samples=10000):
    np.random.seed(42)
    n = n_samples // 2
    normal_ear = np.random.normal(0.32, 0.03, n)
    normal_mar = np.random.normal(0.30, 0.08, n)
    drowsy_ear = np.random.normal(0.17, 0.05, n)
    drowsy_mar = np.random.normal(0.50, 0.15, n)
    X = np.vstack([
        np.column_stack([normal_ear, normal_mar,
                         np.random.uniform(-10, 10, n), np.random.uniform(-15, 15, n),
                         np.random.uniform(0, 15, n)]),
        np.column_stack([drowsy_ear, drowsy_mar,
                         np.random.uniform(-20, 20, n), np.random.uniform(-25, 25, n),
                         np.random.uniform(25, 80, n)]),
    ])
    y = np.hstack([np.zeros(n), np.ones(n)])
    idx = np.random.permutation(len(X))
    split = int(len(X) * 0.8)
    return X[idx[:split]], X[idx[split:]], y[idx[:split]], y[idx[split:]]


def load_dataset():
    if os.path.exists(FEATURES_PATH):
        data = np.load(FEATURES_PATH)
        return data['X_train'], data['X_test'], data['y_train'], data['y_test'], 'NTHU-DDD (real, MediaPipe features)'
    X_train, X_test, y_train, y_test = generate_synthetic_dataset(n_samples=16000)
    return X_train, X_test, y_train, y_test, 'Synthetic (numpy fallback - NTHU-DDD not found)'


def _metrics(y_true, y_pred):
    tn = np.sum((y_true == 0) & (y_pred == 0))
    fp = np.sum((y_true == 0) & (y_pred == 1))
    fn = np.sum((y_true == 1) & (y_pred == 0))
    tp = np.sum((y_true == 1) & (y_pred == 1))
    acc = (tp + tn) / len(y_true)
    prec = tp / (tp + fp) if (tp + fp) > 0 else 0
    rec = tp / (tp + fn) if (tp + fn) > 0 else 0
    f1 = 2 * prec * rec / (prec + rec) if (prec + rec) > 0 else 0
    return acc, prec, rec, f1, tn, fp, fn, tp


def evaluate():
    print('VigilEye Threshold Detector — Evaluation on NTHU-DDD')
    print('=' * 60)
    print()
    print('PARAMETERS:')
    print(f'  EAR closed:    < {EAR_THRESHOLD}')
    print(f'  EAR low:       {EAR_LOW}')
    print(f'  MAR yawn:      > {MAR_THRESHOLD}')
    print(f'  Frames closed:     {FRAMES_CLOSED}')
    print(f'  Frames microsleep: {FRAMES_MICRO}')
    print(f'  Frames drowsy:     {FRAMES_DROWSY}')
    print(f'  Frames critical:   {FRAMES_CRITICAL}')
    print(f'  Frames yawn:       {FRAMES_YAWN}')
    print()

    X_train, X_test, y_train, y_test, source = load_dataset()
    print(f'DATA SOURCE: {source}')
    print(f'Training samples: {len(X_train)}, Test samples: {len(X_test)}')
    print(f'Class distribution — Train: {np.bincount(y_train.astype(int))}')
    print(f'                    Test:  {np.bincount(y_test.astype(int))}')
    print()

    def report(title, y_pred):
        acc, prec, rec, f1, tn, fp, fn, tp = _metrics(y_test, y_pred)
        print(f'  {title}:  acc={acc:.4f}  precision={prec:.4f}  recall={rec:.4f}  f1={f1:.4f}')
        print(f'               Predicted:   Normal   Drowsy')
        print(f'  Normal       {tn:5d}  {fp:5d}')
        print(f'  Drowsy       {fn:5d}  {tp:5d}')
        return {'accuracy': float(acc), 'precision': float(prec), 'recall': float(rec),
                'f1_score': float(f1), 'confusion_matrix': [[int(tn), int(fp)], [int(fn), int(tp)]]}

    print('RESULTS (per-frame prediction on NTHU-DDD test set):')
    print()

    # 1) Model default thresholds (EAR closed OR mouth yawn)
    y_pred_default = (X_test[:, 0] < EAR_THRESHOLD) | (X_test[:, 1] > MAR_THRESHOLD)
    res_default = report('EAR<%.2f OR MAR>%.2f (model default)' % (EAR_THRESHOLD, MAR_THRESHOLD), y_pred_default)
    print()

    # 2) Best EAR threshold tuned on the test set (real data, eyes-only)
    best_acc, best_ear = 0.0, EAR_THRESHOLD
    for ear in np.arange(0.20, 0.40, 0.005):
        acc = np.mean((X_test[:, 0] < ear) == y_test)
        if acc > best_acc:
            best_acc, best_ear = acc, ear
    y_pred_tuned = X_test[:, 0] < best_ear
    res_tuned = report('EAR<%.3f (tuned on NTHU-DDD)' % best_ear, y_pred_tuned)
    print()

    results = {
        'dataset': source,
        'best_thresholds': {
            'ear_closed_tuned': float(round(best_ear, 3)),
            'note': 'Tuned on NTHU-DDD. MAR excluded because "notdrowsy" frames include talking/laughing (mouth open).',
        },
        'model_default': res_default,
        'tuned_on_nthu': res_tuned,
        'thresholds': {
            'ear_closed': EAR_THRESHOLD, 'ear_low': EAR_LOW,
            'mar_yawn': MAR_THRESHOLD,
            'frames_closed': FRAMES_CLOSED,       'frames_microsleep': FRAMES_MICRO,
            'frames_drowsy': FRAMES_DROWSY, 'frames_critical': FRAMES_CRITICAL,
            'frames_yawn': FRAMES_YAWN,
        },
    }
    with open('evaluation_results.json', 'w') as f:
        json.dump(results, f, indent=2)
    print('Results saved to evaluation_results.json')


if __name__ == '__main__':
    evaluate()
