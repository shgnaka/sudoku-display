import { describe, expect, it } from "vitest";
import { SUDOKU_GENERATOR_MODULE_PATH } from "../wasm";

describe("wasm constants", () => {
  it("builds sudoku generator module path from BASE_URL", () => {
    expect(SUDOKU_GENERATOR_MODULE_PATH).toMatch(/wasm\/pkg\/sudoku_generator\.js$/);
  });
});
