import { useQuery, useMutation } from "convex/react";
import { api } from "@cadence/backend/convex/_generated/api";

function todayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function RoutinesTab() {
  const today = todayStr();
  const day = useQuery(api.days.getDay, { date: today });

  const complete = useMutation(api.routines.complete);
  const skip = useMutation(api.routines.skip);
  const uncomplete = useMutation(api.routines.uncomplete);

  if (day === undefined) {
    return (
      <div className="tab-empty">
        <div className="loading-dots"><span /><span /><span /></div>
      </div>
    );
  }

  const routines = day?.routines ?? [];

  if (routines.length === 0) {
    return (
      <div className="tab-empty">
        <div className="tab-empty-icon">○</div>
        <p className="tab-empty-text">No routines scheduled for today</p>
      </div>
    );
  }

  return (
    <div className="task-list">
      {routines.map((r) => (
        <div key={r.routineId} className="task-row">
          <span
            className={`task-dot ${
              r.status === "completed" ? "green" : r.status === "skipped" ? "amber" : "blue"
            }`}
          />
          <span
            className={`task-title${
              r.status === "completed" ? " done" : r.status === "skipped" ? " dismissed" : ""
            }`}
          >
            {r.name}
          </span>
          <div className="task-actions">
            {r.status === "pending" && (
              <>
                <button
                  className="task-action-btn"
                  title="Complete"
                  onClick={() => complete({ routineId: r.routineId, date: today, today })}
                >
                  ✓
                </button>
                <button
                  className="task-action-btn danger"
                  title="Skip"
                  onClick={() => skip({ routineId: r.routineId, date: today, today })}
                >
                  ✕
                </button>
              </>
            )}
            {(r.status === "completed" || r.status === "skipped") && (
              <button
                className="task-action-btn"
                title="Undo"
                onClick={() => uncomplete({ routineId: r.routineId, date: today, today })}
              >
                ↩
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
