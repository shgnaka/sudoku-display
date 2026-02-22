import { readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  MOBILE_BREAKPOINT_PX,
  SOLVE_INPUT_SHEET_BREAKPOINT_PX,
  createMaxWidthMediaQuery
} from "../../constants/layout";
import { useIsMobileViewport } from "../useIsMobileViewport";
import { useSolveInputSheetViewport } from "../useSolveInputSheetViewport";

const BREAKPOINT_SYNC_NOTE = "BREAKPOINT_SYNC_NOTE";
const MOBILE_MEDIA_QUERY = "@media (max-width: 768px)";
const SHEET_MEDIA_QUERY = "@media (max-width: 1024px)";
const stylesDir = resolve(process.cwd(), "src/styles");

function collectCssFiles(dir: string): string[] {
  const entries = readdirSync(dir, { withFileTypes: true });
  return entries.flatMap((entry) => {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      return collectCssFiles(fullPath);
    }
    return entry.name.endsWith(".css") ? [fullPath] : [];
  });
}

describe("viewport breakpoint sync", () => {
  const originalMatchMedia = window.matchMedia;

  afterEach(() => {
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      value: originalMatchMedia
    });
  });

  it("builds stable max-width media queries from shared constants", () => {
    expect(createMaxWidthMediaQuery(MOBILE_BREAKPOINT_PX)).toBe("(max-width: 768px)");
    expect(createMaxWidthMediaQuery(SOLVE_INPUT_SHEET_BREAKPOINT_PX)).toBe("(max-width: 1024px)");
  });

  it("useIsMobileViewport subscribes with the shared mobile query", () => {
    const matchMediaMock = vi.fn().mockImplementation(() => ({
      matches: false,
      media: "",
      onchange: null,
      addListener: () => undefined,
      removeListener: () => undefined,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      dispatchEvent: () => false
    }));

    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      value: matchMediaMock
    });

    renderHook(() => useIsMobileViewport());

    expect(matchMediaMock).toHaveBeenCalledWith("(max-width: 768px)");
  });

  it("useSolveInputSheetViewport subscribes with the shared sheet query", () => {
    const matchMediaMock = vi.fn().mockImplementation(() => ({
      matches: true,
      media: "",
      onchange: null,
      addListener: () => undefined,
      removeListener: () => undefined,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      dispatchEvent: () => false
    }));

    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      value: matchMediaMock
    });

    renderHook(() => useSolveInputSheetViewport());

    expect(matchMediaMock).toHaveBeenCalledWith("(max-width: 1024px)");
  });

  it("keeps every 768px media query scoped to the expected stylesheet set", () => {
    const cssFiles = collectCssFiles(stylesDir);
    const filesWithMobileMedia = cssFiles
      .filter((filePath) => readFileSync(filePath, "utf-8").includes(MOBILE_MEDIA_QUERY))
      .map((filePath) => filePath.replace(`${resolve(process.cwd())}/`, ""));

    expect(filesWithMobileMedia.sort()).toEqual([
      "src/styles/app-shell.css",
      "src/styles/common-ui.css",
      "src/styles/solve-page.base.css",
      "src/styles/solve-page.no-scroll.css"
    ]);
  });

  it("requires BREAKPOINT_SYNC_NOTE before each 768px media query in CSS", () => {
    const cssFiles = collectCssFiles(stylesDir);
    for (const filePath of cssFiles) {
      const source = readFileSync(filePath, "utf-8");
      const mediaLines = source.split("\n");
      for (let i = 0; i < mediaLines.length; i += 1) {
        if (!mediaLines[i].includes(MOBILE_MEDIA_QUERY)) {
          continue;
        }
        expect(mediaLines[i - 1] ?? "", filePath).toContain(BREAKPOINT_SYNC_NOTE);
      }
    }
  });

  it("does not define a 1024px CSS breakpoint yet", () => {
    const cssFiles = collectCssFiles(stylesDir);
    const filesWithSheetMedia = cssFiles.filter((filePath) => readFileSync(filePath, "utf-8").includes(SHEET_MEDIA_QUERY));
    expect(filesWithSheetMedia).toEqual([]);
  });
});
