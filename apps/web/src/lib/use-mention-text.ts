import { useRef, useState } from "react";
import { type Mention, toEditorText, toStoredText } from "@cadence/shared";

/** An `@` run being typed, ended by any bracket the stored form uses. */
const TRIGGER = /@([^@[\]()]*?)$/;

export interface MentionOption {
  id: string;
  name: string;
  type: "routine" | "task";
}

/**
 * The reflection editor's text, its mentions and the `@` autocomplete.
 *
 * The textarea holds the READABLE form (`@Name`); the stored form carries the
 * id and is rebuilt on save. Binding straight to storage is what showed
 * `@[Name](jn77h2ks…)` mid-sentence.
 *
 * The textarea auto-grows, so every path that changes the text also has to
 * re-measure it — which is why the ref lives here rather than in the component.
 */
export function useMentionText(
  initialText: string,
  routines: { routineId: string; name: string }[],
  tasks: { taskId: string; title: string }[],
) {
  const initial = toEditorText(initialText);
  const [text, setText] = useState(initial.text);
  const [mentions, setMentions] = useState<Mention[]>(initial.mentions);
  const [mention, setMention] = useState<{
    query: string;
    start: number;
  } | null>(null);
  const [mentionIdx, setMentionIdx] = useState(0);
  const taRef = useRef<HTMLTextAreaElement>(null);

  const fit = (ta: HTMLTextAreaElement | null) => {
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = `${ta.scrollHeight}px`;
  };

  const options: MentionOption[] = mention
    ? [
        ...routines.map((r) => ({
          id: r.routineId,
          name: r.name,
          type: "routine" as const,
        })),
        ...tasks.map((t) => ({
          id: t.taskId,
          name: t.title,
          type: "task" as const,
        })),
      ].filter((o) =>
        o.name.toLowerCase().includes(mention.query.toLowerCase()),
      )
    : [];

  function onTextChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const ta = e.target;
    fit(ta);
    const val = ta.value;
    const cursor = ta.selectionStart ?? val.length;
    setText(val);
    const m = val.slice(0, cursor).match(TRIGGER);
    if (m && m.index !== undefined) {
      setMention({ query: m[1]!, start: m.index });
      setMentionIdx(0);
    } else setMention(null);
  }

  function insertMention(id: string, name: string) {
    const ta = taRef.current;
    if (!ta || !mention) return;
    const before = text.slice(0, mention.start);
    const insert = `@${name}`;
    setMentions((prev) =>
      prev.some((x) => x.id === id) ? prev : [...prev, { id, name }],
    );
    setText(before + insert + text.slice(ta.selectionStart));
    setMention(null);
    setTimeout(() => {
      const el = taRef.current;
      if (!el) return;
      const pos = before.length + insert.length;
      el.setSelectionRange(pos, pos);
      el.focus();
      fit(el);
    }, 0);
  }

  return {
    text,
    mention,
    setMention,
    mentionIdx,
    setMentionIdx,
    options,
    taRef,
    fit,
    onTextChange,
    insertMention,
    stored: () => toStoredText(text, mentions),
  };
}
