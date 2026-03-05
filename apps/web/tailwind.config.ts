import type { Config } from 'tailwindcss';
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // LuminaGO Design System
        bg: '#1F1A15',           // Dark brown background
        surface: '#2A241E',      // Dark surface
        surface2: '#3D352C',     // Lighter surface
        beige: '#F7F1E4',        // Beige/cream text
        accent: '#F7AF27',       // Yellow accent
        accent2: '#4285F4',      // Nav blue
        warn: '#F59E0B',
        muted: '#7B869A',        // Muted gray
      },
      fontFamily: {
        sans: ['Satoshi', 'system-ui', 'sans-serif'],
        heading: ['MadeOkineSans', 'Satoshi', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
} satisfies Config;
