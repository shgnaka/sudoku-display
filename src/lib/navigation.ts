import { APP_ROUTES, DEFAULT_ROUTE_HASH, DEFAULT_ROUTE_KEY } from "../constants/routes";
import type { AppRouteKey, NavRouteKey } from "../constants/routes";

const ROUTE_BY_HASH = new Map<string, NavRouteKey>(
  APP_ROUTES.map((route) => [route.hash, route.key])
);

export function normalizeRouteHash(hash: string): AppRouteKey {
  if (!hash) {
    return DEFAULT_ROUTE_KEY;
  }

  return ROUTE_BY_HASH.get(hash) ?? "notFound";
}

export function getRouteHash(route: AppRouteKey): string {
  if (route === "notFound") {
    return DEFAULT_ROUTE_HASH;
  }

  const found = APP_ROUTES.find((item) => item.key === route);
  return found?.hash ?? DEFAULT_ROUTE_HASH;
}
