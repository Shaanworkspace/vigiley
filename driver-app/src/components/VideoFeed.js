import React, { useRef, useState, useEffect, useCallback } from 'react';
import Webcam from 'react-webcam';
import { driverAPI } from '../services/api';

const DETECTION_INTERVAL = 3000;

export default function VideoFeed() {
  const webcamRef = useRef(null);
  const intervalRef = useRef(null);
  const [isActive, setIsActive] = useState(false);
  const [lastStatus, setLastStatus] = useState('normal');
  const [confidence, setConfidence] = useState(0);
  const [sessionActive, setSessionActive] = useState(false);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const simulateDetection = useCallback(() => {
    if (!webcamRef.current) return;

    const statuses = ['normal', 'normal', 'normal', 'yawning', 'eyes_closed', 'drowsy'];
    const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
    const randomConfidence = randomStatus === 'normal'
      ? Math.floor(Math.random() * 30) + 10
      : Math.floor(Math.random() * 40) + 55;

    setLastStatus(randomStatus);
    setConfidence(randomConfidence);

    driverAPI
      .sendDetection({
        status: randomStatus,
        confidence: randomConfidence,
        eyeAspectRatio: Math.random() * 0.5,
        mouthAspectRatio: Math.random() * 0.8,
        headPitch: (Math.random() - 0.5) * 30,
        headYaw: (Math.random() - 0.5) * 40,
      })
      .catch((err) => console.error('Detection send failed'));
  }, []);

  const startDetection = async () => {
    try {
      await driverAPI.startSession();
      setSessionActive(true);
      setIsActive(true);
      intervalRef.current = setInterval(simulateDetection, DETECTION_INTERVAL);
    } catch (err) {
      console.error('Failed to start session');
    }
  };

  const stopDetection = async () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsActive(false);
    setSessionActive(false);
    try {
      await driverAPI.endSession();
    } catch (err) {
      console.error('Failed to end session');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      normal: '#4caf50',
      yawning: '#ff9800',
      eyes_closed: '#f44336',
      drowsy: '#d32f2f',
      distracted: '#ff5722',
    };
    return colors[status] || '#4caf50';
  };

  const getStatusEmoji = (status) => {
    const emojis = {
      normal: '😊',
      yawning: '🥱',
      eyes_closed: '😴',
      drowsy: '⚠️',
      distracted: '📱',
    };
    return emojis[status] || '😊';
  };

  return (
    <div style={styles.container}>
      <div style={styles.cameraWrapper}>
        <Webcam
          ref={webcamRef}
          style={styles.webcam}
          screenshotFormat="image/jpeg"
          mirrored
          videoConstraints={{ facingMode: 'user', width: 640, height: 480 }}
        />
        {!isActive && (
          <div style={styles.overlay}>
            <p style={styles.overlayText}>
              {sessionActive ? 'Detection Paused' : 'Click Start to begin monitoring'}
            </p>
          </div>
        )}
      </div>

      <div style={styles.statusBar}>
        <div style={styles.statusRow}>
          <span style={styles.statusLabel}>Status</span>
          <span
            style={{
              ...styles.statusValue,
              color: getStatusColor(lastStatus),
            }}
          >
            {getStatusEmoji(lastStatus)} {lastStatus.replace('_', ' ')}
          </span>
        </div>
        <div style={styles.statusRow}>
          <span style={styles.statusLabel}>Confidence</span>
          <div style={styles.confidenceBar}>
            <div
              style={{
                ...styles.confidenceFill,
                width: `${confidence}%`,
                background: confidence > 70 ? '#f44336' : confidence > 40 ? '#ff9800' : '#4caf50',
              }}
            />
          </div>
          <span style={styles.confidenceText}>{confidence}%</span>
        </div>
      </div>

      <button
        style={{
          ...styles.controlBtn,
          background: isActive
            ? 'linear-gradient(135deg, #d32f2f, #b71c1c)'
            : 'linear-gradient(135deg, #4caf50, #388e3c)',
        }}
        onClick={isActive ? stopDetection : startDetection}
      >
        {isActive ? 'Stop Monitoring' : 'Start Monitoring'}
      </button>
    </div>
  );
}

const styles = {
  container: {
    background: '#1a1a2e',
    borderRadius: 12,
    padding: 16,
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  cameraWrapper: {
    position: 'relative',
    borderRadius: 8,
    overflow: 'hidden',
    background: '#000',
    aspectRatio: '4/3',
  },
  webcam: { width: '100%', height: '100%', objectFit: 'cover', display: 'block' },
  overlay: {
    position: 'absolute',
    inset: 0,
    background: 'rgba(0,0,0,0.6)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  overlayText: { color: '#fff', fontSize: 18, fontWeight: 600, opacity: 0.8 },
  statusBar: {
    background: '#16213e',
    borderRadius: 8,
    padding: 12,
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  statusRow: { display: 'flex', alignItems: 'center', gap: 10 },
  statusLabel: { color: '#8899aa', fontSize: 13, fontWeight: 500, minWidth: 80 },
  statusValue: { fontWeight: 700, fontSize: 16, textTransform: 'capitalize' },
  confidenceBar: {
    flex: 1,
    height: 8,
    background: '#2a2a4a',
    borderRadius: 4,
    overflow: 'hidden',
  },
  confidenceFill: { height: '100%', borderRadius: 4, transition: 'width 0.3s, background 0.3s' },
  confidenceText: { color: '#8899aa', fontSize: 13, minWidth: 40, textAlign: 'right' },
  controlBtn: {
    padding: '14px 24px',
    border: 'none',
    borderRadius: 8,
    color: '#fff',
    fontSize: 16,
    fontWeight: 700,
    cursor: 'pointer',
    letterSpacing: 1,
  },
};
