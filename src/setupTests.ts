import "@testing-library/jest-dom";
import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";

if (typeof window !== "undefined") {
  Object.defineProperty(window, "scrollTo", {
    writable: true,
    value: () => undefined
  });
}

if (typeof HTMLCanvasElement !== "undefined") {
  Object.defineProperty(HTMLCanvasElement.prototype, "getContext", {
    writable: true,
    value: () => ({
      beginPath: () => undefined,
      clearRect: () => undefined,
      lineJoin: "round",
      lineCap: "round",
      lineWidth: 1,
      moveTo: () => undefined,
      lineTo: () => undefined,
      stroke: () => undefined,
      strokeStyle: "#000"
    })
  });
}

afterEach(() => {
  cleanup();
  vi.clearAllMocks();

  if (typeof window !== "undefined") {
    window.localStorage.clear();
    window.location.hash = "#/solve";
  }
});
