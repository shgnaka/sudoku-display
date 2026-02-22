import { BLOCK_IDS } from "../types/ink";
import { createEmptyInkState } from "./inkModel";
import type { InkState } from "../types/ink";
import { STORAGE_KEYS } from "../constants/storageKeys";

const STORAGE_KEY = STORAGE_KEYS.ink;

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function normalizeInkState(value: unknown): InkState {
  if (!isObject(value)) {
    return createEmptyInkState();
  }

  const normalized = createEmptyInkState();

  for (const blockId of BLOCK_IDS) {
    const blockValue = value[blockId];
    normalized[blockId] = Array.isArray(blockValue) ? blockValue : [];
  }

  return normalized;
}

export function loadInkState(): InkState {
  if (typeof window === "undefined") {
    return createEmptyInkState();
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return createEmptyInkState();
    }

    return normalizeInkState(JSON.parse(raw));
  } catch {
    return createEmptyInkState();
  }
}

export function saveInkState(state: InkState): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignore storage failures to keep gameplay responsive.
  }
}

export function clearInkState(): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore storage failures.
  }
}
