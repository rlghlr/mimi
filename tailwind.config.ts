import type { Config } from "tailwindcss";

/**
 * Muse design tokens.
 * Colors are exposed as CSS variables (see globals.css) so the same palette
 * drives light/dark themes. Keep this in sync with docs/planning.html.
 */
const config: Config = {
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
    "./src/features/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ground: "rgb(var(--c-ground) / <alpha-value>)",
        surface: "rgb(var(--c-surface) / <alpha-value>)",
        "surface-2": "rgb(var(--c-surface-2) / <alpha-value>)",
        ink: "rgb(var(--c-ink) / <alpha-value>)",
        "ink-2": "rgb(var(--c-ink-2) / <alpha-value>)",
        "ink-3": "rgb(var(--c-ink-3) / <alpha-value>)",
        border: "rgb(var(--c-border) / <alpha-value>)",
        "border-2": "rgb(var(--c-border-2) / <alpha-value>)",
        accent: {
          DEFAULT: "rgb(var(--c-accent) / <alpha-value>)",
          soft: "rgb(var(--c-accent-soft) / <alpha-value>)",
          ink: "rgb(var(--c-accent-ink) / <alpha-value>)",
        },
        gold: {
          DEFAULT: "rgb(var(--c-gold) / <alpha-value>)",
          soft: "rgb(var(--c-gold-soft) / <alpha-value>)",
        },
        good: {
          DEFAULT: "rgb(var(--c-good) / <alpha-value>)",
          soft: "rgb(var(--c-good-soft) / <alpha-value>)",
        },
        warn: {
          DEFAULT: "rgb(var(--c-warn) / <alpha-value>)",
          soft: "rgb(var(--c-warn-soft) / <alpha-value>)",
        },
        crit: {
          DEFAULT: "rgb(var(--c-crit) / <alpha-value>)",
          soft: "rgb(var(--c-crit-soft) / <alpha-value>)",
        },
      },
      fontFamily: {
        display: ['"Fraunces"', "Georgia", "serif"],
        sans: ['"IBM Plex Sans KR"', "system-ui", "sans-serif"],
        mono: ['"IBM Plex Mono"', "ui-monospace", "monospace"],
      },
      borderRadius: {
        xl: "14px",
        "2xl": "18px",
      },
      boxShadow: {
        card: "0 1px 2px rgb(27 20 24 / 0.04), 0 8px 24px rgb(27 20 24 / 0.05)",
        pop: "0 4px 12px rgb(27 20 24 / 0.10), 0 16px 40px rgb(27 20 24 / 0.12)",
      },
      maxWidth: {
        app: "480px", // mobile-first app column
      },
    },
  },
  plugins: [],
};

export default config;
