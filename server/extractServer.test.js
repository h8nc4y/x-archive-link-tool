import test from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import { handleRequest, createServer, formatStartupError } from "./extractServer.js";

async function withServer(run, options = {}) {
  const server = createServer({
    extractPost: async (parsed) => ({
      accountName: "Test User",
      username: parsed.username,
      userNumericId: "未取得",
      postId: parsed.postId,
      postUrl: parsed.canonicalUrl,
      createdAt: "未取得",
      text: "未取得",
      mediaUrls: []
    }),
    ...options
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));

  try {
    const { port } = server.address();
    await run(port);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

function assertSecurityHeaders(headers) {
  assert.equal(
    headers["content-security-policy"],
    "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data: blob:; connect-src 'self' https://publish.x.com; frame-ancestors 'none'; base-uri 'none'; form-action 'self'; upgrade-insecure-requests"
  );
  assert.equal(headers["x-frame-options"], "DENY");
  assert.equal(headers["x-content-type-options"], "nosniff");
  assert.equal(headers["referrer-policy"], "strict-origin-when-cross-origin");
}

function request(port, { method = "POST", path = "/api/extract", headers = {}, body = "" } = {}) {
  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        host: "127.0.0.1",
        port,
        method,
        path,
        headers
      },
      (res) => {
        const chunks = [];
        res.on("data", (chunk) => chunks.push(chunk));
        res.on("end", () => {
          const text = Buffer.concat(chunks).toString("utf8");
          const contentType = String(res.headers["content-type"] || "");
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: text && contentType.includes("application/json") ? JSON.parse(text) : text
          });
        });
      }
    );

    req.on("error", reject);
    req.end(body);
  });
}

test("GET / serves web index with security headers", async () => {
  await withServer(async (port) => {
    const response = await request(port, {
      method: "GET",
      path: "/"
    });

    assert.equal(response.statusCode, 200);
    assert.equal(response.headers["content-type"], "text/html; charset=utf-8");
    assert.match(response.body, /<script type="module" src="\/app\.js"><\/script>/);
    assertSecurityHeaders(response.headers);
  });
});

test("GET /privacy.html serves privacy policy draft with security headers", async () => {
  await withServer(async (port) => {
    const response = await request(port, {
      method: "GET",
      path: "/privacy.html"
    });

    assert.equal(response.statusCode, 200);
    assert.equal(response.headers["content-type"], "text/html; charset=utf-8");
    assert.match(response.body, /プライバシーポリシー/);
    assert.match(response.body, /h8nc4y\.sub01@gmail\.com/);
    assert.match(response.body, /法務レビュー済みではありません/);
    assertSecurityHeaders(response.headers);
  });
});

test("formatStartupError explains port conflicts", () => {
  assert.equal(
    formatStartupError({ code: "EADDRINUSE" }, 3000),
    "Port 3000 is already in use. Close the existing server or set PORT=3001."
  );
});

test("formatStartupError keeps generic startup errors short", () => {
  assert.equal(formatStartupError({ code: "EACCES", message: "permission denied" }, 3000), "Server startup failed (EACCES): permission denied");
});

test("GET /healthz returns ok without sensitive data", async () => {
  await withServer(async (port) => {
    const response = await request(port, {
      method: "GET",
      path: "/healthz"
    });

    assert.equal(response.statusCode, 200);
    assert.deepEqual(response.body, { ok: true });
    assertSecurityHeaders(response.headers);
  });
});

test("GET static file read failure returns 500 without hanging", async () => {
  await withServer(
    async (port) => {
      const response = await request(port, {
        method: "GET",
        path: "/broken.html"
      });

      assert.equal(response.statusCode, 500);
      assert.deepEqual(response.body, { error: "Internal server error." });
      assertSecurityHeaders(response.headers);
    },
    {
      staticFiles: new Map([["/broken.html", { file: new URL("./missing.html", import.meta.url), contentType: "text/html; charset=utf-8" }]]),
      readFileFn: async () => {
        throw new Error("read failed");
      }
    }
  );
});

test("GET only serves whitelisted static files", async () => {
  await withServer(async (port) => {
    const response = await request(port, {
      method: "GET",
      path: "/../server/oEmbedClient.js"
    });

    assert.equal(response.statusCode, 404);
    assertSecurityHeaders(response.headers);
  });
});

test("POST /api/extract returns injected client response", async () => {
  await withServer(async (port) => {
    const response = await request(port, {
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ url: "https://twitter.com/user_name/status/1234567890123456789?s=20" })
    });

    assert.equal(response.statusCode, 200);
    assertSecurityHeaders(response.headers);
    assert.deepEqual(response.body, {
      accountName: "Test User",
      username: "user_name",
      userNumericId: "未取得",
      postId: "1234567890123456789",
      postUrl: "https://x.com/user_name/status/1234567890123456789",
      createdAt: "未取得",
      text: "未取得",
      mediaUrls: []
    });
  });
});

test("POST /api/extract does not require token environment", async () => {
  await withServer(
    async (port) => {
      const response = await request(port, {
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ url: "https://x.com/user/status/123" })
      });

      assert.equal(response.statusCode, 200);
      assert.equal(response.body.userNumericId, "未取得");
      assert.deepEqual(response.body.mediaUrls, []);
    },
    { env: {} }
  );
});

test("400 response includes security headers", async () => {
  await withServer(async (port) => {
    const response = await request(port, {
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ url: "https://t.co/abc" })
    });

    assert.equal(response.statusCode, 400);
    assertSecurityHeaders(response.headers);
  });
});

test("POST /api/extract rejects invalid URL with 400", async () => {
  await withServer(async (port) => {
    const response = await request(port, {
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ url: "https://t.co/abc" })
    });

    assert.equal(response.statusCode, 400);
    assert.equal(response.body.code, "invalid_host");
  });
});

test("POST /api/extract rejects invalid JSON with 400", async () => {
  await withServer(async (port) => {
    const response = await request(port, {
      headers: { "content-type": "application/json" },
      body: "{"
    });

    assert.equal(response.statusCode, 400);
  });
});

test("POST /api/extract rejects unsupported content type with 415", async () => {
  await withServer(async (port) => {
    const response = await request(port, {
      headers: { "content-type": "text/plain" },
      body: JSON.stringify({ url: "https://x.com/user/status/123" })
    });

    assert.equal(response.statusCode, 415);
    assertSecurityHeaders(response.headers);
  });
});

test("POST /api/extract accepts JSON content type with charset", async () => {
  await withServer(async (port) => {
    const response = await request(port, {
      headers: { "content-type": "application/json; charset=utf-8" },
      body: JSON.stringify({ url: "https://x.com/user/status/123" })
    });

    assert.equal(response.statusCode, 200);
    assertSecurityHeaders(response.headers);
  });
});

test("POST /api/extract rejects unexpected request body shapes", async () => {
  let extractCalls = 0;

  await withServer(
    async (port) => {
      const invalidBodies = [
        null,
        [],
        { url: "https://x.com/user/status/123", extra: true },
        { url: 123 }
      ];

      for (const body of invalidBodies) {
        const response = await request(port, {
          headers: { "content-type": "application/json" },
          body: JSON.stringify(body)
        });

        assert.equal(response.statusCode, 400);
        assert.equal(response.body.error, 'Request body must be { "url": "..." }.');
        assertSecurityHeaders(response.headers);
      }
    },
    {
      extractPost: async () => {
        extractCalls += 1;
        throw new Error("extractPost should not run for invalid request bodies");
      }
    }
  );

  assert.equal(extractCalls, 0);
});

test("POST /api/extract rejects oversized body with 413", async () => {
  await withServer(async (port) => {
    const response = await request(port, {
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ url: `https://x.com/${"a".repeat(1100)}/status/123` })
    });

    assert.equal(response.statusCode, 413);
    assertSecurityHeaders(response.headers);
  });
});

test("unsupported path returns 404", async () => {
  await withServer(async (port) => {
    const response = await request(port, {
      path: "/api/unknown",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ url: "https://x.com/user/status/123" })
    });

    assert.equal(response.statusCode, 404);
    assertSecurityHeaders(response.headers);
  });
});

test("unsupported method returns 405", async () => {
  await withServer(async (port) => {
    const response = await request(port, {
      method: "GET",
      headers: { "content-type": "application/json" }
    });

    assert.equal(response.statusCode, 405);
    assert.equal(response.headers.allow, "POST");
    assertSecurityHeaders(response.headers);
  });
});

test("IP rate limit returns 429 with Retry-After", async () => {
  await withServer(
    async (port) => {
      const first = await request(port, {
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ url: "https://x.com/user/status/123" })
      });
      const second = await request(port, {
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ url: "https://x.com/user/status/123" })
      });

      assert.equal(first.statusCode, 200);
      assert.equal(second.statusCode, 429);
      assert.equal(second.headers["retry-after"], "60");
      assertSecurityHeaders(second.headers);
    },
    {
      env: {
        RATE_LIMIT_PER_IP_PER_MINUTE: "1",
        RATE_LIMIT_GLOBAL_PER_MINUTE: "100"
      },
      now: () => 0
    }
  );
});

test("global rate limit returns 429", async () => {
  await withServer(
    async (port) => {
      const first = await request(port, {
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ url: "https://x.com/user/status/123" })
      });
      const second = await request(port, {
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ url: "https://x.com/user/status/123" })
      });

      assert.equal(first.statusCode, 200);
      assert.equal(second.statusCode, 429);
      assertSecurityHeaders(second.headers);
    },
    {
      env: {
        RATE_LIMIT_PER_IP_PER_MINUTE: "100",
        RATE_LIMIT_GLOBAL_PER_MINUTE: "1"
      },
      now: () => 0
    }
  );
});

test("rate limit resets after time window", async () => {
  let nowMs = 0;

  await withServer(
    async (port) => {
      const first = await request(port, {
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ url: "https://x.com/user/status/123" })
      });
      const second = await request(port, {
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ url: "https://x.com/user/status/123" })
      });
      nowMs = 60_001;
      const third = await request(port, {
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ url: "https://x.com/user/status/123" })
      });

      assert.equal(first.statusCode, 200);
      assert.equal(second.statusCode, 429);
      assert.equal(third.statusCode, 200);
    },
    {
      env: {
        RATE_LIMIT_PER_IP_PER_MINUTE: "1",
        RATE_LIMIT_GLOBAL_PER_MINUTE: "100"
      },
      now: () => nowMs
    }
  );
});

test("rate limit logs do not include sensitive request data", async () => {
  const logs = [];

  await withServer(
    async (port) => {
      const response = await request(port, {
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ url: "https://x.com/sensitive_user/status/987654321" })
      });
      const serializedBody = JSON.stringify(response.body);

      assert.equal(response.statusCode, 429);
      assert.equal(response.body.code, "rate_limit_exceeded");
      assert.equal(serializedBody.includes("https://x.com/sensitive_user/status/987654321"), false);
      assert.equal(serializedBody.includes("sensitive_user"), false);
      assert.equal(serializedBody.includes("987654321"), false);
    },
    {
      logger: (entry) => logs.push(entry),
      rateLimiter: { check: () => ({ allowed: false, retryAfterSeconds: 60 }) }
    }
  );

  const serializedLogs = JSON.stringify(logs);
  assert.equal(logs.length, 1);
  assert.equal(logs[0].statusCode, 429);
  assert.equal(logs[0].errorCode, "rate_limit_exceeded");
  assert.equal(serializedLogs.includes("https://x.com/sensitive_user/status/987654321"), false);
  assert.equal(serializedLogs.includes("987654321"), false);
  assert.equal(serializedLogs.includes("sensitive_user"), false);
});

test("safe logs do not include sensitive request or X data", async () => {
  const logs = [];

  await withServer(
    async (port) => {
      const response = await request(port, {
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ url: "https://x.com/sensitive_user/status/987654321" })
      });

      assert.equal(response.statusCode, 200);
    },
    {
      logger: (entry) => logs.push(entry),
      extractPost: async () => ({
        accountName: "Sensitive Name",
        username: "sensitive_user",
        userNumericId: "42",
        postId: "987654321",
        postUrl: "https://x.com/sensitive_user/status/987654321",
        createdAt: "2026-05-09T00:00:00.000Z",
        text: "<blockquote>Sensitive X body</blockquote>",
        mediaUrls: ["https://pbs.twimg.com/media/secret.jpg"]
      })
    }
  );

  const serialized = JSON.stringify(logs);
  assert.equal(logs.length, 1);
  assert.equal(typeof logs[0].request_id, "string");
  assert.equal(logs[0].method, "POST");
  assert.equal(logs[0].path, "/api/extract");
  assert.equal(logs[0].statusCode, 200);
  assert.equal(serialized.includes("https://x.com/sensitive_user/status/987654321"), false);
  assert.equal(serialized.includes("987654321"), false);
  assert.equal(serialized.includes("sensitive_user"), false);
  assert.equal(serialized.includes("<blockquote>"), false);
  assert.equal(serialized.includes("Sensitive X body"), false);
  assert.equal(serialized.includes("secret.jpg"), false);
  assert.equal(serialized.includes("token"), false);
});

// ===== /api/upload-image（R2移行後のローカル開発サーバー） =====
// ローカル開発サーバーにはR2 bindingが無いため、常に upload_not_configured（503）を
// 返す設計になっている。実R2へは一切通信しない。

function pngMultipartBody({ size = 100, boundary = "----extractServerTestBoundary" } = {}) {
  const header =
    `--${boundary}\r\n` +
    'Content-Disposition: form-data; name="image"; filename="record.png"\r\n' +
    "Content-Type: image/png\r\n\r\n";
  const footer = `\r\n--${boundary}--\r\n`;
  const bytes = Buffer.alloc(size, 0);
  return {
    boundary,
    body: Buffer.concat([Buffer.from(header, "utf8"), bytes, Buffer.from(footer, "utf8")])
  };
}

test("GET /api/upload-image is rejected as method not allowed", async () => {
  await withServer(async (port) => {
    const response = await request(port, {
      method: "GET",
      path: "/api/upload-image"
    });

    assert.equal(response.statusCode, 405);
    assert.equal(response.headers.allow, "POST");
    assertSecurityHeaders(response.headers);
  });
});

test("POST /api/upload-image always returns upload_not_configured (503) on the local dev server (no R2 binding)", async () => {
  const { boundary, body } = pngMultipartBody();

  await withServer(
    async (port) => {
      const response = await request(port, {
        path: "/api/upload-image",
        headers: {
          "content-type": `multipart/form-data; boundary=${boundary}`,
          "content-length": String(body.length)
        },
        body
      });

      assert.equal(response.statusCode, 503);
      assert.equal(response.body.code, "upload_not_configured");
      assertSecurityHeaders(response.headers);
    },
    {
      uploadRateLimiter: { check: () => ({ allowed: true, retryAfterSeconds: 0 }) }
    }
  );
});

test("POST /api/upload-image returns 429 with retry-after when the upload rate limiter rejects", async () => {
  const { boundary, body } = pngMultipartBody();

  await withServer(
    async (port) => {
      const response = await request(port, {
        path: "/api/upload-image",
        headers: {
          "content-type": `multipart/form-data; boundary=${boundary}`,
          "content-length": String(body.length)
        },
        body
      });

      assert.equal(response.statusCode, 429);
      assert.equal(response.headers["retry-after"], "17");
      assert.equal(response.body.code, "rate_limit_exceeded");
      assertSecurityHeaders(response.headers);
    },
    {
      uploadRateLimiter: { check: () => ({ allowed: false, retryAfterSeconds: 17 }) }
    }
  );
});

test("POST /api/upload-image with a malformed body still returns upload_not_configured (503) before validation", async () => {
  await withServer(
    async (port) => {
      const response = await request(port, {
        path: "/api/upload-image",
        headers: {
          "content-type": "multipart/form-data; boundary=----broken",
          "content-length": "0"
        },
        body: ""
      });

      // R2 binding未設定チェックはformData解析・バリデーションより先に行うため、
      // 壊れたmultipart bodyでも400ではなく503のままになる。
      assert.equal(response.statusCode, 503);
      assert.equal(response.body.code, "upload_not_configured");
      assertSecurityHeaders(response.headers);
    },
    {
      uploadRateLimiter: { check: () => ({ allowed: true, retryAfterSeconds: 0 }) }
    }
  );
});
