import { BOTTOM_TAB_ROUTES } from "../../constants/routes";
import type { AppRouteKey } from "../../constants/routes";

interface BottomTabBarProps {
  currentRoute: AppRouteKey;
  onNavigate: (route: AppRouteKey) => void;
}

export function BottomTabBar({ currentRoute, onNavigate }: BottomTabBarProps): JSX.Element {
  return (
    <nav aria-label="ページナビゲーション" className="bottom-tab-bar">
      {BOTTOM_TAB_ROUTES.map((route) => (
        <button
          className={route.key === currentRoute ? "btn btn--nav btn--active" : "btn btn--nav btn--inactive"}
          key={route.key}
          onClick={() => onNavigate(route.key)}
          type="button"
        >
          {route.label}
        </button>
      ))}
    </nav>
  );
}
