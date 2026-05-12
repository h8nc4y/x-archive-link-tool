import test from "node:test";
import assert from "node:assert/strict";
import { createRateLimiter } from "./rateLimiter.js";

function hitMany(rateLimiter, count, ipPrefix = "ip") {
  let result = null;
  for (let index = 0; index < count; index += 1) {
    result = rateLimiter.check(`${ipPrefix}-${index}`);
  }
  return result;
}

test("rate limiter defaults to 10 requests per IP per minute", () => {
  const rateLimiter = createRateLimiter({ env: {}, now: () => 0 });

  for (let index = 0; index < 10; index += 1) {
    assert.deepEqual(rateLimiter.check("same-ip"), { allowed: true, retryAfterSeconds: 0 });
  }

  assert.deepEqual(rateLimiter.check("same-ip"), { allowed: false, retryAfterSeconds: 60 });
});

test("rate limiter defaults to 60 global requests per minute", () => {
  const rateLimiter = createRateLimiter({ env: {}, now: () => 0 });

  assert.deepEqual(hitMany(rateLimiter, 60), { allowed: true, retryAfterSeconds: 0 });
  assert.deepEqual(rateLimiter.check("ip-60"), { allowed: false, retryAfterSeconds: 60 });
});

test("rate limiter uses configured per-IP and global limits", () => {
  const perIpLimiter = createRateLimiter({
    env: {
      RATE_LIMIT_PER_IP_PER_MINUTE: "2",
      RATE_LIMIT_GLOBAL_PER_MINUTE: "100"
    },
    now: () => 0
  });
  assert.deepEqual(perIpLimiter.check("same-ip"), { allowed: true, retryAfterSeconds: 0 });
  assert.deepEqual(perIpLimiter.check("same-ip"), { allowed: true, retryAfterSeconds: 0 });
  assert.deepEqual(perIpLimiter.check("same-ip"), { allowed: false, retryAfterSeconds: 60 });

  const globalLimiter = createRateLimiter({
    env: {
      RATE_LIMIT_PER_IP_PER_MINUTE: "100",
      RATE_LIMIT_GLOBAL_PER_MINUTE: "2"
    },
    now: () => 0
  });
  assert.deepEqual(globalLimiter.check("ip-1"), { allowed: true, retryAfterSeconds: 0 });
  assert.deepEqual(globalLimiter.check("ip-2"), { allowed: true, retryAfterSeconds: 0 });
  assert.deepEqual(globalLimiter.check("ip-3"), { allowed: false, retryAfterSeconds: 60 });
});

test("rate limiter falls back to defaults for empty or invalid env values", () => {
  const perIpLimiter = createRateLimiter({
    env: {
      RATE_LIMIT_PER_IP_PER_MINUTE: "",
      RATE_LIMIT_GLOBAL_PER_MINUTE: "100"
    },
    now: () => 0
  });
  for (let index = 0; index < 10; index += 1) {
    assert.equal(perIpLimiter.check("same-ip").allowed, true);
  }
  assert.equal(perIpLimiter.check("same-ip").allowed, false);

  const globalLimiter = createRateLimiter({
    env: {
      RATE_LIMIT_PER_IP_PER_MINUTE: "100",
      RATE_LIMIT_GLOBAL_PER_MINUTE: "not-a-number"
    },
    now: () => 0
  });
  assert.equal(hitMany(globalLimiter, 60).allowed, true);
  assert.equal(globalLimiter.check("ip-60").allowed, false);
});
