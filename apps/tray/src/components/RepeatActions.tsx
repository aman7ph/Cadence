import { formatCountdown } from "@cadence/shared";
import { useCountdown } from "../lib/useCountdown";

interface Props {
  doneToday: number;
  target: number;
  nextRepAllowedAt?: number;
  onRep: () => void;
  onUndo: () => void;
}

// Progress + gated rep button + undo, shared by the tray's Tasks and Routines
// tabs. Without this the tray's ✓ would call the plain complete mutation,
// which now rejects repeat entities outright (D7) — so this is a bug fix, not
// just a feature: the old button threw on any repeat task or routine.
export function RepeatActions({
  doneToday,
  target,
  nextRepAllowedAt,
  onRep,
  onUndo,
}: Props) {
  const remaining = useCountdown(nextRepAllowedAt);
  const gated = remaining > 0;

  return (
    <>
      <span className="repeat-count">
        {doneToday}/{target}
      </span>
      {gated && <span className="repeat-wait">{formatCountdown(remaining)}</span>}
      <button
        className="task-action-btn"
        title={gated ? `Wait ${formatCountdown(remaining)}` : "Check in"}
        disabled={gated}
        onClick={onRep}
      >
        ✓
      </button>
      {doneToday > 0 && (
        <button className="task-action-btn" title="Undo last check-in" onClick={onUndo}>
          ↩
        </button>
      )}
    </>
  );
}
