/**
 * Per-IP sliding-window rate limiter (in memory, single instance).
 * Detection traffic is limited too, with its own higher budget, instead of being exempt.
 */
function createRateLimiter({
  limit = Number(process.env.RATE_LIMIT || 120),
  windowMs = 60_000,
  detectionLimit = Number(process.env.DETECTION_RATE_LIMIT || 180),
  exempt = [],
} = {}) {
  const hits = new Map();

  const sweep = setInterval(() => {
    const now = Date.now();
    for (const [key, times] of hits.entries()) {
      const fresh = times.filter((t) => now - t < windowMs);
      if (fresh.length === 0) hits.delete(key);
      else hits.set(key, fresh);
    }
  }, windowMs);
  sweep.unref();

  return (req, res, next) => {
    if (exempt.includes(req.path)) return next();
    const isDetection = req.path === '/api/driver/detection';
    const max = isDetection ? detectionLimit : limit;
    const key = `${req.ip}:${isDetection ? 'detect' : 'api'}`;
    const now = Date.now();
    const times = (hits.get(key) || []).filter((t) => now - t < windowMs);
    if (times.length >= max) {
      res.set('Retry-After', String(Math.ceil(windowMs / 1000)));
      return res.status(429).json({ status: 'error', message: 'Too many requests. Please wait a moment.' });
    }
    times.push(now);
    hits.set(key, times);
    return next();
  };
}

module.exports = { createRateLimiter };
