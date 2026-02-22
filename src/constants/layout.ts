export const MOBILE_BREAKPOINT_PX = 768;
export const SOLVE_INPUT_SHEET_BREAKPOINT_PX = 1024;

export function createMaxWidthMediaQuery(maxWidthPx: number): string {
  return `(max-width: ${maxWidthPx}px)`;
}
