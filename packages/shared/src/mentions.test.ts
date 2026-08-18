import { describe, expect, it } from "vitest";
import {
  parseMentionSegments,
  tagsFromStored,
  toEditorText,
  toStoredText,
} from "./mentions";

const ID_A = "jn77h2ks0bjbrsvea502jyr4js8a35ap";
const ID_B = "kd91p2ls0bjbrsvea502jyr4js8a35zz";

describe("toEditorText", () => {
  it("hides the id, which is the whole point", () => {
    const { text } = toEditorText(`@[Test Staged Task](${ID_A})`);
    expect(text).toBe("@Test Staged Task");
    expect(text).not.toContain(ID_A);
  });

  it("keeps the surrounding prose intact", () => {
    const { text } = toEditorText(`Went well. @[Morning run](${ID_A}) felt easy.`);
    expect(text).toBe("Went well. @Morning run felt easy.");
  });

  it("collects each distinct mention once", () => {
    const { mentions } = toEditorText(`@[Run](${ID_A}) then @[Run](${ID_A}) and @[Swim](${ID_B})`);
    expect(mentions).toEqual([
      { id: ID_A, name: "Run" },
      { id: ID_B, name: "Swim" },
    ]);
  });

  it("leaves text with no mentions alone", () => {
    expect(toEditorText("Just a normal day.")).toEqual({
      text: "Just a normal day.",
      mentions: [],
    });
  });
});

describe("toStoredText", () => {
  const mentions = [
    { id: ID_A, name: "Test Staged Task" },
    { id: ID_B, name: "Test Staged Task Two" },
  ];

  it("round-trips", () => {
    const stored = `@[Morning run](${ID_A}) was good`;
    const { text, mentions: ms } = toEditorText(stored);
    expect(toStoredText(text, ms)).toBe(stored);
  });

  it("matches the LONGER name first", () => {
    // The bug this guards: shortest-first turns "@Test Staged Task Two" into
    // "@[Test Staged Task](id) Two", silently mis-tagging a different item.
    expect(toStoredText("@Test Staged Task Two", mentions)).toBe(
      `@[Test Staged Task Two](${ID_B})`,
    );
  });

  it("still matches the shorter name when it is the whole mention", () => {
    expect(toStoredText("@Test Staged Task", mentions)).toBe(
      `@[Test Staged Task](${ID_A})`,
    );
  });

  it("leaves an edited mention as plain prose rather than re-linking it", () => {
    expect(toStoredText("@Test Staged Tas", mentions)).toBe("@Test Staged Tas");
  });

  it("leaves a bare @ alone", () => {
    expect(toStoredText("email me @ noon", mentions)).toBe("email me @ noon");
  });

  it("handles several mentions in one sentence", () => {
    expect(toStoredText("@Test Staged Task and @Test Staged Task Two", mentions)).toBe(
      `@[Test Staged Task](${ID_A}) and @[Test Staged Task Two](${ID_B})`,
    );
  });
});

describe("tagsFromStored", () => {
  it("types each mention by which list holds its id", () => {
    const stored = `@[Run](${ID_A}) and @[Email](${ID_B})`;
    expect(tagsFromStored(stored, [ID_A], [ID_B])).toEqual([
      { entityId: ID_A, entityType: "routine" },
      { entityId: ID_B, entityType: "task" },
    ]);
  });

  it("drops mentions of things that no longer exist", () => {
    expect(tagsFromStored(`@[Gone](${ID_A})`, [], [])).toEqual([]);
  });
});

describe("parseMentionSegments", () => {
  it("is not broken by the shared regex being reused", () => {
    const stored = `@[Run](${ID_A})`;
    // A module-level /g regex keeps lastIndex between calls; two identical
    // calls must agree.
    expect(parseMentionSegments(stored)).toEqual(parseMentionSegments(stored));
  });
});
