import numpy as np
import json
from model import DrowsinessDetector, EAR_THRESHOLD, EAR_LOW, MAR_THRESHOLD, \
    FRAMES_CLOSED, FRAMES_MICROSLEEP, FRAMES_DROWSY, FRAMES_CRITICAL, FRAMES_YAWN


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


def evaluate():
    print('VigilEye Threshold Detector — Evaluation')
    print('=' * 60)
    print()
    print('PARAMETERS:')
    print(f'  EAR closed:    < {EAR_THRESHOLD}')
    print(f'  EAR low:       {EAR_LOW}')
    print(f'  MAR yawn:      > {MAR_THRESHOLD}')
    print(f'  Frames closed:     {FRAMES_CLOSED}')
    print(f'  Frames microsleep: {FRAMES_MICROSLEEP}')
    print(f'  Frames drowsy:     {FRAMES_DROWSY}')
    print(f'  Frames critical:   {FRAMES_CRITICAL}')
    print(f'  Frames yawn:       {FRAMES_YAWN}')
    print()

    X_train, X_test, y_train, y_test = generate_synthetic_dataset(n_samples=16000)
    print(f'Training samples: {len(X_train)}, Test samples: {len(X_test)}')
    print(f'Class distribution — Train: {np.bincount(y_train.astype(int))}')
    print(f'                    Test:  {np.bincount(y_test.astype(int))}')
    print()

    ear_history = []
    y_pred = []
    for i in range(len(X_test)):
        f = X_test[i]
        ear_history.append(f[0])
        if len(ear_history) > 60:
            ear_history.pop(0)
        close_counter = sum(1 for e in ear_history[-60:] if e < EAR_THRESHOLD)
        y_pred.append(1 if close_counter >= FRAMES_DROWSY else 0)
    y_pred = np.array(y_pred)

    tn = np.sum((y_test == 0) & (y_pred == 0))
    fp = np.sum((y_test == 0) & (y_pred == 1))
    fn = np.sum((y_test == 1) & (y_pred == 0))
    tp = np.sum((y_test == 1) & (y_pred == 1))
    acc = (tp + tn) / len(y_test)
    prec = tp / (tp + fp) if (tp + fp) > 0 else 0
    rec = tp / (tp + fn) if (tp + fn) > 0 else 0
    f1 = 2 * prec * rec / (prec + rec) if (prec + rec) > 0 else 0

    print('RESULTS:')
    print(f'  Accuracy:      {acc:.4f}')
    print(f'  Precision:     {prec:.4f}')
    print(f'  Recall:        {rec:.4f}')
    print(f'  F1-Score:      {f1:.4f}')
    print()
    print('CONFUSION MATRIX:')
    print(f'                   Predicted')
    print(f'               Normal   Drowsy')
    print(f'  Normal       {tn:5d}  {fp:5d}')
    print(f'  Drowsy       {fn:5d}  {tp:5d}')
    print()

    results = {
        'accuracy': float(acc),
        'precision': float(prec),
        'recall': float(rec),
        'f1_score': float(f1),
        'confusion_matrix': [[int(tn), int(fp)], [int(fn), int(tp)]],
        'thresholds': {
            'ear_closed': EAR_THRESHOLD, 'ear_low': EAR_LOW,
            'mar_yawn': MAR_THRESHOLD,
            'frames_closed': FRAMES_CLOSED, 'frames_microsleep': FRAMES_MICROSLEEP,
            'frames_drowsy': FRAMES_DROWSY, 'frames_critical': FRAMES_CRITICAL,
            'frames_yawn': FRAMES_YAWN,
        },
    }
    with open('evaluation_results.json', 'w') as f:
        json.dump(results, f, indent=2)
    print('Results saved to evaluation_results.json')


if __name__ == '__main__':
    evaluate()
