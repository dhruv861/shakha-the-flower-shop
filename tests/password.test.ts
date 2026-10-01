import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { generatePassword, hashPassword, verifyPassword } from "../src/lib/password";

describe("passwords", () => {
  it("verifies the right password and rejects a wrong one", async () => {
    const stored = await hashPassword("correct horse battery");
    assert.match(stored, /^scrypt\$16384\$8\$1\$/);
    assert.equal(await verifyPassword("correct horse battery", stored), true);
    assert.equal(await verifyPassword("correct horse batterY", stored), false);
  });

  it("salts every hash", async () => {
    assert.notEqual(await hashPassword("same password"), await hashPassword("same password"));
  });

  it("refuses a malformed stored hash", async () => {
    assert.equal(await verifyPassword("anything", "not-a-hash"), false);
  });

  it("generates long random passwords", () => {
    const password = generatePassword();
    assert.ok(password.length >= 16);
    assert.notEqual(password, generatePassword());
  });
});
