type Tab = "routines" | "tasks";

interface Props {
  active: Tab;
  onChange: (tab: Tab) => void;
}

export function TabBar({ active, onChange }: Props) {
  return (
    <div className="tab-bar">
      <button
        className={`tab-btn${active === "routines" ? " active" : ""}`}
        onClick={() => onChange("routines")}
      >
        Routines
      </button>
      <button
        className={`tab-btn${active === "tasks" ? " active" : ""}`}
        onClick={() => onChange("tasks")}
      >
        Daily Tasks
      </button>
    </div>
  );
}
