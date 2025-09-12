import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        ninja: {
          primary: "#34D399",
          secondary: "#F87171",
          accent: "#8B5CF6",
          background: "#F9FAFB",
          text: "#1F2937",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "bounce-in": {
          "0%": { 
            transform: "scale(0.3) rotate(-10deg)", 
            opacity: "0" 
          },
          "50%": { 
            transform: "scale(1.1) rotate(5deg)", 
            opacity: "0.8" 
          },
          "100%": { 
            transform: "scale(1) rotate(0deg)", 
            opacity: "1" 
          },
        },
        "wiggle": {
          "0%, 100%": { transform: "rotate(-3deg)" },
          "50%": { transform: "rotate(3deg)" },
        },
        "rainbow": {
          "0%": { background: "linear-gradient(45deg, #ff6b6b, #4ecdc4)" },
          "25%": { background: "linear-gradient(45deg, #4ecdc4, #45b7d1)" },
          "50%": { background: "linear-gradient(45deg, #45b7d1, #96ceb4)" },
          "75%": { background: "linear-gradient(45deg, #96ceb4, #feca57)" },
          "100%": { background: "linear-gradient(45deg, #feca57, #ff6b6b)" },
        },
        "task-complete": {
          "0%": { 
            transform: "scale(1) rotate(0deg)",
            background: "var(--gradient-primary)"
          },
          "25%": { 
            transform: "scale(1.1) rotate(5deg)",
            background: "var(--gradient-secondary)"
          },
          "50%": { 
            transform: "scale(1.2) rotate(-5deg)",
            background: "var(--gradient-accent)"
          },
          "75%": { 
            transform: "scale(1.1) rotate(2deg)",
            background: "var(--gradient-secondary)"
          },
          "100%": { 
            transform: "scale(1) rotate(0deg)",
            background: "var(--gradient-primary)"
          },
        },
        "slide-up": {
          "0%": { 
            transform: "translateY(20px) scale(0.9)", 
            opacity: "0" 
          },
          "100%": { 
            transform: "translateY(0) scale(1)", 
            opacity: "1" 
          },
        },
        "float": {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-10px)" },
        },
        "glow-pulse": {
          "0%, 100%": { 
            boxShadow: "0 0 20px hsl(270 95% 75% / 0.4)",
            transform: "scale(1)"
          },
          "50%": { 
            boxShadow: "0 0 40px hsl(270 95% 75% / 0.8)",
            transform: "scale(1.02)"
          },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "bounce-in": "bounce-in 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55)",
        "wiggle": "wiggle 0.5s ease-in-out infinite",
        "rainbow": "rainbow 3s ease-in-out infinite",
        "task-complete": "task-complete 1s ease-in-out",
        "slide-up": "slide-up 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55)",
        "float": "float 3s ease-in-out infinite",
        "glow-pulse": "glow-pulse 2s ease-in-out infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;