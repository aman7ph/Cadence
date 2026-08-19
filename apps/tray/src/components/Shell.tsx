import { GyroMark } from "./GyroMark";

export function Logo() {
  return <GyroMark size={18} />;
}

export function LoadingShell() {
  return (
    <div className="overlay">
      <div className="header">
        <div className="header-drag">
          <Logo />
          <span className="brand">Cadence</span>
        </div>
      </div>
      <div className="tab-empty" style={{ flex: 1 }}>
        <div className="loading-dots">
          <span />
          <span />
          <span />
        </div>
      </div>
    </div>
  );
}
