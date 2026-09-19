import test from "node:test";
import assert from "node:assert/strict";
import { canonicalize, sha256 } from "../src/canonical.ts";

test("canonical fingerprints do not depend on object-key order", () => {
  const left = { z: 3, nested: { b: 2, a: 1 } };
  const right = { nested: { a: 1, b: 2 }, z: 3 };
  assert.equal(canonicalize(left), canonicalize(right));
  assert.equal(sha256(left), sha256(right));
});
