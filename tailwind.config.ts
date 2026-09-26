import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx,css}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "var(--bg)",
        panel: "var(--panel)",
        "panel-2": "var(--panel-2)",
        line: "var(--line)",
        ink: "var(--ink)",
        "ink-2": "var(--ink-2)",
        "ink-3": "var(--ink-3)",
        terra: "var(--terra)",
        "terra-soft": "var(--terra-soft)",
        moss: "var(--moss)",
        "moss-soft": "var(--moss-soft)",
      },
      fontFamily: {
        display: [
          '"Inter Tight"',
          '"Helvetica Now"',
          '"Helvetica Neue"',
          "-apple-system",
          "sans-serif",
        ],
        body: ["Inter", "-apple-system", "sans-serif"],
        mono: [
          '"IBM Plex Mono"',
          "ui-monospace",
          "SFMono-Regular",
          "Menlo",
          "monospace",
        ],
        stamp: [
          '"IBM Plex Mono"',
          "ui-monospace",
          "SFMono-Regular",
          "Menlo",
          "monospace",
        ],
      },
      borderRadius: {
        sharp: "0px",
        nav: "2px",
        icon: "2px",
      },
      boxShadow: {
        "hard-terra": "3px 3px 0 var(--terra)",
        "hard-terra-sm": "2px 2px 0 var(--terra)",
      },
      animation: {
        "drift-30": "editorial-drift-1 30s linear infinite",
        "drift-38": "editorial-drift-2 38s linear infinite",
        "drift-45": "editorial-drift-3 45s linear infinite",
        "drift-52": "editorial-drift-4 52s linear infinite",
        "drift-60": "editorial-drift-1 60s linear infinite reverse",
        "tick-pulse": "editorial-tick-pulse 450ms ease-in-out infinite alternate",
        "stamp-enter": "editorial-stamp-enter 350ms cubic-bezier(0.16, 1, 0.3, 1) forwards",
      },
    },
  },
  plugins: [],
};

export default config;
