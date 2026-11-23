import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          blue: '#1a73e8',
          blueDark: '#1557b0',
          surface: '#f8f9fa',
          border: '#dadce0',
          ink: '#202124',
          muted: '#5f6368'
        }
      }
    }
  },
  plugins: []
};

export default config;
