import { cn } from "@/lib/utils";

interface LogoProps {
  /** Rendered edge length in px. Everything else scales from this. */
  size?: number;
  /** Spin and correct. Off by default: chrome uses the static mark, the
   *  loader opts in. Honours prefers-reduced-motion either way. */
  animated?: boolean;
  className?: string;
}

/**
 * Below this, the CSS-3D rings stop being readable: the border is a fraction of
 * the size (0.039), so at 26px it renders sub-pixel and the three foreshortened
 * ellipses mush into a blob. Verified in the /preview style guide, not assumed.
 * Small sizes therefore get a flattened SVG of the same glyph — fixed stroke
 * widths, slightly opened ellipses — which is what the favicon does too.
 */
const MIN_3D_SIZE = 40;

function FlatMark({ size, className }: { size: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      className={cn("shrink-0", className)}
      role="img"
      aria-label="Cadence"
    >
      <g fill="none" strokeWidth="1.7">
        <ellipse
          cx="16"
          cy="16"
          rx="14"
          ry="5.2"
          stroke="var(--action-primary)"
        />
        <ellipse cx="16" cy="16" rx="5.2" ry="14" stroke="var(--gold-500)" />
        <ellipse
          cx="16"
          cy="16"
          rx="4"
          ry="12"
          stroke="var(--gold-200)"
          transform="rotate(42 16 16)"
        />
      </g>
      <circle cx="16" cy="16" r="2.6" fill="var(--text-primary)" />
    </svg>
  );
}

/**
 * The gyroscope mark — three rings, always correcting.
 *
 * At display sizes it is CSS 3D, not SVG: three bordered circles rotated inside
 * a preserve-3d stage. Geometry and durations live in styles/mark.css, measured
 * from the design prototype. Colours come from the semantic layer, so the mark
 * re-themes with the app.
 */
export function Logo({ size = 26, animated = false, className }: LogoProps) {
  if (size < MIN_3D_SIZE && !animated) {
    return <FlatMark size={size} className={className} />;
  }
  return (
    <div
      className={cn("cad-mark", animated && "cad-mark--spin", className)}
      style={{ ["--mark-size" as string]: `${size}px` }}
      role="img"
      aria-label="Cadence"
    >
      <div className="cad-mark__stage">
        <div className="cad-mark__ring cad-mark__ring--a" />
        <div className="cad-mark__ring cad-mark__ring--b" />
        <div className="cad-mark__ring cad-mark__ring--c" />
        <div className="cad-mark__dot" />
      </div>
    </div>
  );
}
