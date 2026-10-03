// frontend/tailwind.config.js
// Apex-Fit design system. The `gray` and `primary` scales are remapped so every
// existing utility class follows the brand: graphite neutrals (tinted toward the
// logo's teal) and "volt" lime as the single accent. Semantic tokens (shadcn) live
// in index.css as CSS variables.
/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    container: { center: true, padding: "1rem", screens: { "2xl": "1400px" } },
    extend: {
      // Wide AND tall enough for the pinned scroll-story sections; shorter laptops get the stacked layout.
      screens: { pin: { raw: "(min-width: 1024px) and (min-height: 540px)" } },
      fontFamily: {
        sans: ['"Inter"', "ui-sans-serif", "system-ui", "-apple-system", "Segoe UI", "sans-serif"],
        display: ['"Archivo"', '"Inter"', "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ['"JetBrains Mono"', "ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
      colors: {
        gray: {
          50: "#f6f8f6",
          100: "#eef1ee",
          200: "#dfe5e0",
          300: "#c5cdc7",
          400: "#97a39b",
          500: "#6d7b72",
          600: "#4a5750",
          700: "#26302b",
          800: "#121816",
          900: "#0a0e0c",
          950: "#060908",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
          50: "#f6fde8",
          100: "#eafbc4",
          200: "#d6f68d",
          300: "#c4f257",
          400: "#b4ee34",
          500: "#8fcf14",
          600: "#4f8a0b",
          700: "#3f6f0a",
          800: "#335a0c",
          900: "#2b4b10",
          950: "#142806",
        },
        ember: { 400: "#ff8a4c", 500: "#f97316", 600: "#d4580a" },
        pulse: { 400: "#4cc9f0", 500: "#22a9d6", 600: "#1580a8" },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        secondary: { DEFAULT: "hsl(var(--secondary))", foreground: "hsl(var(--secondary-foreground))" },
        destructive: { DEFAULT: "hsl(var(--destructive))", foreground: "hsl(var(--destructive-foreground))" },
        muted: { DEFAULT: "hsl(var(--muted))", foreground: "hsl(var(--muted-foreground))" },
        accent: { DEFAULT: "hsl(var(--accent))", foreground: "hsl(var(--accent-foreground))" },
        popover: { DEFAULT: "hsl(var(--popover))", foreground: "hsl(var(--popover-foreground))" },
        card: { DEFAULT: "hsl(var(--card))", foreground: "hsl(var(--card-foreground))" },
      },
      borderRadius: { lg: "var(--radius)", md: "calc(var(--radius) - 2px)", sm: "calc(var(--radius) - 4px)" },
      boxShadow: {
        card: "0 1px 0 0 hsl(0 0% 100% / 0.04) inset, 0 8px 24px -12px rgb(0 0 0 / 0.5)",
        volt: "0 0 0 1px hsl(var(--primary) / 0.35), 0 8px 30px -8px hsl(var(--primary) / 0.45)",
      },
      animation: {
        "fade-in": "fadeIn 0.4s ease-out",
        "slide-up": "slideUp 0.3s ease-out",
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        shimmer: "shimmer 1.8s linear infinite",
      },
      keyframes: {
        fadeIn: { "0%": { opacity: "0" }, "100%": { opacity: "1" } },
        slideUp: {
          "0%": { transform: "translateY(10px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        "accordion-down": { from: { height: "0" }, to: { height: "var(--radix-accordion-content-height)" } },
        "accordion-up": { from: { height: "var(--radix-accordion-content-height)" }, to: { height: "0" } },
        shimmer: { "0%": { backgroundPosition: "200% 0" }, "100%": { backgroundPosition: "-200% 0" } },
      },
    },
  },
  plugins: [require("tailwind-scrollbar")({ nocompatible: true }), require("tailwindcss-animate")],
};
