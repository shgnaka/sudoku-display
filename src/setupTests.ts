import "@testing-library/jest-dom";

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
