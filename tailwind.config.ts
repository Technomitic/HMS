import type { Config } from 'tailwindcss';

const config: Config = {
  theme: {
    extend: {
      colors: {
        healthcare: {
          primary: '#007bff', // Example Color
          secondary: '#6c757d', // Example Color
          accent: '#17a2b8', // Example Color
          danger: '#dc3545', // Example Color
          warning: '#ffc107', // Example Color
          success: '#28a745', // Example Color
          info: '#17a2b8', // Example Color
        },
      },
    },
  },
  plugins: [],
};

export default config;