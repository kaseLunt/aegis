// Repo hygiene tooth (W5 S0). A raw control character in a source file makes git classify it
// as BINARY: it is then exempt from `.gitattributes * text=auto eol=lf` normalization and lands
// in history as an opaque blob. Nothing else catches this — the code still compiles, tsc is
// clean, eslint is clean, and every test passes, because a control character is a legal string
// character. It was found only by noticing `Bin 0 -> 5736 bytes` in a diffstat.
//
// Sibling hazard, same root: INS-5931d8f8 (the editing tool writing CRLF against eol=lf, hidden
// by git's normalized diff). Both are cases of the editor emitting bytes the repo forbids, with
// no signal until stamp time.
import { readdirSync, readFileSync, statSync } from "node:fs";
import { extname, join } from "node:path";
import { describe, expect, test } from "vitest";

const ROOT = join(__dirname, "..");
const SOURCE_DIRS = ["bin", "lib", "app", "tests", "components"];
const SOURCE_EXT = new Set([".ts", ".tsx"]);

// Tab and newline are the only control characters legal in our sources; carriage return is
// excluded deliberately (eol=lf), so this also fails on a CRLF file.
const FORBIDDEN = new RegExp("[\x00-\x08\x0B-\x1F\x7F]");

function sourceFiles(dir: string): string[] {
  const abs = join(ROOT, dir);
  let entries: string[];
  try {
    entries = readdirSync(abs);
  } catch {
    return [];
  }
  return entries.flatMap((name) => {
    const full = join(abs, name);
    if (statSync(full).isDirectory()) return sourceFiles(join(dir, name));
    return SOURCE_EXT.has(extname(name)) ? [join(dir, name)] : [];
  });
}

describe("repo source hygiene", () => {
  test("no source file contains a raw control character", () => {
    const offenders = SOURCE_DIRS.flatMap(sourceFiles)
      .map((rel) => {
        const text = readFileSync(join(ROOT, rel), "utf-8");
        const match = FORBIDDEN.exec(text);
        if (match === null) return null;
        const line = text.slice(0, match.index).split("\n").length;
        return `${rel}:${line} contains U+${match[0].codePointAt(0)!.toString(16).padStart(4, "0").toUpperCase()}`;
      })
      .filter((x): x is string => x !== null);

    expect(offenders).toEqual([]);
  });

  test("every source file scanned is non-empty (the scanner actually found files)", () => {
    expect(SOURCE_DIRS.flatMap(sourceFiles).length).toBeGreaterThan(20);
  });
});
