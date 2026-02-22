import { readdirSync, readFileSync } from "node:fs";
import { join, relative, resolve } from "node:path";

const rootDir = process.cwd();
const stylesDir = resolve(rootDir, "src/styles");
const KEYWORD_PATTERN =
  /^(inherit|initial|unset|revert|revert-layer|normal|bold|bolder|lighter)$/;
const PROPERTY_PATTERN = /^\s*(font|font-size|line-height|font-weight|font-family)\s*:/;

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
  return value
    .split("!important")[0]
    .trim()
    .toLowerCase();
}

function isAllowedValue(rawValue) {
  const value = normalizeValue(rawValue);
  if (value.startsWith("var(")) {
    return true;
  }
  return KEYWORD_PATTERN.test(value);
}

const violations = [];
const cssFiles = collectCssFiles(stylesDir);

for (const filePath of cssFiles) {
  const repoPath = toRepoPath(filePath);
  const source = readFileSync(filePath, "utf-8");
  const lines = source.split(/\r?\n/);

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    if (!PROPERTY_PATTERN.test(line)) {
      continue;
    }

    const match = line.match(PROPERTY_PATTERN);
    if (!match) {
      continue;
    }
    const property = match[1];
    const value = line.split(":").slice(1).join(":").replace(/;.*$/, "").trim();

    if (property === "font") {
      violations.push(`${repoPath}:${i + 1} avoid font shorthand; use typography tokens per property`);
      continue;
    }

    if (!isAllowedValue(value)) {
      violations.push(`${repoPath}:${i + 1} ${property} must use var(...) or allowed keyword`);
    }
  }
}

if (violations.length > 0) {
  console.error("Typography token lint failed:");
  for (const violation of violations.sort()) {
    console.error(`- ${violation}`);
  }
  process.exit(1);
}

console.log("Typography token lint passed.");
