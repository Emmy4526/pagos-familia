import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",   // Busca en la carpeta app
    "./components/**/*.{js,ts,jsx,tsx,mdx}", // Busca en components
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
export default config;