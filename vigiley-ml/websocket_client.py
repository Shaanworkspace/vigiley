import os
import socketio
import time
import threading

class AlertWebSocketClient:
    def __init__(self, backend_url=None, driver_id='ml-service'):
        self.backend_url = backend_url or os.environ.get(
            'BACKEND_SOCKET_URL', 'http://localhost:5001')
        self.driver_id = driver_id
        self._sio = None
        self.connected = False
        self._lock = threading.Lock()

    def _get_sio(self):
        if self._sio is not None:
            return self._sio
        with self._lock:
            if self._sio is not None:
                return self._sio
            sio = socketio.Client()

            @sio.on('connect')
            def on_connect():
                self.connected = True
                sio.emit('join-driver', self.driver_id)

            @sio.on('disconnect')
            def on_disconnect():
                self.connected = False

            @sio.on('connect_error')
            def on_error(err):
                self.connected = False

            self._sio = sio
            return sio

    def connect(self):
        if self.connected:
            return True
        try:
            sio = self._get_sio()
            sio.connect(self.backend_url, transports=['polling', 'websocket'], wait_timeout=3)
            return True
        except Exception:
            self.connected = False
            return False

    def send_alert(self, detection_result):
        if not self.connected and not self.connect():
            return

        payload = {
            'driverId': self.driver_id,
            'status': detection_result['status'],
            'confidence': detection_result['confidence'],
            'features': {
                'ear': detection_result.get('ear'),
                'mar': detection_result.get('mar'),
                'pitch': detection_result.get('pitch'),
                'yaw': detection_result.get('yaw'),
                'perclos': detection_result.get('perclos'),
                'close_counter': detection_result.get('close_counter'),
                'yawn_counter': detection_result.get('yawn_counter'),
            },
            'timestamp': time.time(),
        }

        try:
            self._sio.emit('drowsiness-alert', payload)
        except Exception:
            self.connected = False

    def close(self):
        if self._sio and self._sio.connected:
            self._sio.disconnect()
