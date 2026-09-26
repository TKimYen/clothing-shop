import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#164F8D', // Màu chữ chính
          bg: '#17579B',      // Màu nền/viền
          dotLight: '#91B8D9',// Màu chấm tròn nhạt
          light: '#eff6ff',   // Màu nền nhạt (hero section)
        }
      },
      container: {
        center: true,
        padding: '1rem',
        screens: {
          '2xl': '1400px',
        },
      }
    },
  },
  plugins: [],
};
export default config;