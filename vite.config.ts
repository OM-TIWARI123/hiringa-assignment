import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    // The code below enables dev tools like taking screenshots of your site
    // while it is being developed on chef.convex.dev.
    // Feel free to remove this code if you're no longer developing your app with Chef.
    // End of code for taking screenshots on chef.convex.dev.
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        // Disable manual chunking to avoid extensibility issues
        manualChunks: undefined,
        // Use inline dynamic imports to prevent chunk splitting issues
        inlineDynamicImports: true,
      },
      // Handle warnings that might cause build failures
      onwarn(warning, warn) {
        // Suppress specific warnings that can cause extensibility errors
        if (warning.code === 'CIRCULAR_DEPENDENCY') return;
        if (warning.code === 'UNUSED_EXTERNAL_IMPORT') return;
        if (warning.code === 'MISSING_EXPORT') return;
        warn(warning);
      },
    },
    commonjsOptions: {
      transformMixedEsModules: true,
    },
    // Use esbuild for minification (more stable than Rollup's minifier)
    minify: 'esbuild',
    target: 'es2020',
    chunkSizeWarningLimit: 2000,
  },
  esbuild: {
    target: 'es2020',
  },
  optimizeDeps: {
    include: ['convex/react'],
    force: true,
  },
  define: {
    global: 'globalThis',
  },
}));
