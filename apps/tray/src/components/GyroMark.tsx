/**
 * The Cadence gyroscope mark, as static SVG on a transparent ground.
 *
 * Both places the tray showed a logo — the overlay header at 18px and the
 * sign-in screen at 32px — drew two solid circles to a canvas in the
 * pre-redesign blue and green. This replaces both.
 *
 * SVG rather than canvas because the mark is three ellipse *outlines*: canvas
 * needed an effect hook, a devicePixelRatio dance and a manual re-draw to get
 * what markup expresses directly and re-renders for free at any size.
 *
 * The three rings are the same flattened poses the favicon uses (see
 * apps/web/public/favicon.svg): the live mark spins them in CSS 3-D, and a
 * static mark takes rotateX(68°) as a wide ellipse, rotateY(68°) as a narrow
 * one, and the compound rotation as a tilted one.
 */
export function GyroMark({ size = 18 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      aria-hidden="true"
      style={{ display: "block", flex: "none" }}
    >
      <g fill="none" strokeWidth="1.7">
        <ellipse cx="16" cy="16" rx="11.5" ry="4.3" stroke="#e8a13d" />
        <ellipse cx="16" cy="16" rx="4.3" ry="11.5" stroke="#c9862a" />
        <ellipse
          cx="16"
          cy="16"
          rx="3.4"
          ry="10"
          stroke="#f3c877"
          transform="rotate(42 16 16)"
        />
      </g>
      <circle cx="16" cy="16" r="2.3" fill="#f3ecdf" />
    </svg>
  );
}
