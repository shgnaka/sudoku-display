import { STORAGE_KEYS } from "../constants/storageKeys";

export type PuzzleTimerStatus = "running" | "paused" | "completed";

export interface PersistedPuzzleTimer {
  elapsedMs: number;
  status: PuzzleTimerStatus;
  startedAt: number | null;
}

type TimerMap = Record<string, PersistedPuzzleTimer>;

function isTimer(value: unknown): value is PersistedPuzzleTimer {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const timer = value as Record<string, unknown>;
  return (
    typeof timer.elapsedMs === "number" &&
    Number.isFinite(timer.elapsedMs) &&
    timer.elapsedMs >= 0 &&
    (timer.status === "running" || timer.status === "paused" || timer.status === "completed") &&
    (timer.startedAt === null ||
      (typeof timer.startedAt === "number" && Number.isFinite(timer.startedAt)))
  );
}

function loadTimers(): TimerMap {
  if (typeof window === "undefined") {
    return {};
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEYS.timers);
    if (!raw) {
      return {};
    }

    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
      return {};
    }

    return Object.fromEntries(
      Object.entries(parsed).filter((entry): entry is [string, PersistedPuzzleTimer] => isTimer(entry[1]))
    );
  } catch {
    return {};
  }
}

export function loadPuzzleTimer(puzzleId: string): PersistedPuzzleTimer | null {
  return loadTimers()[puzzleId] ?? null;
}

export function savePuzzleTimer(puzzleId: string, timer: PersistedPuzzleTimer): void {
  if (typeof window === "undefined" || !puzzleId || !isTimer(timer)) {
    return;
  }

  try {
    window.localStorage.setItem(
      STORAGE_KEYS.timers,
      JSON.stringify({
        ...loadTimers(),
        [puzzleId]: timer
      })
    );
  } catch {
    // Ignore storage failures to keep the puzzle usable.
  }
}

export function removePuzzleTimer(puzzleId: string): void {
  if (typeof window === "undefined" || !puzzleId) {
    return;
  }

  try {
    const timers = loadTimers();
    if (!(puzzleId in timers)) {
      return;
    }

    delete timers[puzzleId];
    window.localStorage.setItem(STORAGE_KEYS.timers, JSON.stringify(timers));
  } catch {
    // Ignore storage failures to keep the puzzle usable.
  }
}

export function clearPuzzleTimers(): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.removeItem(STORAGE_KEYS.timers);
  } catch {
    // Ignore storage failures.
  }
}
