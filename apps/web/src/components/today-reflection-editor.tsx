import { useEffect, useRef, useState } from "react";
import { useMutation } from "convex/react";
import { PenLine } from "lucide-react";
import { api } from "@cadence/backend/convex/_generated/api";
import { cn } from "@/lib/utils";

interface Routine { routineId: string; name: string; }
interface Task { taskId: string; title: string; status: "open" | "completed" | "dismissed"; }
export interface ReflectionEditorProps {
  date: string; initialText: string; routines: Routine[]; tasks: Task[];
  hasExisting: boolean; onSaved: () => void; onCancel: () => void;
}

function parseTagsFromText(text: string, routines: Routine[], tasks: Task[]) {
  const regex = /@\[([^\]]+)\]\(([^)]+)\)/g;
  const tags: Array<{ entityId: string; entityType: "task" | "routine" }> = [];
  const seen = new Set<string>();
  let m: RegExpExecArray | null;
  while ((m = regex.exec(text)) !== null) {
    const id = m[2]!;
    if (seen.has(id)) continue;
    seen.add(id);
    if (routines.some((r) => r.routineId === id)) tags.push({ entityId: id, entityType: "routine" });
    else if (tasks.some((t) => t.taskId === id)) tags.push({ entityId: id, entityType: "task" });
  }
  return tags;
}

export function ReflectionEditor({ date, initialText, routines, tasks, hasExisting, onSaved, onCancel }: ReflectionEditorProps) {
  const upsert = useMutation(api.reflections.upsert);
  const [text, setText] = useState(initialText);
  const [saving, setSaving] = useState(false);
  const [mention, setMention] = useState<{ query: string; start: number } | null>(null);
  const [mentionIdx, setMentionIdx] = useState(0);
  const taRef = useRef<HTMLTextAreaElement>(null);
  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
  const displayDate = new Date(date + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" });

  useEffect(() => {
    const ta = taRef.current;
    if (ta) { ta.style.height = "auto"; ta.style.height = `${ta.scrollHeight}px`; }
  }, []);

  const options = mention
    ? [...routines.map((r) => ({ id: r.routineId, name: r.name, type: "routine" as const })),
       ...tasks.filter((t) => t.status !== "dismissed").map((t) => ({ id: t.taskId, name: t.title, type: "task" as const }))]
        .filter((o) => o.name.toLowerCase().includes(mention.query.toLowerCase()))
    : [];

  function onTextChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const ta = e.target;
    ta.style.height = "auto"; ta.style.height = `${ta.scrollHeight}px`;
    const val = ta.value; const cursor = ta.selectionStart ?? val.length;
    setText(val);
    const m = val.slice(0, cursor).match(/@([^@\[\]()]*?)$/);
    if (m && m.index !== undefined) { setMention({ query: m[1]!, start: m.index }); setMentionIdx(0); }
    else setMention(null);
  }

  function insertMention(id: string, name: string) {
    const ta = taRef.current;
    if (!ta || !mention) return;
    const before = text.slice(0, mention.start);
    const insert = `@[${name}](${id})`;
    const newText = before + insert + text.slice(ta.selectionStart);
    setText(newText); setMention(null);
    setTimeout(() => {
      if (taRef.current) {
        const pos = before.length + insert.length;
        taRef.current.setSelectionRange(pos, pos); taRef.current.focus();
        taRef.current.style.height = "auto"; taRef.current.style.height = `${taRef.current.scrollHeight}px`;
      }
    }, 0);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (mention && options.length > 0) {
      if (e.key === "ArrowDown") { e.preventDefault(); setMentionIdx((i) => (i + 1) % options.length); return; }
      if (e.key === "ArrowUp") { e.preventDefault(); setMentionIdx((i) => (i - 1 + options.length) % options.length); return; }
      if (e.key === "Enter" && !e.shiftKey && !e.ctrlKey && !e.metaKey) {
        e.preventDefault(); const opt = options[mentionIdx]; if (opt) insertMention(opt.id, opt.name); return;
      }
    }
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") { e.preventDefault(); void save(); return; }
    if (e.key === "Escape") { if (mention) setMention(null); else onCancel(); }
  }

  async function save() {
    if (!text.trim()) return;
    setSaving(true);
    try { await upsert({ date, text, tags: parseTagsFromText(text, routines, tasks) }); onSaved(); }
    finally { setSaving(false); }
  }

  return (
    <div className="overflow-hidden rounded-[16px] border border-[var(--border-subtle)] bg-card shadow-[var(--shadow-md)] transition-all duration-200 focus-within:border-[var(--border-accent)] focus-within:shadow-[var(--shadow-accent)]">
      <div className="flex items-center justify-between border-b border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-5 py-3">
        <div className="flex items-center gap-2">
          <PenLine className="size-3.5 text-[var(--text-accent)]" strokeWidth={2.5} />
          <span className="text-[12px] font-bold uppercase tracking-[0.08em] text-[var(--text-accent)]">Reflection</span>
        </div>
        <span className="text-[11px] font-medium text-[var(--text-tertiary)]">{displayDate}</span>
      </div>

      <div className="relative px-5 pt-4 pb-3">
        <textarea ref={taRef} value={text} onChange={onTextChange} onKeyDown={onKeyDown} autoFocus rows={5}
          placeholder={"What's on your mind today?\nReflect on wins, challenges, or anything worth remembering…\n\nType @ to tag a task or routine."}
          className="w-full resize-none overflow-hidden bg-transparent text-[15px] font-[450] leading-[1.75] text-foreground placeholder:text-[var(--text-tertiary)] placeholder:text-[14px] placeholder:leading-[1.8] focus:outline-none" />
        {mention && options.length > 0 && (
          <div className="absolute left-5 top-full z-20 mt-1 max-h-[200px] min-w-[220px] overflow-y-auto rounded-[12px] border border-[var(--border-subtle)] bg-card shadow-[var(--shadow-md)]">
            {options.map((opt, i) => (
              <button key={opt.id} type="button" onMouseDown={(e) => { e.preventDefault(); insertMention(opt.id, opt.name); }}
                className={cn("flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left text-[13px] transition-colors",
                  i === mentionIdx ? "bg-[var(--surface-accent)] text-[var(--text-accent)]" : "text-foreground hover:bg-[var(--surface-hover)]")}>
                <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", opt.type === "routine" ? "bg-[var(--indigo-500)]" : "bg-[var(--amber-500)]")} />
                <span className="flex-1 truncate font-medium">{opt.name}</span>
                <span className="shrink-0 text-[11px] text-[var(--text-tertiary)]">{opt.type}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between border-t border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-5 py-2.5">
        <div className="flex items-center gap-3 text-[11px] text-[var(--text-tertiary)]">
          <span>⌘↵ save</span><span className="opacity-40">·</span><span>@ mention</span>
          {wordCount > 0 && <><span className="opacity-40">·</span><span>{wordCount} {wordCount === 1 ? "word" : "words"}</span></>}
        </div>
        <div className="flex items-center gap-2">
          {hasExisting && (
            <button type="button" onClick={onCancel}
              className="rounded-[8px] px-3 py-1.5 text-[12px] font-semibold text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] transition-colors">
              Cancel
            </button>
          )}
          <button type="button" onClick={() => void save()} disabled={saving || !text.trim()}
            className="rounded-[8px] bg-[var(--action-primary)] px-4 py-1.5 text-[12px] font-semibold text-white shadow-[var(--shadow-accent)] hover:bg-[var(--action-primary-hover)] disabled:opacity-40 disabled:shadow-none transition-all">
            {saving ? "Saving…" : "Save reflection"}
          </button>
        </div>
      </div>
    </div>
  );
}
