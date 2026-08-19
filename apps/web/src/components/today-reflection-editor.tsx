import { useEffect, useRef, useState } from "react";
import { useMutation } from "convex/react";
import { tagsFromStored } from "@cadence/shared";
import { PenLine } from "lucide-react";
import { api } from "@cadence/backend/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { MentionMenu } from "./mention-menu";
import { ReflectionEditorFooter } from "./reflection-editor-footer";
import { useMentionText } from "@/lib/use-mention-text";
import { mentionKeyHandler } from "@/lib/mention-keys";

interface Routine {
  routineId: string;
  name: string;
}
interface Task {
  taskId: string;
  title: string;
  status: "open" | "completed";
}
export interface ReflectionEditorProps {
  date: string;
  initialText: string;
  routines: Routine[];
  tasks: Task[];
  hasExisting: boolean;
  onSaved: () => void;
  onCancel: () => void;
}

export function ReflectionEditor({
  date,
  initialText,
  routines,
  tasks,
  hasExisting,
  onSaved,
  onCancel,
}: ReflectionEditorProps) {
  const upsert = useMutation(api.reflections.upsert);
  // The textarea holds the READABLE form (`@Name`); the stored form carries
  // the id and is rebuilt on save. Binding straight to storage is what showed
  // `@[Name](jn77h2ks…)` mid-sentence.
  const {
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
    stored,
  } = useMentionText(initialText, routines, tasks);

  const [saving, setSaving] = useState(false);
  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
  const displayDate = new Date(date + "T00:00:00").toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });

  useEffect(() => fit(taRef.current), [fit, taRef]);

  const onKeyDown = mentionKeyHandler({
    open: !!mention,
    options,
    activeIndex: mentionIdx,
    setActiveIndex: setMentionIdx,
    onPick: insertMention,
    closeMenu: () => setMention(null),
    onSubmit: () => void save(),
    onEscape: onCancel,
  });

  async function save() {
    if (!text.trim()) return;
    setSaving(true);
    const storedText = stored();
    try {
      await upsert({
        date,
        text: storedText,
        tags: tagsFromStored(
          storedText,
          routines.map((r) => r.routineId),
          tasks.map((t) => t.taskId),
        ),
      });
      onSaved();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-lg border border-[var(--border-subtle)] bg-card shadow-[var(--shadow-sm)] transition-all duration-200 focus-within:border-[var(--border-accent)]">
      <div className="flex items-center justify-between rounded-t-lg border-b border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-5 py-3">
        <div className="flex items-center gap-2">
          <PenLine
            className="size-3.5 text-[var(--text-accent)]"
            strokeWidth={2.5}
          />
          <span className="text-[12px] font-bold uppercase tracking-[0.08em] text-[var(--text-accent)]">
            Reflection
          </span>
        </div>
        <span className="text-[11px] font-medium text-[var(--text-tertiary)]">
          {displayDate}
        </span>
      </div>

      <div className="relative px-5 pt-4 pb-3">
        <textarea
          ref={taRef}
          value={text}
          onChange={onTextChange}
          onKeyDown={onKeyDown}
          autoFocus
          rows={5}
          placeholder={
            "What's on your mind today?\nReflect on wins, challenges, or anything worth remembering…\n\nType @ to tag a task or routine."
          }
          className="w-full resize-none overflow-hidden bg-transparent text-[15px] font-[450] leading-[1.75] text-foreground placeholder:text-[var(--text-tertiary)] placeholder:text-[14px] placeholder:leading-[1.8] focus:outline-none"
        />
        {mention && options.length > 0 && (
          <MentionMenu
            options={options}
            activeIndex={mentionIdx}
            onPick={insertMention}
          />
        )}
      </div>

      <ReflectionEditorFooter
        wordCount={wordCount}
        saving={saving}
        canSave={!!text.trim()}
        hasExisting={hasExisting}
        onCancel={onCancel}
        onSave={() => void save()}
      />
    </div>
  );
}
