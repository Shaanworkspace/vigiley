import numpy as np
from sklearn.metrics import classification_report, confusion_matrix, accuracy_score
from dataset import generate_synthetic_dataset, load_nthu_dataset
from model import DrowsinessDetector
import argparse
import os

def train(args):
    print('Loading dataset...')
    if args.real_data:
        X_train, X_test, y_train, y_test = load_nthu_dataset(args.real_data)
    else:
        X_train, X_test, y_train, y_test = generate_synthetic_dataset(n_samples=args.samples)

    print(f'Training samples: {len(X_train)}, Test samples: {len(X_test)}')
    print(f'Class distribution - Train: {np.bincount(y_train.astype(int))}')
    print(f'                   Test:  {np.bincount(y_test.astype(int))}')

    detector = DrowsinessDetector()
    train_acc = detector.train(X_train, y_train)
    print(f'Training accuracy: {train_acc:.4f}')

    results = detector.evaluate(X_test, y_test)
    y_pred = results['predictions']
    print(f'\nTest Accuracy: {accuracy_score(y_test, y_pred):.4f}')
    print(f'\nClassification Report:')
    print(classification_report(y_test, y_pred, target_names=['Normal', 'Drowsy']))
    print(f'\nConfusion Matrix:')
    print(confusion_matrix(y_test, y_pred))

    detector.save(args.output)
    print(f'\nModel saved to {args.output}/')

    feature_importances = detector.classifier.feature_importances_
    feature_names = ['EAR', 'MAR', 'Head Pitch', 'Head Yaw', 'PERCLOS']
    print('\nFeature Importances:')
    for name, imp in sorted(zip(feature_names, feature_importances), key=lambda x: x[1], reverse=True):
        print(f'  {name}: {imp:.4f}')

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--samples', type=int, default=10000)
    parser.add_argument('--output', type=str, default='model')
    parser.add_argument('--real-data', type=str, default=None, help='Path to NTHU dataset (JSON files)')
    args = parser.parse_args()
    train(args)
