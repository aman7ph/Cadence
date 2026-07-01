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
        slate: {
          50: "var(--slate-50)",
          100: "var(--slate-100)",
          200: "var(--slate-200)",
          300: "var(--slate-300)",
          400: "var(--slate-400)",
          500: "var(--slate-500)",
          600: "var(--slate-600)",
          700: "var(--slate-700)",
          800: "var(--slate-800)",
          900: "var(--slate-900)",
          950: "var(--slate-950)",
        },
        indigo: {
          50: "var(--indigo-50)",
          100: "var(--indigo-100)",
          400: "var(--indigo-400)",
          500: "var(--indigo-500)",
          600: "var(--indigo-600)",
          700: "var(--indigo-700)",
        },
        green: {
          50: "var(--green-50)",
          100: "var(--green-100)",
          500: "var(--green-500)",
          600: "var(--green-600)",
          700: "var(--green-700)",
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
          600: "var(--red-600)",
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
      borderRadius: {
        lg: "16px",
        md: "10px",
        sm: "8px",
      },
      fontFamily: {
        sans: [
          "Plus Jakarta Sans",
          "ui-sans-serif",
          "system-ui",
          "sans-serif",
        ],
        display: [
          "Space Grotesk",
          "Plus Jakarta Sans",
          "ui-sans-serif",
          "sans-serif",
        ],
        mono: [
          "JetBrains Mono",
          "ui-monospace",
          "SFMono-Regular",
          "monospace",
        ],
      },
    },
  },
  plugins: [animate],
};

export default config;
