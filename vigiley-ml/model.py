import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import StandardScaler
import joblib
import os

FEATURE_NAMES = ['eye_aspect_ratio', 'mouth_aspect_ratio', 'head_pitch', 'head_yaw', 'perclos']
CLASS_NAMES = ['normal', 'drowsy']

class DrowsinessDetector:
    def __init__(self):
        self.classifier = RandomForestClassifier(
            n_estimators=200,
            max_depth=12,
            min_samples_split=10,
            min_samples_leaf=4,
            random_state=42,
            class_weight='balanced',
            n_jobs=-1,
        )
        self.scaler = StandardScaler()
        self.feature_history = []
        self.ear_history = []
        self.window_size = 30

    def extract_features_vector(self, features):
        return np.array([
            features['eye_aspect_ratio'],
            features['mouth_aspect_ratio'],
            features['head_pitch'],
            features['head_yaw'],
            features['perclos'],
        ]).reshape(1, -1)

    def smooth_predict(self, features, confidence_threshold=0.6):
        vec = self.extract_features_vector(features)
        scaled = self.scaler.transform(vec)

        proba = self.classifier.predict_proba(scaled)[0]
        prediction = self.classifier.predict(scaled)[0]
        confidence = float(np.max(proba))

        self.feature_history.append({
            'features': features,
            'prediction': prediction,
            'confidence': confidence,
        })

        if len(self.feature_history) > self.window_size:
            self.feature_history.pop(0)

        if len(self.feature_history) >= 5:
            recent_preds = [h['prediction'] for h in self.feature_history[-5:]]
            majority = max(set(recent_preds), key=recent_preds.count)
            majority_count = recent_preds.count(majority)

            if majority_count >= 4:
                avg_confidence = np.mean([h['confidence'] for h in self.feature_history[-5:]])
                return int(majority), float(avg_confidence)

        if confidence >= confidence_threshold:
            return int(prediction), confidence

        return 0, 0.0

    def predict_frame(self, features, ear_history):
        features['perclos'] = self._compute_perclos(ear_history)
        result = self.smooth_predict(features)
        return result

    def _compute_perclos(self, ear_history, threshold=0.21, window=90):
        if len(ear_history) < 10:
            return 0.0
        recent = ear_history[-min(len(ear_history), window):]
        closed_count = sum(1 for ear in recent if ear < threshold)
        return closed_count / max(len(recent), 1)

    def train(self, X, y):
        self.scaler.fit(X)
        X_scaled = self.scaler.transform(X)
        self.classifier.fit(X_scaled, y)
        train_score = self.classifier.score(X_scaled, y)
        return train_score

    def evaluate(self, X, y):
        X_scaled = self.scaler.transform(X)
        return {
            'accuracy': float(self.classifier.score(X_scaled, y)),
            'predictions': self.classifier.predict(X_scaled).tolist(),
            'probabilities': self.classifier.predict_proba(X_scaled).tolist(),
        }

    def save(self, path='model'):
        os.makedirs(path, exist_ok=True)
        joblib.dump(self.classifier, os.path.join(path, 'classifier.pkl'))
        joblib.dump(self.scaler, os.path.join(path, 'scaler.pkl'))
        print(f'Model saved to {path}/')

    def load(self, path='model'):
        self.classifier = joblib.load(os.path.join(path, 'classifier.pkl'))
        self.scaler = joblib.load(os.path.join(path, 'scaler.pkl'))
        print(f'Model loaded from {path}/')
