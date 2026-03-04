import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/pages/**/*.{js,ts,jsx,tsx,mdx}", "./src/components/**/*.{js,ts,jsx,tsx,mdx}", "./src/app/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        coal: "#0f1724",
        graphite: "#111827",
        steel: "#1f2937",
        smoke: "#6B7280",
        champagne: "#D8BFA6",
        ember: "#F97316",
        primary: "#F97316",
        accent: "#D8BFA6",
        muted: "#6B7280"
      },
      fontFamily: {
        body: ["var(--font-body)", "sans-serif"],
        display: ["var(--font-display)", "sans-serif"]
      },
      boxShadow: {
        soft: "none",
        glass: "0 8px 30px rgba(0,0,0,0.3)"
      },
      backgroundImage: {
        mesh: "radial-gradient(circle at 20% 20%, rgba(210,180,140,0.15), transparent 40%), radial-gradient(circle at 80% 0%, rgba(255,255,255,0.07), transparent 35%), radial-gradient(circle at 50% 80%, rgba(249,115,22,0.08), transparent 45%)"
      }
    }
  },
  plugins: []
};

export default config;
