export function createAttemptId(): string {
  return globalThis.crypto.randomUUID();
}
