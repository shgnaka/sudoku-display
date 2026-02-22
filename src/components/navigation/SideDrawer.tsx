import { useEffect, useRef } from "react";
import type { RefObject } from "react";
import type { AppRouteKey, NavRoute } from "../../constants/routes";

interface SideDrawerProps {
  isOpen: boolean;
  currentRoute: AppRouteKey;
  routes: readonly NavRoute[];
  menuButtonRef: RefObject<HTMLButtonElement>;
  onClose: () => void;
  onNavigate: (route: AppRouteKey) => void;
}

export function SideDrawer({
  isOpen,
  currentRoute,
  routes,
  menuButtonRef,
  onClose,
  onNavigate
}: SideDrawerProps): JSX.Element | null {
  const firstNavButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    firstNavButtonRef.current?.focus();
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  const closeWithFocusRestore = (): void => {
    onClose();
    menuButtonRef.current?.focus();
  };

  const navigateWithFocusRestore = (route: AppRouteKey): void => {
    onNavigate(route);
    menuButtonRef.current?.focus();
  };

  return (
    <>
      <div className="drawer-backdrop open" data-testid="drawer-backdrop" onClick={closeWithFocusRestore} />
      <aside
        aria-labelledby="app-side-drawer-title"
        aria-modal="true"
        className="side-drawer open"
        id="app-side-drawer"
        role="dialog"
      >
        <div className="drawer-header">
          <h2 id="app-side-drawer-title">メニュー</h2>
        </div>
        <nav aria-label="アプリメニュー">
          <ul className="drawer-nav">
            {routes.map((route, index) => (
              <li key={route.key}>
                <button
                  className={currentRoute === route.key ? "btn btn--nav btn--active" : "btn btn--nav btn--inactive"}
                  onClick={() => navigateWithFocusRestore(route.key)}
                  ref={index === 0 ? firstNavButtonRef : undefined}
                  type="button"
                >
                  {route.label}
                </button>
              </li>
            ))}
          </ul>
        </nav>
      </aside>
    </>
  );
}
