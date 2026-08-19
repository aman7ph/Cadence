// Reflection @-mentions: the stored form, and the form a person should see.
//
// Reflections are STORED as `@[Display Name](entityId)` so a rename cannot
// orphan a tag. That is the right storage format and the wrong editing format:
// an editor bound directly to it shows the raw id mid-sentence, e.g.
//
//   @[Test Staged Task](jn77h2ks0bjbrsvea502jyr4js8a35ap)
//
// Both apps did exactly that. These helpers convert between the two so the
// editor can hold `@Test Staged Task` while the database still gets the id.
//
// Framework-agnostic string work on purpose — web and mobile share it, which is
// also why the mention regex now has exactly one definition.

export const MENTION_RE = /@\[([^\]]+)\]\(([^)]+)\)/g;

export type MentionSegment =
  | { kind: "text"; value: string }
  | { kind: "mention"; name: string; id: string };

export interface Mention {
  id: string;
  name: string;
}

/** Split stored text into plain runs and mentions, for read-only rendering. */
export function parseMentionSegments(text: string): MentionSegment[] {
  const re = new RegExp(MENTION_RE.source, "g");
  const out: MentionSegment[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last)
      out.push({ kind: "text", value: text.slice(last, m.index) });
    out.push({ kind: "mention", name: m[1]!, id: m[2]! });
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push({ kind: "text", value: text.slice(last) });
  return out;
}

/**
 * Stored → what the editor shows. Returns the readable text plus the mentions
 * it contains, which the caller must hold so the text can be re-serialised.
 */
export function toEditorText(stored: string): {
  text: string;
  mentions: Mention[];
} {
  const mentions: Mention[] = [];
  const text = parseMentionSegments(stored)
    .map((seg) => {
      if (seg.kind === "text") return seg.value;
      if (!mentions.some((x) => x.id === seg.id && x.name === seg.name)) {
        mentions.push({ id: seg.id, name: seg.name });
      }
      return `@${seg.name}`;
    })
    .join("");
  return { text, mentions };
}

/**
 * What the editor shows → stored.
 *
 * Longest names first, so "Test Staged Task Two" is matched before
 * "Test Staged Task" and cannot be corrupted into `@[Test Staged Task](id)Two`.
 * A mention whose text the user has since edited simply stops matching and
 * stays plain prose, which is the honest outcome — better than re-linking text
 * that no longer names the thing.
 */
export function toStoredText(editorText: string, mentions: Mention[]): string {
  const byLength = [...mentions].sort((a, b) => b.name.length - a.name.length);
  let out = "";
  let i = 0;
  outer: while (i < editorText.length) {
    if (editorText[i] === "@") {
      for (const m of byLength) {
        if (editorText.startsWith(m.name, i + 1)) {
          out += `@[${m.name}](${m.id})`;
          i += 1 + m.name.length;
          continue outer;
        }
      }
    }
    out += editorText[i];
    i += 1;
  }
  return out;
}

/** The tags to persist alongside the text, typed by which list the id is in. */
export function tagsFromStored(
  stored: string,
  routineIds: readonly string[],
  taskIds: readonly string[],
): { entityId: string; entityType: "task" | "routine" }[] {
  const tags: { entityId: string; entityType: "task" | "routine" }[] = [];
  for (const seg of parseMentionSegments(stored)) {
    if (seg.kind !== "mention") continue;
    if (routineIds.includes(seg.id))
      tags.push({ entityId: seg.id, entityType: "routine" });
    else if (taskIds.includes(seg.id))
      tags.push({ entityId: seg.id, entityType: "task" });
  }
  return tags;
}
