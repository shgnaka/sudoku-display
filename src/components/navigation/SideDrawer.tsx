import { APP_ROUTES } from "../../lib/navigation";
import type { AppRouteKey } from "../../lib/navigation";

interface SideDrawerProps {
  isOpen: boolean;
  currentRoute: AppRouteKey;
  onClose: () => void;
  onNavigate: (route: AppRouteKey) => void;
}

export function SideDrawer({ isOpen, currentRoute, onClose, onNavigate }: SideDrawerProps): JSX.Element {
  return (
    <>
      <div className={isOpen ? "drawer-backdrop open" : "drawer-backdrop"} onClick={onClose} />
      <aside className={isOpen ? "side-drawer open" : "side-drawer"}>
        <div className="drawer-header">
          <h2>メニュー</h2>
          <button onClick={onClose} type="button">
            閉じる
          </button>
        </div>
        <nav>
          <ul className="drawer-nav">
            {APP_ROUTES.map((route) => (
              <li key={route.key}>
                <button
                  className={currentRoute === route.key ? "active" : ""}
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
