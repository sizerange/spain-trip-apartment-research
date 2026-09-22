import assert from "node:assert/strict";
import { test } from "node:test";
import { readFileSync, mkdtempSync, readdirSync, unlinkSync, rmdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

test("actual workflow gate accepts delayed summer/winter schedules and immediate/manual events", () => {
  const workflow = readFileSync(new URL("../.github/workflows/import-ready-publication.yml", import.meta.url), "utf8");
  const script = workflow.match(/        run: \|\r?\n((?:          [^\n]*\n)+)/)[1].replace(/^          /gm, "");
  const folder = mkdtempSync(join(tmpdir(), "apartment-schedule-"));
  const shell = process.platform === "win32" ? "C:/Program Files/Git/bin/bash.exe" : "bash";
  try {
    for (const [event, cron, offset, expected] of [
      ["schedule", "0 9 * * *", "+0200", true],
      ["schedule", "0 10 * * *", "+0200", false],
      ["schedule", "0 10 * * *", "+0100", true],
      ["schedule", "0 9 * * *", "+0100", false],
      ["workflow_dispatch", "", "+0200", true],
      ["issues", "", "+0100", true],
    ]) {
      const output = join(folder, `${event}-${offset}-${cron.replaceAll(" ", "_").replaceAll("*", "x")}`).replaceAll("\\", "/");
      // Deliberately return a late clock time for the old minute-based gate.
      const result = spawnSync(shell, ["-c", 'date() { if [ "$1" = "+%z" ]; then printf "%s" "$TEST_OFFSET"; else printf "17:23"; fi; };\n' + script], {
        env: { ...process.env, EVENT_NAME: event, SCHEDULE_CRON: cron, TEST_OFFSET: offset, GITHUB_OUTPUT: output }, encoding: "utf8",
      });
      assert.equal(result.status, 0, result.stderr);
      assert.equal(readFileSync(output, "utf8").trim(), `run=${expected}`);
    }
  } finally {
    for (const file of readdirSync(folder)) unlinkSync(join(folder, file));
    rmdirSync(folder);
  }
});
