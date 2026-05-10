import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";

import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [
    tailwindcss(),
    tanstackStart(),
    react(),
  ],
  resolve: {
    tsconfigPaths: true,
  },
  optimizeDeps: {
    exclude: [
      "@tanstack/react-start",
      "@tanstack/react-router",
      "@tanstack/start-server-core",
      "@tanstack/start-client-core",
      "@tanstack/react-start-server",
      "@tanstack/react-start-client",
    ],
  },
});
