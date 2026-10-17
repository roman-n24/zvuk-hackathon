import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
    dedupe: ["react", "react-dom"],
  },
  server: {
<<<<<<< HEAD
    host: true,
=======
    host: "0.0.0.0",
>>>>>>> a9756f3b4afffd308257669cc318421c5ac1eafd
    port: 5173,
    allowedHosts: true,
    proxy: {
      "^/api/": {
        target: "http://localhost:8000",
        changeOrigin: true,
        ws: true,
      },
      "^/ws/": {
        target: "http://localhost:8000",
        changeOrigin: true,
        ws: true,
      },
    },
  },
});