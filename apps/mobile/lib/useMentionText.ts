import { useRef, useState } from "react";
import {
  type Mention,
  tagsFromStored,
  toEditorText,
  toStoredText,
} from "@cadence/shared";
import type { Mentionable } from "../components/MentionMenu";

/** An `@` run being typed, ended by any bracket the stored form uses. */
const TRIGGER = /@([^@[\]()]*?)$/;

/**
 * The reflection editor's text, its mentions, and the `@` autocomplete.
 *
 * The editor holds the READABLE form (`@Name`); the stored form carries the id
 * and is rebuilt on save. Binding straight to storage is what put
 * `@[Name](jn77h2ks…)` in front of the user.
 */
export function useMentionText(
  initialText: string,
  routines: { routineId: string; name: string }[],
  tasks: { taskId: string; title: string }[],
) {
  const initial = toEditorText(initialText);
  const [text, setText] = useState(initial.text);
  const [mentions, setMentions] = useState<Mention[]>(initial.mentions);
  const [query, setQuery] = useState<string | null>(null);
  const [menuIdx, setMenuIdx] = useState(0);
  const cursorRef = useRef(0);

  const mentionables: Mentionable[] = [
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
  ];

  const filtered =
    query === null
      ? []
      : mentionables.filter((m) =>
          m.name.toLowerCase().includes(query.toLowerCase()),
        );

  const handleChange = (val: string) => {
    setText(val);
    const m = val.slice(0, cursorRef.current).match(TRIGGER);
    if (m) {
      setQuery(m[1]!);
      setMenuIdx(0);
    } else {
      setQuery(null);
    }
  };

  const insertMention = (item: Mentionable) => {
    const cursor = cursorRef.current;
    const m = text.slice(0, cursor).match(TRIGGER);
    if (!m) return;
    const start = cursor - m[0].length;
    setText(text.slice(0, start) + `@${item.name}` + text.slice(cursor));
    setMentions((prev) =>
      prev.some((x) => x.id === item.id)
        ? prev
        : [...prev, { id: item.id, name: item.name }],
    );
    setQuery(null);
  };

  /** The stored text plus the tags to persist with it. */
  const collect = () => {
    const stored = toStoredText(text, mentions);
    return {
      stored,
      tags: tagsFromStored(
        stored,
        routines.map((r) => r.routineId),
        tasks.map((t) => t.taskId),
      ),
    };
  };

  return {
    text,
    setText,
    query,
    filtered,
    menuIdx,
    cursorRef,
    handleChange,
    insertMention,
    collect,
  };
}
