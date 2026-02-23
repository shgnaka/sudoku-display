import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { breakpointTokenPlugin } from "./tools/vite-breakpoint-token-plugin";

export default defineConfig({
  base: "/sudoku-display/",
  plugins: [react(), breakpointTokenPlugin()],
  test: {
    environment: "jsdom",
    setupFiles: "./src/setupTests.ts",
    globals: true,
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      all: true,
      include: ["src/**/*.{ts,tsx}"],
      exclude: [
        "src/**/*.test.ts",
        "src/**/*.test.tsx",
        "src/main.tsx",
        "src/vite-env.d.ts"
      ],
      thresholds: {
        lines: 95,
        branches: 90
      }
    }
  }
});
