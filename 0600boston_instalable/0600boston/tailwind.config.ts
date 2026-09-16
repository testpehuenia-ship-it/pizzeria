import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#ff5f3b",
        secondary: "#ffa726",
        dark: "#1a1a2e",
        lighter: "#f5f5f5",
      },
    },
  },
  plugins: [],
} satisfies Config;