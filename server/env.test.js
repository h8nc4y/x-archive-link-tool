import test from "node:test";
import assert from "node:assert/strict";
import { validateEnv } from "./env.js";

test("validateEnv does not require token env", () => {
  assert.deepEqual(validateEnv({ PORT: "3000" }), {
    PORT: "3000"
  });
});

test("validateEnv succeeds with empty env", () => {
  assert.deepEqual(validateEnv({}), {
    PORT: undefined
  });
});
