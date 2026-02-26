import { createEvent, fireEvent, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { InkOverlay } from "../InkOverlay";
import { createEmptyInkState } from "../../lib/inkModel";
import type { BlockId, Stroke } from "../../types/ink";

function mockCanvasRects(root: HTMLElement): void {
  const canvases = Array.from(root.children).filter(
    (element): element is HTMLCanvasElement => element instanceof HTMLCanvasElement
  );
  canvases.forEach((canvas) => {
    Object.defineProperty(canvas, "getBoundingClientRect", {
      configurable: true,
      value: () => ({
        width: 120,
        height: 120,
        top: 0,
        left: 0,
        right: 120,
        bottom: 120,
        x: 0,
        y: 0,
        toJSON: () => ({})
      })
    });
  });
}

function firePointer(
  target: HTMLElement,
  type: "pointerdown" | "pointermove" | "pointerup" | "pointercancel",
  init: { pointerId: number; pointerType: string; clientX: number; clientY: number }
): void {
  const event =
    type === "pointerdown"
      ? createEvent.pointerDown(target)
      : type === "pointermove"
        ? createEvent.pointerMove(target)
        : type === "pointerup"
          ? createEvent.pointerUp(target)
          : createEvent.pointerCancel(target);

  Object.defineProperties(event, {
    pointerId: { value: init.pointerId },
    pointerType: { value: init.pointerType },
    clientX: { value: init.clientX },
    clientY: { value: init.clientY },
    pressure: { value: 0.5 }
  });

  fireEvent(target, event);
}

describe("InkOverlay", () => {
  const originalMaxTouchPoints = Object.getOwnPropertyDescriptor(window.navigator, "maxTouchPoints");

  function setMaxTouchPoints(value: number): void {
    Object.defineProperty(window.navigator, "maxTouchPoints", {
      configurable: true,
      value
    });
  }

  beforeEach(() => {
    setMaxTouchPoints(0);
  });

  afterEach(() => {
    if (originalMaxTouchPoints) {
      Object.defineProperty(window.navigator, "maxTouchPoints", originalMaxTouchPoints);
      return;
    }

    Reflect.deleteProperty(window.navigator, "maxTouchPoints");
  });

  it("commits stroke for pen when ink mode is enabled", () => {
    const onCommitStroke = vi.fn<(blockId: BlockId, stroke: Stroke) => void>();
    const onActiveBlockChange = vi.fn<(blockId: BlockId) => void>();

    const { getByTestId } = render(
      <InkOverlay
        activeBlockId="0-0"
        inkState={createEmptyInkState()}
        isInkMode
        onActiveBlockChange={onActiveBlockChange}
        onCommitStroke={onCommitStroke}
      />
    );

    const root = getByTestId("ink-overlay");
    mockCanvasRects(root);
    const canvas = getByTestId("ink-canvas-0-0") as HTMLCanvasElement;

    firePointer(canvas, "pointerdown", { pointerId: 10, pointerType: "pen", clientX: 10, clientY: 10 });
    firePointer(canvas, "pointermove", { pointerId: 10, pointerType: "pen", clientX: 20, clientY: 20 });
    firePointer(canvas, "pointerup", { pointerId: 10, pointerType: "pen", clientX: 20, clientY: 20 });

    expect(onActiveBlockChange).toHaveBeenCalledWith("0-0");
    expect(onCommitStroke).toHaveBeenCalledTimes(1);
  });

  it("ignores pointer moves outside drawing canvas bounds", () => {
    const onCommitStroke = vi.fn<(blockId: BlockId, stroke: Stroke) => void>();

    const { getByTestId } = render(
      <InkOverlay
        activeBlockId="0-0"
        inkState={createEmptyInkState()}
        isInkMode
        onActiveBlockChange={vi.fn()}
        onCommitStroke={onCommitStroke}
      />
    );

    const root = getByTestId("ink-overlay");
    mockCanvasRects(root);
    const canvas = getByTestId("ink-canvas-0-0") as HTMLCanvasElement;

    firePointer(canvas, "pointerdown", { pointerId: 11, pointerType: "pen", clientX: 10, clientY: 10 });
    firePointer(canvas, "pointermove", { pointerId: 11, pointerType: "pen", clientX: -20, clientY: -20 });
    firePointer(canvas, "pointerup", { pointerId: 11, pointerType: "pen", clientX: -20, clientY: -20 });

    expect(onCommitStroke).toHaveBeenCalledTimes(1);
    const [, stroke] = onCommitStroke.mock.calls[0];
    expect(stroke.points).toHaveLength(1);
  });

  it("does not draw for touch input", () => {
    const onCommitStroke = vi.fn();
    const onActiveBlockChange = vi.fn();

    const { getByTestId } = render(
      <InkOverlay
        activeBlockId="0-0"
        inkState={createEmptyInkState()}
        isInkMode
        onActiveBlockChange={onActiveBlockChange}
        onCommitStroke={onCommitStroke}
      />
    );

    const root = getByTestId("ink-overlay");
    mockCanvasRects(root);
    const canvas = getByTestId("ink-canvas-0-0") as HTMLCanvasElement;

    firePointer(canvas, "pointerdown", {
      pointerId: 12,
      pointerType: "touch",
      clientX: 10,
      clientY: 10
    });
    firePointer(canvas, "pointermove", {
      pointerId: 12,
      pointerType: "touch",
      clientX: 20,
      clientY: 20
    });
    firePointer(canvas, "pointerup", { pointerId: 12, pointerType: "touch", clientX: 20, clientY: 20 });

    expect(onCommitStroke).not.toHaveBeenCalled();
  });

  it("does not draw for mouse input on touch-capable devices", () => {
    setMaxTouchPoints(5);

    const onCommitStroke = vi.fn();
    const onActiveBlockChange = vi.fn();

    const { getByTestId } = render(
      <InkOverlay
        activeBlockId="0-0"
        inkState={createEmptyInkState()}
        isInkMode
        onActiveBlockChange={onActiveBlockChange}
        onCommitStroke={onCommitStroke}
      />
    );

    const root = getByTestId("ink-overlay");
    mockCanvasRects(root);
    const canvas = getByTestId("ink-canvas-0-0") as HTMLCanvasElement;

    firePointer(canvas, "pointerdown", { pointerId: 13, pointerType: "mouse", clientX: 10, clientY: 10 });
    firePointer(canvas, "pointerup", { pointerId: 13, pointerType: "mouse", clientX: 20, clientY: 20 });

    expect(onActiveBlockChange).not.toHaveBeenCalled();
    expect(onCommitStroke).not.toHaveBeenCalled();
  });

  it("commits stroke for pen on touch-capable devices", () => {
    setMaxTouchPoints(5);

    const onCommitStroke = vi.fn<(blockId: BlockId, stroke: Stroke) => void>();
    const onActiveBlockChange = vi.fn<(blockId: BlockId) => void>();

    const { getByTestId } = render(
      <InkOverlay
        activeBlockId="0-0"
        inkState={createEmptyInkState()}
        isInkMode
        onActiveBlockChange={onActiveBlockChange}
        onCommitStroke={onCommitStroke}
      />
    );

    const root = getByTestId("ink-overlay");
    mockCanvasRects(root);
    const canvas = getByTestId("ink-canvas-0-0") as HTMLCanvasElement;

    firePointer(canvas, "pointerdown", { pointerId: 14, pointerType: "pen", clientX: 10, clientY: 10 });
    firePointer(canvas, "pointermove", { pointerId: 14, pointerType: "pen", clientX: 20, clientY: 20 });
    firePointer(canvas, "pointerup", { pointerId: 14, pointerType: "pen", clientX: 20, clientY: 20 });

    expect(onActiveBlockChange).toHaveBeenCalledWith("0-0");
    expect(onCommitStroke).toHaveBeenCalledTimes(1);
  });

  it("does not draw when ink mode is disabled", () => {
    const onCommitStroke = vi.fn();
    const onActiveBlockChange = vi.fn();

    const { getByTestId } = render(
      <InkOverlay
        activeBlockId="0-0"
        inkState={createEmptyInkState()}
        isInkMode={false}
        onActiveBlockChange={onActiveBlockChange}
        onCommitStroke={onCommitStroke}
      />
    );

    const root = getByTestId("ink-overlay");
    mockCanvasRects(root);
    const canvas = getByTestId("ink-canvas-0-0") as HTMLCanvasElement;

    firePointer(canvas, "pointerdown", {
      pointerId: 22,
      pointerType: "mouse",
      clientX: 10,
      clientY: 10
    });
    firePointer(canvas, "pointerup", { pointerId: 22, pointerType: "mouse", clientX: 20, clientY: 20 });

    expect(onActiveBlockChange).not.toHaveBeenCalled();
    expect(onCommitStroke).not.toHaveBeenCalled();
  });

  it("handles pointer edge cases without committing stroke", () => {
    const onCommitStroke = vi.fn();
    const onActiveBlockChange = vi.fn();

    const { getByTestId } = render(
      <InkOverlay
        activeBlockId="0-0"
        inkState={createEmptyInkState()}
        isInkMode
        onActiveBlockChange={onActiveBlockChange}
        onCommitStroke={onCommitStroke}
      />
    );

    const root = getByTestId("ink-overlay");
    mockCanvasRects(root);
    const canvas00 = getByTestId("ink-canvas-0-0") as HTMLCanvasElement;
    const canvas01 = getByTestId("ink-canvas-0-1") as HTMLCanvasElement;

    firePointer(root, "pointerdown", { pointerId: 1, pointerType: "mouse", clientX: 10, clientY: 10 });
    firePointer(canvas00, "pointerdown", { pointerId: 2, pointerType: "mouse", clientX: 10, clientY: 10 });
    firePointer(canvas00, "pointermove", { pointerId: 999, pointerType: "mouse", clientX: 11, clientY: 11 });
    firePointer(canvas01, "pointermove", { pointerId: 2, pointerType: "mouse", clientX: 12, clientY: 12 });
    firePointer(canvas00, "pointerup", { pointerId: 999, pointerType: "mouse", clientX: 13, clientY: 13 });

    expect(onActiveBlockChange).toHaveBeenCalledWith("0-0");
    expect(onCommitStroke).not.toHaveBeenCalled();
  });

  it("commits via pointer cancel and tolerates pointer capture failure", () => {
    const onCommitStroke = vi.fn<(blockId: BlockId, stroke: Stroke) => void>();
    const onActiveBlockChange = vi.fn<(blockId: BlockId) => void>();

    const { getByTestId } = render(
      <InkOverlay
        activeBlockId="0-0"
        inkState={createEmptyInkState()}
        isInkMode
        onActiveBlockChange={onActiveBlockChange}
        onCommitStroke={onCommitStroke}
      />
    );

    const root = getByTestId("ink-overlay");
    mockCanvasRects(root);
    const canvas = getByTestId("ink-canvas-0-0") as HTMLCanvasElement;
    canvas.setPointerCapture = vi.fn(() => {
      throw new Error("capture failed");
    });

    firePointer(canvas, "pointerdown", { pointerId: 3, pointerType: "pen", clientX: -10, clientY: -20 });
    firePointer(canvas, "pointercancel", { pointerId: 3, pointerType: "pen", clientX: 500, clientY: 600 });

    expect(onCommitStroke).toHaveBeenCalledTimes(1);
    const [, stroke] = onCommitStroke.mock.calls[0];
    expect(stroke.points[0].x).toBe(0);
    expect(stroke.points[0].y).toBe(0);
  });

  it("observes canvases with ResizeObserver and disconnects on unmount", () => {
    const observe = vi.fn();
    const disconnect = vi.fn();
    class MockResizeObserver {
      constructor(_cb: ResizeObserverCallback) {}
      observe = observe;
      disconnect = disconnect;
    }
    vi.stubGlobal("ResizeObserver", MockResizeObserver);

    const { getByTestId, unmount } = render(
      <InkOverlay
        activeBlockId="0-0"
        inkState={createEmptyInkState()}
        isInkMode
        onActiveBlockChange={vi.fn()}
        onCommitStroke={vi.fn()}
      />
    );

    mockCanvasRects(getByTestId("ink-overlay"));
    expect(observe).toHaveBeenCalledTimes(9);
    unmount();
    expect(disconnect).toHaveBeenCalledTimes(1);
  });

  it("skips redraw when context cannot be acquired", () => {
    const onCommitStroke = vi.fn();
    const onActiveBlockChange = vi.fn();
    const inkState = createEmptyInkState();
    inkState["0-0"] = [
      {
        points: [{ x: 0.1, y: 0.2 }],
        color: "#000",
        width: 2,
        ts: 1
      }
    ];

    const { getByTestId } = render(
      <InkOverlay
        activeBlockId="0-0"
        inkState={inkState}
        isInkMode
        onActiveBlockChange={onActiveBlockChange}
        onCommitStroke={onCommitStroke}
      />
    );

    const root = getByTestId("ink-overlay");
    mockCanvasRects(root);
    const canvas = getByTestId("ink-canvas-0-0") as HTMLCanvasElement;
    canvas.getContext = vi.fn(() => {
      throw new Error("context failed");
    }) as unknown as HTMLCanvasElement["getContext"];

    firePointer(canvas, "pointerdown", { pointerId: 4, pointerType: "pen", clientX: 10, clientY: 10 });
    firePointer(canvas, "pointerup", { pointerId: 4, pointerType: "pen", clientX: 10, clientY: 10 });

    expect(onCommitStroke).toHaveBeenCalledTimes(1);
  });
});
