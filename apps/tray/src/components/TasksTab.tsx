import { useQuery, useMutation } from "convex/react";
import { api } from "@cadence/backend/convex/_generated/api";

function todayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function TasksTab() {
  const today = todayStr();
  const day = useQuery(api.days.getDay, { date: today });

  const complete = useMutation(api.dailyTasks.complete);
  const uncomplete = useMutation(api.dailyTasks.uncomplete);
  const dismiss = useMutation(api.dailyTasks.dismiss);

  if (day === undefined) {
    return (
      <div className="tab-empty">
        <div className="loading-dots"><span /><span /><span /></div>
      </div>
    );
  }

  const tasks = day?.randomTasks ?? [];
  const open = tasks.filter((t) => t.status === "open");
  const done = tasks.filter((t) => t.status === "completed");
  const dismissed = tasks.filter((t) => t.status === "dismissed");

  if (tasks.length === 0) {
    return (
      <div className="tab-empty">
        <div className="tab-empty-icon">○</div>
        <p className="tab-empty-text">No tasks for today</p>
      </div>
    );
  }

  return (
    <div className="task-list">
      {open.map((t) => (
        <div key={t.taskId} className="task-row">
          <span className="task-dot blue" />
          <span className="task-title">
            {t.isCarriedOver ? "↑ " : ""}
            {t.title}
          </span>
          <div className="task-actions">
            <button
              className="task-action-btn"
              title="Complete"
              onClick={() => complete({ taskId: t.taskId, today })}
            >
              ✓
            </button>
            <button
              className="task-action-btn danger"
              title="Dismiss"
              onClick={() => dismiss({ taskId: t.taskId })}
            >
              ✕
            </button>
          </div>
        </div>
      ))}

      {done.length > 0 && (
        <>
          <div className="section-divider" />
          {done.map((t) => (
            <div key={t.taskId} className="task-row">
              <span className="task-dot green" />
              <span className="task-title done">{t.title}</span>
              <div className="task-actions">
                <button
                  className="task-action-btn"
                  title="Undo"
                  onClick={() => uncomplete({ taskId: t.taskId })}
                >
                  ↩
                </button>
              </div>
            </div>
          ))}
        </>
      )}

      {dismissed.length > 0 && (
        <>
          <div className="section-divider" />
          {dismissed.map((t) => (
            <div key={t.taskId} className="task-row">
              <span className="task-dot dim" />
              <span className="task-title dismissed">{t.title}</span>
            </div>
          ))}
        </>
      )}
    </div>
  );
}
