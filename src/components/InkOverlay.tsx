import { useCallback, useEffect, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import { INK_STROKE_COLOR, INK_STROKE_WIDTH } from "../constants/uiTuning";
import { appendInkPoint, normalizeInkPoint } from "../lib/inkModel";
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

function isTouchPrimaryEnvironment(): boolean {
  if (typeof navigator === "undefined") {
    return false;
  }

  return navigator.maxTouchPoints > 0;
}

function isDrawingPointer(pointerType: string, touchPrimaryEnvironment: boolean): boolean {
  if (pointerType === "pen" || pointerType === "touch") {
    return true;
  }

  return pointerType === "mouse" && !touchPrimaryEnvironment;
}

function createCanvasRefMap(): Record<BlockId, HTMLCanvasElement | null> {
  return BLOCK_IDS.reduce(
    (acc, blockId) => {
      acc[blockId] = null;
      return acc;
    },
    {} as Record<BlockId, HTMLCanvasElement | null>
  );
}

function getPointerType(event: ReactPointerEvent<HTMLDivElement>): string {
  return event.pointerType || (event.nativeEvent as PointerEvent).pointerType || "";
}

interface PointerCoordinates {
  clientX: number;
  clientY: number;
  pressure: number;
}

function toLocalPoint(event: PointerCoordinates, target: HTMLElement): InkPoint {
  const rect = target.getBoundingClientRect();
  const x = rect.width > 0 ? (event.clientX - rect.left) / rect.width : 0;
  const y = rect.height > 0 ? (event.clientY - rect.top) / rect.height : 0;

  return {
    x,
    y,
    pressure: event.pressure > 0 ? event.pressure : undefined
  };
}

function isPointInsideElement(event: PointerCoordinates, target: HTMLElement): boolean {
  const rect = target.getBoundingClientRect();
  return (
    event.clientX >= rect.left &&
    event.clientX <= rect.right &&
    event.clientY >= rect.top &&
    event.clientY <= rect.bottom
  );
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
  const canvasRefs = useRef<Record<BlockId, HTMLCanvasElement | null>>(createCanvasRefMap());
  const [drawingSession, setDrawingSession] = useState<DrawingSession | null>(null);
  const drawingSessionRef = useRef<DrawingSession | null>(null);
  const inkStateRef = useRef(inkState);
  const touchPrimaryEnvironment = isTouchPrimaryEnvironment();

  inkStateRef.current = inkState;
  drawingSessionRef.current = drawingSession;

  const redraw = useCallback((blockId: BlockId) => {
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
      for (const stroke of inkStateRef.current[blockId]) {
        drawStroke(ctx, stroke, width, height);
      }

      const preview = drawingSessionRef.current;
      if (preview?.blockId === blockId) {
        drawStroke(
          ctx,
          {
            points: preview.points,
            color: INK_STROKE_COLOR,
            width: INK_STROKE_WIDTH,
            ts: 0
          },
          width,
          height
        );
      }
    }, []);

  useEffect(() => {
    for (const blockId of BLOCK_IDS) {
      redraw(blockId);
    }
  }, [drawingSession, inkState, redraw]);

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

  useEffect(() => {
    if (isInkMode || !drawingSessionRef.current) {
      return;
    }

    const blockId = drawingSessionRef.current.blockId;
    drawingSessionRef.current = null;
    setDrawingSession(null);
    redraw(blockId);
  }, [isInkMode, redraw]);

  const updateDrawingSession = (next: DrawingSession | null): void => {
    drawingSessionRef.current = next;
    setDrawingSession(next);
  };

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>): void => {
    const pointerType = getPointerType(event);
    if (
      !isInkMode ||
      event.isPrimary === false ||
      drawingSessionRef.current ||
      !isDrawingPointer(pointerType, touchPrimaryEnvironment)
    ) {
      return;
    }

    const target = event.target as HTMLElement;
    const blockId = target.dataset.blockId as BlockId | undefined;
    if (!blockId) {
      return;
    }

    onActiveBlockChange(blockId);

    const canvas = canvasRefs.current[blockId];
    if (!canvas) {
      return;
    }

    try {
      canvas.setPointerCapture(event.pointerId);
    } catch {
      // Some browsers may reject pointer capture in edge cases.
    }

    event.preventDefault();
    updateDrawingSession({
      blockId,
      pointerId: event.pointerId,
      points: [normalizeInkPoint(toLocalPoint(event, canvas))]
    });
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>): void => {
    const currentSession = drawingSessionRef.current;
    if (!currentSession || currentSession.pointerId !== event.pointerId) {
      return;
    }

    const canvas = canvasRefs.current[currentSession.blockId];
    if (!canvas) {
      return;
    }

    event.preventDefault();

    const nativeEvent = event.nativeEvent as PointerEvent;
    const coalescedEvents =
      typeof nativeEvent.getCoalescedEvents === "function" ? nativeEvent.getCoalescedEvents() : [];
    const pointerEvents: PointerCoordinates[] = [
      ...coalescedEvents,
      event as unknown as PointerCoordinates
    ];
    let nextPoints = currentSession.points;

    for (const pointerEvent of pointerEvents) {
      if (isPointInsideElement(pointerEvent, canvas)) {
        nextPoints = appendInkPoint(nextPoints, toLocalPoint(pointerEvent, canvas));
      }
    }

    if (nextPoints !== currentSession.points) {
      updateDrawingSession({ ...currentSession, points: nextPoints });
    }
  };

  const releasePointerCapture = (pointerId: number, blockId: BlockId): void => {
    const canvas = canvasRefs.current[blockId];
    if (!canvas) {
      return;
    }

    try {
      if (canvas.hasPointerCapture(pointerId)) {
        canvas.releasePointerCapture(pointerId);
      }
    } catch {
      // Some browsers may reject pointer capture release in edge cases.
    }
  };

  const commitDrawing = (event: ReactPointerEvent<HTMLDivElement>): void => {
    const currentSession = drawingSessionRef.current;
    if (!currentSession || currentSession.pointerId !== event.pointerId) {
      return;
    }

    const canvas = canvasRefs.current[currentSession.blockId];
    let points = currentSession.points;
    if (canvas && isPointInsideElement(event, canvas)) {
      points = appendInkPoint(points, toLocalPoint(event, canvas));
    }

    releasePointerCapture(event.pointerId, currentSession.blockId);
    event.preventDefault();

    onCommitStroke(currentSession.blockId, {
      points,
      color: INK_STROKE_COLOR,
      width: INK_STROKE_WIDTH,
      ts: Date.now()
    });

    updateDrawingSession(null);
  };

  const cancelDrawing = (event: ReactPointerEvent<HTMLDivElement>): void => {
    const currentSession = drawingSessionRef.current;
    if (!currentSession || currentSession.pointerId !== event.pointerId) {
      return;
    }

    releasePointerCapture(event.pointerId, currentSession.blockId);
    event.preventDefault();
    updateDrawingSession(null);
    redraw(currentSession.blockId);
  };

  return (
    <div
      aria-label="ink-overlay"
      className={isInkMode ? "ink-overlay ink-enabled" : "ink-overlay"}
      data-testid="ink-overlay"
      onPointerCancel={cancelDrawing}
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
            data-testid={`ink-canvas-${blockId}`}
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
