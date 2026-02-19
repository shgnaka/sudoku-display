export const APP_ROUTES = [
  { key: "solve", label: "解く", hash: "#/solve", mobile: true },
  { key: "manage", label: "問題作成/生成", hash: "#/manage", mobile: true },
  { key: "help", label: "ヘルプ", hash: "#/help", mobile: true },
  { key: "storage", label: "保存管理", hash: "#/storage", mobile: true }
] as const;

export type NavRouteKey = (typeof APP_ROUTES)[number]["key"];
export type AppRouteKey = NavRouteKey | "notFound";

const ROUTE_BY_HASH = new Map<string, NavRouteKey>(
  APP_ROUTES.map((route) => [route.hash, route.key])
);

export function normalizeRouteHash(hash: string): AppRouteKey {
  if (!hash) {
    return "solve";
  }

  return ROUTE_BY_HASH.get(hash) ?? "notFound";
}

export function getRouteHash(route: AppRouteKey): string {
  if (route === "notFound") {
    return "#/solve";
  }

  const found = APP_ROUTES.find((item) => item.key === route);
  return found?.hash ?? "#/solve";
}
