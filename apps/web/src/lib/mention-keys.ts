import type { MentionOption } from "./use-mention-text";

interface Args {
  open: boolean;
  options: MentionOption[];
  activeIndex: number;
  setActiveIndex: (fn: (i: number) => number) => void;
  onPick: (id: string, name: string) => void;
  closeMenu: () => void;
  onSubmit: () => void;
  onEscape: () => void;
}

/**
 * Keyboard bindings for the reflection editor.
 *
 * Arrow keys and Enter drive the mention menu while it is open, so the same
 * Enter that picks a mention must not also submit. Escape closes the menu
 * first and only cancels the editor on a second press.
 */
export function mentionKeyHandler({
  open,
  options,
  activeIndex,
  setActiveIndex,
  onPick,
  closeMenu,
  onSubmit,
  onEscape,
}: Args) {
  return (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (open && options.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIndex((i) => (i + 1) % options.length);
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIndex((i) => (i - 1 + options.length) % options.length);
        return;
      }
      if (e.key === "Enter" && !e.shiftKey && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        const opt = options[activeIndex];
        if (opt) onPick(opt.id, opt.name);
        return;
      }
    }
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      onSubmit();
      return;
    }
    if (e.key === "Escape") {
      if (open) closeMenu();
      else onEscape();
    }
  };
}
