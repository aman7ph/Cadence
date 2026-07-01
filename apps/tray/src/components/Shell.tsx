import { useEffect, useRef } from "react";

export function Logo() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const dpr = window.devicePixelRatio || 1;
    const s = 18;
    c.width = s * dpr;
    c.height = s * dpr;
    c.style.width = `${s}px`;
    c.style.height = `${s}px`;
    const ctx = c.getContext("2d")!;
    ctx.scale(dpr, dpr);
    ctx.beginPath();
    ctx.arc(7, 7, 5.5, 0, Math.PI * 2);
    ctx.fillStyle = "#4a9eff";
    ctx.fill();
    ctx.beginPath();
    ctx.arc(11, 11, 5.5, 0, Math.PI * 2);
    ctx.fillStyle = "#3dd68c";
    ctx.fill();
  }, []);
  return <canvas ref={ref} aria-hidden="true" />;
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
          <span /><span /><span />
        </div>
      </div>
    </div>
  );
}
