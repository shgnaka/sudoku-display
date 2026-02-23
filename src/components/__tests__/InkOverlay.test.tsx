import { createEvent, fireEvent, render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
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
  type: "pointerdown" | "pointermove" | "pointerup",
  init: { pointerId: number; pointerType: string; clientX: number; clientY: number }
): void {
  const event =
    type === "pointerdown"
      ? createEvent.pointerDown(target)
      : type === "pointermove"
        ? createEvent.pointerMove(target)
        : createEvent.pointerUp(target);

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
});
