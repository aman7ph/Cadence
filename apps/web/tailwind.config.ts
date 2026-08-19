import type { Config } from "tailwindcss";
import animate from "tailwindcss-animate";

const config: Config = {
  darkMode: ["selector", '[data-theme="dark"]'],
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    container: {
      center: true,
      padding: "1rem",
      screens: {
        "2xl": "1120px",
      },
    },
    extend: {
      colors: {
        // Hue-neutral scales. Roles live in src/styles/semantic.css — prefer the
        // semantic names below (bg-card, text-primary, border-border) over these.
        sand: {
          50: "var(--sand-50)",
          100: "var(--sand-100)",
          150: "var(--sand-150)",
          200: "var(--sand-200)",
          300: "var(--sand-300)",
          400: "var(--sand-400)",
          500: "var(--sand-500)",
          600: "var(--sand-600)",
          700: "var(--sand-700)",
          800: "var(--sand-800)",
          850: "var(--sand-850)",
          900: "var(--sand-900)",
          950: "var(--sand-950)",
        },
        gold: {
          50: "var(--gold-50)",
          100: "var(--gold-100)",
          200: "var(--gold-200)",
          400: "var(--gold-400)",
          500: "var(--gold-500)",
          600: "var(--gold-600)",
          700: "var(--gold-700)",
          950: "var(--gold-950)",
          975: "var(--gold-975)",
        },
        green: {
          50: "var(--green-50)",
          100: "var(--green-100)",
          500: "var(--green-500)",
          600: "var(--green-600)",
          700: "var(--green-700)",
          950: "var(--green-950)",
        },
        amber: {
          50: "var(--amber-50)",
          100: "var(--amber-100)",
          500: "var(--amber-500)",
          600: "var(--amber-600)",
        },
        red: {
          50: "var(--red-50)",
          100: "var(--red-100)",
          500: "var(--red-500)",
          600: "var(--red-600)",
          950: "var(--red-950)",
        },

        background: "var(--bg-app)",
        foreground: "var(--text-primary)",
        card: {
          DEFAULT: "var(--surface-card)",
          foreground: "var(--text-primary)",
        },
        popover: {
          DEFAULT: "var(--surface-card)",
          foreground: "var(--text-primary)",
        },
        primary: {
          DEFAULT: "var(--action-primary)",
          foreground: "var(--text-on-accent)",
        },
        secondary: {
          DEFAULT: "var(--surface-active)",
          foreground: "var(--text-primary)",
        },
        muted: {
          DEFAULT: "var(--bg-sunken)",
          foreground: "var(--text-secondary)",
        },
        accent: {
          DEFAULT: "var(--surface-accent)",
          foreground: "var(--text-accent)",
        },
        destructive: {
          DEFAULT: "var(--status-danger)",
          foreground: "var(--text-on-accent)",
        },
        border: "var(--border-subtle)",
        input: "var(--border-default)",
        ring: "var(--focus-ring)",
      },
      /* Four steps, and only four. The prototype hand-authored ~8 distinct
       * radii (8/7/12/20/10/16/9/14) as inline styles, which is drift rather
       * than intent — its own handoff notes demand consistency and forbid
       * introducing new radii. These are the clusters that drift falls into. */
      borderRadius: {
        sm: "9px", // controls: buttons, inputs, outlined actions
        md: "12px", // blocks: ghost add-rows, menus, popovers
        lg: "16px", // cards and panels
        pill: "20px", // segmented controls and chips
      },
      fontFamily: {
        // Body: no webfont — the prototype uses the platform UI face.
        sans: [
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
        ],
        // Display: headings, nav, section labels and stat numerals.
        display: ["Lora", "Georgia", "Cambria", "Times New Roman", "serif"],
        mono: ["JetBrains Mono", "ui-monospace", "SFMono-Regular", "monospace"],
      },
    },
  },
  plugins: [animate],
};

export default config;
