#!/usr/bin/env node
// Test discovery guard.
//
// Why this exists: vitest can silently collect fewer test files than exist
// when it runs while node_modules is still being mutated (e.g. an npm install
// that is still reifying in the background). We hit this twice: the suite
// came back "8 files / 56 tests" — green — instead of the real 11 / 89.
// A partial suite that reports green is worse than a failing suite.
//
// This wrapper runs vitest with the default reporter plus a JSON reporter,
// then compares the files vitest actually executed against the *.test.{ts,tsx}
// files on disk (mirroring the include glob in vitest.config.ts). Any mismatch
// fails the run loudly and names the dropped files.
//
// It also catches the general class of silent discovery regressions: include
// glob typos, test files renamed to non-matching names, files added outside
// the glob, etc.

const { execSync } = require("node:child_process");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "..");
// Forward slashes: safe on Windows and avoids cmd.exe backslash escaping.
const RESULTS = path
  .join(os.tmpdir(), `vitest-results-${process.pid}.json`)
  .replace(/\\/g, "/");

// Keep in sync with test.include in vitest.config.ts.
const TEST_FILE_PATTERN = /\.test\.(ts|tsx)$/;
const TEST_DIRS = ["src"];

function findTestFiles(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...findTestFiles(p));
    else if (TEST_FILE_PATTERN.test(entry.name)) out.push(p);
  }
  return out;
}

function rel(p) {
  return path.relative(ROOT, p).replace(/\\/g, "/");
}

let vitestFailed = false;
try {
  execSync(
    `npx vitest run --reporter=default --reporter=json --outputFile="${RESULTS}"`,
    { stdio: "inherit", cwd: ROOT, env: process.env },
  );
} catch {
  // Real test failures (or vitest failing to start). Report after the
  // discovery comparison so a partial-suite problem is surfaced together
  // with any test failures.
  vitestFailed = true;
}

const onDisk = TEST_DIRS.flatMap((d) =>
  findTestFiles(path.join(ROOT, d)),
)
  .map(rel)
  .sort();

let ran = [];
try {
  const json = JSON.parse(fs.readFileSync(RESULTS, "utf8"));
  ran = (json.testResults || []).map((r) => rel(r.name)).sort();
} catch (e) {
  console.error(`\n[test-guard] could not read vitest JSON results: ${e.message}`);
}
fs.rmSync(RESULTS, { force: true });

const missing = onDisk.filter((f) => !ran.includes(f));
const unexpected = ran.filter((f) => !onDisk.includes(f));

if (missing.length || unexpected.length) {
  console.error("\n[test-guard] TEST DISCOVERY MISMATCH — this was NOT the full suite!");
  if (!ran.length) {
    console.error("  vitest executed 0 files — it likely failed to start at all.");
  }
  for (const f of missing) {
    console.error(`  dropped (on disk, never ran): ${f}`);
  }
  for (const f of unexpected) {
    console.error(`  unexpected (ran, not on disk): ${f}`);
  }
  console.error(
    "  Likely causes: node_modules changed mid-run (an npm install is still",
    "\n  in progress — wait for it and rerun), or the vitest include glob no",
    "\n  longer matches these files.",
  );
  process.exit(1);
}

if (vitestFailed) process.exit(1);

console.log(
  `\n[test-guard] discovery verified: ${onDisk.length} test file(s) collected and executed.`,
);
