import { describe, expect, it } from "vitest";
import {
  DEFAULT_LIST_COLUMNS,
  LIST_PAGES,
  MAX_LIST_COLUMNS,
  MIN_LIST_COLUMNS,
  isValidColumnCount,
  listColumnsValidationError,
  validateListColumns,
  withColumnDefaults,
} from "./listColumns";

describe("isValidColumnCount", () => {
  it("accepts every value in range", () => {
    for (let n = MIN_LIST_COLUMNS; n <= MAX_LIST_COLUMNS; n++) {
      expect(isValidColumnCount(n)).toBe(true);
    }
  });

  it("rejects out-of-range values on both sides", () => {
    expect(isValidColumnCount(MIN_LIST_COLUMNS - 1)).toBe(false);
    expect(isValidColumnCount(MAX_LIST_COLUMNS + 1)).toBe(false);
  });

  it("rejects non-integers and non-numbers", () => {
    expect(isValidColumnCount(2.5)).toBe(false);
    expect(isValidColumnCount(NaN)).toBe(false);
    expect(isValidColumnCount(Infinity)).toBe(false);
    expect(isValidColumnCount("2")).toBe(false);
    expect(isValidColumnCount(null)).toBe(false);
    expect(isValidColumnCount(undefined)).toBe(false);
  });
});

describe("defaults", () => {
  it("covers every page", () => {
    for (const page of LIST_PAGES) {
      expect(isValidColumnCount(DEFAULT_LIST_COLUMNS[page])).toBe(true);
    }
  });

  // The defaults must reproduce the layout the pages already shipped with, so
  // that adding the field changes nothing until a user opts in.
  it("matches the pre-feature layout", () => {
    expect(DEFAULT_LIST_COLUMNS).toEqual({
      today: 1,
      routines: 2,
      staging: 2,
      goals: 1,
    });
  });
});

describe("listColumnsValidationError", () => {
  it("passes a complete valid object", () => {
    expect(listColumnsValidationError(DEFAULT_LIST_COLUMNS)).toBeNull();
  });

  it("rejects a missing page", () => {
    const { goals, ...partial } = DEFAULT_LIST_COLUMNS;
    void goals;
    expect(listColumnsValidationError(partial)).toMatch(/goals/);
  });

  it("names the offending page", () => {
    expect(
      listColumnsValidationError({ ...DEFAULT_LIST_COLUMNS, staging: 99 }),
    ).toMatch(/staging/);
  });

  it("rejects non-objects", () => {
    expect(listColumnsValidationError(null)).not.toBeNull();
    expect(listColumnsValidationError(3)).not.toBeNull();
  });
});

describe("validateListColumns", () => {
  it("throws the same message the form would show", () => {
    expect(() =>
      validateListColumns({ ...DEFAULT_LIST_COLUMNS, today: 0 }),
    ).toThrow(/today/);
  });

  it("does not throw on a valid object", () => {
    expect(() =>
      validateListColumns({ today: 3, routines: 5, staging: 1, goals: 2 }),
    ).not.toThrow();
  });
});

describe("withColumnDefaults", () => {
  it("returns the defaults when nothing is stored", () => {
    expect(withColumnDefaults(undefined)).toEqual(DEFAULT_LIST_COLUMNS);
  });

  it("fills only the pages that are missing", () => {
    expect(withColumnDefaults({ today: 3 })).toEqual({
      ...DEFAULT_LIST_COLUMNS,
      today: 3,
    });
  });

  // A stored value could be out of range if the cap were ever lowered; falling
  // back beats rendering a grid nobody can read.
  it("ignores stored values outside the range", () => {
    expect(withColumnDefaults({ routines: 99, goals: 0 })).toEqual(
      DEFAULT_LIST_COLUMNS,
    );
  });

  it("does not mutate the shared defaults object", () => {
    withColumnDefaults({ today: 4 });
    expect(DEFAULT_LIST_COLUMNS.today).toBe(1);
  });
});
