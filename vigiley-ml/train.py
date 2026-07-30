import numpy as np
import json
from sklearn.metrics import classification_report, confusion_matrix, accuracy_score
from model import DrowsinessDetector, EAR_THRESHOLD, MAR_THRESHOLD, CLOSE_FRAMES, YAWN_FRAMES

def generate_synthetic_dataset(n_samples=10000):
    np.random.seed(42)
    n = n_samples // 2
    normal_ear = np.random.normal(0.30, 0.04, n)
    normal_mar = np.random.normal(0.35, 0.08, n)
    drowsy_ear = np.random.normal(0.18, 0.05, n)
    drowsy_mar = np.random.normal(0.50, 0.15, n)
    X = np.vstack([
        np.column_stack([normal_ear, normal_mar, np.random.uniform(-10,10,n), np.random.uniform(-15,15,n), np.random.uniform(0,20,n)]),
        np.column_stack([drowsy_ear, drowsy_mar, np.random.uniform(-20,20,n), np.random.uniform(-25,25,n), np.random.uniform(20,80,n)]),
    ])
    y = np.hstack([np.zeros(n), np.ones(n)])
    idx = np.random.permutation(len(X))
    split = int(len(X) * 0.8)
    return X[idx[:split]], X[idx[split:]], y[idx[:split]], y[idx[split:]]

def threshold_predict(features, ear_history):
    ear = features[0]
    close_counter = sum(1 for e in ear_history[-60:] if e < EAR_THRESHOLD) if ear_history else 0
    return 1 if close_counter >= CLOSE_FRAMES else 0

def evaluate():
    print('Loading dataset...')
    X_train, X_test, y_train, y_test = generate_synthetic_dataset(n_samples=16000)
    print(f'Training samples: {len(X_train)}, Test samples: {len(X_test)}')
    print(f'Class distribution - Train: {np.bincount(y_train.astype(int))}')
    print(f'                   Test:  {np.bincount(y_test.astype(int))}')
    ear_history = []
    y_pred = []
    for i in range(len(X_test)):
        f = X_test[i]
        ear_history.append(f[0])
        if len(ear_history) > 60:
            ear_history.pop(0)
        y_pred.append(threshold_predict(f, ear_history))
    y_pred = np.array(y_pred)
    print(f'\nThreshold-based detector (EAR<{EAR_THRESHOLD} for {CLOSE_FRAMES}f)')
    print(f'Test Accuracy: {accuracy_score(y_test, y_pred):.4f}')
    print(f'\nClassification Report:')
    print(classification_report(y_test, y_pred, target_names=['Normal', 'Drowsy']))
    print(f'Confusion Matrix:')
    print(confusion_matrix(y_test, y_pred))
    tn, fp, fn, tp = confusion_matrix(y_test, y_pred).ravel()
    precision = tp / (tp + fp) if (tp + fp) > 0 else 0
    recall = tp / (tp + fn) if (tp + fn) > 0 else 0
    f1 = 2 * precision * recall / (precision + recall) if (precision + recall) > 0 else 0
    print(f'\nPrecision: {precision:.4f}')
    print(f'Recall:    {recall:.4f}')
    print(f'F1-Score:  {f1:.4f}')
    print(f'\nThresholds used: EAR<{EAR_THRESHOLD}, MAR>{MAR_THRESHOLD}, Close frames={CLOSE_FRAMES}, Yawn frames={YAWN_FRAMES}')
    results = {
        'accuracy': float(accuracy_score(y_test, y_pred)),
        'precision': float(precision),
        'recall': float(recall),
        'f1_score': float(f1),
        'confusion_matrix': confusion_matrix(y_test, y_pred).tolist(),
        'thresholds': {'ear': EAR_THRESHOLD, 'mar': MAR_THRESHOLD, 'close_frames': CLOSE_FRAMES, 'yawn_frames': YAWN_FRAMES},
    }
    with open('evaluation_results.json', 'w') as f:
        json.dump(results, f, indent=2)
    print('\nResults saved to evaluation_results.json')

if __name__ == '__main__':
    evaluate()
