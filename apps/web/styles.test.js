import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("hidden elements stay hidden over component display rules", async () => {
  const css = await readFile(new URL("./styles.css", import.meta.url), "utf8");

  assert.match(css, /\[hidden\]\s*{[^}]*display:\s*none\s*!important;[^}]*}/s);
});

test("disabled buttons rely on color rather than opacity for contrast", async () => {
  const css = await readFile(new URL("./styles.css", import.meta.url), "utf8");

  assert.match(css, /button:disabled\s*{[^}]*background:\s*var\(--muted\);[^}]*}/s);
  assert.doesNotMatch(css, /button:disabled\s*{[^}]*opacity:[^}]*}/s);
});

test("keyboard focus and error focus are visually indicated", async () => {
  const css = await readFile(new URL("./styles.css", import.meta.url), "utf8");

  assert.match(css, /:focus-visible\s*{[^}]*outline:[^}]*}/s);
  assert.match(css, /\.message\.error:focus\s*{[^}]*outline:[^}]*}/s);
});

test("Cloudflare Pages static headers mirror server security headers", async () => {
  const headers = await readFile(new URL("./_headers", import.meta.url), "utf8");

  assert.match(headers, /\/\*/);
  assert.match(
    headers,
    /Content-Security-Policy:\s*default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'; upgrade-insecure-requests/
  );
  assert.match(headers, /X-Frame-Options:\s*DENY/);
  assert.match(headers, /X-Content-Type-Options:\s*nosniff/);
  assert.match(headers, /Referrer-Policy:\s*strict-origin-when-cross-origin/);
});
