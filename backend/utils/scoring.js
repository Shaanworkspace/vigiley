const SDS_DECAY_FACTOR = 0.95;
const EAR_BASELINE = 0.25;
const MAR_BASELINE = 0.15;
const PITCH_BASELINE = 0;
const YAW_BASELINE = 0;

const MODALITY_WEIGHTS = {
  ear: 0.40,
  mar: 0.25,
  pitch: 0.20,
  yaw: 0.15,
};

function normalizeEAR(ear) {
  const deviation = Math.max(0, EAR_BASELINE - ear);
  return Math.min(100, deviation * 400);
}

function normalizeMAR(mar) {
  const deviation = Math.max(0, mar - MAR_BASELINE);
  return Math.min(100, deviation * 200);
}

function normalizePitch(pitch) {
  const deviation = Math.abs(pitch - PITCH_BASELINE);
  return Math.min(100, deviation * 3.33);
}

function normalizeYaw(yaw) {
  const deviation = Math.abs(yaw - YAW_BASELINE);
  return Math.min(100, deviation * 2.5);
}

function computeAttentionWeights(features, prevWeights) {
  const now = features;
  const deltaEAR = Math.abs(now.eyeAspectRatio - EAR_BASELINE);
  const deltaMAR = Math.abs(now.mouthAspectRatio - MAR_BASELINE);
  const deltaPitch = Math.abs(now.headPitch - PITCH_BASELINE);
  const deltaYaw = Math.abs(now.headYaw - YAW_BASELINE);

  const totalDelta = deltaEAR + deltaMAR + deltaPitch + deltaYaw + 0.001;

  const rawWeights = {
    ear: deltaEAR / totalDelta,
    mar: deltaMAR / totalDelta,
    pitch: deltaPitch / totalDelta,
    yaw: deltaYaw / totalDelta,
  };

  if (prevWeights) {
    return {
      ear: 0.7 * rawWeights.ear + 0.3 * prevWeights.ear,
      mar: 0.7 * rawWeights.mar + 0.3 * prevWeights.mar,
      pitch: 0.7 * rawWeights.pitch + 0.3 * prevWeights.pitch,
      yaw: 0.7 * rawWeights.yaw + 0.3 * prevWeights.yaw,
    };
  }

  return rawWeights;
}

function computeSDS(prevSDS, features, attentionWeights, timestamp) {
  const earScore = normalizeEAR(features.eyeAspectRatio);
  const marScore = normalizeMAR(features.mouthAspectRatio);
  const pitchScore = normalizePitch(features.headPitch);
  const yawScore = normalizeYaw(features.headYaw);

  const instantScore =
    attentionWeights.ear * earScore * MODALITY_WEIGHTS.ear * 2.5 +
    attentionWeights.mar * marScore * MODALITY_WEIGHTS.mar * 4.0 +
    attentionWeights.pitch * pitchScore * MODALITY_WEIGHTS.pitch * 5.0 +
    attentionWeights.yaw * yawScore * MODALITY_WEIGHTS.yaw * 6.67;

  const decayedPrev = prevSDS * SDS_DECAY_FACTOR;

  const newSDS = decayedPrev + instantScore * (1 - SDS_DECAY_FACTOR);

  return Math.min(100, Math.max(0, newSDS));
}

function computeSeverity(sds, confidence) {
  const combinedScore = 0.6 * sds + 0.4 * confidence;

  if (combinedScore > 85) return 'critical';
  if (combinedScore > 70) return 'high';
  if (combinedScore > 50) return 'medium';
  if (combinedScore > 30) return 'low';
  return 'normal';
}

function computeRiskLevel(sds, recentAlerts) {
  const criticalCount = recentAlerts.filter((a) => a.severity === 'critical').length;
  const highCount = recentAlerts.filter((a) => a.severity === 'high').length;

  if (sds > 80 || criticalCount > 3) return 'critical';
  if (sds > 60 || highCount > 5) return 'high';
  if (sds > 35) return 'medium';
  return 'low';
}

module.exports = {
  computeSDS,
  computeAttentionWeights,
  computeSeverity,
  computeRiskLevel,
  normalizeEAR,
  normalizeMAR,
  normalizePitch,
  normalizeYaw,
  SDS_DECAY_FACTOR,
};
