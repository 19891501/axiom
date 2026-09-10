import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  ACCOUNTING,
  ARTIFACT,
  AXES,
  BASELINES,
  CERTIFICATE,
  C_FORMULA,
  F1,
  F1_C_HAT_MIN,
  F1_FAMILY,
  F1_K_MAX,
  F1_L,
  F1_MARGIN,
  F1_N,
  F1_NEG_C_HAT_MAX,
  F1_OMEGA,
  KILL,
  LADDER,
  OBJECTIVE,
  PHASE2_FROZEN_ON,
  PHASE2_STATUS,
  LAW_VERDICT,
  QUERY,
  TAUTOLOGIES_REFUSED,
  aIsInduced,
  cIsFinite,
  cIsNotLength,
  compressorIsB1,
  specIsFrozen,
} from "./phase2";

describe("Phase 2 spec freeze", () => {
  it("is frozen and dated", () => {
    assert.equal(specIsFrozen(), true);
    assert.equal(PHASE2_STATUS, "frozen");
    assert.equal(PHASE2_FROZEN_ON, "2026-09-10");
    assert.equal(LAW_VERDICT, "NO-GO");
  });

  it("C is held-out answers, not string length", () => {
    assert.equal(cIsNotLength(), true);
    assert.match(F1.C, /Q_test/);
    assert.doesNotMatch(F1.C, /\bn\b/);
    assert.match(C_FORMULA, /reconstruct/);
    assert.match(C_FORMULA, /K_max/);
  });

  it("objective is max C/S under a K budget", () => {
    assert.equal(OBJECTIVE.maximize, "C / S");
    assert.match(OBJECTIVE.subjectTo, /K/);
    assert.equal(AXES.length, 3);
  });

  it("four baselines, B0 is direct store of Ω not train-only", () => {
    assert.equal(BASELINES.length, 4);
    assert.equal(BASELINES[0]!.id, "B0");
    assert.equal(BASELINES[3]!.id, "B3");
    assert.match(BASELINES[0]!.how, /train∪test|Ω/);
    assert.match(BASELINES[0]!.how, /tautology/);
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

describe("Phase 2 metric freeze — decisions that can fail", () => {
  it("A is induced from Q_train; human-written program is refused tautology", () => {
    assert.equal(aIsInduced(), true);
    assert.equal(ARTIFACT.producedBy, "M(Q_train)");
    assert.match(ARTIFACT.humanWrittenProgram, /refused/);
    assert.ok(TAUTOLOGIES_REFUSED.some((t) => t.includes("human-written")));
    assert.ok(KILL.some((k) => k.includes("Human-written")));
  });

  it("Phase-1 compressor on concatenated pairs is B1, never B2", () => {
    assert.equal(compressorIsB1(), true);
    assert.match(ARTIFACT.phase1CompressorOnConcatenatedPairs, /^B1/);
    assert.match(BASELINES[1]!.how, /never B2/);
    assert.ok(TAUTOLOGIES_REFUSED.some((t) => t.includes("B2") && t.includes("B1")));
  });

  it("C is finite on a frozen split of {0,1}^8", () => {
    assert.equal(cIsFinite(), true);
    assert.equal(F1_L, 8);
    assert.equal(F1_OMEGA, 256);
    assert.equal(F1_N, 128);
    assert.equal(QUERY.nTrain, QUERY.nTest);
    assert.equal(QUERY.nTrain + QUERY.nTest, F1_OMEGA);
    assert.match(QUERY.split, /disjoint/);
    assert.match(F1.C, /0\.\.128/);
    assert.ok(TAUTOLOGIES_REFUSED.some((t) => t.includes("infinity") || t.includes("totality")));
  });

  it("N and K_max are frozen before the run; C/S cannot be a knob", () => {
    assert.equal(F1_N, 128);
    assert.equal(F1_K_MAX, 10_000);
    assert.equal(F1_MARGIN, 1.02);
    assert.equal(F1_C_HAT_MIN, 0.9);
    assert.equal(F1_NEG_C_HAT_MAX, 0.05);
    assert.equal(F1_FAMILY, "reverse");
    assert.match(F1.kMax, /10000/);
    assert.match(F1.kill, /N or K_max changed/);
    assert.ok(TAUTOLOGIES_REFUSED.some((t) => t.includes("|Q_test|")));
  });

  it("PASS/MIXED/FAIL/kill are distinct; negative overfit is kill", () => {
    assert.match(F1.pass, /1\.02/);
    assert.match(F1.mixed, /XOR/);
    assert.match(F1.fail, /no method beats B0/);
    assert.match(F1.negativeControl, /kill/);
    assert.equal(QUERY.fStructured, "reverse");
  });
});
