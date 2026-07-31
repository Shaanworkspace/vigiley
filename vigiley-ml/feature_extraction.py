import cv2
import numpy as np
import time
from mediapipe.tasks import python
from mediapipe.tasks.python import vision
from mediapipe import Image, ImageFormat

class FeatureExtractor:
    def __init__(self):
        model_path = self._get_model_path()
        options = vision.FaceLandmarkerOptions(
            base_options=python.BaseOptions(model_asset_path=model_path),
            running_mode=vision.RunningMode.IMAGE,
            num_faces=1,
            output_face_blendshapes=False,
            min_face_detection_confidence=0.5,
            min_tracking_confidence=0.5,
        )
        self.landmarker = vision.FaceLandmarker.create_from_options(options)

    def _get_model_path(self):
        import os
        path = os.path.join(os.path.dirname(__file__), 'face_landmarker.task')
        if os.path.exists(path):
            return path
        return None

    def compute_ear(self, landmarks, img_w, img_h):
        left_eye = np.array([[landmarks[i].x * img_w, landmarks[i].y * img_h] for i in [33, 158, 159, 133, 153, 144]])
        right_eye = np.array([[landmarks[i].x * img_w, landmarks[i].y * img_h] for i in [362, 385, 386, 263, 373, 374]])

        def eye_aspect_ratio(eye):
            a = np.linalg.norm(eye[1] - eye[5])
            b = np.linalg.norm(eye[2] - eye[4])
            c = np.linalg.norm(eye[0] - eye[3])
            return (a + b) / (2.0 * c + 1e-6)

        left_ear = eye_aspect_ratio(left_eye)
        right_ear = eye_aspect_ratio(right_eye)
        return (left_ear + right_ear) / 2.0

    def compute_mar(self, landmarks, img_w, img_h):
        upper = np.array([[landmarks[i].x * img_w, landmarks[i].y * img_h] for i in [13, 14]])
        lower = np.array([[landmarks[i].x * img_w, landmarks[i].y * img_h] for i in [78, 308]])
        left_corner = np.array([landmarks[61].x * img_w, landmarks[61].y * img_h])
        right_corner = np.array([landmarks[291].x * img_w, landmarks[291].y * img_h])

        a = np.linalg.norm(upper[0] - lower[1])
        b = np.linalg.norm(upper[1] - lower[0])
        c = np.linalg.norm(left_corner - right_corner)
        return (a + b) / (2.0 * c + 1e-6)

    def compute_head_pose(self, landmarks, img_w, img_h):
        model_pts = np.array([
            (0.0, 0.0, 0.0),
            (0.0, -330.0, -65.0),
            (-225.0, 170.0, -135.0),
            (225.0, 170.0, -135.0),
            (-150.0, -150.0, -125.0),
            (150.0, -150.0, -125.0),
        ])
        img_pts = np.array([
            [landmarks[1].x * img_w, landmarks[1].y * img_h],
            [landmarks[199].x * img_w, landmarks[199].y * img_h],
            [landmarks[33].x * img_w, landmarks[33].y * img_h],
            [landmarks[263].x * img_w, landmarks[263].y * img_h],
            [landmarks[61].x * img_w, landmarks[61].y * img_h],
            [landmarks[291].x * img_w, landmarks[291].y * img_h],
        ], dtype=np.float64)

        focal = img_w
        center = (img_w / 2, img_h / 2)
        cam_matrix = np.array([[focal, 0, center[0]], [0, focal, center[1]], [0, 0, 1]], dtype=np.float64)
        dist = np.zeros((4, 1))

        success, rvec, _ = cv2.solvePnP(model_pts, img_pts, cam_matrix, dist, flags=cv2.SOLVEPNP_ITERATIVE)
        if not success:
            return 0.0, 0.0

        rmat, _ = cv2.Rodrigues(rvec)
        angles, _, _, _, _, _ = cv2.RQDecomp3x3(rmat)
        return angles[0], angles[1]

    def extract(self, frame, ear_history=None):
        rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        mp_image = Image(image_format=ImageFormat.SRGB, data=rgb)

        result = self.landmarker.detect(mp_image)
        if not result or not result.face_landmarks:
            return None

        landmarks = result.face_landmarks[0]
        h, w = frame.shape[:2]

        ear = self.compute_ear(landmarks, w, h)
        mar = self.compute_mar(landmarks, w, h)
        pitch, yaw = self.compute_head_pose(landmarks, w, h)

        perclos = 0.0
        if ear_history is not None:
            ear_history.append(ear)
            if len(ear_history) >= 10:
                window = ear_history[-min(len(ear_history), 90):]
                closed = sum(1 for e in window if e < 0.25)
                perclos = closed / len(window)

        xs = [lm.x * w for lm in landmarks]
        ys = [lm.y * h for lm in landmarks]
        face_x = int(min(xs))
        face_y = int(min(ys))
        face_w = int(max(xs) - min(xs))
        face_h = int(max(ys) - min(ys))

        eye_lm = [33, 158, 159, 133, 153, 144, 362, 385, 386, 263, 373, 374]
        mouth_lm = [13, 14, 78, 308, 61, 291]
        eye_pts = [[int(landmarks[i].x * w), int(landmarks[i].y * h)] for i in eye_lm]
        mouth_pts = [[int(landmarks[i].x * w), int(landmarks[i].y * h)] for i in mouth_lm]

        return {
            'eye_aspect_ratio': round(ear, 4),
            'mouth_aspect_ratio': round(mar, 4),
            'head_pitch': round(pitch, 2),
            'head_yaw': round(yaw, 2),
            'perclos': round(perclos, 4),
            'face_box': [face_x, face_y, face_w, face_h],
            'eye_points': eye_pts,
            'mouth_points': mouth_pts,
        }

    def release(self):
        self.landmarker.close()
