import { readdirSync, readFileSync } from "node:fs";
import { join, relative, resolve } from "node:path";

const MOBILE_BREAKPOINT_TOKEN = "__MOBILE_BREAKPOINT_PX__";
const MOBILE_MEDIA_QUERY = `@media (max-width: ${MOBILE_BREAKPOINT_TOKEN})`;
const FORBIDDEN_MOBILE_MEDIA_QUERY = "@media (max-width: 768px)";
const TABLET_BREAKPOINT_TOKEN = "__TABLET_BREAKPOINT_PX__";
const TABLET_MEDIA_QUERY = `@media (max-width: ${TABLET_BREAKPOINT_TOKEN})`;
const FORBIDDEN_TABLET_MEDIA_QUERY = "@media (max-width: 1024px)";
const NOTE_TAG = "BREAKPOINT_SYNC_NOTE";
const NOTE_CONST = "MOBILE_BREAKPOINT_PX";
const TABLET_NOTE_CONST = "SOLVE_INPUT_SHEET_BREAKPOINT_PX";
const NOTE_SOURCE = "src/constants/layout.ts";
const EXPECTED_MOBILE_FILES = [
  "src/styles/common-ui.css",
  "src/styles/solve-page.base.css",
  "src/styles/solve-page.no-scroll.css"
];
const EXPECTED_TABLET_FILES = ["src/styles/app-shell.css"];

const rootDir = process.cwd();
const stylesDir = resolve(rootDir, "src/styles");

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

const violations = [];
const cssFiles = collectCssFiles(stylesDir);
const filesWithMobileMedia = new Set();
const filesWithTabletMedia = new Set();

for (const filePath of cssFiles) {
  const repoPath = toRepoPath(filePath);
  const source = readFileSync(filePath, "utf-8");
  const lines = source.split(/\r?\n/);

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    if (!line.includes(MOBILE_MEDIA_QUERY)) {
      if (!line.includes(TABLET_MEDIA_QUERY)) {
        continue;
      }

      filesWithTabletMedia.add(repoPath);
      const noteLine = lines[i - 1] ?? "";
      const missing = [];
      if (!noteLine.includes(NOTE_TAG)) {
        missing.push(NOTE_TAG);
      }
      if (!noteLine.includes(TABLET_NOTE_CONST)) {
        missing.push(TABLET_NOTE_CONST);
      }
      if (!noteLine.includes(NOTE_SOURCE)) {
        missing.push(NOTE_SOURCE);
      }
      if (missing.length > 0) {
        violations.push(`${repoPath}:${i + 1} missing sync note parts: ${missing.join(", ")}`);
      }
      continue;
    }

    filesWithMobileMedia.add(repoPath);

    const noteLine = lines[i - 1] ?? "";
    const missing = [];
    if (!noteLine.includes(NOTE_TAG)) {
      missing.push(NOTE_TAG);
    }
    if (!noteLine.includes(NOTE_CONST)) {
      missing.push(NOTE_CONST);
    }
    if (!noteLine.includes(NOTE_SOURCE)) {
      missing.push(NOTE_SOURCE);
    }

    if (missing.length > 0) {
      violations.push(`${repoPath}:${i + 1} missing sync note parts: ${missing.join(", ")}`);
    }
  }

  if (source.includes(FORBIDDEN_MOBILE_MEDIA_QUERY)) {
    violations.push(`${repoPath}: found forbidden hardcoded mobile query ${FORBIDDEN_MOBILE_MEDIA_QUERY}`);
  }

  if (source.includes(FORBIDDEN_TABLET_MEDIA_QUERY)) {
    violations.push(`${repoPath}: found forbidden tablet query ${FORBIDDEN_TABLET_MEDIA_QUERY}`);
  }
}

const expectedSet = new Set(EXPECTED_MOBILE_FILES);
for (const actual of filesWithMobileMedia) {
  if (!expectedSet.has(actual)) {
    violations.push(`${actual}: unexpected file contains ${MOBILE_MEDIA_QUERY}`);
  }
}
for (const expected of expectedSet) {
  if (!filesWithMobileMedia.has(expected)) {
    violations.push(`${expected}: expected file is missing ${MOBILE_MEDIA_QUERY}`);
  }
}

const expectedTabletSet = new Set(EXPECTED_TABLET_FILES);
for (const actual of filesWithTabletMedia) {
  if (!expectedTabletSet.has(actual)) {
    violations.push(`${actual}: unexpected file contains ${TABLET_MEDIA_QUERY}`);
  }
}
for (const expected of expectedTabletSet) {
  if (!filesWithTabletMedia.has(expected)) {
    violations.push(`${expected}: expected file is missing ${TABLET_MEDIA_QUERY}`);
  }
}

if (violations.length > 0) {
  console.error("Breakpoint sync lint failed:");
  for (const violation of violations.sort()) {
    console.error(`- ${violation}`);
  }
  process.exit(1);
}

console.log("Breakpoint sync lint passed.");
