import type { AppRouteKey, NavRoute } from "../../lib/navigation";

interface SideDrawerProps {
  isOpen: boolean;
  currentRoute: AppRouteKey;
  routes: readonly NavRoute[];
  onClose: () => void;
  onNavigate: (route: AppRouteKey) => void;
}

export function SideDrawer({ isOpen, currentRoute, routes, onClose, onNavigate }: SideDrawerProps): JSX.Element {
  return (
    <>
      <div className={isOpen ? "drawer-backdrop open" : "drawer-backdrop"} onClick={onClose} />
      <aside className={isOpen ? "side-drawer open" : "side-drawer"} id="app-side-drawer">
        <div className="drawer-header">
          <h2>メニュー</h2>
        </div>
        <nav aria-label="アプリメニュー">
          <ul className="drawer-nav">
            {routes.map((route) => (
              <li key={route.key}>
                <button
                  className={currentRoute === route.key ? "btn btn--nav btn--active" : "btn btn--nav btn--inactive"}
                  onClick={() => onNavigate(route.key)}
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
