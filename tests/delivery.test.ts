import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  addDays,
  dateChip,
  deliveryDays,
  type DeliveryRules,
  formatTime,
  indiaNow,
  isValidDelivery,
  type Slot,
  slotLabel,
  slotsFor,
  toMinutes,
} from "../src/lib/delivery";

const TODAY = "2026-10-01"; // a Thursday
const at = (hhmm: string, dateKey = TODAY) => ({ dateKey, minutes: toMinutes(hhmm) });
const labels = (slots: Slot[]) => slots.map(slotLabel);

const rules: DeliveryRules = {
  sameDayCutoff: "",
  leadTimeMinutes: 90,
  // Out of order on purpose: slots come back sorted.
  slots: [
    { start: "14:00", end: "18:00" },
    { start: "08:00", end: "12:00" },
    { start: "18:00", end: "22:00" },
  ],
  daysAhead: 2,
};

describe("indiaNow", () => {
  it("reads the clock in India time, whatever the server's time zone", () => {
    assert.deepEqual(indiaNow(new Date("2026-09-30T18:29:00Z")), { dateKey: "2026-09-30", minutes: 23 * 60 + 59 });
    assert.deepEqual(indiaNow(new Date("2026-09-30T18:30:00Z")), { dateKey: "2026-10-01", minutes: 0 });
  });
});

describe("formatTime", () => {
  it("writes times the way the shop says them", () => {
    assert.equal(formatTime("08:00"), "8 AM");
    assert.equal(formatTime("12:00"), "12 PM");
    assert.equal(formatTime("00:30"), "12:30 AM");
    assert.equal(formatTime("13:30"), "1:30 PM");
  });
});

describe("addDays", () => {
  it("crosses month, year and leap-day boundaries", () => {
    assert.equal(addDays("2026-09-30", 1), "2026-10-01");
    assert.equal(addDays("2026-12-31", 1), "2027-01-01");
    assert.equal(addDays("2028-02-28", 1), "2028-02-29");
  });
});

describe("slotsFor", () => {
  it("offers every slot, sorted, on a later day", () => {
    assert.deepEqual(labels(slotsFor("2026-10-02", rules, at("23:00"))), ["8 AM – 12 PM", "2 PM – 6 PM", "6 PM – 10 PM"]);
  });

  it("drops today's slots that end within the lead time", () => {
    assert.equal(slotsFor(TODAY, rules, at("10:00")).length, 3);
    assert.deepEqual(labels(slotsFor(TODAY, rules, at("10:31"))), ["2 PM – 6 PM", "6 PM – 10 PM"]);
  });

  it("keeps a slot with exactly the lead time left", () => {
    assert.deepEqual(labels(slotsFor(TODAY, rules, at("20:30"))), ["6 PM – 10 PM"]);
    assert.deepEqual(slotsFor(TODAY, rules, at("20:31")), []);
  });

  it("closes same-day orders at the cut-off", () => {
    const withCutoff = { ...rules, sameDayCutoff: "16:00" };
    assert.equal(slotsFor(TODAY, withCutoff, at("15:59")).length, 2);
    assert.deepEqual(slotsFor(TODAY, withCutoff, at("16:00")), []);
    assert.equal(slotsFor("2026-10-02", withCutoff, at("16:00")).length, 3);
  });

  it("offers nothing in the past or beyond the booking window", () => {
    assert.deepEqual(slotsFor("2026-09-30", rules, at("09:00")), []);
    assert.equal(slotsFor("2026-10-03", rules, at("09:00")).length, 3);
    assert.deepEqual(slotsFor("2026-10-04", rules, at("09:00")), []);
  });
});

describe("deliveryDays", () => {
  it("includes today while a slot is still reachable", () => {
    assert.deepEqual(
      deliveryDays(rules, at("09:00")).map((d) => d.dateKey),
      ["2026-10-01", "2026-10-02", "2026-10-03"],
    );
  });

  it("starts tomorrow once today's last slot is out of reach", () => {
    assert.deepEqual(
      deliveryDays(rules, at("21:00")).map((d) => d.dateKey),
      ["2026-10-02", "2026-10-03"],
    );
  });
});

describe("isValidDelivery", () => {
  it("accepts only a slot that is still on offer", () => {
    const now = at("11:00");
    assert.equal(isValidDelivery(TODAY, "2 PM – 6 PM", rules, now), true);
    assert.equal(isValidDelivery(TODAY, "8 AM – 12 PM", rules, now), false);
    assert.equal(isValidDelivery("2026-10-02", "8 AM – 12 PM", rules, now), true);
    assert.equal(isValidDelivery("2026-10-02", "9 AM – 1 PM", rules, now), false);
  });
});

describe("dateChip", () => {
  it("names today and tomorrow, then weekdays", () => {
    assert.deepEqual(dateChip("2026-10-01", TODAY), { day: "Today", date: "1 Oct" });
    assert.deepEqual(dateChip("2026-10-02", TODAY), { day: "Tomorrow", date: "2 Oct" });
    assert.deepEqual(dateChip("2026-10-03", TODAY), { day: "Sat", date: "3 Oct" });
  });
});
