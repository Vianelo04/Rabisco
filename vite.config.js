import { defineConfig } from "vite";

export default defineConfig({
  base: "./",
  optimizeDeps: { exclude: ["@babylonjs/havok"] },
  server: { port: 5173 },
});
