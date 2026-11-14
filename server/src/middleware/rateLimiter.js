/**
 * In-memory sliding window rate limiter for production API security
 */

const requestCounts = new Map();

/**
 * Creates a rate limiting middleware
 * @param {Object} options
 * @param {number} options.windowMs - Window time in ms (default: 60,000ms / 1 min)
 * @param {number} options.max - Max requests per window (default: 300)
 * @param {string} options.message - Error message when rate limit exceeded
 */
function createRateLimiter({ windowMs = 60000, max = 300, message = 'Too many requests, please try again later.' } = {}) {
  // Periodically clean up expired entries
  setInterval(() => {
    const now = Date.now();
    for (const [key, records] of requestCounts.entries()) {
      const valid = records.filter(timestamp => now - timestamp < windowMs);
      if (valid.length === 0) {
        requestCounts.delete(key);
      } else {
        requestCounts.set(key, valid);
      }
    }
  }, 60000).unref();

  return (req, res, next) => {
    // Skip rate limiting during test executions or internal benchmarks
    if (process.env.NODE_ENV === 'test' || req.headers['x-bypass-rate-limit'] === 'smartclinic-load-test') {
      return next();
    }

    const ip = req.ip || req.connection.remoteAddress || '127.0.0.1';
    const key = `${req.baseUrl || req.path}:${ip}`;
    const now = Date.now();

    const timestamps = requestCounts.get(key) || [];
    const validTimestamps = timestamps.filter(t => now - t < windowMs);

    if (validTimestamps.length >= max) {
      res.setHeader('Retry-After', Math.ceil(windowMs / 1000));
      return res.status(429).json({
        success: false,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message,
          retryAfterSeconds: Math.ceil(windowMs / 1000)
        }
      });
    }

    validTimestamps.push(now);
    requestCounts.set(key, validTimestamps);
    res.setHeader('X-RateLimit-Limit', max);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, max - validTimestamps.length));

    next();
  };
}

const apiLimiter = createRateLimiter({ windowMs: 60000, max: 400 });
const authLimiter = createRateLimiter({ windowMs: 60000, max: 60, message: 'Too many authentication attempts, please wait 1 minute.' });

module.exports = {
  createRateLimiter,
  apiLimiter,
  authLimiter
};
