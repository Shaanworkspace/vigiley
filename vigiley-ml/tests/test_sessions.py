"""Session isolation tests for the ML API.

MediaPipe and OpenCV are stubbed so these run in CI without a camera, model file or GPU.
"""
import importlib
import sys
import types

import numpy as np
import pytest


@pytest.fixture()
def api(monkeypatch):
    cv2 = types.ModuleType("cv2")
    cv2.IMREAD_COLOR = 1
    cv2.INTER_NEAREST = 0
    cv2.imdecode = lambda arr, flag: np.zeros((240, 320, 3), dtype=np.uint8)
    cv2.resize = lambda frame, size, interpolation=None: frame
    monkeypatch.setitem(sys.modules, "cv2", cv2)

    fe = types.ModuleType("feature_extraction")

    class FakeExtractor:
        def extract(self, frame, ear_history=None):
            ear_history.append(0.30)
            return {
                "eye_aspect_ratio": 0.30, "mouth_aspect_ratio": 0.2,
                "head_pitch": 0.0, "head_yaw": 0.0, "face_box": [0, 0, 1, 1],
                "eye_points": [], "mouth_points": [],
            }

    fe.FeatureExtractor = FakeExtractor
    monkeypatch.setitem(sys.modules, "feature_extraction", fe)
    sys.modules.pop("api", None)
    module = importlib.import_module("api")
    yield module
    sys.modules.pop("api", None)


def test_sessions_do_not_share_history(api):
    from fastapi.testclient import TestClient

    client = TestClient(api.app)
    img = "aGVsbG8="  # any valid base64; cv2 is stubbed
    for _ in range(3):
        assert client.post("/predict", json={"image": img, "session_id": "driver-aaaa"}).status_code == 200
    r = client.post("/predict", json={"image": img, "session_id": "driver-bbbb"}).json()

    assert r["frame_id"] == 1  # B starts fresh
    assert api._sessions["driver-aaaa"].frame_count == 3  # A keeps its own count


def test_reset_only_clears_own_session(api):
    from fastapi.testclient import TestClient

    client = TestClient(api.app)
    img = "aGVsbG8="
    client.post("/predict", json={"image": img, "session_id": "driver-aaaa"})
    client.post("/predict", json={"image": img, "session_id": "driver-bbbb"})

    assert client.post("/reset", json={"session_id": "driver-aaaa"}).status_code == 200
    assert "driver-aaaa" not in api._sessions
    assert "driver-bbbb" in api._sessions


@pytest.mark.parametrize("bad", ["", "short", "has spaces in it", "x" * 65, "../../etc"])
def test_rejects_bad_session_ids(api, bad):
    from fastapi.testclient import TestClient

    r = TestClient(api.app).post("/predict", json={"image": "aGVsbG8=", "session_id": bad})
    assert r.status_code == 400


def test_session_cap_evicts_oldest(api, monkeypatch):
    monkeypatch.setattr(api, "MAX_SESSIONS", 2)
    api._get_session("session-0001")
    api._get_session("session-0002")
    api._get_session("session-0003")
    assert "session-0001" not in api._sessions
    assert len(api._sessions) == 2
