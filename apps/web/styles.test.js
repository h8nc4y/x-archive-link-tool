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

test("copy success feedback has a dedicated style and even header spacing", async () => {
  const css = await readFile(new URL("./styles.css", import.meta.url), "utf8");

  assert.match(css, /\.message\.is-success\s*{[^}]*}/s);
  assert.match(css, /\.output-header h2\s*{[^}]*margin-bottom:\s*0;[^}]*}/s);
});

test("static UI exposes output format and date format radio groups", async () => {
  const html = await readFile(new URL("./index.html", import.meta.url), "utf8");

  assert.match(html, /<fieldset class="output-options"[^>]*aria-describedby="output-format-hint"/);
  assert.match(html, /id="format-plain"[^>]*name="copy-format"[^>]*type="radio"[^>]*checked/);
  assert.match(html, /id="format-markdown"[^>]*name="copy-format"[^>]*type="radio"/);
  assert.match(html, /id="date-iso"[^>]*name="date-format"[^>]*type="radio"[^>]*checked/);
  assert.match(html, /id="date-japanese"[^>]*name="date-format"[^>]*type="radio"/);
});

test("output settings radios use native controls with the existing accent token", async () => {
  const css = await readFile(new URL("./styles.css", import.meta.url), "utf8");

  assert.match(css, /\.output-options\s*{[^}]*border:\s*1px solid var\(--line\);[^}]*}/s);
  assert.match(css, /input\[type="radio"\]\s*{[^}]*accent-color:\s*var\(--accent\);[^}]*}/s);
  assert.doesNotMatch(css, /\.output-options\s*{[^}]*#[0-9a-fA-F]{3,8}/s);
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
