import socketio
import time

class AlertWebSocketClient:
    def __init__(self, backend_url='http://localhost:5001', driver_id='ml-service'):
        self.backend_url = backend_url
        self.driver_id = driver_id
        self.sio = None
        self.connected = False
        self._setup()

    def _setup(self):
        self.sio = socketio.Client()

        @self.sio.on('connect')
        def on_connect():
            self.connected = True
            print(f'[SocketIO] Connected to backend at {self.backend_url}')
            self.sio.emit('join-driver', self.driver_id)

        @self.sio.on('disconnect')
        def on_disconnect():
            self.connected = False
            print('[SocketIO] Disconnected from backend')

        @self.sio.on('connect_error')
        def on_error(err):
            self.connected = False
            print(f'[SocketIO] Connection error: {err}')

    def connect(self):
        if self.connected:
            return True
        try:
            self.sio.connect(self.backend_url, transports=['polling', 'websocket'], wait_timeout=3)
            return True
        except Exception as e:
            self.connected = False
            return False

    def send_alert(self, detection_result):
        if not self.connected and not self.connect():
            return

        payload = {
            'driverId': self.driver_id,
            'status': detection_result['status'],
            'confidence': detection_result['confidence'],
            'features': detection_result.get('features', {}),
            'timestamp': time.time(),
        }

        try:
            self.sio.emit('drowsiness-alert', payload)
        except Exception as e:
            self.connected = False

    def close(self):
        if self.sio and self.sio.connected:
            self.sio.disconnect()
