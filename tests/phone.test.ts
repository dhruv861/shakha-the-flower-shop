import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { indianMobile } from "../src/lib/phone";

const parse = (typed: string) => {
  const result = indianMobile.safeParse(typed);
  return result.success ? result.data : null;
};

describe("indianMobile", () => {
  it("accepts the ways people type their number, keeping the 10 digits", () => {
    for (const typed of [
      "9876543210",
      "98765 43210",
      " 98765 43210 ",
      "+91 98765 43210",
      "+919876543210",
      "919876543210",
      "09876543210",
      "(+91) 98765-43210",
    ]) {
      assert.equal(parse(typed), "9876543210", typed);
    }
  });

  it("leaves a number that only starts with 91 alone", () => {
    assert.equal(parse("9198765432"), "9198765432");
  });

  it("rejects numbers that aren't Indian mobiles", () => {
    for (const typed of ["", "12345", "5876543210", "98765432101", "+1 415 555 0100"]) {
      assert.equal(parse(typed), null, typed);
    }
  });
});
