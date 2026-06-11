import { BLOCK_IDS } from "../types/ink";
import type { BlockId, InkPoint, InkState, Stroke } from "../types/ink";

const MIN_POINT_DISTANCE = 0.004;
const MAX_POINT_DISTANCE = 0.035;
const MAX_STROKE_POINTS = 2048;

function clampUnit(value: number): number {
  return Math.min(1, Math.max(0, value));
}

function distance(left: InkPoint, right: InkPoint): number {
  return Math.hypot(right.x - left.x, right.y - left.y);
}

function interpolatePoint(start: InkPoint, end: InkPoint, progress: number): InkPoint {
  const pressure =
    start.pressure === undefined && end.pressure === undefined
      ? undefined
      : (start.pressure ?? end.pressure ?? 0.5) +
        ((end.pressure ?? start.pressure ?? 0.5) - (start.pressure ?? end.pressure ?? 0.5)) *
          progress;

  return {
    x: start.x + (end.x - start.x) * progress,
    y: start.y + (end.y - start.y) * progress,
    ...(pressure === undefined ? {} : { pressure })
  };
}

export function normalizeInkPoint(point: InkPoint): InkPoint {
  return {
    x: clampUnit(point.x),
    y: clampUnit(point.y),
    ...(point.pressure === undefined ? {} : { pressure: clampUnit(point.pressure) })
  };
}

export function appendInkPoint(points: InkPoint[], rawPoint: InkPoint): InkPoint[] {
  const point = normalizeInkPoint(rawPoint);
  if (points.length === 0) {
    return [point];
  }

  if (points.length >= MAX_STROKE_POINTS) {
    return points;
  }

  const previous = points[points.length - 1];
  const pointDistance = distance(previous, point);
  if (pointDistance < MIN_POINT_DISTANCE) {
    return points;
  }

  const segmentCount = Math.ceil(pointDistance / MAX_POINT_DISTANCE);
  const availablePointCount = MAX_STROKE_POINTS - points.length;
  const pointsToAdd = Math.min(segmentCount, availablePointCount);
  const next = [...points];

  for (let index = 1; index <= pointsToAdd; index += 1) {
    next.push(interpolatePoint(previous, point, index / segmentCount));
  }

  return next;
}

export function createEmptyInkState(): InkState {
  return BLOCK_IDS.reduce((acc, blockId) => {
    acc[blockId] = [];
    return acc;
  }, {} as InkState);
}

export function appendStroke(state: InkState, blockId: BlockId, stroke: Stroke): InkState {
  return {
    ...state,
    [blockId]: [...state[blockId], stroke]
  };
}

export function clearBlock(state: InkState, blockId: BlockId): InkState {
  return {
    ...state,
    [blockId]: []
  };
}

export function clearAll(): InkState {
  return createEmptyInkState();
}
