import { useEffect, useMemo, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import { BLOCK_IDS } from "../types/ink";
import type { BlockId, InkPoint, InkState, Stroke } from "../types/ink";

interface InkOverlayProps {
  activeBlockId: BlockId;
  inkState: InkState;
  isInkMode: boolean;
  onActiveBlockChange: (blockId: BlockId) => void;
  onCommitStroke: (blockId: BlockId, stroke: Stroke) => void;
}

interface DrawingSession {
  blockId: BlockId;
  pointerId: number;
  points: InkPoint[];
}

const STROKE_COLOR = "#1f2d47";
const STROKE_WIDTH = 2;

function clampUnit(value: number): number {
  return Math.min(1, Math.max(0, value));
}

function getPointerType(event: ReactPointerEvent<HTMLDivElement>): string {
  return event.pointerType || (event.nativeEvent as PointerEvent).pointerType || "";
}

function toLocalPoint(event: ReactPointerEvent<HTMLDivElement>, target: HTMLElement): InkPoint {
  const rect = target.getBoundingClientRect();
  const x = rect.width > 0 ? (event.clientX - rect.left) / rect.width : 0;
  const y = rect.height > 0 ? (event.clientY - rect.top) / rect.height : 0;

  return {
    x: clampUnit(x),
    y: clampUnit(y),
    pressure: event.pressure > 0 ? event.pressure : undefined
  };
}

function drawStroke(ctx: CanvasRenderingContext2D, stroke: Stroke, width: number, height: number): void {
  if (stroke.points.length === 0) {
    return;
  }

  ctx.strokeStyle = stroke.color;
  ctx.lineWidth = stroke.width;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.beginPath();

  const first = stroke.points[0];
  ctx.moveTo(first.x * width, first.y * height);

  for (let i = 1; i < stroke.points.length; i += 1) {
    const point = stroke.points[i];
    ctx.lineTo(point.x * width, point.y * height);
  }

  if (stroke.points.length === 1) {
    ctx.lineTo(first.x * width + 0.001, first.y * height + 0.001);
  }

  ctx.stroke();
}

export function InkOverlay({
  activeBlockId,
  inkState,
  isInkMode,
  onActiveBlockChange,
  onCommitStroke
}: InkOverlayProps): JSX.Element {
  const canvasRefs = useRef<Record<BlockId, HTMLCanvasElement | null>>({
    "0-0": null,
    "0-1": null,
    "0-2": null,
    "1-0": null,
    "1-1": null,
    "1-2": null,
    "2-0": null,
    "2-1": null,
    "2-2": null
  });
  const [drawingSession, setDrawingSession] = useState<DrawingSession | null>(null);

  const redraw = useMemo(
    () => (blockId: BlockId) => {
      const canvas = canvasRefs.current[blockId];
      if (!canvas) {
        return;
      }

      const rect = canvas.getBoundingClientRect();
      const width = Math.max(1, Math.round(rect.width));
      const height = Math.max(1, Math.round(rect.height));

      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }

      let ctx: CanvasRenderingContext2D | null = null;
      try {
        ctx = canvas.getContext("2d");
      } catch {
        ctx = null;
      }
      if (!ctx) {
        return;
      }

      ctx.clearRect(0, 0, width, height);
      for (const stroke of inkState[blockId]) {
        drawStroke(ctx, stroke, width, height);
      }
    },
    [inkState]
  );

  useEffect(() => {
    for (const blockId of BLOCK_IDS) {
      redraw(blockId);
    }
  }, [inkState, redraw]);

  useEffect(() => {
    if (typeof ResizeObserver === "undefined") {
      return;
    }

    const observer = new ResizeObserver(() => {
      for (const blockId of BLOCK_IDS) {
        redraw(blockId);
      }
    });

    for (const blockId of BLOCK_IDS) {
      const canvas = canvasRefs.current[blockId];
      if (canvas) {
        observer.observe(canvas);
      }
    }

    return () => observer.disconnect();
  }, [redraw]);

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>): void => {
    const pointerType = getPointerType(event);
    if (!isInkMode || (pointerType !== "pen" && pointerType !== "mouse")) {
      return;
    }

    const target = event.target as HTMLElement;
    const blockId = target.dataset.blockId as BlockId | undefined;
    if (!blockId) {
      return;
    }

    onActiveBlockChange(blockId);

    const canvas = canvasRefs.current[blockId];
    if (canvas) {
      try {
        canvas.setPointerCapture(event.pointerId);
      } catch {
        // Some browsers may reject pointer capture in edge cases.
      }
    }

    event.preventDefault();
    setDrawingSession({
      blockId,
      pointerId: event.pointerId,
      points: [toLocalPoint(event, target)]
    });
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>): void => {
    if (!drawingSession || drawingSession.pointerId !== event.pointerId) {
      return;
    }

    const target = event.target as HTMLElement;
    const blockId = target.dataset.blockId as BlockId | undefined;
    if (!blockId || blockId !== drawingSession.blockId) {
      return;
    }

    event.preventDefault();

    const point = toLocalPoint(event, target);
    setDrawingSession((current) => {
      if (!current || current.pointerId !== event.pointerId) {
        return current;
      }

      return {
        ...current,
        points: [...current.points, point]
      };
    });
  };

  const commitDrawing = (event: ReactPointerEvent<HTMLDivElement>): void => {
    if (!drawingSession || drawingSession.pointerId !== event.pointerId) {
      return;
    }

    event.preventDefault();

    onCommitStroke(drawingSession.blockId, {
      points: drawingSession.points,
      color: STROKE_COLOR,
      width: STROKE_WIDTH,
      ts: Date.now()
    });

    setDrawingSession(null);
  };

  return (
    <div
      aria-label="ink-overlay"
      className={isInkMode ? "ink-overlay ink-enabled" : "ink-overlay"}
      data-testid="ink-overlay"
      onPointerCancel={commitDrawing}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={commitDrawing}
    >
      {BLOCK_IDS.map((blockId, index) => {
        const row = Math.floor(index / 3);
        const col = index % 3;

        return (
          <canvas
            className={activeBlockId === blockId ? "ink-canvas active" : "ink-canvas"}
            data-block-id={blockId}
            data-block-col={col}
            data-block-row={row}
            key={blockId}
            ref={(node) => {
              canvasRefs.current[blockId] = node;
            }}
          />
        );
      })}
    </div>
  );
}
