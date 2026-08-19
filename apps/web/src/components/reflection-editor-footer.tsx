import { Button } from "@/components/ui/button";

interface ReflectionEditorFooterProps {
  wordCount: number;
  saving: boolean;
  canSave: boolean;
  hasExisting: boolean;
  onCancel: () => void;
  onSave: () => void;
}

/**
 * The editor's status strip and actions: shortcut hints, a word count, and the
 * save/cancel pair.
 *
 * Cancel appears only when there is already a saved reflection — on a blank
 * day there is nothing to revert to, so the button would do nothing.
 */
export function ReflectionEditorFooter({
  wordCount,
  saving,
  canSave,
  hasExisting,
  onCancel,
  onSave,
}: ReflectionEditorFooterProps) {
  return (
    <div className="flex items-center justify-between rounded-b-lg border-t border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-5 py-2.5">
      <div className="flex items-center gap-3 text-[11px] text-[var(--text-tertiary)]">
        <span>⌘↵ save</span>
        <span className="opacity-40">·</span>
        <span>@ mention</span>
        {wordCount > 0 && (
          <>
            <span className="opacity-40">·</span>
            <span>
              {wordCount} {wordCount === 1 ? "word" : "words"}
            </span>
          </>
        )}
      </div>
      <div className="flex items-center gap-2">
        {hasExisting && (
          <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button
          type="button"
          size="sm"
          onClick={onSave}
          disabled={saving || !canSave}
        >
          {saving ? "Saving…" : "Save reflection"}
        </Button>
      </div>
    </div>
  );
}
