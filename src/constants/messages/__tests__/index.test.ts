import { describe, expect, it } from "vitest";
import { HELP_MESSAGES, NOT_FOUND_MESSAGES, STORAGE_MESSAGES } from "../index";
import { HELP_MESSAGES as HELP_MESSAGES_SOURCE } from "../help";
import { NOT_FOUND_MESSAGES as NOT_FOUND_MESSAGES_SOURCE } from "../notFound";
import { STORAGE_MESSAGES as STORAGE_MESSAGES_SOURCE } from "../storage";

describe("message exports", () => {
  it("re-exports message constants from index.ts", () => {
    expect(HELP_MESSAGES).toBe(HELP_MESSAGES_SOURCE);
    expect(STORAGE_MESSAGES).toBe(STORAGE_MESSAGES_SOURCE);
    expect(NOT_FOUND_MESSAGES).toBe(NOT_FOUND_MESSAGES_SOURCE);
  });
});
