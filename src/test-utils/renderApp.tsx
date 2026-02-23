import { fireEvent, render, screen } from "@testing-library/react";
import type { RenderResult } from "@testing-library/react";
import { vi } from "vitest";
import App from "../App";
import { installResponsiveMatchMedia, setLocationHash } from "./browserMocks";

const { generateSudokuMock, keyboardInsetState } = vi.hoisted(() => ({
  generateSudokuMock: vi.fn(),
  keyboardInsetState: { value: 0 }
}));

const viewportState = {
  isMobile: false,
  isSheetInput: false
};

vi.mock("../wasm/sudokuGenerator", () => ({
  generateSudoku: generateSudokuMock
}));

vi.mock("../lib/useKeyboardInset", () => ({
  useKeyboardInset: () => keyboardInsetState.value
}));

interface RenderAppOptions {
  route?: string;
  isMobile?: boolean;
  isSheetInput?: boolean;
  keyboardInset?: number;
}

export function resetAppTestState(): void {
  window.localStorage.clear();
  setLocationHash("#/solve");
  generateSudokuMock.mockReset();
  keyboardInsetState.value = 0;
  viewportState.isMobile = false;
  viewportState.isSheetInput = false;
  installResponsiveMatchMedia(viewportState);
}

export function renderApp(options: RenderAppOptions = {}): RenderResult {
  if (options.route !== undefined) {
    setLocationHash(options.route);
  }
  if (options.isMobile !== undefined) {
    viewportState.isMobile = options.isMobile;
  }
  if (options.isSheetInput !== undefined) {
    viewportState.isSheetInput = options.isSheetInput;
  }
  if (options.keyboardInset !== undefined) {
    keyboardInsetState.value = options.keyboardInset;
  }

  installResponsiveMatchMedia(viewportState);
  return render(<App />);
}

export function cellLabel(row: number, col: number): RegExp {
  return new RegExp(`^${row}行${col}列、`);
}

export function clickNav(label: string): void {
  const buttons = screen.getAllByRole("button", { name: label });
  fireEvent.click(buttons[0]);
}

export { generateSudokuMock, keyboardInsetState };
