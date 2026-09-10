import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { runCompleteProtocol } from "./battery";

describe("Axiom protocol", () => {
  const report = runCompleteProtocol();

  it("runs a non-empty battery", () => {
    assert.ok(report.total >= 150, `expected ≥150 tests, got ${report.total}`);
  });

  it(`PASS ${report.passed}/${report.total} in ${report.elapsedMs}ms`, () => {
    const failed = report.results.filter((r) => !r.ok);
    assert.equal(
      failed.length,
      0,
      failed.map((f) => `${f.suite}/${f.id}: ${f.detail}`).join("\n"),
    );
  });

  for (const suite of report.suites) {
    it(`${suite.name} ${suite.passed}/${suite.total}`, () => {
      assert.equal(
        suite.failed.length,
        0,
        suite.failed.map((f) => `${f.name}: ${f.detail}`).join("\n"),
      );
    });
  }

  it("CAPACITY/STATE: structured beat baseline, random stays near 1", () => {
    assert.equal(report.density.structuredPass, report.density.structuredTotal);
    assert.equal(report.density.randomSane, true);
    assert.ok(report.density.randomBest < 1.15);
  });
});
