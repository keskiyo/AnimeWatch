import { describe, expect, test } from "bun:test";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const SRC_ROOT = join(import.meta.dir, "..", "src");

describe("frontend file organization", () => {
  test("does not use legacy css-in-js after the Tailwind migration", () => {
    const files = collectFiles(SRC_ROOT, [".ts", ".tsx", ".css"]).concat([join(import.meta.dir, "..", "package.json")]);
    const forbiddenImports = ["styled" + "-components", "styled" + "."];

    const offenders = files.filter((file) => {
      const content = readFileSync(file, "utf8");
      return forbiddenImports.some((pattern) => content.includes(pattern));
    });

    expect(offenders.map(toRelativeSrcPath)).toEqual([]);
  });

  test("uses Tailwind global CSS instead of styled style modules", () => {
    const cssFile = join(SRC_ROOT, "styles", "index.css");
    const stylesRoot = join(SRC_ROOT, "styles");
    const styleModules = fileExists(stylesRoot) ? collectFiles(stylesRoot, [".ts", ".tsx"]) : [];

    expect(readFileSync(cssFile, "utf8")).toContain('@import "tailwindcss"');
    expect(styleModules.map(toRelativeSrcPath)).toEqual([]);
  });

  test("keeps app bootstrap, feature components, and fallback data in AGENTS structure", () => {
    expect(fileExists(join(SRC_ROOT, "app", "App.tsx"))).toBe(true);
    expect(fileExists(join(SRC_ROOT, "App.tsx"))).toBe(false);
    expect(fileExists(join(SRC_ROOT, "features", "catalog", "components", "AnimeCatalog.tsx"))).toBe(true);
    expect(fileExists(join(SRC_ROOT, "features", "animepage", "components", "AnimePageContent.tsx"))).toBe(true);
    expect(fileExists(join(SRC_ROOT, "components", "catalog"))).toBe(false);
    expect(fileExists(join(SRC_ROOT, "utils", "fallbackData.ts"))).toBe(true);
    expect(fileExists(join(SRC_ROOT, "data"))).toBe(false);
  });

  test("keeps catalog constants in utils and catalog types in types", () => {
    const dataFile = join(SRC_ROOT, "data", "catalogDesign.ts");
    const utilsFile = join(SRC_ROOT, "utils", "catalogData.ts");
    const typesFile = join(SRC_ROOT, "types", "catalog.ts");

    expect(fileExists(dataFile)).toBe(false);
    expect(fileExists(utilsFile)).toBe(true);
    expect(fileExists(typesFile)).toBe(true);
  });
});

function collectFiles(directory: string, extensions: string[]): string[] {
  return readdirSync(directory).flatMap((entry) => {
    const path = join(directory, entry);
    const stat = statSync(path);

    if (stat.isDirectory()) {
      return collectFiles(path, extensions);
    }

    return extensions.some((extension) => path.endsWith(extension)) ? [path] : [];
  });
}

function fileExists(path: string): boolean {
  try {
    statSync(path);
    return true;
  } catch {
    return false;
  }
}

function toRelativeSrcPath(path: string): string {
  return path.replace(`${SRC_ROOT}\\`, "").replaceAll("\\", "/");
}
