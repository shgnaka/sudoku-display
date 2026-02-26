import { vi } from "vitest";

interface ResponsiveViewportState {
  isMobile: boolean;
  isSheetInput: boolean;
}

interface MatchMediaConfig {
  matches?: boolean;
  media?: string;
}

export interface MockVisualViewport {
  offsetTop: number;
  height: number;
  width: number;
  addEventListener: (event: "resize" | "scroll", cb: () => void) => void;
  removeEventListener: (event: "resize" | "scroll", cb: () => void) => void;
  emit: (event: "resize" | "scroll") => void;
}

const originalMatchMedia = typeof window !== "undefined" ? window.matchMedia : undefined;
const originalVisualViewport = typeof window !== "undefined" ? window.visualViewport : undefined;
const originalUserAgentDescriptor =
  typeof navigator !== "undefined" ? Object.getOwnPropertyDescriptor(window.navigator, "userAgent") : undefined;
const originalPlatformDescriptor =
  typeof navigator !== "undefined" ? Object.getOwnPropertyDescriptor(window.navigator, "platform") : undefined;
const originalMaxTouchPointsDescriptor =
  typeof navigator !== "undefined" ? Object.getOwnPropertyDescriptor(window.navigator, "maxTouchPoints") : undefined;

export function installMockMatchMedia(
  resolver: (query: string) => MatchMediaConfig = () => ({ matches: false })
): ReturnType<typeof vi.fn> {
  const mock = vi.fn().mockImplementation((query: string) => {
    const resolved = resolver(query);
    return {
      matches: resolved.matches ?? false,
      media: resolved.media ?? query,
      onchange: null,
      addListener: () => undefined,
      removeListener: () => undefined,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      dispatchEvent: () => false
    };
  });

  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    value: mock
  });

  return mock;
}

export function installResponsiveMatchMedia(state: ResponsiveViewportState): ReturnType<typeof vi.fn> {
  return installMockMatchMedia((query: string) => ({
    matches:
      query === "(max-width: 768px)"
        ? state.isMobile
        : query === "(max-width: 1024px)"
          ? state.isSheetInput
          : false
  }));
}

export function setHashRoute(hash: string): void {
  window.location.hash = hash;
}

export function clearStorage(): void {
  window.localStorage.clear();
}

export function seedStorage(key: string, value: string): void {
  window.localStorage.setItem(key, value);
}

export function setWindowScrollY(value: number): void {
  Object.defineProperty(window, "scrollY", {
    configurable: true,
    writable: true,
    value
  });
}

export function spyWindowScrollTo() {
  return vi.spyOn(window, "scrollTo").mockImplementation(() => undefined);
}

export function createMockVisualViewport(height: number, offsetTop = 0, width = 400): MockVisualViewport {
  const listeners: Record<"resize" | "scroll", Array<() => void>> = {
    resize: [],
    scroll: []
  };

  return {
    height,
    offsetTop,
    width,
    addEventListener: (event, cb) => {
      listeners[event].push(cb);
    },
    removeEventListener: (event, cb) => {
      listeners[event] = listeners[event].filter((listener) => listener !== cb);
    },
    emit: (event) => {
      for (const cb of listeners[event]) {
        cb();
      }
    }
  };
}

export function installMockVisualViewport(viewport: MockVisualViewport | undefined): void {
  Object.defineProperty(window, "visualViewport", {
    configurable: true,
    value: viewport as VisualViewport | undefined
  });
}

export function resetBrowserEnv(): void {
  if (originalMatchMedia) {
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      value: originalMatchMedia
    });
  }

  Object.defineProperty(window, "visualViewport", {
    configurable: true,
    value: originalVisualViewport
  });

  if (originalUserAgentDescriptor) {
    Object.defineProperty(window.navigator, "userAgent", originalUserAgentDescriptor);
  }

  if (originalPlatformDescriptor) {
    Object.defineProperty(window.navigator, "platform", originalPlatformDescriptor);
  }

  if (originalMaxTouchPointsDescriptor) {
    Object.defineProperty(window.navigator, "maxTouchPoints", originalMaxTouchPointsDescriptor);
  }

  setWindowScrollY(0);
  setHashRoute("#/solve");
  clearStorage();
}
