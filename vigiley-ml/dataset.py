import numpy as np
from sklearn.model_selection import train_test_split

def generate_synthetic_dataset(n_samples=10000, noise=0.02):
    np.random.seed(42)

    ear_normal = np.random.normal(0.30, 0.04, n_samples)
    ear_drowsy = np.random.normal(0.18, 0.05, n_samples)

    mar_normal = np.random.normal(0.10, 0.03, n_samples)
    mar_drowsy = np.random.normal(0.35, 0.08, n_samples)

    pitch_normal = np.random.normal(0, 5, n_samples)
    pitch_drowsy = np.random.normal(15, 8, n_samples)

    yaw_normal = np.random.normal(0, 5, n_samples)
    yaw_drowsy = np.random.normal(8, 10, n_samples)

    perclos_normal = np.random.beta(1, 20, n_samples)
    perclos_drowsy = np.random.beta(5, 2, n_samples)

    features_normal = np.column_stack([ear_normal, mar_normal, pitch_normal, yaw_normal, perclos_normal])
    features_drowsy = np.column_stack([ear_drowsy, mar_drowsy, pitch_drowsy, yaw_drowsy, perclos_drowsy])

    noise_normal = np.random.normal(0, noise, features_normal.shape)
    noise_drowsy = np.random.normal(0, noise, features_drowsy.shape)

    X = np.vstack([features_normal + noise_normal, features_drowsy + noise_drowsy])
    y = np.hstack([np.zeros(n_samples), np.ones(n_samples)])

    indices = np.random.permutation(len(X))
    X, y = X[indices], y[indices]

    return train_test_split(X, y, test_size=0.2, random_state=42)

def load_nthu_dataset(data_path):
    import glob
    import json

    X, y = [], []
    for json_file in glob.glob(f'{data_path}/**/*.json', recursive=True):
        with open(json_file) as f:
            data = json.load(f)
        X.append([
            data.get('ear', 0.3),
            data.get('mar', 0.1),
            data.get('pitch', 0),
            data.get('yaw', 0),
            data.get('perclos', 0),
        ])
        y.append(1 if data.get('label') == 'drowsy' else 0)

    X, y = np.array(X), np.array(y)
    return train_test_split(X, y, test_size=0.2, random_state=42)

if __name__ == '__main__':
    X_train, X_test, y_train, y_test = generate_synthetic_dataset()
    print(f'Training samples: {len(X_train)}, Test samples: {len(X_test)}')
    print(f'Class distribution - Train: {np.bincount(y_train.astype(int))}, Test: {np.bincount(y_test.astype(int))}')
