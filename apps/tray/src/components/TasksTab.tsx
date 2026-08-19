import { useQuery, useMutation } from "convex/react";
import { api } from "@cadence/backend/convex/_generated/api";
import { RepeatActions } from "./RepeatActions";

function todayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function TasksTab() {
  const today = todayStr();
  const day = useQuery(api.days.getDay, { date: today });

  const complete = useMutation(api.dailyTasks.complete);
  const uncomplete = useMutation(api.dailyTasks.uncomplete);
  const logRep = useMutation(api.dailyTaskRepeats.logRep);
  const undoRep = useMutation(api.dailyTaskRepeats.undoRep);

  if (day === undefined) {
    return (
      <div className="tab-empty">
        <div className="loading-dots">
          <span />
          <span />
          <span />
        </div>
      </div>
    );
  }

  const tasks = day?.randomTasks ?? [];
  const open = tasks.filter((t) => t.status === "open");
  const done = tasks.filter((t) => t.status === "completed");

  if (tasks.length === 0) {
    return (
      <div className="tab-empty">
        <div className="tab-empty-icon">○</div>
        {/* Web and mobile say "No tasks yet. Add one below." — the second
            sentence is dropped because the tray has no add affordance, and
            pointing at one that does not exist is worse than saying less. */}
        <p className="tab-empty-text">No tasks yet.</p>
      </div>
    );
  }

  return (
    <div className="task-list">
      {open.map((t) => (
        <div key={t.taskId} className="task-row">
          <span className="task-dot pending" />
          <span className="task-title">
            {t.isCarriedOver ? "↑ " : ""}
            {t.title}
          </span>
          <div className="task-actions">
            {t.repeatTarget !== undefined ? (
              <RepeatActions
                doneToday={t.repeatDoneToday ?? 0}
                target={t.repeatTarget}
                nextRepAllowedAt={t.nextRepAllowedAt}
                onRep={() => void logRep({ taskId: t.taskId, today })}
                onUndo={() => void undoRep({ taskId: t.taskId, today })}
              />
            ) : (
              <button
                className="task-action-btn"
                title="Complete"
                onClick={() => complete({ taskId: t.taskId, today })}
              >
                ✓
              </button>
            )}
          </div>
        </div>
      ))}

      {done.length > 0 && (
        <>
          <div className="section-divider" />
          {done.map((t) => (
            <div key={t.taskId} className="task-row">
              <span className="task-dot completed" />
              <span className="task-title done">{t.title}</span>
              <div className="task-actions">
                {t.repeatTarget !== undefined && (
                  <span className="repeat-count">
                    {t.repeatDoneToday ?? 0}/{t.repeatTarget}
                  </span>
                )}
                <button
                  className="task-action-btn"
                  title="Undo"
                  onClick={() =>
                    t.repeatTarget !== undefined
                      ? void undoRep({ taskId: t.taskId, today })
                      : void uncomplete({ taskId: t.taskId })
                  }
                >
                  ↩
                </button>
              </div>
            </div>
          ))}
        </>
      )}
    </div>
  );
}
