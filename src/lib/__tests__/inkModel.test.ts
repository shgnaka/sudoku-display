import { describe, expect, it } from "vitest";
import { appendInkPoint, normalizeInkPoint } from "../inkModel";

describe("ink point processing", () => {
  it("clamps coordinates and pressure to normalized bounds", () => {
    expect(normalizeInkPoint({ x: -1, y: 2, pressure: 4 })).toEqual({
      x: 0,
      y: 1,
      pressure: 1
    });
  });

  it("ignores tiny pointer jitter", () => {
    const points = [{ x: 0.5, y: 0.5 }];

    expect(appendInkPoint(points, { x: 0.501, y: 0.501 })).toBe(points);
  });

  it("interpolates a large pointer movement into short connected segments", () => {
    const points = appendInkPoint([{ x: 0, y: 0 }], { x: 0.2, y: 0.2 });

    expect(points.length).toBeGreaterThan(2);
    expect(points[points.length - 1]).toEqual({ x: 0.2, y: 0.2 });

    for (let index = 1; index < points.length; index += 1) {
      expect(Math.hypot(points[index].x - points[index - 1].x, points[index].y - points[index - 1].y)).toBeLessThanOrEqual(
        0.036
      );
    }
  });
});
