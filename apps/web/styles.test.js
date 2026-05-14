import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("hidden elements stay hidden over component display rules", async () => {
  const css = await readFile(new URL("./styles.css", import.meta.url), "utf8");

  assert.match(css, /\[hidden\]\s*{[^}]*display:\s*none\s*!important;[^}]*}/s);
});
