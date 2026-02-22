import { readdirSync, readFileSync } from "node:fs";
import { join, relative, resolve } from "node:path";

const rootDir = process.cwd();
const stylesDir = resolve(rootDir, "src/styles");
const SPACING_PROPERTY_PATTERN =
  /^\s*(padding|padding-top|padding-right|padding-bottom|padding-left|margin|margin-top|margin-right|margin-bottom|margin-left|gap|row-gap|column-gap)\s*:/;
const RAW_UNIT_PATTERN = /-?\d*\.?\d+(rem|px)\b/;
const DISALLOWED_RAW_SPACING_VALUES = new Set([
  "1rem",
  "0.75rem",
  "0.7rem",
  "0.65rem",
  "0.6rem",
  "0.5rem",
  "0.45rem",
  "0.35rem",
  "0.2rem"
]);

function collectCssFiles(dir) {
  const entries = readdirSync(dir, { withFileTypes: true });
  return entries.flatMap((entry) => {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      return collectCssFiles(fullPath);
    }
    return entry.name.endsWith(".css") ? [fullPath] : [];
  });
}

function toRepoPath(fullPath) {
  return relative(rootDir, fullPath).replaceAll("\\", "/");
}

function normalizeValue(value) {
  return value.split("!important")[0].trim().toLowerCase();
}

function getCurrentSelector(selectorStack) {
  for (let i = selectorStack.length - 1; i >= 0; i -= 1) {
    if (!selectorStack[i].startsWith("@")) {
      return selectorStack[i];
    }
  }
  return "";
}

function isKnownException({ selector, property, value }) {
  return selector.includes(".visually-hidden") && property === "margin" && value === "-1px";
}

const violations = [];
const cssFiles = collectCssFiles(stylesDir);

for (const filePath of cssFiles) {
  const repoPath = toRepoPath(filePath);
  const source = readFileSync(filePath, "utf-8");
  const lines = source.split(/\r?\n/);
  const selectorStack = [];

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    const trimmed = line.trim();

    if (trimmed.endsWith("{")) {
      selectorStack.push(trimmed.slice(0, -1).trim());
      continue;
    }

    if (trimmed.includes("}")) {
      const closeCount = (trimmed.match(/}/g) ?? []).length;
      for (let c = 0; c < closeCount; c += 1) {
        selectorStack.pop();
      }
      continue;
    }

    if (!SPACING_PROPERTY_PATTERN.test(line)) {
      continue;
    }

    const match = line.match(SPACING_PROPERTY_PATTERN);
    if (!match) {
      continue;
    }
    const property = match[1];
    const rawValue = line.split(":").slice(1).join(":").replace(/;.*$/, "").trim();
    const value = normalizeValue(rawValue);

    if (!RAW_UNIT_PATTERN.test(value)) {
      continue;
    }

    const selector = getCurrentSelector(selectorStack);
    if (isKnownException({ selector, property, value })) {
      continue;
    }

    const rawTokens = value.match(/-?\d*\.?\d+(rem|px)\b/g) ?? [];
    const hasDisallowedRawValue = rawTokens.some((token) => DISALLOWED_RAW_SPACING_VALUES.has(token));
    if (!hasDisallowedRawValue) {
      continue;
    }

    violations.push(`${repoPath}:${i + 1} ${property} uses disallowed raw spacing value "${rawValue}"`);
  }
}

if (violations.length > 0) {
  console.error("Spacing token lint failed:");
  for (const violation of violations.sort()) {
    console.error(`- ${violation}`);
  }
  process.exit(1);
}

console.log("Spacing token lint passed.");
