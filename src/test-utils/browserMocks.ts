import { vi } from "vitest";

interface ResponsiveViewportState {
  isMobile: boolean;
  isSheetInput: boolean;
}

export function installResponsiveMatchMedia(state: ResponsiveViewportState): void {
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches:
        query === "(max-width: 768px)"
          ? state.isMobile
          : query === "(max-width: 1024px)"
            ? state.isSheetInput
            : false,
      media: query,
      onchange: null,
      addListener: () => undefined,
      removeListener: () => undefined,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      dispatchEvent: () => false
    }))
  });
}

export function setLocationHash(hash: string): void {
  window.location.hash = hash;
}
