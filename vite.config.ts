import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { breakpointTokenPlugin } from "./tools/vite-breakpoint-token-plugin";

export default defineConfig({
  base: "/sudoku-display/",
  plugins: [react(), breakpointTokenPlugin()],
  test: {
    environment: "jsdom",
    setupFiles: "./src/setupTests.ts",
    globals: true
  }
});
