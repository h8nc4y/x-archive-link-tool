const DEFAULT_PER_IP_LIMIT = 10;
const DEFAULT_GLOBAL_LIMIT = 60;
const WINDOW_MS = 60 * 1000;

function readPositiveInteger(value, fallback) {
  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function hitCounter(counter, nowMs, limit) {
  if (nowMs >= counter.resetAt) {
    counter.count = 0;
    counter.resetAt = nowMs + WINDOW_MS;
  }

  counter.count += 1;

  if (counter.count > limit) {
    return {
      allowed: false,
      retryAfterSeconds: Math.max(1, Math.ceil((counter.resetAt - nowMs) / 1000))
    };
  }

  return { allowed: true, retryAfterSeconds: 0 };
}

export function createRateLimiter({ env = process.env, now = Date.now } = {}) {
  const perIpLimit = readPositiveInteger(env.RATE_LIMIT_PER_IP_PER_MINUTE, DEFAULT_PER_IP_LIMIT);
  const globalLimit = readPositiveInteger(env.RATE_LIMIT_GLOBAL_PER_MINUTE, DEFAULT_GLOBAL_LIMIT);
  const globalCounter = { count: 0, resetAt: now() + WINDOW_MS };
  const ipCounters = new Map();

  return {
    check(ipAddress = "unknown") {
      const nowMs = now();
      const globalResult = hitCounter(globalCounter, nowMs, globalLimit);
      if (!globalResult.allowed) {
        return globalResult;
      }

      let ipCounter = ipCounters.get(ipAddress);
      if (!ipCounter) {
        ipCounter = { count: 0, resetAt: nowMs + WINDOW_MS };
        ipCounters.set(ipAddress, ipCounter);
      }

      return hitCounter(ipCounter, nowMs, perIpLimit);
    }
  };
}
