import { useRef } from "react";
import { BOTTOM_TAB_ROUTES } from "../../constants/routes";
import type { RefObject } from "react";
import type { AppRouteKey } from "../../constants/routes";

interface BottomTabBarProps {
  currentRoute: AppRouteKey;
  onNavigate: (route: AppRouteKey) => void;
  onOpenSolveTools?: () => void;
  solveButtonRef?: RefObject<HTMLButtonElement>;
}

const LONG_PRESS_MS = 500;

export function BottomTabBar({
  currentRoute,
  onNavigate,
  onOpenSolveTools = () => undefined,
  solveButtonRef
}: BottomTabBarProps): JSX.Element {
  const longPressTimerRef = useRef<number | null>(null);
  const didLongPressRef = useRef(false);

  const cancelLongPress = (): void => {
    if (longPressTimerRef.current !== null) {
      window.clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  return (
    <nav aria-label="ページナビゲーション" className="bottom-tab-bar">
      {BOTTOM_TAB_ROUTES.map((route) => (
        <button
          className={route.key === currentRoute ? "btn btn--nav btn--active" : "btn btn--nav btn--inactive"}
          key={route.key}
          onClick={() => {
            if (didLongPressRef.current) {
              didLongPressRef.current = false;
              return;
            }
            onNavigate(route.key);
          }}
          onPointerCancel={route.key === "solve" ? cancelLongPress : undefined}
          onPointerDown={
            route.key === "solve" && currentRoute === "solve"
              ? () => {
                  didLongPressRef.current = false;
                  cancelLongPress();
                  longPressTimerRef.current = window.setTimeout(() => {
                    didLongPressRef.current = true;
                    onOpenSolveTools();
                  }, LONG_PRESS_MS);
                }
              : undefined
          }
          onPointerLeave={route.key === "solve" ? cancelLongPress : undefined}
          onPointerUp={route.key === "solve" ? cancelLongPress : undefined}
          ref={route.key === "solve" ? solveButtonRef : undefined}
          type="button"
        >
          {route.label}
        </button>
      ))}
    </nav>
  );
}
