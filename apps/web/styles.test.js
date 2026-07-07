import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

function parseHexColor(value) {
  const match = String(value || "").trim().match(/^#([0-9a-f]{6})$/i);
  assert.ok(match, `Expected a 6-digit hex color, got ${value}`);

  const hex = match[1];
  return [0, 2, 4].map((start) => Number.parseInt(hex.slice(start, start + 2), 16) / 255);
}

function relativeLuminance(hexColor) {
  return parseHexColor(hexColor)
    .map((channel) => (channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4))
    .reduce((sum, channel, index) => sum + channel * [0.2126, 0.7152, 0.0722][index], 0);
}

function contrastRatio(foreground, background) {
  const foregroundLuminance = relativeLuminance(foreground);
  const backgroundLuminance = relativeLuminance(background);
  const lighter = Math.max(foregroundLuminance, backgroundLuminance);
  const darker = Math.min(foregroundLuminance, backgroundLuminance);

  return (lighter + 0.05) / (darker + 0.05);
}

function extractMediaBlock(css, query) {
  const marker = `@media ${query}`;
  const start = css.indexOf(marker);
  assert.notEqual(start, -1, `Missing ${marker}`);

  const blockStart = css.indexOf("{", start);
  assert.notEqual(blockStart, -1, `Missing ${marker} block start`);

  let depth = 0;
  for (let index = blockStart; index < css.length; index += 1) {
    if (css[index] === "{") {
      depth += 1;
    } else if (css[index] === "}") {
      depth -= 1;
      if (depth === 0) {
        return css.slice(blockStart + 1, index);
      }
    }
  }

  assert.fail(`Missing ${marker} block end`);
}

function parseCustomProperties(cssBlock) {
  return Object.fromEntries(
    Array.from(cssBlock.matchAll(/(--[a-z-]+):\s*([^;]+);/g), ([, name, value]) => [name, value.trim()])
  );
}

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

test("high contrast preference overrides core palette with accessible contrast", async () => {
  const css = await readFile(new URL("./styles.css", import.meta.url), "utf8");
  const highContrastBlock = extractMediaBlock(css, "(prefers-contrast: more)");
  const tokens = parseCustomProperties(highContrastBlock);

  for (const name of ["--bg", "--panel", "--text", "--muted", "--line", "--accent", "--accent-dark", "--danger"]) {
    assert.match(tokens[name] || "", /^#[0-9a-f]{6}$/i, `${name} should be a concrete high-contrast color`);
  }

  assert.ok(contrastRatio(tokens["--text"], tokens["--bg"]) >= 7, "text on background should meet enhanced contrast");
  assert.ok(contrastRatio(tokens["--muted"], tokens["--bg"]) >= 7, "muted helper text should remain readable");
  assert.ok(contrastRatio(tokens["--accent"], "#ffffff") >= 4.5, "primary button text should contrast with accent");
  assert.ok(contrastRatio(tokens["--muted"], "#ffffff") >= 4.5, "disabled button text should contrast with muted background");
  assert.ok(contrastRatio(tokens["--accent-dark"], tokens["--panel"]) >= 7, "links should be clearly visible");
  assert.ok(contrastRatio(tokens["--danger"], tokens["--panel"]) >= 7, "errors should be clearly visible");
  assert.match(highContrastBlock, /:focus-visible\s*{[^}]*outline:\s*3px\s+solid\s+var\(--accent-dark\);[^}]*}/s);
  assert.match(highContrastBlock, /\.error\s*{[^}]*font-weight:\s*700;[^}]*}/s);
});

test("forced colors mode maps the palette to system colors", async () => {
  const css = await readFile(new URL("./styles.css", import.meta.url), "utf8");
  const forcedColorsBlock = extractMediaBlock(css, "(forced-colors: active)");

  assert.match(forcedColorsBlock, /--bg:\s*Canvas;/);
  assert.match(forcedColorsBlock, /--panel:\s*Canvas;/);
  assert.match(forcedColorsBlock, /--text:\s*CanvasText;/);
  assert.match(forcedColorsBlock, /--accent:\s*Highlight;/);
  assert.match(forcedColorsBlock, /button:disabled\s*{[^}]*color:\s*GrayText;[^}]*}/s);
  assert.match(forcedColorsBlock, /a\[aria-disabled="true"\]\s*{[^}]*color:\s*GrayText;[^}]*}/s);
});

test("Cloudflare Pages static headers mirror server security headers", async () => {
  const headers = await readFile(new URL("./_headers", import.meta.url), "utf8");

  assert.match(headers, /\/\*/);
  assert.match(
    headers,
    /Content-Security-Policy:\s*default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data: blob:; connect-src 'self' https:\/\/publish\.x\.com; frame-ancestors 'none'; base-uri 'none'; form-action 'self'; upgrade-insecure-requests/
  );
  assert.match(headers, /X-Frame-Options:\s*DENY/);
  assert.match(headers, /X-Content-Type-Options:\s*nosniff/);
  assert.match(headers, /Referrer-Policy:\s*strict-origin-when-cross-origin/);
});
