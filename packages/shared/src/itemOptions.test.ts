import { describe, expect, it } from "vitest";
import {
  EMPTY_ITEM_OPTIONS,
  itemOptionsFrom,
  itemOptionsToArgs,
  type ItemOptions,
} from "./itemOptions";

describe("itemOptionsToArgs", () => {
  it("sends nothing when nothing is configured", () => {
    // The point of the whole helper: a plain task must not arrive carrying
    // repeatTarget: 2 just because that is the stepper's floor.
    expect(itemOptionsToArgs(EMPTY_ITEM_OPTIONS)).toEqual({
      goalId: undefined,
      goalContribution: undefined,
      repeatTarget: undefined,
      repeatIntervalMinutes: undefined,
    });
  });

  it("drops the contribution when no goal is linked", () => {
    const o: ItemOptions = { ...EMPTY_ITEM_OPTIONS, goalContribution: 7 };
    expect(itemOptionsToArgs(o).goalContribution).toBeUndefined();
  });

  it("keeps the contribution when a goal is linked", () => {
    const o: ItemOptions = {
      ...EMPTY_ITEM_OPTIONS,
      goalId: "g1",
      goalContribution: 7,
    };
    expect(itemOptionsToArgs(o)).toMatchObject({
      goalId: "g1",
      goalContribution: 7,
    });
  });

  it("drops both repeat values when spread is off", () => {
    const o: ItemOptions = {
      ...EMPTY_ITEM_OPTIONS,
      repeatTarget: 5,
      repeatIntervalMinutes: 30,
    };
    expect(itemOptionsToArgs(o)).toMatchObject({
      repeatTarget: undefined,
      repeatIntervalMinutes: undefined,
    });
  });

  it("sends both repeat values when spread is on", () => {
    const o: ItemOptions = {
      ...EMPTY_ITEM_OPTIONS,
      spread: true,
      repeatTarget: 5,
      repeatIntervalMinutes: 30,
    };
    expect(itemOptionsToArgs(o)).toMatchObject({
      repeatTarget: 5,
      repeatIntervalMinutes: 30,
    });
  });

  it("emits numbers, never strings", () => {
    const args = itemOptionsToArgs({
      goalId: "g1",
      goalContribution: 2,
      spread: true,
      repeatTarget: 3,
      repeatIntervalMinutes: 45,
    });
    expect(typeof args.goalContribution).toBe("number");
    expect(typeof args.repeatTarget).toBe("number");
    expect(typeof args.repeatIntervalMinutes).toBe("number");
  });
});

describe("itemOptionsFrom", () => {
  it("treats a stored repeatTarget as spread being on", () => {
    expect(itemOptionsFrom({ repeatTarget: 4 })).toMatchObject({
      spread: true,
      repeatTarget: 4,
    });
  });

  it("leaves spread off when there is no repeatTarget", () => {
    expect(itemOptionsFrom({ goalId: "g1" })).toMatchObject({
      spread: false,
      repeatTarget: 2,
    });
  });

  it("round-trips a configured item", () => {
    const doc = {
      goalId: "g1",
      goalContribution: 3,
      repeatTarget: 6,
      repeatIntervalMinutes: 90,
    };
    expect(itemOptionsToArgs(itemOptionsFrom(doc))).toMatchObject(doc);
  });

  it("round-trips a bare item back to nothing", () => {
    expect(itemOptionsToArgs(itemOptionsFrom({}))).toEqual({
      goalId: undefined,
      goalContribution: undefined,
      repeatTarget: undefined,
      repeatIntervalMinutes: undefined,
    });
  });
});
