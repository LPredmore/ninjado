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
        
        /* Ninja Clay Color Palette */
        ninja: {
          midnight: "hsl(220 25% 8%)",      /* Midnight Blue base */
          charcoal: "hsl(220 15% 20%)",     /* Charcoal Gray */
          forest: "hsl(140 20% 6%)",        /* Deep Forest Green */
          slate: "hsl(210 15% 45%)",        /* Slate Gray */
          crimson: "hsl(10 60% 35%)",       /* Deep Crimson */
          jade: "hsl(174 70% 45%)",         /* Jade Green */
          fire: "hsl(25 85% 50%)",          /* Fiery Orange */
          electric: "hsl(48 100% 50%)",     /* Electric Yellow */
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
        success: {
          DEFAULT: "hsl(var(--success))",
          foreground: "hsl(var(--success-foreground))",
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
        
        /* Clay Tactile Animations */
        "clay-squish": {
          "0%": { transform: "scale(1)" },
          "50%": { transform: "scale(0.95)" },
          "100%": { transform: "scale(1)" },
        },
        "clay-bounce": {
          "0%": { 
            transform: "scale(0.8) rotate(-5deg)", 
            opacity: "0" 
          },
          "60%": { 
            transform: "scale(1.1) rotate(2deg)", 
            opacity: "1" 
          },
          "100%": { 
            transform: "scale(1) rotate(0deg)", 
            opacity: "1" 
          },
        },
        
        /* Ninja Themed Animations */
        "smoke-puff": {
          "0%": { 
            opacity: "1",
            transform: "scale(1)",
            filter: "blur(0px)"
          },
          "50%": {
            opacity: "0.7",
            transform: "scale(1.2)",
            filter: "blur(2px)"
          },
          "100%": {
            opacity: "0",
            transform: "scale(1.5)",
            filter: "blur(4px)"
          }
        },
        "katana-slash": {
          "0%": { 
            transform: "translateX(-100%) rotate(-45deg)",
            opacity: "0"
          },
          "50%": {
            transform: "translateX(0%) rotate(0deg)",
            opacity: "1"
          },
          "100%": { 
            transform: "translateX(100%) rotate(45deg)",
            opacity: "0"
          },
        },
        "shuriken-spin": {
          "0%": { 
            transform: "rotate(0deg) scale(1)",
            opacity: "1"
          },
          "100%": { 
            transform: "rotate(360deg) scale(1.1)",
            opacity: "1"
          },
        },
        "ninja-float": {
          "0%, 100%": { 
            transform: "translateY(0px) rotate(0deg)" 
          },
          "25%": { 
            transform: "translateY(-8px) rotate(1deg)" 
          },
          "50%": { 
            transform: "translateY(-12px) rotate(0deg)" 
          },
          "75%": { 
            transform: "translateY(-6px) rotate(-1deg)" 
          },
        },
        "jade-glow": {
          "0%, 100%": { 
            boxShadow: "0 0 20px hsl(174 70% 45% / 0.4)",
            transform: "scale(1)"
          },
          "50%": { 
            boxShadow: "0 0 40px hsl(174 70% 45% / 0.8)",
            transform: "scale(1.05)"
          },
        },
        "fire-glow": {
          "0%, 100%": { 
            boxShadow: "0 0 20px hsl(25 85% 50% / 0.4)",
            transform: "scale(1)"
          },
          "50%": { 
            boxShadow: "0 0 40px hsl(25 85% 50% / 0.8)",
            transform: "scale(1.05)"
          },
        },
        "electric-glow": {
          "0%, 100%": { 
            boxShadow: "0 0 20px hsl(48 100% 50% / 0.6)",
            transform: "scale(1)"
          },
          "50%": { 
            boxShadow: "0 0 40px hsl(48 100% 50% / 1)",
            transform: "scale(1.05)"
          },
        },
        "bamboo-sway": {
          "0%, 100%": { transform: "rotate(0deg)" },
          "25%": { transform: "rotate(1deg)" },
          "75%": { transform: "rotate(-1deg)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        
        /* Clay Animations */
        "clay-squish": "clay-squish 0.15s cubic-bezier(0.68, -0.55, 0.265, 1.55)",
        "clay-bounce": "clay-bounce 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55)",
        
        /* Ninja Animations */
        "smoke-puff": "smoke-puff 0.6s ease-out forwards",
        "katana-slash": "katana-slash 0.8s ease-in-out",
        "shuriken-spin": "shuriken-spin 0.5s ease-out",
        "ninja-float": "ninja-float 4s ease-in-out infinite",
        
        /* Glow Animations */
        "jade-glow": "jade-glow 2s ease-in-out infinite",
        "fire-glow": "fire-glow 2s ease-in-out infinite",
        "electric-glow": "electric-glow 2s ease-in-out infinite",
        
        /* Background Animations */
        "bamboo-sway": "bamboo-sway 6s ease-in-out infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;