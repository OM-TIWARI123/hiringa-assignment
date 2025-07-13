import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import commonjs from '@rollup/plugin-commonjs'; // Add this import

export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  // Add this build configuration section
  build: {
    minify:false,
    rollupOptions: {
      plugins: [
        commonjs({
          requireReturnsDefault: 'auto' // Critical fix
        })
      ]
    }
  }
}));

