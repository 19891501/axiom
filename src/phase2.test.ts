import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  ACCOUNTING,
  AXES,
  BASELINES,
  CERTIFICATE,
  F1,
  KILL,
  LADDER,
  OBJECTIVE,
  PHASE2_FROZEN_ON,
  PHASE2_STATUS,
  cIsNotLength,
  specIsFrozen,
} from "./phase2";

describe("Phase 2 spec freeze", () => {
  it("is frozen and dated", () => {
    assert.equal(specIsFrozen(), true);
    assert.equal(PHASE2_STATUS, "frozen");
    assert.equal(PHASE2_FROZEN_ON, "2026-09-10");
  });

  it("C is held-out answers, not string length", () => {
    assert.equal(cIsNotLength(), true);
    assert.match(F1.C, /Q_test/);
    assert.doesNotMatch(F1.C, /\bn\b/);
  });

  it("objective is max C/S under a K budget", () => {
    assert.equal(OBJECTIVE.maximize, "C / S");
    assert.match(OBJECTIVE.subjectTo, /K/);
    assert.equal(AXES.length, 3);
  });

  it("four baselines, B0 is direct store", () => {
    assert.equal(BASELINES.length, 4);
    assert.equal(BASELINES[0]!.id, "B0");
    assert.equal(BASELINES[3]!.id, "B3");
  });

  it("accounting: specialized decoder is state; general expander is infrastructure", () => {
    const decoder = ACCOUNTING.find((a) => a.where.includes("task-specific"));
    const expander = ACCOUNTING.find((a) => a.where.includes("general expander"));
    assert.equal(decoder?.countsAs, "state");
    assert.equal(expander?.countsAs, "infrastructure");
    assert.ok(ACCOUNTING.some((a) => a.countsAs === "cost"));
  });

  it("F1 has a negative control, a pass line, and a kill line", () => {
    assert.match(F1.negativeControl, /random/);
    assert.match(F1.pass, /B0/);
    assert.match(F1.kill, /Q_test leaked/);
  });

  it("ladder starts at calibration and forbids winning on level 0", () => {
    assert.equal(LADDER[0]!.level, 0);
    assert.match(LADDER[0]!.exam, /Cannot win/);
    assert.equal(LADDER[1]!.level, 1);
    assert.ok(KILL.some((k) => k.includes("Level 0")));
  });

  it("certificate names hash, baselines, and verdict", () => {
    assert.ok(CERTIFICATE.some((c) => c.includes("hash")));
    assert.ok(CERTIFICATE.some((c) => c.includes("B0–B3") || c.includes("B0-B3")));
    assert.ok(CERTIFICATE.some((c) => c.includes("verdict")));
  });
});
