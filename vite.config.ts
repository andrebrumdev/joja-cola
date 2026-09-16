import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Production builds are served by GitHub Pages under /joja-cola/.
export default defineConfig(({ command, isPreview }) => ({
  base: command === "build" || isPreview ? "/joja-cola/" : "/",
  plugins: [react()],
  server: { port: 5173, strictPort: true },
  optimizeDeps: { exclude: ["maplibre-gl"] },
}));
