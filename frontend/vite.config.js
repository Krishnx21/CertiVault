import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [
    react({
      babel: {
        babelrc: false,
        configFile: false,
      },
    }),
  ],
  server: {
    port: 5173,
    host: "0.0.0.0",
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
});

