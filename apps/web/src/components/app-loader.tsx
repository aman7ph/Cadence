import { Logo } from "@/components/ui/logo";

/**
 * Full-screen opening state: the gyroscope, the wordmark, the promise.
 *
 * Replaces the bare "Loading session…" text. The mark is the only element that
 * animates by default in the app — everywhere else it renders static.
 *
 * The plate follows the theme rather than staying dark as in the prototype: a
 * dark loader handing off to a light app reads as a flash of the wrong screen.
 * The app *icon* keeps its dark plate, which is a different surface.
 */
export function AppLoader({ label = "Loading your day…" }: { label?: string }) {
  return (
    <div className="grid min-h-screen w-full place-items-center bg-background px-6">
      <div className="flex flex-col items-center gap-7">
        <Logo size={132} animated />
        <div className="cad-word flex flex-col items-center gap-2">
          <span className="font-display text-[26px] font-semibold leading-none text-foreground">
            Cadence
          </span>
          <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--text-tertiary)]">
            Small corrections. Steady course.
          </span>
        </div>
        <span className="sr-only" role="status">
          {label}
        </span>
      </div>
    </div>
  );
}
